import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushApi } from '../api/push.api';

const PUSH_STATUS_KEY = 'wali_push_registration_status';

let Notifications = null;
let Device = null;
let Constants = null;

async function loadExpoModules() {
  if (Notifications && Device && Constants) {
    return { Notifications, Device, Constants };
  }

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
  await AsyncStorage.setItem(
    PUSH_STATUS_KEY,
    JSON.stringify({
      ...status,
      updated_at: new Date().toISOString(),
    }),
  );
}

export async function getPushRegistrationStatus() {
  const raw = await AsyncStorage.getItem(PUSH_STATUS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function registerPushToken(options = {}) {
  const source = options?.source || 'unknown';
  console.log('PUSH REGISTER START', { source });

  const modules = await loadExpoModules();
  if (!modules) {
    console.error('PUSH REGISTER ERROR', {
      source,
      reason: 'expo-notifications module unavailable',
    });
    return { ok: false, skipped: true, reason: 'module_unavailable' };
  }

  const { Notifications: Notif, Device: Dev, Constants: Const } = modules;

  if (!Dev.isDevice) {
    console.error('PUSH REGISTER ERROR', {
      source,
      reason: 'physical device required',
    });
    await saveRegistrationStatus({ ok: false, skipped: true, reason: 'simulator' });
    return { ok: false, skipped: true, reason: 'simulator' };
  }

  try {
    if (Platform.OS === 'android') {
      console.log('[push] create Android notification channel: default');
      await Notif.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notif.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15803D',
      });
    }

    const { status: existingStatus } = await Notif.getPermissionsAsync();
    console.log('[push] notification permission existing:', existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notif.requestPermissionsAsync();
      finalStatus = status;
      console.log('[push] notification permission requested:', status);
    }

    if (finalStatus !== 'granted') {
      console.warn('PUSH PERMISSION DENIED', { source, status: finalStatus });
      await saveRegistrationStatus({ ok: false, skipped: true, reason: 'permission_denied' });
      return { ok: false, skipped: true, reason: 'permission_denied' };
    }

    const projectId =
      Const.expoConfig?.extra?.eas?.projectId ??
      Const.easConfig?.projectId;

    console.log('[push] EAS projectId:', projectId || null);

    const tokenResult = await Notif.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const expoPushToken = tokenResult?.data;
    if (!expoPushToken) {
      throw new Error('Expo push token kosong');
    }

    console.log('PUSH REGISTER TOKEN OK', expoPushToken);

    const platform = Platform.OS;
    const deviceName =
      Dev.deviceName ||
      [Dev.manufacturer, Dev.modelName].filter(Boolean).join(' ') ||
      platform;

    console.log('PUSH REGISTER POST START', {
      endpoint: '/wali-app/device-token',
      token_prefix: `${String(expoPushToken).slice(0, 24)}...`,
    });

    const response = await pushApi.registerDeviceToken({
      expo_push_token: expoPushToken,
      platform,
      device_name: deviceName,
    });

    console.log('PUSH REGISTER POST SUCCESS', response);

    const status = {
      ok: true,
      expo_push_token: expoPushToken,
      platform,
      device_name: deviceName,
    };
    await saveRegistrationStatus(status);
    return status;
  } catch (err) {
    console.error('PUSH REGISTER ERROR', {
      source,
      message: err?.message,
      code: err?.code,
      status: err?.response?.status,
      data: err?.response?.data,
      stack: err?.stack,
    });
    await saveRegistrationStatus({
      ok: false,
      error: err?.message || 'register_failed',
    });
    return { ok: false, error: err?.message || 'register_failed' };
  }
}

export async function registerPushTokenBackground(options = {}) {
  try {
    return await registerPushToken(options);
  } catch (err) {
    console.error('PUSH REGISTER ERROR', {
      source: options?.source || 'background',
      message: err?.message || 'register_failed',
    });
    return { ok: false, error: err?.message || 'register_failed' };
  }
}

export async function unregisterPushToken() {
  try {
    const status = await getPushRegistrationStatus();
    const expoPushToken = status?.expo_push_token;

    if (!expoPushToken) {
      return { ok: false, skipped: true, reason: 'no_token' };
    }

    await pushApi.unregisterDeviceToken({ expo_push_token: expoPushToken });
    await saveRegistrationStatus({
      ok: false,
      unregistered: true,
      expo_push_token: expoPushToken,
    });

    return { ok: true };
  } catch (err) {
    console.warn('[push] Gagal unregister token:', err?.message || err);
    return { ok: false, error: err?.message || 'unregister_failed' };
  }
}
