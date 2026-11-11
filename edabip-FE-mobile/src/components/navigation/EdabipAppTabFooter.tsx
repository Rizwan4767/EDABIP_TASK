import { useRouter } from 'expo-router';

import { EdabipTabBar } from '@/components/navigation/EdabipTabBar';
import { ROUTES } from '@/navigation/routes';

const TAB_ROUTES = [
  { key: 'dashboard', name: 'dashboard', href: ROUTES.main.dashboard },
  { key: 'powerbi', name: 'powerbi', href: ROUTES.main.powerBi },
  { key: 'tableau', name: 'tableau', href: ROUTES.main.tableau },
  { key: 'analytics', name: 'analytics', href: ROUTES.main.analytics },
  { key: 'reports', name: 'reports', href: ROUTES.main.reports },
] as const;

/**
 * Same Figma footer as Dashboard / Power BI / Tableau / Analytics / Report,
 * usable on stack screens that sit above the tab navigator.
 */
export function EdabipAppTabFooter({ active }: Readonly<{ active?: string }>) {
  const router = useRouter();
  const index = TAB_ROUTES.findIndex((route) => route.name === active);

  return (
    <EdabipTabBar
      state={{
        index: index < 0 ? -1 : index,
        routes: TAB_ROUTES.map(({ key, name }) => ({ key, name })),
      }}
      descriptors={{}}
      navigation={{
        emit: () => ({ defaultPrevented: false }),
        navigate: (name) => {
          const target = TAB_ROUTES.find((route) => route.name === name);
          if (target) router.navigate(target.href);
        },
      }}
    />
  );
}
