import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { pushApi } from '../api/push.api';

const PUSH_STATUS_KEY = 'wali_push_registration_status';
const PUSH_TOKEN_KEY = 'wali.expo_push_token';
const SECURE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let Notifications = null;
let Device = null;
let Constants = null;

async function loadExpoModules() {
  if (Notifications && Device && Constants) return { Notifications, Device, Constants };

  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    Constants = require('expo-constants').default;
    return { Notifications, Device, Constants };
  } catch {
    return null;
  }
}

async function saveRegistrationStatus(status) {
  const safeStatus = {
    ok: status?.ok === true,
    skipped: status?.skipped === true,
    reason: status?.reason || null,
    platform: status?.platform || Platform.OS,
    updated_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PUSH_STATUS_KEY, JSON.stringify(safeStatus));
}

export async function getPushRegistrationStatus() {
  const raw = await AsyncStorage.getItem(PUSH_STATUS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    await AsyncStorage.removeItem(PUSH_STATUS_KEY);
    return null;
  }
}

export async function registerPushToken(options = {}) {
  const modules = await loadExpoModules();
  if (!modules) return { ok: false, skipped: true, reason: 'module_unavailable' };

  const { Notifications: Notif, Device: Dev, Constants: Const } = modules;
  if (!Dev.isDevice) {
    await saveRegistrationStatus({ ok: false, skipped: true, reason: 'simulator' });
    return { ok: false, skipped: true, reason: 'simulator' };
  }

  try {
    if (Platform.OS === 'android') {
      await Notif.setNotificationChannelAsync('wali-santri', {
        name: 'Notifikasi Wali Santri',
        importance: Notif.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15803D',
      });
    }

    const { status: existingStatus } = await Notif.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted' && options.requestPermission === true) {
      const permission = await Notif.requestPermissionsAsync();
      finalStatus = permission.status;
    }

    if (finalStatus !== 'granted') {
      const reason = existingStatus === 'denied' ? 'permission_denied' : 'permission_required';
      await saveRegistrationStatus({ ok: false, skipped: true, reason });
      return { ok: false, skipped: true, reason };
    }

    const projectId = Const.expoConfig?.extra?.eas?.projectId ?? Const.easConfig?.projectId;
    if (!projectId) throw new Error('missing_project_id');

    const tokenResult = await Notif.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenResult?.data;
    if (!expoPushToken) throw new Error('missing_push_token');

    const platform = Platform.OS;
    const deviceName = Dev.deviceName || [Dev.manufacturer, Dev.modelName].filter(Boolean).join(' ') || platform;

    await pushApi.registerDeviceToken({
      expo_push_token: expoPushToken,
      platform,
      device_name: deviceName,
    });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, expoPushToken, SECURE_OPTIONS);
    await saveRegistrationStatus({ ok: true, platform });
    return { ok: true, platform };
  } catch {
    await saveRegistrationStatus({ ok: false, reason: 'register_failed' });
    return { ok: false, reason: 'register_failed' };
  }
}

export async function registerPushTokenBackground(options = {}) {
  try {
    return await registerPushToken(options);
  } catch {
    return { ok: false, reason: 'register_failed' };
  }
}

export async function unregisterPushToken() {
  let expoPushToken = null;
  try {
    expoPushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY, SECURE_OPTIONS);
    if (!expoPushToken) return { ok: false, skipped: true, reason: 'no_token' };
    await pushApi.unregisterDeviceToken({ expo_push_token: expoPushToken });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unregister_failed' };
  } finally {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(PUSH_TOKEN_KEY, SECURE_OPTIONS),
      AsyncStorage.removeItem(PUSH_STATUS_KEY),
    ]);
  }
}
