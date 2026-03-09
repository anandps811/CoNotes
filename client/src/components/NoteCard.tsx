import { Note } from "@/context/NotesContext";
import { useAuth } from "@/context/AuthContext";
import { FileText, Users, Clock, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { getNoteEditorPath } from "@/routes/paths";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = note.owner === user?.id;
  const plainText = note.content.replace(/<[^>]*>/g, "").slice(0, 120);

  return (
    <div
      className="glass-card rounded-xl p-5 cursor-pointer group hover:border-primary/30 transition-all duration-300 animate-fade-in"
      onClick={() => navigate(getNoteEditorPath(note.id))}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground truncate max-w-[180px]">{note.title}</h3>
        </div>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={e => { e.stopPropagation(); onDelete(note.id); }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
        {plainText || "Empty note..."}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(note.updatedAt, "MMM d, yyyy")}
        </div>
        {note.collaborators.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {note.collaborators.length} shared
          </div>
        )}
      </div>
    </div>
  );
}
