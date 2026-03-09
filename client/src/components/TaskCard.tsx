import { Card, PRIORITY_CONFIG } from "@/context/BoardContext";
import { Clock, User, GripVertical } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  card: Card;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function TaskCard({ card, onClick, onDragStart }: TaskCardProps) {
  const priorityCfg = PRIORITY_CONFIG[card.priority];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="glass-card rounded-lg p-3.5 cursor-pointer group hover:border-primary/30 transition-all duration-200 animate-fade-in select-none"
    >
      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {card.labels.map(label => (
            <span key={label.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${label.color}`}>
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground mb-2 leading-snug">{card.title}</h4>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          {card.priority !== "none" && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityCfg.className}`}>
              {priorityCfg.icon} {priorityCfg.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          {/* Due date */}
          {card.dueDate && (
            <span className="flex items-center gap-1 text-[10px]">
              <Clock className="h-3 w-3" />
              {format(card.dueDate, "MMM d")}
            </span>
          )}

          {/* Assignee */}
          {card.assignee && (
            <div
              className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary border border-primary/20"
              title={card.assignee.name}
            >
              {card.assignee.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
          )}
        </div>
      </div>

      {/* Drag handle hint */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}
