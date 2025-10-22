import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from api.models import ProjectMember


@pytest.mark.django_db
def test_viewer_cannot_edit_project(project):
    viewer = User.objects.create_user(username="viewer", password="123")
    ProjectMember.objects.create(project=project, user=viewer, role="viewer")

    client = APIClient()
    client.force_authenticate(user=viewer)

    response = client.patch(
        f"/api/projects/{project.id}/", {"title": "Hack!"}, format="json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_member_can_edit_task(task):
    member = User.objects.create_user(username="member", password="123")
    ProjectMember.objects.create(project=task.project, user=member, role="member")

    client = APIClient()
    client.force_authenticate(user=member)

    response = client.patch(
        f"/api/tasks/{task.id}/", {"status": "in_progress"}, format="json"
    )
    assert response.status_code in (200, 202)
