import axiosInstance from "./axios";
import type { Comment } from "../types";

export const commentsApi = {
  getByTask: async (taskId: number): Promise<Comment[]> => {
    try {
      const { data } = await axiosInstance.get(`/comments/?task=${taskId}`);

      if (Array.isArray(data)) {
        return data;
      }

      if (data && Array.isArray(data.results)) {
        return data.results;
      }

      console.warn("Unexpected comments response format:", data);
      return [];
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  },

  create: async (taskId: number, content: string): Promise<Comment> => {
    const { data } = await axiosInstance.post<Comment>("/comments/", {
      task: taskId,
      content,
    });

    if (!data.author) {
      console.error("Comment created without author data:", data);
      throw new Error("Invalid comment data received from server");
    }

    return data;
  },

  delete: async (commentId: number): Promise<void> => {
    await axiosInstance.delete(`/comments/${commentId}/`);
  },
};
