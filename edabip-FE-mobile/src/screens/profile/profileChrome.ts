import { billingPlansHref, ROUTES } from '@/navigation/routes';
import type { User } from '@/types/auth';
import { getPersonName } from '@/utils/format';

type ProfileRouter = {
  dismissTo: (href: typeof ROUTES.main.profile) => void;
  navigate: (href: ReturnType<typeof billingPlansHref> | typeof ROUTES.main.profile) => void;
};

export function getProfileDisplayName(profile: User | null | undefined): string {
  if (!profile) return 'Your name';
  return getPersonName(
    profile.firstName,
    profile.lastName,
    profile.fullName,
    profile.email,
    'Your name',
  );
}

/** Name for the edit form — never fall back to the email local-part. */
export function getProfileFormName(profile: User | null | undefined): string {
  if (!profile) return '';
  return getPersonName(profile.firstName, profile.lastName, profile.fullName, '', '');
}

export function getProfileEmail(profile: User | null | undefined): string {
  return profile?.email?.trim() ?? '';
}

export function goBackToProfile(router: ProfileRouter) {
  // Pops to Profile when it is already in this stack; otherwise replaces
  // the current screen so the back control never no-ops.
  router.dismissTo(ROUTES.main.profile);
}

export function goToBillingPlans(router: ProfileRouter) {
  router.navigate(billingPlansHref());
}
