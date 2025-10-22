from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from typing import Optional
from django.utils import timezone


class Project(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="active", db_index=True
    )
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_projects"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return self.title


class ProjectMember(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("member", "Member"),
        ("viewer", "Viewer"),
    ]

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="project_memberships"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="viewer")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["project", "user"]
        indexes = [models.Index(fields=["project", "user"])]

    def __str__(self) -> str:
        return f"{self.user.username} - {self.project.title} ({self.role})"


class Task(models.Model):
    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("review", "Review"),
        ("done", "Done"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="todo", db_index=True
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="medium", db_index=True
    )
    deadline = models.DateTimeField(null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_tasks"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    order = models.IntegerField(default=0, validators=[MinValueValidator(0)])

    class Meta:
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["assignee", "status"]),
            models.Index(fields=["project", "deadline"]),
            models.Index(fields=["priority", "status"]),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def due_date(self) -> Optional[timezone.datetime]:
        return self.deadline

    @due_date.setter
    def due_date(self, value: Optional[timezone.datetime]) -> None:
        self.deadline = value

    @property
    def is_overdue(self) -> bool:
        return (
            self.deadline is not None
            and self.deadline < timezone.now()
            and self.status != "done"
        )


class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["task", "created_at"])]

    def __str__(self) -> str:
        return f"Comment by {self.author.username} on {self.task.title}"


class TaskHistory(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="history")
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    field_name = models.CharField(max_length=50)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-changed_at"]
        indexes = [models.Index(fields=["task", "changed_at"])]

    def __str__(self) -> str:
        return f"{self.task.title} - {self.field_name} changed by {self.changed_by.username}"
