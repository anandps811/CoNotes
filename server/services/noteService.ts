import { Types } from "mongoose";
import Note, { INoteDocument } from "../models/Note.js";

const toId = (id: Types.ObjectId | string): string => id.toString();

export const isOwner = (note: INoteDocument, userId: Types.ObjectId | string): boolean =>
  toId(note.owner) === toId(userId);

export const getCollaborator = (note: INoteDocument, userId: Types.ObjectId | string) =>
  note.collaborators.find((c) => toId(c.user) === toId(userId));

export const canViewNote = (note: INoteDocument, userId: Types.ObjectId | string): boolean =>
  isOwner(note, userId) || Boolean(getCollaborator(note, userId));

export const canEditNote = (note: INoteDocument, userId: Types.ObjectId | string): boolean => {
  if (isOwner(note, userId)) return true;
  const collaborator = getCollaborator(note, userId);
  return collaborator?.permission === "editor";
};

export const assertCanViewNote = (note: INoteDocument, userId: Types.ObjectId | string): void => {
  if (!canViewNote(note, userId)) {
    const error = new Error("Not authorized to view this note") as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }
};

export const assertCanEditNote = (note: INoteDocument, userId: Types.ObjectId | string): void => {
  if (!canEditNote(note, userId)) {
    const error = new Error("Not authorized to edit this note") as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }
};

export const assertOwner = (note: INoteDocument, userId: Types.ObjectId | string): void => {
  if (!isOwner(note, userId)) {
    const error = new Error("Only owner can perform this action") as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }
};

export const getAccessibleNotes = (userId: Types.ObjectId | string) =>
  Note.find({
    $or: [{ owner: userId }, { "collaborators.user": userId }]
  })
    .populate("owner", "name email")
    .populate("collaborators.user", "name email")
    .sort({ updatedAt: -1 });
