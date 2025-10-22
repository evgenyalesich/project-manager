import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  TaskStatus,
  TaskPriority,
  type TaskFormData,
  type Task,
} from "../../types";

interface TaskFormProps {
  projectId: number;
  initialData?: Task;
  initialStatus?: TaskStatus;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

export const TaskForm = ({
  projectId,
  initialData,
  initialStatus,
  onSubmit,
  onCancel,
}: TaskFormProps) => {
  const { currentProject } = useSelector((state: RootState) => state.projects);
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || initialStatus || TaskStatus.TODO,
    priority: initialData?.priority || TaskPriority.MEDIUM,
    project: projectId,
    assignee: initialData?.assignee?.id,
    deadline: initialData?.deadline || "",
  });

  useEffect(() => {
    if (!initialData && user && !formData.assignee) {
      setFormData((prev) => ({ ...prev, assignee: user.id }));
    }
  }, [initialData, user, formData.assignee]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "assignee" ? (value ? parseInt(value) : undefined) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Название задачи *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Введите название задачи"
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
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Опишите задачу подробнее"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Статус
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={TaskStatus.TODO}>К выполнению</option>
            <option value={TaskStatus.IN_PROGRESS}>В работе</option>
            <option value={TaskStatus.REVIEW}>На проверке</option>
            <option value={TaskStatus.DONE}>Завершено</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Приоритет
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={TaskPriority.LOW}>Низкий</option>
            <option value={TaskPriority.MEDIUM}>Средний</option>
            <option value={TaskPriority.HIGH}>Высокий</option>
            <option value={TaskPriority.URGENT}>Срочно</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="assignee"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Исполнитель
        </label>
        <select
          id="assignee"
          name="assignee"
          value={formData.assignee || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Не назначен</option>
          {currentProject?.members?.map((member: any) => {
            const userId = member.user?.id || member.id;
            const displayName = member.user
              ? `${member.user.first_name || ""} ${member.user.last_name || ""}`.trim() ||
                member.user.username ||
                member.user.email
              : `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
                member.username ||
                member.email ||
                "Без имени";

            return (
              <option key={userId} value={userId}>
                {displayName}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label
          htmlFor="deadline"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Срок выполнения
        </label>
        <input
          type="date"
          id="deadline"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {initialData ? "Сохранить изменения" : "Создать задачу"}
        </button>
      </div>
    </form>
  );
};
