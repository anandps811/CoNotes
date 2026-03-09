import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  removeCollaborator,
  shareNote,
  updateCollaboratorPermission,
  updateNote
} from "../controllers/noteController.js";

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(getNotes).post(createNote);
router.route("/:id").get(getNoteById).put(updateNote).delete(deleteNote);
router.post("/:id/share", shareNote);
router.delete("/:id/collaborators/:userId", removeCollaborator);
router.patch("/:id/collaborators/:userId/permission", updateCollaboratorPermission);

export default router;
