import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import {
  fetchCommentsByTask,
  createComment,
  deleteComment,
} from "../../store/slices/commentsSlice";
import type { Comment } from "../../types";

interface CommentListProps {
  taskId: number;
}

export const CommentList = ({ taskId }: CommentListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((state: RootState) => state.comments);
  const { user } = useSelector((state: RootState) => state.auth);

  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      dispatch(fetchCommentsByTask(taskId));
    }
  }, [taskId, dispatch]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await dispatch(
        createComment({ taskId, content: newComment.trim() }),
      ).unwrap();
      setNewComment("");
    } catch (err: any) {
      console.error("Failed to create comment:", err);
      setError(err?.message || "Ошибка при добавлении комментария");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Удалить комментарий?")) {
      try {
        await dispatch(deleteComment(id)).unwrap();
      } catch (err) {
        console.error("Failed to delete comment:", err);
        setError("Ошибка при удалении комментария");
      }
    }
  };

  const formatDate = (date: string) => {
    try {
      const d = new Date(date);
      return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Неизвестная дата";
    }
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Комментарии</h3>

      {loading && (
        <p className="text-gray-500 text-sm mb-3">Загрузка комментариев...</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {items.length === 0 && !loading ? (
          <p className="text-sm text-gray-500">Комментариев пока нет.</p>
        ) : (
          items.map((comment: Comment) => {
            // ✅ Безопасная проверка наличия author
            if (!comment.author) {
              console.error("Comment without author:", comment);
              return null;
            }

            return (
              <div
                key={comment.id}
                className="flex items-start justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-gray-100 transition"
              >
                <div className="flex gap-3">
                  {/* Аватар */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {comment.author?.first_name?.[0] ??
                      comment.author?.username?.[0] ??
                      "?"}
                  </div>

                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">
                        {comment.author?.first_name ||
                          comment.author?.username ||
                          "Без имени"}
                      </span>
                      <span className="text-gray-500 text-xs ml-2">
                        {formatDate(comment.created_at)}
                      </span>
                    </p>
                    <p className="text-gray-700 text-sm mt-1">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {user?.id === comment.author?.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                    title="Удалить комментарий"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleAddComment}
        className="mt-4 flex items-center gap-2 border-t pt-3"
      >
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Написать комментарий..."
          disabled={submitting}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Отправка..." : "Отправить"}
        </button>
      </form>
    </div>
  );
};
