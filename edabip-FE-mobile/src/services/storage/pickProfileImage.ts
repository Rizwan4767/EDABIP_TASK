import { getErrorMessage } from '@/services/api/apiError';

const PICKER_UNAVAILABLE = 'Photo library is unavailable in this app build.';

function isNativeModuleMissing(cause: unknown) {
  return cause instanceof Error && /cannot find native module/i.test(cause.message);
}

/**
 * Load the native picker only when the user asks to change a photo.
 * A top-level `import 'expo-image-picker'` throws during module evaluation if
 * the running binary was built before that package was added, which then
 * prevents every screen that renders the sidebar from exporting.
 */
async function loadImagePicker() {
  try {
    return await import('expo-image-picker');
  } catch (cause) {
    if (isNativeModuleMissing(cause)) {
      if (__DEV__) {
        console.warn(
          '[pickProfileImage] expo-image-picker is not compiled into this native binary. Rebuild with: npx expo run:android (or npx expo run:ios)',
        );
      }
      throw new Error(PICKER_UNAVAILABLE);
    }
    throw cause;
  }
}

/**
 * Opens the system photo library and returns a persistable data URL.
 * `null` means the user cancelled. Throws when the picker cannot produce an image.
 */
export async function pickProfileImage(): Promise<string | null> {
  const ImagePicker = await loadImagePicker();

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library access is required to update your profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) {
    throw new Error('Could not read the selected image.');
  }

  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }

  if (asset.uri) return asset.uri;

  throw new Error('Could not read the selected image.');
}

export function getProfileImagePickError(cause: unknown) {
  return getErrorMessage(cause, 'Could not update your profile picture.');
}
