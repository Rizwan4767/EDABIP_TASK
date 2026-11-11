import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { SearchClearIcon, SearchFieldIcon } from '@/assets/settings';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { integrationsCardStyles as styles } from '@/screens/settings/components/integrationsCardStyles';
import { SettingsSectionCard } from '@/screens/settings/components/SettingsSectionCard';
import { integrationStatusLabel, type SettingsIntegration } from '@/screens/settings/settingsData';

export function IntegrationsCard({
  integrations,
  expanded,
  onToggle,
  onToggleConnected,
}: Readonly<{
  integrations: SettingsIntegration[];
  expanded: boolean;
  onToggle: () => void;
  onToggleConnected: (id: string, connected: boolean) => Promise<unknown>;
}>) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [error, setError] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return integrations;
    return integrations.filter((item) => item.name.toLowerCase().includes(needle));
  }, [integrations, query]);

  const handleToggle = async (item: SettingsIntegration) => {
    setPendingId(item.id);
    setError('');
    try {
      await onToggleConnected(item.id, !item.connected);
    } catch {
      setError(`Could not ${item.connected ? 'disconnect' : 'connect'} ${item.name}.`);
    } finally {
      setPendingId('');
    }
  };

  return (
    <SettingsSectionCard title="Integrations" expanded={expanded} onToggle={onToggle}>
      <View style={styles.search}>
        <DashboardIcon icon={SearchFieldIcon} size={14} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          style={[
            styles.input,
            { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular },
          ]}
          accessibilityLabel="Search integrations"
          returnKeyType="search"
          underlineColorAndroid="transparent"
        />
        <Pressable
          onPress={() => setQuery('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={theme.dimensions.hitSlop}
        >
          <DashboardIcon icon={SearchClearIcon} size={12} />
        </Pressable>
      </View>

      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}

      <View style={styles.list}>
        {visible.length === 0 ? (
          <AppText variant="caption" color="textMuted" align="center" style={styles.empty}>
            No integrations match that search.
          </AppText>
        ) : (
          visible.map((item) => {
            const status = integrationStatusLabel(item);
            const active = status !== 'Inactive';
            return (
              <Pressable
                key={item.id}
                onPress={() => void handleToggle(item)}
                disabled={pendingId === item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${status}`}
                style={styles.row}
              >
                <View style={styles.logo}>
                  <DashboardIcon icon={item.icon} size={28} />
                </View>
                <AppText variant="body" style={styles.name} numberOfLines={1}>
                  {item.name}
                </AppText>
                <View style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}>
                  <AppText
                    variant="caption"
                    style={[
                      styles.pillLabel,
                      active ? styles.pillLabelActive : styles.pillLabelInactive,
                    ]}
                  >
                    {pendingId === item.id ? 'Updating…' : status}
                  </AppText>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </SettingsSectionCard>
  );
}
