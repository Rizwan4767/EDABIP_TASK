# Notifications

Reserved for push and in-app notifications.

Nothing is implemented yet, deliberately: `expo-notifications` requires a
development build (it no longer works in Expo Go on Android), an EAS project
ID, and a backend endpoint to register device tokens. None of those exist yet,
so adding the dependency now would only add weight and a broken code path.

When the work starts:

1. `npx expo install expo-notifications expo-device`
2. Add the `expo-notifications` config plugin to `app.config.ts`.
3. Add `pushNotifications` handling here as `notificationService.ts`, exposing
   `requestPermissions()`, `registerDeviceToken()`, and `unregisterDeviceToken()`.
4. Add the backend device-registration route to `src/services/api/endpoints.ts`.
5. Flip `appConfig.features.pushNotifications` to `true`.

Keep all Expo notification imports inside this folder so the rest of the app
depends on a stable interface rather than the SDK surface.
