import type { Project } from "../types";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: number) => void;
  onClick: () => void;
}

export const ProjectCard = ({
  project,
  onDelete,
  onClick,
}: ProjectCardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-200"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex-1">
          {project.title}
        </h3>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 ml-2"
          title="Удалить проект"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">
        {project.description || "Нет описания"}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span>{project.members.length} участников</span>
        </div>
        <span>Создан: {formatDate(project.created_at)}</span>
      </div>

      <div className="flex -space-x-2 mt-4">
        {project.members.slice(0, 5).map((member) => {
          const firstLetter =
            member.first_name?.[0] ?? member.username?.[0] ?? "?";
          const lastLetter = member.last_name?.[0] ?? "";
          const fullName =
            [member.first_name, member.last_name].filter(Boolean).join(" ") ||
            member.username ||
            "—";

          return (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-medium border-2 border-white"
              title={fullName}
            >
              {firstLetter}
              {lastLetter}
            </div>
          );
        })}
        {project.members.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white">
            +{project.members.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
