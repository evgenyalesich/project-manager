from django.db.models import Count, Q, Prefetch, QuerySet
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth.models import User
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from typing import Dict, Any, Optional, List

from .models import Project, Task, Comment, ProjectMember, TaskHistory


class RealtimeService:
    @staticmethod
    def send_to_project(
        project_id: int, event_type: str, payload: Dict[str, Any]
    ) -> None:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        async_to_sync(channel_layer.group_send)(
            f"project_{project_id}",
            {"type": event_type, **payload},
        )

    @staticmethod
    def send_to_user(user_id: int, message: Dict[str, Any]) -> None:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {"type": "notification", "message": message},
        )


class ProjectService:
    """Service layer for Project operations"""

    @staticmethod
    def get_projects_with_stats(user: User) -> QuerySet:
        return (
            Project.objects.filter(members__user=user)
            .select_related("owner")
            .annotate(
                tasks_count=Count("tasks", distinct=True),
                members_count=Count("members", distinct=True),
            )
            .distinct()
        )

    @staticmethod
    def get_project_detail(project_id: int, user: User) -> Optional[Project]:
        cache_key = f"project_detail_{project_id}_{user.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        now = timezone.now()
        project = (
            Project.objects.filter(id=project_id, members__user=user)
            .select_related("owner")
            .prefetch_related(
                Prefetch(
                    "members", queryset=ProjectMember.objects.select_related("user")
                )
            )
            .annotate(
                tasks_count=Count("tasks", distinct=True),
                todo_count=Count(
                    "tasks", filter=Q(tasks__status="todo"), distinct=True
                ),
                in_progress_count=Count(
                    "tasks", filter=Q(tasks__status="in_progress"), distinct=True
                ),
                review_count=Count(
                    "tasks", filter=Q(tasks__status="review"), distinct=True
                ),
                done_count=Count(
                    "tasks", filter=Q(tasks__status="done"), distinct=True
                ),
                overdue_count=Count(
                    "tasks",
                    filter=Q(
                        tasks__deadline__lt=now,
                        tasks__status__in=["todo", "in_progress", "review"],
                    ),
                    distinct=True,
                ),
            )
            .first()
        )
        if project:
            cache.set(cache_key, project, 300)
        return project

    @staticmethod
    def invalidate_project_cache(
        project_id: int, user_ids: Optional[List[int]] = None
    ) -> None:
        if user_ids is None:
            user_ids = ProjectMember.objects.filter(project_id=project_id).values_list(
                "user_id", flat=True
            )
        for user_id in user_ids:
            cache_key = f"project_detail_{project_id}_{user_id}"
            cache.delete(cache_key)

    @staticmethod
    def get_project_statistics(project_id: int) -> Dict[str, Any]:
        now = timezone.now()
        stats = Task.objects.filter(project_id=project_id).aggregate(
            total=Count("id"),
            todo=Count("id", filter=Q(status="todo")),
            in_progress=Count("id", filter=Q(status="in_progress")),
            review=Count("id", filter=Q(status="review")),
            done=Count("id", filter=Q(status="done")),
            overdue=Count(
                "id",
                filter=Q(
                    deadline__lt=now, status__in=["todo", "in_progress", "review"]
                ),
            ),
        )
        return stats


class TaskService:
    @staticmethod
    def get_tasks_optimized(
        project_id: Optional[int] = None,
        assignee_id: Optional[int] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        user: Optional[User] = None,
    ) -> QuerySet:
        queryset = (
            Task.objects.select_related("project", "assignee", "created_by")
            .prefetch_related(
                Prefetch("comments", queryset=Comment.objects.select_related("author"))
            )
            .annotate(comments_count=Count("comments", distinct=True))
        )

        if user:
            accessible_projects = Project.objects.filter(members__user=user)
            queryset = queryset.filter(project__in=accessible_projects)

        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if assignee_id:
            queryset = queryset.filter(assignee_id=assignee_id)
        if status:
            queryset = queryset.filter(status=status)
        if priority:
            queryset = queryset.filter(priority=priority)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset.distinct()

    @staticmethod
    def update_task_status(
        task: Task, new_status: str, user: User, order: Optional[int] = None
    ) -> Task:
        old_status = task.status
        if old_status != new_status:
            TaskHistory.objects.create(
                task=task,
                changed_by=user,
                field_name="status",
                old_value=old_status,
                new_value=new_status,
            )
            task.status = new_status

        if order is not None:
            task.order = order

        task.save(update_fields=["status", "order", "updated_at"])

        ProjectService.invalidate_project_cache(task.project_id)
        RealtimeService.send_to_project(
            task.project_id, "task_updated", {"task": TaskService._serialize_task(task)}
        )
        return task

    @staticmethod
    def _serialize_task(task: Task) -> Dict[str, Any]:
        return {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "assignee": task.assignee_id,
            "project": task.project_id,
            "updated_at": task.updated_at.isoformat(),
        }


class CommentService:
    @staticmethod
    def get_task_comments(task_id: int) -> QuerySet:
        return (
            Comment.objects.filter(task_id=task_id)
            .select_related("author")
            .order_by("-created_at")
        )

    @staticmethod
    def create_comment(task_id: int, author: User, content: str) -> Comment:
        comment = Comment.objects.create(
            task_id=task_id, author=author, content=content
        )
        task = Task.objects.select_related("project").get(id=task_id)

        ProjectService.invalidate_project_cache(task.project_id)
        RealtimeService.send_to_project(
            task.project_id,
            "comment_created",
            {"comment": CommentService._serialize_comment(comment)},
        )

        return comment

    @staticmethod
    def _serialize_comment(comment: Comment) -> Dict[str, Any]:
        return {
            "id": comment.id,
            "content": comment.content,
            "task": comment.task_id,
            "author": {
                "id": comment.author.id,
                "username": comment.author.username,
                "first_name": comment.author.first_name,
                "last_name": comment.author.last_name,
            },
            "created_at": comment.created_at.isoformat(),
        }


class MembershipService:
    @staticmethod
    def add_member(project: Project, user: User, role: str = "viewer") -> ProjectMember:
        membership, created = ProjectMember.objects.get_or_create(
            project=project, user=user, defaults={"role": role}
        )

        if not created:
            membership.role = role
            membership.save()

        ProjectService.invalidate_project_cache(project.id, [user.id])
        RealtimeService.send_to_project(
            project.id,
            "member_added",
            {"member": {"id": user.id, "username": user.username, "role": role}},
        )

        return membership

    @staticmethod
    def remove_member(project: Project, user: User) -> None:
        ProjectMember.objects.filter(project=project, user=user).delete()
        ProjectService.invalidate_project_cache(project.id, [user.id])
        RealtimeService.send_to_project(
            project.id, "member_removed", {"user_id": user.id}
        )

    @staticmethod
    def update_member_role(project: Project, user: User, role: str) -> ProjectMember:
        membership = ProjectMember.objects.get(project=project, user=user)
        membership.role = role
        membership.save()

        ProjectService.invalidate_project_cache(project.id, [user.id])
        RealtimeService.send_to_project(
            project.id,
            "member_updated",
            {"member": {"id": user.id, "username": user.username, "role": role}},
        )

        return membership

    @staticmethod
    def get_user_role(project: Project, user: User) -> Optional[str]:
        try:
            return ProjectMember.objects.get(project=project, user=user).role
        except ProjectMember.DoesNotExist:
            return None
