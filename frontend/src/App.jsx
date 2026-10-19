import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// UX guard only: hides pages from logged-out users.
// Real protection is the backend's get_current_user on every API route.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

// Logged-in users have no reason to see login/register.
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
