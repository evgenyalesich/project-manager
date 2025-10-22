import { TaskStatus, type Task } from "../../types";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  color: string;
  tasks: Task[];
  onAddTask: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

export const KanbanColumn = ({
  title,
  color,
  tasks,
  onAddTask,
  onDragOver,
  onDrop,
  onDragStart,
}: KanbanColumnProps) => {
  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      <div
        className={`${color} rounded-t-lg p-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="text-gray-700 hover:text-gray-900 transition"
          title="Добавить задачу"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <div
        className="flex-1 bg-gray-100 p-4 rounded-b-lg space-y-3 overflow-y-auto"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {tasks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">Нет задач</p>
            <button
              onClick={onAddTask}
              className="text-blue-600 hover:text-blue-800 text-sm mt-2"
            >
              + Добавить задачу
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
};
