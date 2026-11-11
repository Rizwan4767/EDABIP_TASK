import { Pressable, View } from 'react-native';

import { DownloadIcon, InvoiceAmountIcon, InvoiceCalendarIcon } from '@/assets/billing';
import { KebabIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { BillingInvoice } from '@/screens/billing/billingData';
import {
  chartCardFill,
  invoicesCardStyles as styles,
} from '@/screens/billing/components/invoicesCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

const PREVIEW_COUNT = 5;

export function InvoicesCard({
  invoices,
  expanded,
  onToggleExpanded,
  onDownload,
}: Readonly<{
  invoices: BillingInvoice[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onDownload: (invoice: BillingInvoice) => void;
}>) {
  const theme = useTheme();
  const visible = expanded ? invoices : invoices.slice(0, PREVIEW_COUNT);
  const canExpand = invoices.length > PREVIEW_COUNT;

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, '#CFC9C9')]}
      accessibilityLabel="Invoices"
    >
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          Invoices
        </AppText>
        {canExpand ? (
          <Pressable
            onPress={onToggleExpanded}
            hitSlop={theme.dimensions.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Show fewer invoices' : 'View all invoices'}
          >
            <AppText variant="caption" style={styles.viewAll}>
              {expanded ? 'Show less' : 'View all'}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {visible.map((invoice) => (
          <View key={invoice.id} style={styles.row}>
            <View style={styles.top}>
              <AppText variant="bodyStrong" style={styles.number}>
                {invoice.number}
              </AppText>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => onDownload(invoice)}
                  hitSlop={theme.dimensions.hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={`Download ${invoice.number}`}
                >
                  <DashboardIcon icon={DownloadIcon} size={12} />
                </Pressable>
                <Pressable
                  hitSlop={theme.dimensions.hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={`${invoice.number} actions`}
                >
                  <DashboardIcon icon={KebabIcon} width={3} height={10} />
                </Pressable>
              </View>
            </View>
            <View style={styles.bottom}>
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <DashboardIcon icon={InvoiceCalendarIcon} size={10} />
                  <AppText variant="caption" style={styles.metaText}>
                    {invoice.date}
                  </AppText>
                </View>
                <View style={styles.metaItem}>
                  <DashboardIcon icon={InvoiceAmountIcon} size={10} />
                  <AppText variant="caption" style={styles.metaText}>
                    {invoice.amount}
                  </AppText>
                </View>
              </View>
              <View style={styles.paid}>
                <AppText variant="overline" style={styles.paidLabel}>
                  {invoice.status}
                </AppText>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
