import { Routes, Route, Navigate } from "react-router-dom";
import { Admin } from "./Admin";
import { Login } from "./Login";
import { TeamSelection } from "./TeamSelection";
import { Dashboard } from "./Dashboard";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamSelection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Admin />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
