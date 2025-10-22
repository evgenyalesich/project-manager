import axiosInstance from "./axios";
import type {
  Project,
  ProjectFormData,
  PaginatedResponse,
  User,
} from "../types";

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } =
      await axiosInstance.get<PaginatedResponse<Project>>("/projects/");
    return data.results;
  },

  getById: async (id: number): Promise<Project> => {
    const { data } = await axiosInstance.get<Project>(`/projects/${id}/`);
    return data;
  },

  create: async (projectData: ProjectFormData): Promise<Project> => {
    const { data } = await axiosInstance.post<Project>(
      "/projects/",
      projectData,
    );
    return data;
  },

  update: async (
    id: number,
    projectData: Partial<ProjectFormData>,
  ): Promise<Project> => {
    const { data } = await axiosInstance.patch<Project>(
      `/projects/${id}/`,
      projectData,
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/projects/${id}/`);
  },

  addMember: async (
    projectId: number,
    userId: number,
    role: string = "viewer",
  ): Promise<{
    id: number;
    user: User;
    role: string;
    joined_at: string;
  }> => {
    const { data } = await axiosInstance.post(
      `/projects/${projectId}/add_member/`,
      {
        user: userId,
        role,
      },
    );
    return data;
  },

  removeMember: async (projectId: number, userId: number): Promise<void> => {
    await axiosInstance.delete(`/projects/${projectId}/members/${userId}/`);
  },
};
