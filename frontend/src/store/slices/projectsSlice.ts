import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { projectsApi } from "../../api/projects";
import type { ProjectsState, Project, ProjectFormData } from "../../types";
import { handleApiError } from "../../api/axios";

const initialState: ProjectsState = {
  items: [],
  currentProject: null,
  loading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const projects = await projectsApi.getAll();
      return projects;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const project = await projectsApi.getById(id);
      return project;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const createProject = createAsyncThunk(
  "projects/create",
  async (projectData: ProjectFormData, { rejectWithValue }) => {
    try {
      const project = await projectsApi.create(projectData);
      return project;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const updateProject = createAsyncThunk(
  "projects/update",
  async (
    { id, data }: { id: number; data: Partial<ProjectFormData> },
    { rejectWithValue },
  ) => {
    try {
      const project = await projectsApi.update(id, data);
      return project;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      await projectsApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const addMemberToProject = createAsyncThunk<
  number,
  { projectId: number; userId: number }
>(
  "projects/addMember",
  async ({ projectId, userId }, { dispatch, rejectWithValue }) => {
    try {
      await projectsApi.addMember(projectId, userId);
      await dispatch(fetchProjectById(projectId));
      return projectId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

export const removeMemberFromProject = createAsyncThunk<
  number,
  { projectId: number; userId: number }
>(
  "projects/removeMember",
  async ({ projectId, userId }, { dispatch, rejectWithValue }) => {
    try {
      await projectsApi.removeMember(projectId, userId);
      await dispatch(fetchProjectById(projectId));
      return projectId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  },
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;

        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder.addCase(updateProject.fulfilled, (state, action) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    });

    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    });

    builder
      .addCase(addMemberToProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMemberToProject.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addMemberToProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(removeMemberFromProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMemberFromProject.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeMemberFromProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;
