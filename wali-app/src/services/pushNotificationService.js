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

export async function getPushDebugInfo() {
  const registrationStatus = await getPushRegistrationStatus();
  const modules = await loadExpoModules();
  let permissionStatus = null;

  if (modules?.Notifications) {
    try {
      const permission = await modules.Notifications.getPermissionsAsync();
      permissionStatus = permission?.status || null;
    } catch (err) {
      permissionStatus = `error: ${err?.message || 'permission_check_failed'}`;
    }
  }

  return {
    permission_status: permissionStatus,
    registration_status: registrationStatus,
  };
}

export async function registerPushToken(options = {}) {
  const source = options?.source || 'unknown';
  console.log('[PUSH] register start', { source });

  const modules = await loadExpoModules();
  if (!modules) {
    console.error('[PUSH] register error', {
      source,
      reason: 'expo-notifications module unavailable',
    });
    return { ok: false, skipped: true, reason: 'module_unavailable' };
  }

  const { Notifications: Notif, Device: Dev, Constants: Const } = modules;

  if (!Dev.isDevice) {
    console.error('[PUSH] register error', {
      source,
      reason: 'physical device required',
    });
    await saveRegistrationStatus({ ok: false, skipped: true, reason: 'simulator' });
    return { ok: false, skipped: true, reason: 'simulator' };
  }

  try {
    if (Platform.OS === 'android') {
      console.log('[PUSH] create Android notification channel', {
        channel_id: 'default',
      });
      await Notif.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notif.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#15803D',
      });
    }

    const { status: existingStatus } = await Notif.getPermissionsAsync();
    console.log('[PUSH] permission existing', { status: existingStatus });
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notif.requestPermissionsAsync();
      finalStatus = status;
      console.log('[PUSH] permission requested', { status });
    }

    if (finalStatus !== 'granted') {
      console.warn('[PUSH] permission denied', { source, status: finalStatus });
      await saveRegistrationStatus({ ok: false, skipped: true, reason: 'permission_denied' });
      return { ok: false, skipped: true, reason: 'permission_denied' };
    }

    const projectId =
      Const.expoConfig?.extra?.eas?.projectId ??
      Const.easConfig?.projectId;

    console.log('[PUSH] EAS projectId', { projectId: projectId || null });

    const tokenResult = await Notif.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const expoPushToken = tokenResult?.data;
    if (!expoPushToken) {
      throw new Error('Expo push token kosong');
    }

    console.log('[PUSH] expo token', {
      token_prefix: `${String(expoPushToken).slice(0, 24)}...`,
    });

    const platform = Platform.OS;
    const deviceName =
      Dev.deviceName ||
      [Dev.manufacturer, Dev.modelName].filter(Boolean).join(' ') ||
      platform;

    console.log('[PUSH] register request', {
      endpoint: '/wali-app/device-token',
      token_prefix: `${String(expoPushToken).slice(0, 24)}...`,
      platform,
      device_name: deviceName,
    });

    const response = await pushApi.registerDeviceToken({
      expo_push_token: expoPushToken,
      platform,
      device_name: deviceName,
    });

    console.log('[PUSH] register success', response);

    const status = {
      ok: true,
      expo_push_token: expoPushToken,
      platform,
      device_name: deviceName,
    };
    await saveRegistrationStatus(status);
    return status;
  } catch (err) {
    console.error('[PUSH] register error', {
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
    console.error('[PUSH] register error', {
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
