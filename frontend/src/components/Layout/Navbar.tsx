import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold text-gray-800">
              ProjectManager
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-medium">
                  {user.first_name?.[0] ?? user.username?.[0] ?? "?"}
                  {user.last_name?.[0] ?? ""}
                </div>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-red-600 transition"
                  title="Выйти"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
