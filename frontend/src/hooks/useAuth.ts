import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../store";
import { loadUser, logout as logoutAction } from "../store/slices/authSlice";
import { authApi } from "../api/auth";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    const checkAuth = async () => {
      if (authApi.checkAuth() && !user && !loading) {
        try {
          await dispatch(loadUser()).unwrap();
        } catch (error) {
          console.error("Failed to load user:", error);
        }
      }
    };

    checkAuth();
  }, [dispatch, user, loading]);

  const logout = async () => {
    await dispatch(logoutAction());
    navigate("/login");
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    logout,
  };
};
