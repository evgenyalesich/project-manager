import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { commentsApi } from "../../api/comments";
import { handleApiError } from "../../api/axios";
import type { Comment } from "../../types";

interface CommentsState {
  items: Comment[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCommentsByTask = createAsyncThunk(
  "comments/fetchByTask",
  async (taskId: number, { rejectWithValue }) => {
    try {
      const comments = await commentsApi.getByTask(taskId);
      return comments;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const createComment = createAsyncThunk(
  "comments/create",
  async (
    { taskId, content }: { taskId: number; content: string },
    { rejectWithValue },
  ) => {
    try {
      const comment = await commentsApi.create(taskId, content);

      if (!comment.author) {
        console.error("Created comment without author:", comment);
        return rejectWithValue("Comment created without author data");
      }

      return comment;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const deleteComment = createAsyncThunk(
  "comments/delete",
  async (commentId: number, { rejectWithValue }) => {
    try {
      await commentsApi.delete(commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearComments: (state) => {
      state.items = [];
      state.error = null;
      state.loading = false;
    },
    addComment: (state, action) => {
      if (action.payload && action.payload.author) {
        state.items.unshift(action.payload);
      } else {
        console.error(
          "Attempted to add comment without author:",
          action.payload,
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommentsByTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommentsByTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter((comment) => comment.author);
        state.error = null;
      })
      .addCase(fetchCommentsByTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createComment.pending, (state) => {
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const exists = state.items.some((c) => c.id === action.payload.id);
        if (!exists && action.payload.author) {
          state.items.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(createComment.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(deleteComment.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearComments, addComment } = commentsSlice.actions;
export default commentsSlice.reducer;
