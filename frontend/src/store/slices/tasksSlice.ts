import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit"; // ✅ тип импортирован отдельно
import { tasksApi } from "../../api/tasks";
import type { TasksState, Task, TaskFormData, TaskStatus } from "../../types"; // ✅ типовой импорт
import { handleApiError } from "../../api/axios";

const initialState: TasksState = {
  items: [],
  loading: false,
  error: null,
  filter: {},
};

export const fetchTasksByProject = createAsyncThunk(
  "tasks/fetchByProject",
  async (projectId: number, { rejectWithValue }) => {
    try {
      const tasks = await tasksApi.getByProject(projectId);
      return tasks;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (taskData: TaskFormData, { rejectWithValue }) => {
    try {
      const task = await tasksApi.create(taskData);
      return task;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async (
    { id, data }: { id: number; data: Partial<TaskFormData> },
    { rejectWithValue },
  ) => {
    try {
      const task = await tasksApi.update(id, data);
      return task;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await tasksApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async (
    { id, status }: { id: number; status: TaskStatus },
    { rejectWithValue },
  ) => {
    try {
      const task = await tasksApi.updateStatus(id, status);
      return task;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const reorderTask = createAsyncThunk(
  "tasks/reorder",
  async (
    {
      taskId,
      newOrder,
      newStatus,
    }: { taskId: number; newOrder: number; newStatus?: TaskStatus },
    { rejectWithValue },
  ) => {
    try {
      const task = await tasksApi.reorder(taskId, newOrder, newStatus);
      return task;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilter: (
      state,
      action: PayloadAction<Partial<TasksState["filter"]>>,
    ) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearFilter: (state) => {
      state.filter = {};
    },
    addTask: (state, action: PayloadAction<Task>) => {
      const exists = state.items.find((t) => t.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    updateTaskInStore: (state, action: PayloadAction<Task>) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeTask: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasksByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasksByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(reorderTask.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const {
  clearError,
  setFilter,
  clearFilter,
  addTask,
  updateTaskInStore,
  removeTask,
} = tasksSlice.actions;

export default tasksSlice.reducer;
