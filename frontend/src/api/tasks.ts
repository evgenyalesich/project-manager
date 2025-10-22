import axiosInstance from "./axios";
import type { Task, TaskFormData, PaginatedResponse, Comment } from "../types";

export const tasksApi = {
  getByProject: async (projectId: number): Promise<Task[]> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Task>>(
      `/tasks/?project=${projectId}`,
    );
    return data.results;
  },

  getById: async (id: number): Promise<Task> => {
    const { data } = await axiosInstance.get<Task>(`/tasks/${id}/`);
    return data;
  },

  create: async (taskData: TaskFormData): Promise<Task> => {
    const { data } = await axiosInstance.post<Task>("/tasks/", taskData);
    return data;
  },

  update: async (
    id: number,
    taskData: Partial<TaskFormData>,
  ): Promise<Task> => {
    const { data } = await axiosInstance.patch<Task>(`/tasks/${id}/`, taskData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/tasks/${id}/`);
  },

  updateStatus: async (id: number, status: string): Promise<Task> => {
    const { data } = await axiosInstance.patch<Task>(`/tasks/${id}/`, {
      status,
    });
    return data;
  },

  assignTask: async (id: number, assigneeId: number | null): Promise<Task> => {
    const { data } = await axiosInstance.patch<Task>(`/tasks/${id}/`, {
      assignee: assigneeId,
    });
    return data;
  },

  reorder: async (
    taskId: number,
    newOrder: number,
    newStatus?: string,
  ): Promise<Task> => {
    const updateData: any = { order: newOrder };
    if (newStatus) {
      updateData.status = newStatus;
    }
    const { data } = await axiosInstance.patch<Task>(
      `/tasks/${taskId}/`,
      updateData,
    );
    return data;
  },

  comments: {
    getByTask: async (taskId: number): Promise<Comment[]> => {
      const { data } = await axiosInstance.get<Comment[]>(
        `/tasks/${taskId}/comments/`,
      );
      return data;
    },

    create: async (taskId: number, content: string): Promise<Comment> => {
      const { data } = await axiosInstance.post<Comment>(
        `/tasks/${taskId}/comments/`,
        {
          content,
        },
      );
      return data;
    },

    delete: async (taskId: number, commentId: number): Promise<void> => {
      await axiosInstance.delete(`/tasks/${taskId}/comments/${commentId}/`);
    },
  },
};
