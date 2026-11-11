import type { GeneralSettings } from '@/screens/settings/settingsData';
import type { User } from '@/types/auth';

function filled(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    const next = value?.trim() ?? '';
    if (next) return next;
  }
  return '';
}

/**
 * A profile is complete when signup identity plus the remaining general
 * settings (mobile, company size, industry) are all present — same rule as web.
 */
export function isProfileComplete(
  user: User | null,
  general?: Partial<GeneralSettings> | null,
): boolean {
  if (!user) return true;

  const parts = user.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = filled(general?.firstName, user.firstName, parts[0]);
  const lastName = filled(
    general?.lastName,
    user.lastName,
    parts.length > 1 ? parts.slice(1).join(' ') : '',
  );

  return Boolean(
    firstName &&
    lastName &&
    filled(general?.email, user.email) &&
    filled(general?.mobileNumber, user.phone) &&
    filled(general?.companySize) &&
    filled(general?.industry),
  );
}
