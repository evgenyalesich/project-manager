import axiosInstance, { tokenStorage } from "./axios";
import type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from "../types";

export const authApi = {
  login: async (
    credentials: LoginCredentials,
  ): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await axiosInstance.post<{
      user: User;
      tokens: AuthTokens;
    }>("/auth/login/", credentials);

    tokenStorage.setTokens(data.tokens);

    return {
      user: data.user,
      tokens: data.tokens,
    };
  },

  register: async (
    userData: RegisterData,
  ): Promise<{ user: User; tokens: AuthTokens }> => {
    const { data } = await axiosInstance.post<{
      user: User;
      tokens: AuthTokens;
    }>("/auth/register/", userData);

    tokenStorage.setTokens(data.tokens);

    return {
      user: data.user,
      tokens: data.tokens,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await axiosInstance.get<User>("/auth/me/");
    return data;
  },

  logout: async (): Promise<void> => {
    const tokens = tokenStorage.getTokens();
    if (tokens?.refresh) {
      try {
        await axiosInstance.post("/auth/logout/", { refresh: tokens.refresh });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    tokenStorage.clearTokens();
  },

  refreshToken: async (refresh: string): Promise<AuthTokens> => {
    const { data } = await axiosInstance.post<{ access: string }>(
      "/auth/token/refresh/",
      {
        refresh,
      },
    );
    const tokens: AuthTokens = {
      access: data.access,
      refresh,
    };
    tokenStorage.setTokens(tokens);
    return tokens;
  },

  checkAuth: (): boolean => {
    const tokens = tokenStorage.getTokens();
    return !!tokens?.access;
  },
};
