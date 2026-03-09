import { useState } from "react";
import { Note, useNotes } from "@/context/NotesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, X, Shield, Pencil } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareModal({ note, open, onOpenChange }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"viewer" | "editor">("viewer");
  const { shareNote, removeCollaborator, updatePermission } = useNotes();

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    try {
      await shareNote(note.id, email, permission);
      setEmail("");
      toast.success(`Shared with ${email}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to share note");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Share "{note.title}"</DialogTitle>
          <DialogDescription>Invite collaborators by email</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleShare} className="flex gap-2 mt-2">
          <Input
            placeholder="user@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={permission} onValueChange={(v: "viewer" | "editor") => setPermission(v)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="icon">
            <UserPlus className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {note.collaborators.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No collaborators yet</p>
          )}
          {note.collaborators.map(c => (
            <div key={c.user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {c.user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.user.name}</p>
                  <p className="text-xs text-muted-foreground">{c.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={c.permission}
                  onValueChange={async (v: "viewer" | "editor") => {
                    try {
                      await updatePermission(note.id, c.user.id, v);
                      toast.success("Permission updated");
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to update permission");
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Viewer</span>
                    </SelectItem>
                    <SelectItem value="editor">
                      <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Editor</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    try {
                      await removeCollaborator(note.id, c.user.id);
                      toast.success("Removed");
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to remove collaborator");
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
