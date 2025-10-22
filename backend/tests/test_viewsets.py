import pytest


@pytest.mark.django_db
def test_project_list(auth_client, project):
    res = auth_client.get("/api/projects/")
    assert res.status_code == 200

    if isinstance(res.data, dict) and "results" in res.data:
        results = res.data["results"]
        assert len(results) > 0, "No projects in results"
        project_names = [p.get("name") for p in results]
        assert "Test Project" in project_names, (
            f"Expected 'Test Project' in {project_names}"
        )
    elif isinstance(res.data, list):
        assert len(res.data) > 0, "No projects in list"
        project_names = [p.get("name") for p in res.data]
        assert "Test Project" in project_names, (
            f"Expected 'Test Project' in {project_names}"
        )
    else:
        raise AssertionError(f"Unexpected response format: {type(res.data)}")


@pytest.mark.django_db
def test_task_crud(auth_client, project):
    res = auth_client.post("/api/tasks/", {"title": "New Task", "project": project.id})
    assert res.status_code == 201
    task_id = res.data["id"]

    res2 = auth_client.patch(
        f"/api/tasks/{task_id}/", {"status": "done"}, format="json"
    )
    assert res2.status_code in (200, 202)
    assert res2.data["status"] == "done"

    res3 = auth_client.delete(f"/api/tasks/{task_id}/")
    assert res3.status_code == 204


@pytest.mark.django_db
def test_comment_api(auth_client, task):
    res = auth_client.post("/api/comments/", {"task": task.id, "content": "Hello!"})
    assert res.status_code == 201
    assert res.data["content"] == "Hello!"

    res2 = auth_client.get(f"/api/comments/?task={task.id}")
    assert res2.status_code == 200

    comments = (
        res2.data.get("results", res2.data)
        if isinstance(res2.data, dict)
        else res2.data
    )
    assert any("Hello!" in c["content"] for c in comments)
