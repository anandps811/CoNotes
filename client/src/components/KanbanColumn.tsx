import { useState, useRef } from "react";
import { ColumnStatus, COLUMNS, useBoard } from "@/context/BoardContext";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface KanbanColumnProps {
  column: typeof COLUMNS[number];
  onCardClick: (cardId: string) => void;
}

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const { getColumnCards, addCard, moveCard } = useBoard();
  const cards = getColumnCards(column.id);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addCard(newTitle.trim(), column.id);
    setNewTitle("");
    setAdding(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const cardId = e.dataTransfer.getData("text/plain");
    if (cardId) {
      moveCard(cardId, column.id, cards.length);
    }
  };

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[320px] w-full rounded-xl bg-muted/30 border-t-2 ${column.color} transition-colors ${dragOver ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-display font-semibold text-foreground">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
            {cards.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards */}
      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin">
        {cards.map(card => (
          <TaskCard
            key={card.id}
            card={card}
            onClick={() => onCardClick(card.id)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", card.id);
              e.dataTransfer.effectAllowed = "move";
            }}
          />
        ))}

        {/* Add card inline */}
        {adding && (
          <div className="glass-card rounded-lg p-3 space-y-2 animate-scale-in">
            <Input
              ref={inputRef}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Card title..."
              className="text-sm"
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
                Add
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setAdding(false); setNewTitle(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
