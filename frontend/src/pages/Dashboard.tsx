import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../store";
import {
  fetchProjects,
  createProject,
  deleteProject,
} from "../store/slices/projectsSlice";
import { ProjectCard } from "../components/ProjectCard";
import { Modal } from "../components/Modal";
import type { ProjectFormData } from "../types";

export const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const {
    items: projects,
    loading,
    error,
  } = useSelector((state: RootState) => state.projects);
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProjects());
    }
  }, [dispatch, isAuthenticated]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProject = await dispatch(createProject(formData)).unwrap();
      setIsModalOpen(false);
      setFormData({ title: "", description: "" });
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      console.error("Ошибка при создании проекта:", error);
      alert("Не удалось создать проект. Проверьте подключение к серверу.");
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm("Вы уверены, что хотите удалить этот проект?")) {
      try {
        await dispatch(deleteProject(projectId)).unwrap();
      } catch (error) {
        console.error("Ошибка при удалении проекта:", error);
        alert("Не удалось удалить проект.");
      }
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <p className="text-red-600 mb-4">
          Ошибка при загрузке проектов: {error}
        </p>
        <button
          onClick={() => dispatch(fetchProjects())}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Мои проекты</h1>
          {user ? (
            <p className="text-gray-600 mt-1">
              Добро пожаловать,&nbsp;
              <span className="font-semibold">
                {user?.first_name || "Пользователь"} {user?.last_name || ""}
              </span>
              !
            </p>
          ) : (
            <p className="text-gray-500 mt-1 italic">Загрузка данных...</p>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Новый проект
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">У вас пока нет проектов</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            Создать первый проект
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ title: "", description: "" });
        }}
        title="Создать новый проект"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Название проекта
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название проекта"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Описание
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Опишите ваш проект"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setFormData({ title: "", description: "" });
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Создать
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
