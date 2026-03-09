import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotes } from "@/context/NotesContext";
import { useAuth } from "@/context/AuthContext";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ShareModal } from "@/components/ShareModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Share2, Users, Check, Wifi, FileText } from "lucide-react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";
import { ROUTES } from "@/routes/paths";

const NoteEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getNote, updateNote, notesLoading } = useNotes();
  const { user } = useAuth();
  const note = getNote(id || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const socketRef = useRef<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id]);

  const isOwner = note?.owner === user?.id;
  const collabEntry = note?.collaborators.find(c => c.user.id === user?.id);
  const canEdit = isOwner || collabEntry?.permission === "editor";

  useEffect(() => {
    if (!id || !token || !user) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    const onNoteUpdate = (payload: any) => {
      if (payload?.note) {
        const payloadId = payload.note._id || payload.note.id;
        if (payloadId !== id) return;
        if (typeof payload.note.title === "string") setTitle(payload.note.title);
        if (typeof payload.note.content === "string") setContent(payload.note.content);
        setSaved(true);
        return;
      }

      if (payload?.noteId !== id) return;
      if (payload?.updatedBy?.id === user.id) return;

      if (typeof payload.title === "string") setTitle(payload.title);
      if (typeof payload.content === "string") setContent(payload.content);
      setSaved(true);
    };

    const onPresenceUpdate = (payload: any) => {
      if (payload?.noteId !== id) return;
      setOnlineUsers(Array.isArray(payload?.users) ? payload.users : []);
    };

    const onTypingStart = (payload: any) => {
      if (payload?.noteId !== id || payload?.user?.id === user.id) return;
      setTypingUsers((prev) => ({ ...prev, [payload.user.id]: payload.user.name }));
    };

    const onTypingStop = (payload: any) => {
      if (payload?.noteId !== id) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (payload?.user?.id) delete next[payload.user.id];
        return next;
      });
    };

    socket.emit("join-note", id);
    socket.on("note-update", onNoteUpdate);
    socket.on("presence-update", onPresenceUpdate);
    socket.on("typing-start", onTypingStart);
    socket.on("typing-stop", onTypingStop);

    return () => {
      socket.emit("leave-note", id);
      socket.off("note-update", onNoteUpdate);
      socket.off("presence-update", onPresenceUpdate);
      socket.off("typing-start", onTypingStart);
      socket.off("typing-stop", onTypingStop);
    };
  }, [id, token, user]);

  const emitTyping = useCallback(() => {
    if (!id || !socketRef.current || !canEdit) return;
    socketRef.current.emit("typing-start", { noteId: id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing-stop", { noteId: id });
    }, 1200);
  }, [id, canEdit]);

  const autoSave = useCallback((newTitle: string, newContent: string) => {
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (id) {
        if (socketRef.current) {
          socketRef.current.emit("note-update", { noteId: id, title: newTitle, content: newContent });
        } else {
          await updateNote(id, { title: newTitle, content: newContent });
        }
        setSaved(true);
      }
    }, 1500);
  }, [id, updateNote]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    emitTyping();
    autoSave(val, content);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    emitTyping();
    autoSave(title, val);
  };

  if (notesLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-xl font-display font-semibold mb-2">Note not found</h2>
          <Button variant="ghost" onClick={() => navigate(ROUTES.DASHBOARD)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.DASHBOARD)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-display font-semibold text-gradient">CoNotes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save indicator */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
              {saved ? (
                <><Check className="h-3 w-3 text-success" /> Saved</>
              ) : (
                <><Wifi className="h-3 w-3 animate-pulse" /> Saving...</>
              )}
            </div>

            {/* Online users indicator */}
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1 mr-2">
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      className="h-7 w-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-semibold text-primary"
                      title={u.name}
                    >
                      {u.name[0]}
                    </div>
                  ))}
                </div>
                {onlineUsers.length > 3 && (
                  <span className="text-xs text-muted-foreground ml-1">+{onlineUsers.length - 3}</span>
                )}
              </div>
            )}

            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                <Share2 className="h-3.5 w-3.5 mr-1" />
                Share
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="mb-4">
          {canEdit ? (
            <Input
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              className="text-2xl sm:text-3xl font-display font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
              placeholder="Untitled note..."
            />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-display font-bold">{title}</h1>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {!isOwner && (
              <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                <Users className="h-3 w-3" />
                {collabEntry?.permission === "editor" ? "Editor" : "Viewer"}
              </span>
            )}
            {Object.keys(typingUsers).length > 0 && (
              <span>{Object.values(typingUsers).join(", ")} editing...</span>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden flex-1">
          <RichTextEditor content={content} onChange={handleContentChange} readOnly={!canEdit} />
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal note={note} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
};

export default NoteEditor;
