import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4">
          Страница не найдена
        </h2>
        <p className="text-gray-600 mt-2 mb-8">
          Запрашиваемая страница не существует или была удалена
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  );
};
