import mongoose, { Document, Model, Types } from "mongoose";

export type CollaboratorPermission = "viewer" | "editor";

export interface ICollaborator {
  user: Types.ObjectId;
  permission: CollaboratorPermission;
}

export interface INote {
  title: string;
  content: string;
  owner: Types.ObjectId;
  collaborators: ICollaborator[];
  lastEditedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoteDocument extends INote, Document {}

const collaboratorSchema = new mongoose.Schema<ICollaborator>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    permission: {
      type: String,
      enum: ["viewer", "editor"],
      required: true,
      default: "viewer"
    }
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema<INoteDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled"
    },
    content: {
      type: String,
      default: ""
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    collaborators: {
      type: [collaboratorSchema],
      default: []
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const Note: Model<INoteDocument> = mongoose.model<INoteDocument>("Note", noteSchema);

export default Note;
