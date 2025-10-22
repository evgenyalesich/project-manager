from rest_framework import serializers
from django.contrib.auth.models import User
from typing import Dict, Any
from .models import Project, Task, Comment, ProjectMember, TaskHistory


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id"]


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True
    )

    class Meta:
        model = ProjectMember
        fields = ["id", "user", "user_id", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class ProjectListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="title")  # 👈 alias для фронта
    owner = UserSerializer(read_only=True)
    members = serializers.SerializerMethodField()
    tasks_count = serializers.IntegerField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "status",
            "owner",
            "members",
            "created_at",
            "updated_at",
            "tasks_count",
            "members_count",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "owner"]

    def get_members(self, obj):
        members = ProjectMember.objects.filter(project=obj).select_related("user")
        return [
            {
                "id": m.user.id,
                "first_name": m.user.first_name,
                "last_name": m.user.last_name,
                "email": m.user.email,
                "role": m.role,
            }
            for m in members
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="title")  # 👈 alias
    owner = UserSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)

    tasks_count = serializers.IntegerField(read_only=True)
    todo_count = serializers.IntegerField(read_only=True)
    in_progress_count = serializers.IntegerField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    done_count = serializers.IntegerField(read_only=True)
    overdue_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "status",
            "owner",
            "members",
            "created_at",
            "updated_at",
            "tasks_count",
            "todo_count",
            "in_progress_count",
            "review_count",
            "done_count",
            "overdue_count",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "owner"]

    def create(self, validated_data: Dict[str, Any]) -> Project:
        owner = validated_data.pop("owner", None) or self.context["request"].user
        project = Project.objects.create(owner=owner, **validated_data)
        ProjectMember.objects.create(project=project, user=owner, role="owner")
        return project


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "task",
            "author",
            "content",
            "created_at",
            "updated_at",
        ]  # ✅ author
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def create(self, validated_data: Dict[str, Any]) -> Comment:
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class TaskListSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    due_date = serializers.DateTimeField(source="deadline", read_only=True)  # 👈 alias
    comments_count = serializers.IntegerField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_title",
            "assignee",
            "status",
            "priority",
            "due_date",
            "created_at",
            "updated_at",
            "order",
            "comments_count",
            "is_overdue",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "is_overdue"]


class TaskDetailSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assignee",
        write_only=True,
        required=False,
        allow_null=True,
    )
    created_by = UserSerializer(read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    due_date = serializers.DateTimeField(source="deadline", read_only=True)  # 👈 alias
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_title",
            "assignee",
            "assignee_id",
            "status",
            "priority",
            "due_date",
            "created_by",
            "created_at",
            "updated_at",
            "order",
            "comments",
            "is_overdue",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "is_overdue",
        ]

    def create(self, validated_data: Dict[str, Any]) -> Task:
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class TaskHistorySerializer(serializers.ModelSerializer):
    changed_by = UserSerializer(read_only=True)

    class Meta:
        model = TaskHistory
        fields = [
            "id",
            "task",
            "changed_by",
            "field_name",
            "old_value",
            "new_value",
            "changed_at",
        ]
        read_only_fields = ["id", "changed_at"]


class TaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
    order = serializers.IntegerField(min_value=0, required=False)
