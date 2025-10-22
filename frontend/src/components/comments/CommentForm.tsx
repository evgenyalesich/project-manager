import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { createComment } from "../../store/slices/commentsSlice";

interface CommentFormProps {
  taskId: number;
}

export const CommentForm = ({ taskId }: CommentFormProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await dispatch(
        createComment({ taskId, content: content.trim() }),
      ).unwrap();
      setContent("");
    } catch (err: any) {
      console.error("Failed to create comment:", err);
      setError(err?.message || "Ошибка при добавлении комментария");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 pt-3 mt-3"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Оставить комментарий..."
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Отправка..." : "Отправить"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};
