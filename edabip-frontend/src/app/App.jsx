import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { SessionTimeout } from '../modules/auth/hooks/useSessionTimeout.jsx';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import GuestRoute from '../routes/GuestRoute.jsx';
import { routes } from '../routes/routeConfig.js';

function renderRouteElement(route) {
  if (route.protected) {
    return <ProtectedRoute>{route.element}</ProtectedRoute>;
  }
  if (route.guest) {
    return <GuestRoute>{route.element}</GuestRoute>;
  }
  return route.element;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionTimeout>
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={renderRouteElement(route)}
              />
            ))}
          </Routes>
        </SessionTimeout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
