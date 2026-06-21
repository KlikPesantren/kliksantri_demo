import { CommonActions } from '@react-navigation/native';

export function navigateFromNotification(navigationRef, payload, { anak, setActiveSantri }) {
  if (!navigationRef?.isReady?.()) return;

  const type = payload?.type;
  const santriId = payload?.santri_id != null ? Number(payload.santri_id) : null;

  if (santriId && Array.isArray(anak) && anak.length > 0 && setActiveSantri) {
    const child = anak.find(
      (item) => Number(item.santri_id ?? item.id) === santriId,
    );
    if (child) {
      setActiveSantri(child);
    }
  }

  if (type === 'pelanggaran') {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'Monitoring',
          params: { screen: 'Pelanggaran' },
        },
      }),
    );
    return;
  }

  if (type === 'perizinan') {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'Monitoring',
          params: { screen: 'Perizinan' },
        },
      }),
    );
    return;
  }

  if (type === 'pengumuman') {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'Pengumuman',
          params: { screen: 'PengumumanHome' },
        },
      }),
    );
    return;
  }

  if (type === 'kesehatan') {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'Monitoring',
          params: { screen: 'Kesehatan' },
        },
      }),
    );
    return;
  }

  if (type === 'sahriyah') {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'Keuangan',
          params: { screen: 'Sahriyah' },
        },
      }),
    );
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'MainTabs',
      params: { screen: 'Beranda' },
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
  } catch (err) {
    console.warn('[notif-nav] getLastNotificationResponseAsync:', err?.message);
  }

  return () => subscription.remove();
}
