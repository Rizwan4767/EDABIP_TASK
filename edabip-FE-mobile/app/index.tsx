import { Redirect } from 'expo-router';

import { useNavigationReady } from '@/navigation/useNavigationReady';
import { HOME_ROUTE, ROUTES } from '@/navigation/routes';
import { useAuth } from '@/store/auth';

/** Entry route: sends the user into the app shell or the landing page. */
export default function Index() {
  const { isAuthenticated } = useAuth();
  const navigationReady = useNavigationReady();

  if (!navigationReady) {
    return null;
  }

  return <Redirect href={isAuthenticated ? HOME_ROUTE : ROUTES.auth.landing} />;
}
