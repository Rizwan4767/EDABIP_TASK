import { StyleSheet } from 'react-native';

import type { Theme } from '@/theme';

/** Layout shared by every screen in the authentication flow. */
export const createAuthStyles = (theme: Theme) =>
  StyleSheet.create({
    content: { flexGrow: 1, justifyContent: 'center', paddingVertical: theme.spacing.xxl },
    form: { gap: theme.spacing.base },
    actions: { gap: theme.spacing.md, marginTop: theme.spacing.sm },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xl,
    },
    inlineLink: { alignSelf: 'flex-end' },
    centeredBlock: { alignItems: 'center', gap: theme.spacing.md },
  });
