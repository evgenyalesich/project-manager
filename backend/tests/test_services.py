import pytest
from api.services import ProjectService, TaskService, CommentService


@pytest.mark.django_db
def test_project_statistics(project, task):
    stats = ProjectService.get_project_statistics(project.id)
    assert "total" in stats
    assert stats["total"] >= 1


@pytest.mark.django_db
def test_task_status_update(task, user):
    updated = TaskService.update_task_status(task, "in_progress", user)
    assert updated.status == "in_progress"


@pytest.mark.django_db
def test_create_comment(task, user):
    comment = CommentService.create_comment(task.id, user, "service test")
    assert comment.content == "service test"
    assert comment.task == task
