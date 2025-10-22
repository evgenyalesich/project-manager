import pytest
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from api.models import Project, ProjectMember, Task, Comment


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def another_user(db):
    return User.objects.create_user(
        username="anotheruser",
        email="another@example.com",
        password="testpass123",
        first_name="Another",
        last_name="User",
    )


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def project(db, user):
    project = Project.objects.create(
        title="Test Project",
        description="Test Description",
        owner=user,
        status="active",
    )
    ProjectMember.objects.create(project=project, user=user, role="owner")
    return project


@pytest.fixture
def task(db, project, user):
    return Task.objects.create(
        project=project,
        title="Test Task",
        description="Test task description",
        status="todo",
        priority="medium",
        created_by=user,
        assignee=user,
    )


@pytest.fixture
def comment(db, task, user):
    return Comment.objects.create(task=task, author=user, content="Test comment")


@pytest.fixture
def project_with_members(db, user, another_user):
    project = Project.objects.create(
        title="Team Project",
        description="Project with multiple members",
        owner=user,
        status="active",
    )
    ProjectMember.objects.create(project=project, user=user, role="owner")
    ProjectMember.objects.create(project=project, user=another_user, role="member")
    return project
