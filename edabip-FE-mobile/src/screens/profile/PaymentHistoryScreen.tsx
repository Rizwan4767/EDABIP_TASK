import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPlaceholder, LogoWordmarkIcon, MenuIcon, SearchIcon } from '@/assets/dashboard';
import {
  BackArrowIcon,
  PaymentDownloadIcon,
  PaymentFilterIcon,
  PenEditIcon,
} from '@/assets/profile';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { GoToDashboardFab } from '@/components/navigation/GoToDashboardFab';
import { useScrollAwareFab } from '@/components/navigation/useScrollAwareFab';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { paymentHistoryStyles as styles } from '@/screens/profile/paymentHistoryStyles';
import {
  getProfileDisplayName,
  getProfileEmail,
  goBackToProfile,
  goToBillingPlans,
} from '@/screens/profile/profileChrome';
import { toPaymentHistory, type PaymentHistoryRow } from '@/services/api/billing/adapters';
import { billingApi, billingErrorDetail } from '@/services/api/billingApi';
import { getErrorMessage } from '@/services/api/apiError';
import { useUser } from '@/store/user';

type PaymentTransaction = PaymentHistoryRow;

function TransactionCard({
  tx,
  onDownload,
}: Readonly<{ tx: PaymentTransaction; onDownload: (tx: PaymentTransaction) => void }>) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const isCompleted = tx.status === 'Completed';
  const statusValueStyle = isCompleted ? styles.txStatusCompleted : styles.txStatusFailed;
  const detailStatusStyle = isCompleted ? styles.detailValueCompleted : styles.detailValueFailed;

  return (
    <View style={styles.txCard}>
      {expanded ? (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>{tx.amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={detailStatusStyle}>{tx.status}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{tx.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{tx.transactionId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{tx.paymentMethod}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Card Number</Text>
            <Text style={styles.detailValue}>{tx.cardNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name on Card</Text>
            <Text style={styles.detailValue}>{tx.nameOnCard}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.txNameRow}>
            <Text style={styles.txName} numberOfLines={1}>
              {tx.name}
            </Text>
            <Pressable
              onPress={() => onDownload(tx)}
              accessibilityRole="button"
              accessibilityLabel={`Download receipt for ${tx.name}`}
              hitSlop={theme.dimensions.hitSlop}
            >
              <DashboardIcon icon={PaymentDownloadIcon} size={16} color="#000000" />
            </Pressable>
          </View>

          <View style={styles.txStatusRow}>
            <View style={styles.txStatusPair}>
              <Text style={styles.txStatusLabel}>Status:</Text>
              <Text style={statusValueStyle}>{tx.status}</Text>
            </View>
            <Text style={styles.txAmount}>{tx.amount}</Text>
          </View>

          <Text style={styles.txDate}>{tx.date}</Text>
        </>
      )}

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.txViewMoreHit}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'View less' : 'View more'}
        hitSlop={theme.dimensions.hitSlop}
      >
        <Text style={styles.txViewMore}>{expanded ? 'View Less' : 'View more'}</Text>
      </Pressable>
    </View>
  );
}

export function PaymentHistoryScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <PaymentHistoryCanvas />
    </ThemeSchemeOverride>
  );
}

type FilterTab = 'All' | 'Recently';

function PaymentHistoryCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUser();
  const { visible: fabVisible, onScroll: onFabScroll } = useScrollAwareFab();
  const displayName = getProfileDisplayName(profile);
  const displayEmail = getProfileEmail(profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const payload = await billingApi.getAllPayments();
    return toPaymentHistory(payload).rows;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const rows = await load();
        if (cancelled) return;
        setTransactions(rows);
        setError(null);
      } catch (cause) {
        if (!cancelled) {
          setError(getErrorMessage(cause, 'Unable to load payment history.'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      setTransactions(await load());
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to load payment history.'));
    } finally {
      setIsRefreshing(false);
    }
  }, [load]);

  const visible = activeFilter === 'Recently' ? transactions.slice(0, 3) : transactions;

  const onDownload = (tx: PaymentTransaction) => {
    if (!tx.invoiceNumber) {
      Alert.alert('Receipt unavailable', 'No invoice is linked to this payment.');
      return;
    }
    void (async () => {
      try {
        await billingApi.downloadInvoicePdf(tx.invoiceNumber!);
      } catch (cause) {
        Alert.alert(
          'Unable to download invoice',
          billingErrorDetail(cause, getErrorMessage(cause)),
        );
      }
    })();
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" />

      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onFabScroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refresh()}
              tintColor={theme.colors.textOnBrand}
            />
          }
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colors.brand,
                paddingTop: insets.top + theme.spacing.sm,
              },
            ]}
          >
            <View style={styles.navRow}>
              <Pressable
                onPress={() => setMenuOpen(true)}
                style={styles.navButton}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                hitSlop={theme.dimensions.hitSlop}
              >
                <DashboardIcon icon={MenuIcon} size={26} />
              </Pressable>
              <View style={styles.logo}>
                <DashboardIcon icon={LogoWordmarkIcon} width={73} height={29} />
              </View>
              <View style={styles.navRight}>
                <Pressable
                  style={styles.searchButton}
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                  hitSlop={theme.dimensions.hitSlop}
                >
                  <DashboardIcon icon={SearchIcon} size={18} />
                </Pressable>
                <Pressable
                  onPress={() => router.push(ROUTES.main.profile)}
                  accessibilityRole="button"
                  accessibilityLabel="Open profile"
                >
                  <Image
                    source={profile?.avatarUrl ? { uri: profile.avatarUrl } : AvatarPlaceholder}
                    style={styles.headerAvatar}
                    accessibilityLabel="Profile photo"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.userRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={profile?.avatarUrl ? { uri: profile.avatarUrl } : AvatarPlaceholder}
                  style={styles.avatar}
                  accessibilityLabel="Your profile photo"
                />
                <View style={styles.penBadge}>
                  <DashboardIcon icon={PenEditIcon} size={14} />
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                {displayEmail ? (
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {displayEmail}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => goToBillingPlans(router)}
                  accessibilityRole="link"
                  accessibilityLabel="Upgrade Your Plan"
                  hitSlop={theme.dimensions.hitSlop}
                >
                  <Text style={styles.upgradeLink}>Upgrade Your Plan</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.body}>
            <Pressable
              onPress={() => goBackToProfile(router)}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={theme.dimensions.hitSlop}
              style={({ pressed }) => [styles.backRow, pressed ? styles.backRowPressed : null]}
            >
              <View style={styles.backButton}>
                <DashboardIcon icon={BackArrowIcon} size={16} color="#000000" />
              </View>
              <Text style={styles.backTitle}>Payment History</Text>
            </Pressable>

            <View style={styles.filterRow}>
              {(['All', 'Recently'] as FilterTab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  style={
                    activeFilter === tab
                      ? [styles.chipActive, { backgroundColor: theme.colors.brand }]
                      : styles.chipInactive
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeFilter === tab }}
                  accessibilityLabel={tab}
                >
                  <Text
                    style={activeFilter === tab ? styles.chipActiveLabel : styles.chipInactiveLabel}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}

              <View style={styles.filterSpacer} />

              <Pressable
                onPress={() => void refresh()}
                accessibilityRole="button"
                accessibilityLabel="Refresh payments"
                hitSlop={theme.dimensions.hitSlop}
              >
                <DashboardIcon icon={PaymentFilterIcon} size={16} color="#000000" />
              </Pressable>
            </View>

            <View style={styles.listPanel}>
              {isLoading ? (
                <ActivityIndicator color={theme.colors.brand} style={{ marginVertical: 24 }} />
              ) : null}
              {error && !isLoading ? <Text style={styles.txDate}>{error}</Text> : null}
              {!isLoading && !error && visible.length === 0 ? (
                <Text style={styles.txDate}>No payments yet.</Text>
              ) : null}
              {visible.map((tx) => (
                <TransactionCard key={tx.id} tx={tx} onDownload={onDownload} />
              ))}
            </View>
          </View>
        </ScrollView>

        <GoToDashboardFab includeSafeArea visible={fabVisible} />
      </View>

      <EdabipAppSidebar
        visible={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}
