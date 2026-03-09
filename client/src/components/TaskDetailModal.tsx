import { useState } from "react";
import { Card, Priority, PRIORITY_CONFIG, COLUMNS, ColumnStatus, useBoard, Label, TeamMember } from "@/context/BoardContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label as UILabel } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Calendar, Tag, Flag, Columns, UserPlus, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TaskDetailModalProps {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ card, open, onOpenChange }: TaskDetailModalProps) {
  const { updateCard, deleteCard, availableLabels, teamMembers } = useBoard();

  if (!card) return null;

  const handleUpdate = (updates: Partial<Omit<Card, "id" | "createdAt">>) => {
    updateCard(card.id, updates);
  };

  const toggleLabel = (label: Label) => {
    const has = card.labels.some(l => l.id === label.id);
    const newLabels = has ? card.labels.filter(l => l.id !== label.id) : [...card.labels, label];
    handleUpdate({ labels: newLabels });
  };

  const assignMember = (member: TeamMember) => {
    handleUpdate({ assignee: { id: member.id, name: member.name, email: member.email } });
  };

  const removeAssignee = () => {
    handleUpdate({ assignee: undefined });
  };

  const handleDelete = () => {
    deleteCard(card.id);
    onOpenChange(false);
    toast.success("Card deleted");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <Input
              value={card.title}
              onChange={e => handleUpdate({ title: e.target.value })}
              className="text-lg font-display font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
              placeholder="Card title..."
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <UILabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Columns className="h-3 w-3" /> Status
              </UILabel>
              <Select value={card.status} onValueChange={(v: ColumnStatus) => handleUpdate({ status: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <UILabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Flag className="h-3 w-3" /> Priority
              </UILabel>
              <Select value={card.priority} onValueChange={(v: Priority) => handleUpdate({ priority: v })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-1.5">{cfg.icon} {cfg.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <UILabel className="text-xs text-muted-foreground flex items-center gap-1">
              <UserPlus className="h-3 w-3" /> Assignee
            </UILabel>
            {card.assignee ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary border border-primary/20">
                  {card.assignee.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{card.assignee.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{card.assignee.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={removeAssignee}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground h-9">
                    <UserPlus className="h-3.5 w-3.5 mr-2" /> Assign a team member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1" align="start">
                  <div className="space-y-0.5">
                    {teamMembers.map(member => (
                      <button
                        key={member.id}
                        onClick={() => assignMember(member)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left hover:bg-accent transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary border border-primary/20 shrink-0">
                          {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <UILabel className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Due Date
            </UILabel>
            <Input
              type="date"
              value={card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : ""}
              onChange={e => handleUpdate({ dueDate: e.target.value ? new Date(e.target.value) : undefined })}
              className="h-9 text-sm"
            />
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <UILabel className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" /> Labels
            </UILabel>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map(label => {
                const active = card.labels.some(l => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-all border ${label.color} ${active ? "ring-2 ring-primary/40 opacity-100" : "opacity-50 hover:opacity-80 border-transparent"}`}
                  >
                    {label.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <UILabel className="text-xs text-muted-foreground">Description</UILabel>
            <Textarea
              value={card.description}
              onChange={e => handleUpdate({ description: e.target.value })}
              placeholder="Add a description..."
              className="min-h-[120px] text-sm resize-none"
            />
          </div>

          {/* Meta + Delete */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Updated {format(card.updatedAt, "MMM d, yyyy 'at' h:mm a")}
            </span>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}