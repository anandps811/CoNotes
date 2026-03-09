import { Route, Routes } from "react-router-dom";
import { NotesProvider } from "@/context/NotesContext";
import { BoardProvider } from "@/context/BoardContext";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { ROUTES } from "@/routes/paths";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import NoteEditor from "@/pages/NoteEditor";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Index />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <NotesProvider>
              <BoardProvider>
                <Dashboard />
              </BoardProvider>
            </NotesProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.NOTE_EDITOR}
        element={
          <ProtectedRoute>
            <NotesProvider>
              <NoteEditor />
            </NotesProvider>
          </ProtectedRoute>
        }
      />
      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
    </Routes>
  );
}
