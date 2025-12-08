import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./Login";
import { TeamSelection } from "./TeamSelection";
import { Dashboard } from "./Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/teams" element={<TeamSelection />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
