import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

export type Priority = "urgent" | "high" | "medium" | "low" | "none";
export type ColumnStatus = "todo" | "in-progress" | "review" | "done";

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  status: ColumnStatus;
  priority: Priority;
  labels: Label[];
  assignee?: { id: string; name: string; email: string };
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export interface Board {
  id: string;
  title: string;
  owner: string;
  cards: Card[];
  createdAt: Date;
}

export const COLUMNS: { id: ColumnStatus; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "border-muted-foreground/30" },
  { id: "in-progress", title: "In Progress", color: "border-primary/50" },
  { id: "review", title: "Review", color: "border-priority-medium/50" },
  { id: "done", title: "Done", color: "border-priority-low/50" },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; icon: string; className: string }> = {
  urgent: { label: "Urgent", icon: "🔴", className: "bg-priority-urgent/15 text-priority-urgent border-priority-urgent/30" },
  high: { label: "High", icon: "🟠", className: "bg-priority-high/15 text-priority-high border-priority-high/30" },
  medium: { label: "Medium", icon: "🟡", className: "bg-priority-medium/15 text-priority-medium border-priority-medium/30" },
  low: { label: "Low", icon: "🟢", className: "bg-priority-low/15 text-priority-low border-priority-low/30" },
  none: { label: "No Priority", icon: "⚪", className: "bg-muted text-muted-foreground border-border" },
};

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: "u1", name: "You", email: "anand@gmail.com" },
  { id: "u2", name: "Priya Singh", email: "priya@gmail.com" },
  { id: "u3", name: "Alex Chen", email: "alex@gmail.com" },
  { id: "u4", name: "Maya Johnson", email: "maya@gmail.com" },
  { id: "u5", name: "Ravi Patel", email: "ravi@gmail.com" },
];

const DEFAULT_LABELS: Label[] = [
  { id: "l1", name: "Bug", color: "bg-priority-urgent/20 text-priority-urgent" },
  { id: "l2", name: "Feature", color: "bg-primary/20 text-primary" },
  { id: "l3", name: "Design", color: "bg-purple-500/20 text-purple-400" },
  { id: "l4", name: "Backend", color: "bg-priority-low/20 text-priority-low" },
  { id: "l5", name: "Docs", color: "bg-blue-500/20 text-blue-400" },
];

const MOCK_CARDS: Card[] = [
  {
    id: "c1", title: "Design landing page mockup", description: "Create high-fidelity mockups for the new landing page with hero section, features, and CTA.",
    status: "todo", priority: "high", labels: [DEFAULT_LABELS[2]], order: 0,
    dueDate: new Date("2026-03-15"), createdAt: new Date("2026-03-01"), updatedAt: new Date("2026-03-07"),
  },
  {
    id: "c2", title: "Fix authentication redirect bug", description: "Users are being redirected to 404 after login instead of the dashboard. Investigate session handling.",
    status: "todo", priority: "urgent", labels: [DEFAULT_LABELS[0]], order: 1,
    createdAt: new Date("2026-03-06"), updatedAt: new Date("2026-03-07"),
  },
  {
    id: "c3", title: "Implement user notifications", description: "Add real-time notifications for task assignments, due dates, and mentions.",
    status: "in-progress", priority: "medium", labels: [DEFAULT_LABELS[1]], order: 0,
    assignee: { id: "u2", name: "Priya Singh", email: "priya@gmail.com" },
    createdAt: new Date("2026-03-02"), updatedAt: new Date("2026-03-08"),
  },
  {
    id: "c4", title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment to staging.",
    status: "in-progress", priority: "high", labels: [DEFAULT_LABELS[3]], order: 1,
    createdAt: new Date("2026-03-03"), updatedAt: new Date("2026-03-07"),
  },
  {
    id: "c5", title: "Write API documentation", description: "Document all REST endpoints with examples, request/response schemas, and error codes.",
    status: "review", priority: "low", labels: [DEFAULT_LABELS[4]], order: 0,
    assignee: { id: "u3", name: "Alex Chen", email: "alex@gmail.com" },
    dueDate: new Date("2026-03-12"), createdAt: new Date("2026-02-28"), updatedAt: new Date("2026-03-06"),
  },
  {
    id: "c6", title: "Optimize database queries", description: "Profile and optimize slow MongoDB queries. Add indexes where needed.",
    status: "done", priority: "high", labels: [DEFAULT_LABELS[3]], order: 0,
    createdAt: new Date("2026-02-25"), updatedAt: new Date("2026-03-05"),
  },
  {
    id: "c7", title: "Add dark mode toggle", description: "Implement theme switching with persistence in localStorage.",
    status: "done", priority: "low", labels: [DEFAULT_LABELS[1], DEFAULT_LABELS[2]], order: 1,
    createdAt: new Date("2026-02-20"), updatedAt: new Date("2026-03-04"),
  },
];

interface BoardContextType {
  board: Board;
  cards: Card[];
  availableLabels: Label[];
  teamMembers: TeamMember[];
  getColumnCards: (status: ColumnStatus) => Card[];
  addCard: (title: string, status: ColumnStatus) => Card;
  updateCard: (id: string, updates: Partial<Omit<Card, "id" | "createdAt">>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, toStatus: ColumnStatus, toIndex: number) => void;
}

const BoardContext = createContext<BoardContextType | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>(MOCK_CARDS);

  const board: Board = {
    id: "board1", title: "Project Board", owner: user?.id || "", cards, createdAt: new Date("2026-02-15"),
  };

  const getColumnCards = useCallback((status: ColumnStatus) =>
    cards.filter(c => c.status === status).sort((a, b) => a.order - b.order),
  [cards]);

  const addCard = useCallback((title: string, status: ColumnStatus) => {
    const colCards = cards.filter(c => c.status === status);
    const card: Card = {
      id: `c${Date.now()}`, title, description: "", status, priority: "none",
      labels: [], order: colCards.length, createdAt: new Date(), updatedAt: new Date(),
    };
    setCards(prev => [...prev, card]);
    return card;
  }, [cards]);

  const updateCard = useCallback((id: string, updates: Partial<Omit<Card, "id" | "createdAt">>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const moveCard = useCallback((cardId: string, toStatus: ColumnStatus, toIndex: number) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card) return prev;

      const updated = prev.map(c => {
        if (c.id === cardId) return { ...c, status: toStatus, order: toIndex, updatedAt: new Date() };
        if (c.status === toStatus && c.order >= toIndex) return { ...c, order: c.order + 1 };
        return c;
      });
      return updated;
    });
  }, []);

  return (
    <BoardContext.Provider value={{ board, cards, availableLabels: DEFAULT_LABELS, teamMembers: TEAM_MEMBERS, getColumnCards, addCard, updateCard, deleteCard, moveCard }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
