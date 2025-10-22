from rest_framework import permissions
from .models import Project, ProjectMember, Task
from typing import Any


class IsProjectOwner(permissions.BasePermission):
    def has_object_permission(self, request: Any, view: Any, obj: Project) -> bool:
        return obj.owner == request.user


class IsProjectMember(permissions.BasePermission):
    def has_object_permission(self, request: Any, view: Any, obj: Project) -> bool:
        return ProjectMember.objects.filter(project=obj, user=request.user).exists()


class ProjectPermission(permissions.BasePermission):
    def has_object_permission(self, request: Any, view: Any, obj: Project) -> bool:
        try:
            membership = ProjectMember.objects.get(project=obj, user=request.user)
        except ProjectMember.DoesNotExist:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(view, "action") and view.action in ["add_member", "remove_member"]:
            return membership.role in ["owner", "member"]  # ✅ Разрешаем и member'ам

        if hasattr(view, "action") and view.action == "statistics":
            return True

        if request.method in ["PUT", "PATCH", "POST"]:
            return membership.role in ["owner", "member"]

        if request.method == "DELETE":
            return membership.role == "owner"

        return False


class TaskPermission(permissions.BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        if view.action in ["list", "create"]:
            project_id = request.query_params.get("project") or request.data.get(
                "project"
            )
            if project_id:
                try:
                    project = Project.objects.get(id=project_id)
                    membership = ProjectMember.objects.get(
                        project=project, user=request.user
                    )

                    if request.method in permissions.SAFE_METHODS:
                        return True

                    return membership.role in ["owner", "member"]
                except (Project.DoesNotExist, ProjectMember.DoesNotExist):
                    return False

        return True

    def has_object_permission(self, request: Any, view: Any, obj: Task) -> bool:
        try:
            membership = ProjectMember.objects.get(
                project=obj.project, user=request.user
            )
        except ProjectMember.DoesNotExist:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        if request.method in ["PUT", "PATCH", "POST"]:
            return membership.role in ["owner", "member"]

        if request.method == "DELETE":
            return membership.role in ["owner", "member"]

        return False


class CommentPermission(permissions.BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        if view.action == "create":
            task_id = request.data.get("task")
            if task_id:
                try:
                    task = Task.objects.select_related("project").get(id=task_id)
                    return ProjectMember.objects.filter(
                        project=task.project, user=request.user
                    ).exists()
                except Task.DoesNotExist:
                    return False

        return True

    def has_object_permission(self, request: Any, view: Any, obj: Any) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return ProjectMember.objects.filter(
                project=obj.task.project, user=request.user
            ).exists()

        is_author = obj.author == request.user
        is_project_owner = obj.task.project.owner == request.user

        return is_author or is_project_owner
