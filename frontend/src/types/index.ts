export interface User {
  id: number;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  avatar?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  owner: User;
  members: User[];
  created_at: string;
  updated_at: string;
}

export const TaskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  DONE: "done",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: number;
  assignee?: User;
  created_by: User;
  created_at: string;
  updated_at: string;
  deadline?: string;
  order: number;
}

export interface Comment {
  id: number;
  task: number;
  author: User;
  content: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: number;
  assignee?: number;
  deadline?: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  member_ids?: number[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WSMessage {
  type: "task_created" | "task_updated" | "task_deleted" | "comment_created";
  data: Task | Comment;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ProjectsState {
  items: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

export interface TasksState {
  items: Task[];
  loading: boolean;
  error: string | null;
  filter: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee?: number;
  };
}
