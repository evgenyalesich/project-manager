import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { addMemberToProject } from "../../store/slices/projectsSlice";
import axiosInstance from "../../api/axios";

interface AddMemberFormProps {
  projectId: number;
  onClose: () => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export const AddMemberForm = ({ projectId, onClose }: AddMemberFormProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("viewer");

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setError("Введите минимум 2 символа");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get(`/users/search/`, {
        params: { q: searchQuery },
      });

      console.log("Search API response:", response.data);

      let data = response.data;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        data = data.results || data.users || data.data || [];
      }

      const users = Array.isArray(data) ? data : [];
      setSearchResults(users);

      if (users.length === 0) {
        setError("Пользователи не найдены");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: number) => {
    try {
      await axiosInstance.post(`/projects/${projectId}/members/add/`, {
        user_id: userId,
        role: selectedRole,
      });

      await dispatch(addMemberToProject({ projectId, userId })).unwrap();

      onClose();
    } catch (err: any) {
      console.error("Add member error:", err);
      setError(
        err?.response?.data?.detail || "Ошибка при добавлении участника",
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Добавить участника</h2>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Email или имя пользователя"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {loading ? "Поиск..." : "Найти"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль участника
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="viewer">Наблюдатель (только чтение)</option>
              <option value="member">Участник (редактирование)</option>
              <option value="owner">Владелец (полный доступ)</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.username}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleAddMember(user.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                  >
                    Добавить
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 &&
            searchResults.length === 0 &&
            !loading &&
            !error && (
              <p className="text-sm text-gray-500 text-center py-4">
                Пользователи не найдены
              </p>
            )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
