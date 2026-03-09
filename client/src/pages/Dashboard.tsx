import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBoard, COLUMNS, PRIORITY_CONFIG, Priority } from "@/context/BoardContext";
import { useNotes } from "@/context/NotesContext";
import { KanbanColumn } from "@/components/KanbanColumn";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Search, Filter, LayoutDashboard, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getNoteEditorPath, ROUTES } from "@/routes/paths";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { board, cards } = useBoard();
  const { createNote } = useNotes();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => cards.find(c => c.id === selectedCardId) || null,
    [cards, selectedCardId]
  );

  // Stats
  const stats = useMemo(() => ({
    total: cards.length,
    urgent: cards.filter(c => c.priority === "urgent").length,
    inProgress: cards.filter(c => c.status === "in-progress").length,
    done: cards.filter(c => c.status === "done").length,
  }), [cards]);

  const handleCreateNote = async () => {
    try {
      const note = await createNote("Untitled note");
      navigate(getNoteEditorPath(note.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to create note");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center glow-amber">
              <LayoutDashboard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-gradient leading-tight">CoNotes</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">{board.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 mr-4 text-xs">
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">{stats.total}</span> cards</span>
              <span className="text-priority-urgent"><span className="font-semibold">{stats.urgent}</span> urgent</span>
              <span className="text-primary"><span className="font-semibold">{stats.inProgress}</span> active</span>
              <span className="text-priority-low"><span className="font-semibold">{stats.done}</span> done</span>
            </div>

            <Button variant="outline" size="sm" onClick={handleCreateNote}>
              <FileText className="h-4 w-4 mr-1" />
              New Note
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate(ROUTES.LOGIN); }} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="px-4 sm:px-6 pb-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | "all")}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-1">{cfg.icon} {cfg.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-x-auto px-4 sm:px-6 py-5">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(column => (
            <KanbanColumn key={column.id} column={column} onCardClick={setSelectedCardId} />
          ))}
        </div>
      </main>

      {/* Card Detail Modal */}
      <TaskDetailModal
        card={selectedCard}
        open={!!selectedCardId}
        onOpenChange={(open) => { if (!open) setSelectedCardId(null); }}
      />
    </div>
  );
};

export default Dashboard;
