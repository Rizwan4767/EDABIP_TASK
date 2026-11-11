import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import { AUTH_STATUS } from '../modules/auth/utils/authConfig.js';
import AppShell from '../components/layout/AppShell/index.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing, authStatus } = useAuthContext();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  // MFA pending is not authenticated — credentials alone are insufficient.
  const canAccess =
    isAuthenticated && authStatus === AUTH_STATUS.AUTHENTICATED;

  if (!canAccess) {
    // This is frontend route protection only, not real authorization.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <AppShell>{children}</AppShell>;
}

export default ProtectedRoute;
