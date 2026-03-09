import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Note from "../models/Note.js";
import User from "../models/User.js";
import {
  assertCanEditNote,
  assertCanViewNote,
  assertOwner,
  getAccessibleNotes
} from "../services/noteService.js";

type ErrorWithStatus = Error & { statusCode?: number };

const emitNoteUpdate = (req: Request, note: any, action = "updated"): void => {
  const io = req.app.get("io");
  if (!io) return;

  io.to(note._id.toString()).emit("note-update", {
    noteId: note._id,
    action,
    note
  });
};

export const getNotes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notes = await getAccessibleNotes(_req.user!._id);
    res.json({ notes });
  } catch (err) {
    next(err);
  }
};

export const getNoteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators.user", "name email");

    if (!note) {
      const error = new Error("Note not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    assertCanViewNote(note, req.user!._id);
    res.json({ note });
  } catch (err) {
    next(err);
  }
};

export const createNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content } = req.body as { title?: string; content?: string };

    const note = await Note.create({
      title: (title || "Untitled").trim(),
      content: content || "",
      owner: req.user!._id,
      lastEditedBy: req.user!._id
    });

    const populated = await note.populate([
      { path: "owner", select: "name email" },
      { path: "collaborators.user", select: "name email" }
    ]);

    res.status(201).json({ note: populated });
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body as { title?: string; content?: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid note id") as ErrorWithStatus;
      error.statusCode = 400;
      throw error;
    }

    const note = await Note.findById(id);
    if (!note) {
      const error = new Error("Note not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    assertCanEditNote(note, req.user!._id);

    if (typeof title === "string") note.title = title;
    if (typeof content === "string") note.content = content;
    note.lastEditedBy = req.user!._id;

    await note.save();

    const populated = await note.populate([
      { path: "owner", select: "name email" },
      { path: "collaborators.user", select: "name email" }
    ]);

    emitNoteUpdate(req, populated, "updated");
    res.json({ note: populated });
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      const error = new Error("Note not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    assertOwner(note, req.user!._id);
    await note.deleteOne();

    emitNoteUpdate(req, note, "deleted");
    res.json({ message: "Note deleted" });
  } catch (err) {
    next(err);
  }
};

export const shareNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, permission } = req.body as {
      email?: string;
      permission?: "viewer" | "editor";
    };

    if (!email || !permission || !["viewer", "editor"].includes(permission)) {
      const error = new Error("Valid email and permission are required") as ErrorWithStatus;
      error.statusCode = 400;
      throw error;
    }

    const note = await Note.findById(id);
    if (!note) {
      const error = new Error("Note not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    assertOwner(note, req.user!._id);

    const collaboratorUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!collaboratorUser) {
      const error = new Error("User with this email not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    if (note.owner.toString() === collaboratorUser._id.toString()) {
      const error = new Error("Owner is already a collaborator with full access") as ErrorWithStatus;
      error.statusCode = 400;
      throw error;
    }

    const existing = note.collaborators.find(
      (c) => c.user.toString() === collaboratorUser._id.toString()
    );

    if (existing) {
      existing.permission = permission;
    } else {
      note.collaborators.push({ user: collaboratorUser._id, permission });
    }

    await note.save();
    const populated = await note.populate([
      { path: "owner", select: "name email" },
      { path: "collaborators.user", select: "name email" }
    ]);

    emitNoteUpdate(req, populated, "shared");
    res.json({ note: populated });
  } catch (err) {
    next(err);
  }
};

export const removeCollaborator = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, userId } = req.params;

    const note = await Note.findById(id);
    if (!note) {
      const error = new Error("Note not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    assertOwner(note, req.user!._id);

    note.collaborators = note.collaborators.filter((c) => c.user.toString() !== userId.toString());

    await note.save();
    const populated = await note.populate([
      { path: "owner", select: "name email" },
      { path: "collaborators.user", select: "name email" }
    ]);

    emitNoteUpdate(req, populated, "collaborator-removed");
    res.json({ note: populated });
  } catch (err) {
    next(err);
  }
};

export const updateCollaboratorPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const { permission } = req.body as { permission?: "viewer" | "editor" };

    if (!permission || !["viewer", "editor"].includes(permission)) {
      const error = new Error("Permission must be viewer or editor") as ErrorWithStatus;
      error.statusCode = 400;
      throw error;
    }

    const note = await Note.findById(id);
    if (!note) {
      const error = new Error("Note not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    assertOwner(note, req.user!._id);

    const collaborator = note.collaborators.find((c) => c.user.toString() === userId.toString());
    if (!collaborator) {
      const error = new Error("Collaborator not found") as ErrorWithStatus;
      error.statusCode = 404;
      throw error;
    }

    collaborator.permission = permission;
    await note.save();

    const populated = await note.populate([
      { path: "owner", select: "name email" },
      { path: "collaborators.user", select: "name email" }
    ]);

    emitNoteUpdate(req, populated, "permission-updated");
    res.json({ note: populated });
  } catch (err) {
    next(err);
  }
};
