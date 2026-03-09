import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import Note from "../models/Note.js";
import User, { IUserDocument } from "../models/User.js";
import { canEditNote, canViewNote } from "../services/noteService.js";

type SocketUser = {
  _id: string;
  name: string;
  email: string;
};

type NoteSocket = Socket & {
  user?: SocketUser;
};

const notePresence = new Map<string, Map<string, { id: string; name: string; email: string }>>();

const getTokenFromSocket = (socket: NoteSocket): string | null => {
  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string") {
    return authToken.startsWith("Bearer ") ? authToken.split(" ")[1] : authToken;
  }
  return null;
};

const addPresence = (noteId: string, socket: NoteSocket, user: SocketUser): void => {
  if (!notePresence.has(noteId)) {
    notePresence.set(noteId, new Map());
  }
  const roomUsers = notePresence.get(noteId)!;
  roomUsers.set(socket.id, { id: user._id, name: user.name, email: user.email });
};

const removePresence = (noteId: string, socketId: string): void => {
  if (!notePresence.has(noteId)) return;

  const roomUsers = notePresence.get(noteId)!;
  roomUsers.delete(socketId);

  if (roomUsers.size === 0) {
    notePresence.delete(noteId);
  }
};

const getPresenceList = (noteId: string): { id: string; name: string; email: string }[] => {
  if (!notePresence.has(noteId)) return [];
  return Array.from(notePresence.get(noteId)!.values());
};

const registerNoteSocket = (io: Server): void => {
  io.use(async (socket: NoteSocket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) return next(new Error("Authentication token missing"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      const user = (await User.findById(decoded.id).select("-password")) as IUserDocument | null;
      if (!user) return next(new Error("User not found"));

      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email
      };
      next();
    } catch (_err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: NoteSocket) => {
    socket.on("join-note", async (noteId: string) => {
      try {
        if (!socket.user) return;
        const note = await Note.findById(noteId);
        if (!note || !canViewNote(note, socket.user._id)) {
          socket.emit("socket-error", { message: "Not authorized to access this note" });
          return;
        }

        socket.join(noteId);
        addPresence(noteId, socket, socket.user);

        io.to(noteId).emit("presence-update", { noteId, users: getPresenceList(noteId) });
        socket.to(noteId).emit("user-joined", {
          noteId,
          user: { id: socket.user._id, name: socket.user.name, email: socket.user.email }
        });
      } catch (_err) {
        socket.emit("socket-error", { message: "Failed to join note room" });
      }
    });

    socket.on("leave-note", (noteId: string) => {
      if (!socket.user) return;
      socket.leave(noteId);
      removePresence(noteId, socket.id);
      io.to(noteId).emit("presence-update", { noteId, users: getPresenceList(noteId) });
      socket.to(noteId).emit("user-left", {
        noteId,
        user: { id: socket.user._id, name: socket.user.name, email: socket.user.email }
      });
    });

    socket.on("typing-start", async ({ noteId }: { noteId: string }) => {
      if (!socket.user) return;
      const note = await Note.findById(noteId);
      if (!note || !canEditNote(note, socket.user._id)) return;

      socket.to(noteId).emit("typing-start", {
        noteId,
        user: { id: socket.user._id, name: socket.user.name, email: socket.user.email }
      });
    });

    socket.on("typing-stop", ({ noteId }: { noteId: string }) => {
      if (!socket.user) return;
      socket.to(noteId).emit("typing-stop", {
        noteId,
        user: { id: socket.user._id, name: socket.user.name, email: socket.user.email }
      });
    });

    socket.on(
      "note-update",
      async ({ noteId, title, content }: { noteId: string; title?: string; content?: string }) => {
        try {
          if (!socket.user) return;
          const note = await Note.findById(noteId);
          if (!note || !canEditNote(note, socket.user._id)) {
            socket.emit("socket-error", { message: "Not authorized to edit this note" });
            return;
          }

          if (typeof title === "string") note.title = title;
          if (typeof content === "string") note.content = content;
          note.lastEditedBy = note.owner.constructor(socket.user._id);
          await note.save();

          socket.to(noteId).emit("note-update", {
            noteId,
            title: note.title,
            content: note.content,
            updatedAt: note.updatedAt,
            updatedBy: { id: socket.user._id, name: socket.user.name, email: socket.user.email }
          });
        } catch (_err) {
          socket.emit("socket-error", { message: "Failed to update note" });
        }
      }
    );

    socket.on("disconnect", () => {
      if (!socket.user) return;
      for (const [noteId, roomUsers] of notePresence.entries()) {
        if (!roomUsers.has(socket.id)) continue;

        removePresence(noteId, socket.id);
        io.to(noteId).emit("presence-update", { noteId, users: getPresenceList(noteId) });
        socket.to(noteId).emit("user-left", {
          noteId,
          user: { id: socket.user._id, name: socket.user.name, email: socket.user.email }
        });
      }
    });
  });
};

export default registerNoteSocket;
