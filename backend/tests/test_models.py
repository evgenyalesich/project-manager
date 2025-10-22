import pytest
from api.models import Project, Task, Comment, ProjectMember


@pytest.mark.django_db
def test_project_creation(project):
    assert Project.objects.count() == 1
    assert project.title == "Test Project"
    assert project.owner.username == "testuser"


@pytest.mark.django_db
def test_task_fields(task):
    assert task.title == "Test Task"
    assert task.status == "todo"
    assert task.project.title == "Test Project"


@pytest.mark.django_db
def test_comment_creation(task, user):
    comment = Comment.objects.create(task=task, author=user, content="Nice!")
    assert comment.content == "Nice!"
    assert comment.author == user
    assert comment.task == task


@pytest.mark.django_db
def test_project_member_role(project, user):
    member = ProjectMember.objects.get(project=project, user=user)
    assert member.role == "owner"
