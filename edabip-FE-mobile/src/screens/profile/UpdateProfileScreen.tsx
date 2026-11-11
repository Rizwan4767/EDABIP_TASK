import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPlaceholder, LogoWordmarkIcon, MenuIcon, SearchIcon } from '@/assets/dashboard';
import { BackArrowIcon, PenEditIcon } from '@/assets/profile';
import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  getProfileDisplayName,
  getProfileEmail,
  getProfileFormName,
  goBackToProfile,
  goToBillingPlans,
} from '@/screens/profile/profileChrome';
import { updateProfileStyles as styles } from '@/screens/profile/updateProfileStyles';
import { useUser } from '@/store/user';
import { splitFullName } from '@/utils/format';
import { isValidEmail } from '@/utils/validation';

interface UpdateProfilePayload {
  name: string;
  email: string;
  mobile: string;
}

export function UpdateProfileScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <UpdateProfileGate />
    </ThemeSchemeOverride>
  );
}

function UpdateProfileGate() {
  const { profile } = useUser();
  return <UpdateProfileCanvas key={profile?.id ?? 'pending'} />;
}

function UpdateProfileCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, applyProfilePatch } = useUser();

  const [name, setName] = useState(() => getProfileFormName(profile));
  const [emailVal, setEmailVal] = useState(() => getProfileEmail(profile));
  const [mobile, setMobile] = useState(profile?.phone ?? '');
  const [location, setLocation] = useState('USA');
  const [menuOpen, setMenuOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const displayName = getProfileDisplayName(profile);
  const displayEmail = getProfileEmail(profile);

  const saveAction = useAsyncAction(async (payload: UpdateProfilePayload) => {
    // No dedicated profile-update endpoint exists yet — apply the change to
    // the local session, mirroring how Settings' General card saves.
    await new Promise((resolve) => setTimeout(resolve, 400));
    const { firstName, lastName } = splitFullName(payload.name);
    applyProfilePatch({
      firstName,
      lastName,
      fullName: payload.name,
      email: payload.email,
      phone: payload.mobile,
    });
    return true;
  });

  const handleSave = async () => {
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Please enter your name.');
      return;
    }
    if (!isValidEmail(emailVal)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    const result = await saveAction.run({ name: name.trim(), email: emailVal.trim(), mobile });
    if (result) {
      goBackToProfile(router);
    }
  };

  const bannerMessage = validationError ?? saveAction.error;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Teal Header ─────────────────────────────────────────── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.brand,
              paddingTop: insets.top + theme.spacing.sm,
            },
          ]}
        >
          {/* Nav bar */}
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

          {/* User row */}
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

        {/* ── Body ─────────────────────────────────────────────────── */}
        <View style={styles.body}>
          {/* Back + title row */}
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
            <Text style={styles.backTitle} numberOfLines={1} allowFontScaling={false}>
              Update your Profile
            </Text>
          </Pressable>

          {bannerMessage ? <ErrorBanner message={bannerMessage} /> : null}

          {/* Form card. Figma renders the "your name" / "yourname@gmail.com"
              placeholder copy in solid black rather than a muted grey, so
              placeholderTextColor matches that here instead of the usual
              lighter placeholder tone. */}
          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="your name"
                placeholderTextColor="#000000"
                style={styles.inputBorder}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={emailVal}
                onChangeText={setEmailVal}
                placeholder="yourname@gmail.com"
                placeholderTextColor="#000000"
                style={styles.inputBorder}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <TextInput
                value={mobile}
                onChangeText={setMobile}
                placeholder="Add number"
                placeholderTextColor="#000000"
                style={styles.inputBorder}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="USA"
                placeholderTextColor="#000000"
                style={styles.inputBorder}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
              disabled={saveAction.isPending}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: theme.colors.brand,
                  opacity: pressed || saveAction.isPending ? 0.88 : 1,
                },
              ]}
            >
              {saveAction.isPending ? (
                <ActivityIndicator color={theme.colors.textOnBrand} />
              ) : (
                <Text style={styles.saveLabel} numberOfLines={1} allowFontScaling={false}>
                  Save Change
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <EdabipAppSidebar
        visible={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}
