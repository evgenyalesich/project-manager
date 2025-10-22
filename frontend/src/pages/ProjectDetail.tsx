import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { fetchProjectById } from "../store/slices/projectsSlice";
import { fetchTasksByProject } from "../store/slices/tasksSlice";
import { KanbanBoard } from "../components/Kanban/KanbanBoard";
import { AddMemberForm } from "../components/forms/AddMemberForm";
import { useWebSocket } from "../hooks/useWebSocket";

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : null;
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showAddMember, setShowAddMember] = useState(false);

  const { currentProject, loading: projectLoading } = useSelector(
    (state: RootState) => state.projects,
  );
  const { items: tasks, loading: tasksLoading } = useSelector(
    (state: RootState) => state.tasks,
  );

  const { isConnected } = useWebSocket(projectId);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
      dispatch(fetchTasksByProject(projectId));
    }
  }, [projectId, dispatch]);

  if (!projectId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600 mb-4">Неверный ID проекта</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-blue-600 hover:text-blue-800"
        >
          Вернуться к проектам
        </button>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">Проект не найден</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-blue-600 hover:text-blue-800"
        >
          Вернуться к проектам
        </button>
      </div>
    );
  }

  const projectTitle =
    (currentProject as any).title ||
    (currentProject as any).name ||
    "Без названия";

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Назад
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {projectTitle}
              </h1>
              <p className="text-sm text-gray-600">
                {currentProject.description || "Описание отсутствует"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Участники:</span>
              <div className="flex -space-x-2">
                {(currentProject.members || []).slice(0, 3).map((member) => {
                  const firstLetter =
                    member.first_name?.[0] ?? member.username?.[0] ?? "?";
                  const lastLetter = member.last_name?.[0] ?? "";
                  const fullName =
                    [member.first_name, member.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    member.username ||
                    "—";

                  return (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                      title={fullName}
                    >
                      {firstLetter}
                      {lastLetter}
                    </div>
                  );
                })}
                {currentProject.members &&
                  currentProject.members.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white">
                      +{currentProject.members.length - 3}
                    </div>
                  )}
              </div>

              <button
                onClick={() => setShowAddMember(true)}
                className="ml-2 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center text-lg font-bold transition"
                title="Добавить участника"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={`text-sm ${
                  isConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {isConnected ? "Онлайн" : "Оффлайн"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-50">
        <KanbanBoard
          projectId={projectId}
          tasks={tasks}
          loading={tasksLoading}
        />
      </div>

      {showAddMember && (
        <AddMemberForm
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
};
