import { CommonActions } from '@react-navigation/native';

export function navigateFromNotification(navigationRef, payload, { anak, setActiveSantri }) {
  if (!navigationRef?.isReady?.()) return;

  const santriId = payload?.santri_id != null ? Number(payload.santri_id) : null;

  if (santriId && Array.isArray(anak) && anak.length > 0 && setActiveSantri) {
    const child = anak.find(
      (item) => Number(item.santri_id ?? item.id) === santriId,
    );
    if (child) {
      setActiveSantri(child);
    }
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Notifications',
    }),
  );
}

export async function setupNotificationNavigation(
  navigationRef,
  { getAnak, setActiveSantri },
) {
  let Notifications;
  try {
    Notifications = require('expo-notifications');
  } catch {
    return () => {};
  }

  Notifications.setNotificationHandler({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  });

  function handleResponse(response) {
    const data = response?.notification?.request?.content?.data;
    if (!data) return;
    const anak = typeof getAnak === 'function' ? getAnak() : getAnak;
    navigateFromNotification(navigationRef, data, { anak, setActiveSantri });
  }

  const subscription =
    Notifications.addNotificationResponseReceivedListener(handleResponse);

  try {
    const lastResponse =
      await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
      handleResponse(lastResponse);
    }
  } catch {}

  return () => subscription.remove();
}
