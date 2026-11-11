import type { ImageSourcePropType } from 'react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';

import { AvatarPlaceholder } from '@/assets/dashboard';
import { edabipAppSidebarStyles as styles } from '@/components/navigation/edabipAppSidebarStyles';
import { getProfileImagePickError, pickProfileImage } from '@/services/storage/pickProfileImage';
import { useUser } from '@/store/user';

const EditIcon: ImageSourcePropType = require('@/assets/images/edit-icon.png');

export function SidebarProfileAvatar({ avatarUrl }: Readonly<{ avatarUrl?: string }>) {
  const { updateAvatar } = useUser();
  const [hovered, setHovered] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const onChangePhoto = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const dataUrl = await pickProfileImage();
      if (dataUrl) await updateAvatar(dataUrl);
    } catch (cause) {
      Alert.alert('Could not update photo', getProfileImagePickError(cause));
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <Pressable
      onPress={() => {
        void onChangePhoto();
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={isPicking}
      accessibilityRole="button"
      accessibilityLabel="Change profile picture"
      style={styles.avatarWrap}
    >
      {({ pressed }) => (
        <>
          <View style={styles.avatarButton}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : AvatarPlaceholder}
              resizeMode="cover"
              style={styles.avatar}
            />
            {hovered || pressed ? <View style={styles.avatarOverlay} pointerEvents="none" /> : null}
          </View>
          <Image
            source={EditIcon}
            resizeMode="contain"
            style={styles.avatarEditBadge}
            accessibilityIgnoresInvertColors
          />
        </>
      )}
    </Pressable>
  );
}
