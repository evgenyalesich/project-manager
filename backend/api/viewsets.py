from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import UserSerializer

from .models import Project, Task, Comment, ProjectMember
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    TaskListSerializer,
    TaskDetailSerializer,
    TaskStatusUpdateSerializer,
    CommentSerializer,
    ProjectMemberSerializer,
)
from .permissions import ProjectPermission, TaskPermission, CommentPermission
from .services import ProjectService, TaskService, CommentService, MembershipService


@method_decorator(csrf_exempt, name="dispatch")
class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, ProjectPermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        return (
            Project.objects.filter(members__user=user)
            .select_related("owner")
            .prefetch_related("members__user")
            .distinct()
        )

    def get_serializer_class(self):
        return (
            ProjectListSerializer if self.action == "list" else ProjectDetailSerializer
        )

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        ProjectMember.objects.get_or_create(
            project=project, user=self.request.user, defaults={"role": "owner"}
        )
        return project

    def retrieve(self, request, *args, **kwargs):
        project = self.get_object()
        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        project = self.get_object()
        stats = ProjectService.get_project_statistics(project.id)
        return Response(stats)

    @extend_schema(
        request=ProjectMemberSerializer,
        responses={200: ProjectDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="members/add")
    def add_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get("user_id")
        role = request.data.get("role", "viewer")

        if not user_id:
            return Response(
                {"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        MembershipService.add_member(project, user, role)

        serializer = ProjectDetailSerializer(project, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        parameters=[OpenApiParameter("user_id", int)],
        responses={200: ProjectDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="members/remove")
    def remove_member(self, request, pk=None):
        """Удалить участника и вернуть обновлённый проект"""
        project = self.get_object()
        user_id = request.data.get("user_id")

        if not user_id:
            return Response(
                {"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
            MembershipService.remove_member(project, user)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProjectDetailSerializer(project, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, TaskPermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["project", "status", "priority", "assignee"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at", "deadline", "priority", "order"]
    ordering = ["order", "-created_at"]

    def get_queryset(self):
        user = self.request.user
        return (
            Task.objects.filter(project__members__user=user)
            .select_related("project", "assignee", "created_by")
            .prefetch_related("comments")
            .distinct()
        )

    def get_serializer_class(self):
        return TaskListSerializer if self.action == "list" else TaskDetailSerializer

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        return task

    @extend_schema(
        request=TaskStatusUpdateSerializer,
        responses={200: TaskDetailSerializer},
    )
    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        """Обновить статус задачи (drag & drop)"""
        task = self.get_object()
        serializer = TaskStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            updated_task = TaskService.update_task_status(
                task=task,
                new_status=serializer.validated_data["status"],
                user=request.user,
                order=serializer.validated_data.get("order"),
            )
            return Response(TaskDetailSerializer(updated_task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class CommentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CommentPermission]
    serializer_class = CommentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["task"]

    def get_queryset(self):
        user = self.request.user
        return Comment.objects.filter(task__project__members__user=user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "email", "first_name", "last_name"]

    @action(detail=False, methods=["get"])
    def search(self, request):
        from django.db.models import Q

        query = request.query_params.get("q", "")
        if len(query) < 2:
            return Response([])

        users = User.objects.filter(
            Q(email__icontains=query)
            | Q(username__icontains=query)
            | Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
        ).values("id", "username", "email", "first_name", "last_name")[:10]

        return Response(list(users))
