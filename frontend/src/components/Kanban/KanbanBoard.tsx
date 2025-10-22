import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { createTask, updateTaskStatus } from "../../store/slices/tasksSlice";
import { TaskStatus, type Task, type TaskFormData } from "../../types";
import { KanbanColumn } from "./KanbanColumn";
import { Modal } from "../Modal";
import { TaskForm } from "../forms/TaskForm";

interface KanbanBoardProps {
  projectId: number;
  tasks: Task[];
  loading: boolean;
}

const columns: { status: TaskStatus; title: string; color: string }[] = [
  { status: TaskStatus.TODO, title: "К выполнению", color: "bg-gray-200" },
  { status: TaskStatus.IN_PROGRESS, title: "В работе", color: "bg-blue-200" },
  { status: TaskStatus.REVIEW, title: "На проверке", color: "bg-yellow-200" },
  { status: TaskStatus.DONE, title: "Завершено", color: "bg-green-200" },
];

export const KanbanBoard = ({
  projectId,
  tasks,
  loading,
}: KanbanBoardProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(
    TaskStatus.TODO,
  );

  const handleCreateTask = async (taskData: TaskFormData) => {
    try {
      await dispatch(createTask({ ...taskData, project: projectId })).unwrap();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData("taskId"));
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      try {
        await dispatch(
          updateTaskStatus({ id: taskId, status: newStatus }),
        ).unwrap();
      } catch (error) {
        console.error("Failed to update task status:", error);
      }
    }
  };

  const openCreateModal = (status: TaskStatus) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full p-6 bg-gray-50 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
          {columns.map((column) => {
            const columnTasks = tasks.filter(
              (task) => task.status === column.status,
            );

            return (
              <KanbanColumn
                key={column.status}
                title={column.title}
                status={column.status}
                color={column.color}
                tasks={columnTasks}
                onAddTask={() => openCreateModal(column.status)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
                onDragStart={handleDragStart}
              />
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Создать новую задачу"
      >
        <TaskForm
          projectId={projectId}
          initialStatus={selectedStatus}
          onSubmit={handleCreateTask}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};
