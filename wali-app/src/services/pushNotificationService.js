import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushApi } from '../api/push.api';

const PUSH_STATUS_KEY = 'wali_push_registration_status';
const DEVICE_ID_KEY = 'wali_device_id';

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

async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated = `wali-${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
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

export async function registerPushToken() {
  const modules = await loadExpoModules();
  if (!modules) {
    console.warn('[push] expo-notifications tidak tersedia — lewati registrasi');
    return { ok: false, skipped: true, reason: 'module_unavailable' };
  }

  const { Notifications: Notif, Device: Dev, Constants: Const } = modules;

  if (!Dev.isDevice) {
    console.warn('[push] Push token hanya didukung di perangkat fisik');
    await saveRegistrationStatus({ ok: false, skipped: true, reason: 'simulator' });
    return { ok: false, skipped: true, reason: 'simulator' };
  }

  try {
    const { status: existingStatus } = await Notif.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notif.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[push] Izin notifikasi ditolak pengguna');
      await saveRegistrationStatus({ ok: false, skipped: true, reason: 'permission_denied' });
      return { ok: false, skipped: true, reason: 'permission_denied' };
    }

    const projectId =
      Const.expoConfig?.extra?.eas?.projectId ??
      Const.easConfig?.projectId;

    const tokenResult = await Notif.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const expoPushToken = tokenResult?.data;
    if (!expoPushToken) {
      throw new Error('Expo push token kosong');
    }

    const deviceId = await getOrCreateDeviceId();
    const platform = Platform.OS;

    await pushApi.registerToken({
      expo_push_token: expoPushToken,
      device_id: deviceId,
      platform,
    });

    const status = {
      ok: true,
      expo_push_token: expoPushToken,
      platform,
      device_id: deviceId,
    };
    await saveRegistrationStatus(status);
    return status;
  } catch (err) {
    console.warn('[push] Gagal mendaftarkan push token:', err?.message || err);
    await saveRegistrationStatus({
      ok: false,
      error: err?.message || 'register_failed',
    });
    return { ok: false, error: err?.message || 'register_failed' };
  }
}

export async function registerPushTokenBackground() {
  try {
    return await registerPushToken();
  } catch (err) {
    console.warn('[push] Background register gagal:', err?.message || err);
    return { ok: false, error: err?.message || 'register_failed' };
  }
}
