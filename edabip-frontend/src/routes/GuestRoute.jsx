import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import { AUTH_STATUS } from '../modules/auth/utils/authConfig.js';

function GuestRoute({ children }) {
  const { isAuthenticated, isInitializing, authStatus } = useAuthContext();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated && authStatus === AUTH_STATUS.AUTHENTICATED) {
    const from = location.state?.from;
    const destination =
      typeof from === 'string' && from.startsWith('/') && from !== '/login' && from !== '/signup'
        ? from
        : '/dashboard';

    return <Navigate to={destination} replace />;
  }

  return children;
}

export default GuestRoute;
