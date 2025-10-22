import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { deleteTask, updateTask } from "../../store/slices/tasksSlice";
import { TaskPriority, type Task, type TaskFormData } from "../../types";
import { Modal } from "../Modal";
import { TaskForm } from "../forms/TaskForm";
import { CommentList } from "../comments/CommentList";
import { addComment } from "../../store/slices/commentsSlice";
import { tokenStorage } from "../../api/axios";

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

const priorityColors = {
  [TaskPriority.LOW]: "bg-gray-200 text-gray-700",
  [TaskPriority.MEDIUM]: "bg-blue-200 text-blue-700",
  [TaskPriority.HIGH]: "bg-orange-200 text-orange-700",
  [TaskPriority.URGENT]: "bg-red-200 text-red-700",
};

const priorityLabels = {
  [TaskPriority.LOW]: "Низкий",
  [TaskPriority.MEDIUM]: "Средний",
  [TaskPriority.HIGH]: "Высокий",
  [TaskPriority.URGENT]: "Срочно",
};

export const TaskCard = ({ task, onDragStart }: TaskCardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const tokens = tokenStorage.getTokens();
    if (!tokens?.access || !task.project) return;

    const ws = new WebSocket(
      `${WS_URL}/ws/projects/${task.project}/?token=${tokens.access}`,
    );

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "comment_created" && msg.comment) {
          if (msg.comment.task === task.id) {
            dispatch(addComment(msg.comment));
          }
        } else if (msg.type === "task_updated" && msg.task?.id === task.id) {
          console.log("Task updated via WebSocket:", msg.task);
        } else if (msg.type === "task_deleted" && msg.task_id === task.id) {
          console.log("Task deleted via WebSocket:", msg.task_id);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onopen = () => {
      console.log(`🔌 WebSocket подключен для проекта ${task.project}`);
    };

    ws.onerror = (error) => {
      console.error(`❌ WebSocket error для проекта ${task.project}:`, error);
    };

    ws.onclose = (event) => {
      console.log(
        `❌ WebSocket отключен для проекта ${task.project}`,
        event.code,
        event.reason,
      );
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [task.project, task.id, dispatch]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Удалить эту задачу?")) {
      try {
        await dispatch(deleteTask(task.id)).unwrap();
      } catch (error) {
        console.error("Failed to delete task:", error);
        alert("Ошибка при удалении задачи");
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (taskData: TaskFormData) => {
    try {
      await dispatch(updateTask({ id: task.id, data: taskData })).unwrap();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Ошибка при обновлении задачи");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "Неверная дата";
    }
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task)}
        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {showActions && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-gray-100 rounded transition"
              title="Редактировать"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 rounded transition"
              title="Удалить"
            >
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}

        <h4 className="font-medium text-gray-800 mb-2 pr-16">{task.title}</h4>

        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}
          >
            {priorityLabels[task.priority]}
          </span>

          {task.assignee ? (
            <div
              className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-xs font-medium"
              title={
                `${task.assignee.first_name || ""} ${task.assignee.last_name || ""}`.trim() ||
                task.assignee.username ||
                "Без имени"
              }
            >
              {task.assignee.first_name?.[0] ??
                task.assignee.username?.[0] ??
                "?"}
              {task.assignee.last_name?.[0] ?? ""}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>

        {task.deadline && (
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(task.deadline)}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments((prev) => !prev);
          }}
          className="text-xs text-blue-600 mt-3 hover:underline focus:outline-none"
        >
          {showComments ? "Скрыть комментарии" : "Показать комментарии"}
        </button>

        {/* 💬 Комментарии прямо в карточке */}
        {showComments && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <CommentList taskId={task.id} />
          </div>
        )}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактировать задачу"
      >
        <div className="space-y-6">
          <TaskForm
            projectId={task.project}
            initialData={task}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
          />

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Комментарии
            </h3>
            <CommentList taskId={task.id} />
          </div>
        </div>
      </Modal>
    </>
  );
};
