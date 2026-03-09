export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  NOTE_EDITOR: "/note/:id",
  NOT_FOUND: "*"
} as const;

export const getNoteEditorPath = (id: string) => `/note/${id}`;
