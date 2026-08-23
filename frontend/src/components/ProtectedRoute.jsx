import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && userRole !== role) {
    // role mismatch -> redirect by actual role
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'operator') return <Navigate to="/operator" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
}
