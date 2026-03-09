import React, { createContext, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/lib/api";

export interface Collaborator {
  user: { id: string; name: string; email: string };
  permission: "viewer" | "editor";
}

export interface Note {
  id: string;
  title: string;
  content: string;
  owner: string;
  collaborators: Collaborator[];
  createdAt: Date;
  updatedAt: Date;
}

interface NotesContextType {
  notes: Note[];
  notesLoading: boolean;
  createNote: (title: string) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Pick<Note, "title" | "content">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Note | undefined;
  shareNote: (noteId: string, email: string, permission: "viewer" | "editor") => Promise<void>;
  removeCollaborator: (noteId: string, userId: string) => Promise<void>;
  updatePermission: (noteId: string, userId: string, permission: "viewer" | "editor") => Promise<void>;
}

const NotesContext = createContext<NotesContextType | null>(null);

type RawUser = { id?: string; _id?: string; name: string; email: string };
type RawNote = {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  owner: string | RawUser;
  collaborators: { user: string | RawUser; permission: "viewer" | "editor" }[];
  createdAt: string;
  updatedAt: string;
};

const getId = (value: { id?: string; _id?: string } | string) =>
  typeof value === "string" ? value : value.id || value._id || "";

const normalizeUser = (value: string | RawUser) => {
  if (typeof value === "string") {
    return { id: value, name: "Unknown", email: "" };
  }
  return { id: getId(value), name: value.name, email: value.email };
};

const normalizeNote = (note: RawNote): Note => ({
  id: getId(note),
  title: note.title,
  content: note.content,
  owner: typeof note.owner === "string" ? note.owner : getId(note.owner),
  collaborators: note.collaborators.map((c) => ({
    user: normalizeUser(c.user),
    permission: c.permission
  })),
  createdAt: new Date(note.createdAt),
  updatedAt: new Date(note.updatedAt)
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  const notesQuery = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: async () => {
      const res = await apiRequest<{ notes: RawNote[] }>("/api/notes", { token });
      return res.notes.map(normalizeNote);
    },
    enabled: Boolean(user && token)
  });

  const upsertNote = (newNote: Note) => {
    queryClient.setQueryData<Note[]>(["notes", user?.id], (prev = []) => {
      const idx = prev.findIndex((n) => n.id === newNote.id);
      if (idx === -1) return [newNote, ...prev];
      const next = [...prev];
      next[idx] = newNote;
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest<{ note: RawNote }>("/api/notes", {
        method: "POST",
        token,
        body: { title }
      });
      return normalizeNote(res.note);
    },
    onSuccess: (note) => upsertNote(note)
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<Pick<Note, "title" | "content">>;
    }) => {
      const res = await apiRequest<{ note: RawNote }>(`/api/notes/${id}`, {
        method: "PUT",
        token,
        body: updates
      });
      return normalizeNote(res.note);
    },
    onSuccess: (note) => upsertNote(note)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest<{ message: string }>(`/api/notes/${id}`, { method: "DELETE", token });
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Note[]>(["notes", user?.id], (prev = []) =>
        prev.filter((n) => n.id !== id)
      );
    }
  });

  const shareMutation = useMutation({
    mutationFn: async ({
      noteId,
      email,
      permission
    }: {
      noteId: string;
      email: string;
      permission: "viewer" | "editor";
    }) => {
      const res = await apiRequest<{ note: RawNote }>(`/api/notes/${noteId}/share`, {
        method: "POST",
        token,
        body: { email, permission }
      });
      return normalizeNote(res.note);
    },
    onSuccess: (note) => upsertNote(note)
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: async ({ noteId, userId }: { noteId: string; userId: string }) => {
      const res = await apiRequest<{ note: RawNote }>(`/api/notes/${noteId}/collaborators/${userId}`, {
        method: "DELETE",
        token
      });
      return normalizeNote(res.note);
    },
    onSuccess: (note) => upsertNote(note)
  });

  const permissionMutation = useMutation({
    mutationFn: async ({
      noteId,
      userId,
      permission
    }: {
      noteId: string;
      userId: string;
      permission: "viewer" | "editor";
    }) => {
      const res = await apiRequest<{ note: RawNote }>(
        `/api/notes/${noteId}/collaborators/${userId}/permission`,
        { method: "PATCH", token, body: { permission } }
      );
      return normalizeNote(res.note);
    },
    onSuccess: (note) => upsertNote(note)
  });

  const notes = useMemo(() => notesQuery.data || [], [notesQuery.data]);
  const getNote = (id: string) => notes.find((n) => n.id === id);

  const value: NotesContextType = {
    notes,
    notesLoading: notesQuery.isLoading,
    createNote: (title) => createMutation.mutateAsync(title),
    updateNote: async (id, updates) => {
      await updateMutation.mutateAsync({ id, updates });
    },
    deleteNote: async (id) => {
      await deleteMutation.mutateAsync(id);
    },
    getNote,
    shareNote: async (noteId, email, permission) => {
      await shareMutation.mutateAsync({ noteId, email, permission });
    },
    removeCollaborator: async (noteId, userId) => {
      await removeCollaboratorMutation.mutateAsync({ noteId, userId });
    },
    updatePermission: async (noteId, userId, permission) => {
      await permissionMutation.mutateAsync({ noteId, userId, permission });
    }
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
