import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./Login";
import { TeamSelection } from "./TeamSelection";
import { Dashboard } from "./Dashboard";
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
    </Routes>
  );
}

export default App;
