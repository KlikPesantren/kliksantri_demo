import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProfilPesantren } from '../../hooks/useProfilPesantren';
import { TabPesantrenHeader } from '../../components/home/TabPesantrenHeader';
import {
  ScreenContainer,
  AppCard,
  AppText,
  AppButton,
  MenuRow,
} from '../../components/ui';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/theme';
import { pushApi } from '../../api/push.api';
import {
  getPushDebugInfo,
  registerPushTokenBackground,
} from '../../services/pushNotificationService';

function PesantrenLogo({ logoUrl, nama }) {
  const uri = resolveMediaUrl(logoUrl);
  const initials = (nama ?? 'PP')
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (uri) {
    return (
      <Image source={{ uri }} style={styles.logo} resizeMode="contain" />
    );
  }

  return (
    <View style={styles.logoFallback}>
      <AppText variant="h2" color="brand">
        {initials}
      </AppText>
    </View>
  );
}

export function ProfilHubScreen() {
  const navigation = useNavigation();
  const { wali, logout } = useAuth();
  const { data: pesantren, isLoading } = useProfilPesantren();
  const [pushDebug, setPushDebug] = useState(null);
  const [pushServerStatus, setPushServerStatus] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  const loadPushDebug = useCallback(async () => {
    let message = '';

    try {
      const localInfo = await getPushDebugInfo();
      setPushDebug(localInfo);
    } catch (err) {
      message = err?.message || 'Gagal memuat status lokal push';
    }

    try {
      const serverStatus = await pushApi.getDeviceTokenStatus();
      setPushServerStatus(serverStatus);
    } catch (err) {
      message = err?.response?.data?.error || err?.message || 'Gagal memuat status server push';
    }

    setPushMessage(message);
  }, []);

  useEffect(() => {
    loadPushDebug();
  }, [loadPushDebug]);

  async function handleManualRegisterPush() {
    setPushLoading(true);
    setPushMessage('');
    try {
      const result = await registerPushTokenBackground({ source: 'profileDebugManual' });
      await loadPushDebug();
      setPushMessage(result?.ok ? 'Register push berhasil.' : `Register push belum berhasil: ${result?.reason || result?.error || 'unknown'}`);
    } catch (err) {
      setPushMessage(err?.message || 'Register push gagal');
    } finally {
      setPushLoading(false);
    }
  }

  async function handleTestPush() {
    setPushLoading(true);
    setPushMessage('');
    try {
      const result = await pushApi.sendTestNotification({
        title: 'Test KlikSantri',
        body: 'Push notification test dari aplikasi Wali.',
      });
      await loadPushDebug();
      setPushMessage(result?.success ? 'Test push dikirim.' : result?.message || 'Test push belum berhasil.');
    } catch (err) {
      setPushMessage(err?.response?.data?.error || err?.message || 'Test push gagal');
    } finally {
      setPushLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      'Keluar Akun',
      'Yakin ingin keluar dari aplikasi?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logout },
      ]
    );
  }

  if (isLoading && !pesantren) {
    return (
      <ScreenContainer edges={false}>
        <TabPesantrenHeader />
        <LoadingSpinner message="Memuat profil..." />
      </ScreenContainer>
    );
  }

  const namaPesantren = pesantren?.nama_pesantren ?? 'Pesantren';
  const namaWali = wali?.nama ?? 'Wali';

  return (
    <ScreenContainer edges={false}>
      <TabPesantrenHeader />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppCard padding="lg" style={styles.headerCard}>
          <PesantrenLogo logoUrl={pesantren?.logo_url} nama={namaPesantren} />
          <AppText variant="h2" style={styles.center} numberOfLines={2}>
            {namaPesantren}
          </AppText>
          <AppText variant="body" color="secondary" style={styles.center}>
            {namaWali}
          </AppText>
        </AppCard>

        <AppCard padding="none" style={styles.menuCard}>
          <MenuRow
            icon="person-outline"
            title="Profil Anak"
            subtitle="Data santri & identitas"
            onPress={() => navigation.navigate('ProfilSantri')}
          />
          <MenuRow
            icon="lock-closed-outline"
            title="Ganti PIN"
            subtitle="Ubah PIN masuk aplikasi"
            onPress={() => navigation.navigate('GantiPin')}
          />
          <MenuRow
            icon="information-circle-outline"
            title="Tentang Aplikasi"
            subtitle="Informasi & versi aplikasi"
            onPress={() => navigation.navigate('TentangAplikasi')}
          />
          <MenuRow
            icon="log-out-outline"
            iconColor={colors.danger}
            title="Logout"
            subtitle="Keluar dari akun"
            onPress={handleLogout}
            danger
            showChevron={false}
          />
        </AppCard>

        <AppCard padding="lg" style={styles.debugCard}>
          <AppText variant="h3">Debug Push Notification</AppText>
          <View style={styles.debugRows}>
            <DebugRow label="Permission" value={pushDebug?.permission_status || '-'} />
            <DebugRow
              label="Expo Token"
              value={
                pushDebug?.registration_status?.expo_push_token
                  ? `${String(pushDebug.registration_status.expo_push_token).slice(0, 20)}...`
                  : '-'
              }
            />
            <DebugRow
              label="Register Lokal"
              value={pushDebug?.registration_status?.ok ? 'OK' : pushDebug?.registration_status?.reason || pushDebug?.registration_status?.error || '-'}
            />
            <DebugRow
              label="Token Server"
              value={pushServerStatus?.has_active_token ? `Aktif (${pushServerStatus.active_token_count})` : 'Belum ada'}
            />
            <DebugRow label="Server Token" value={pushServerStatus?.latest_token_prefix || '-'} />
            <DebugRow label="Platform" value={pushServerStatus?.latest_platform || '-'} />
            <DebugRow label="Last Seen" value={pushServerStatus?.latest_last_seen || '-'} />
          </View>
          {pushMessage ? (
            <AppText variant="caption" color="secondary">
              {pushMessage}
            </AppText>
          ) : null}
          <View style={styles.debugActions}>
            <AppButton
              size="sm"
              onPress={handleManualRegisterPush}
              loading={pushLoading}
              fullWidth
            >
              Register Push Token
            </AppButton>
            <AppButton
              size="sm"
              variant="outline"
              onPress={handleTestPush}
              loading={pushLoading}
              fullWidth
            >
              Test Push
            </AppButton>
            <AppButton
              size="sm"
              variant="ghost"
              onPress={loadPushDebug}
              disabled={pushLoading}
              fullWidth
            >
              Refresh Status
            </AppButton>
          </View>
        </AppCard>
      </ScrollView>
    </ScreenContainer>
  );
}

function DebugRow({ label, value }) {
  return (
    <View style={styles.debugRow}>
      <AppText variant="caption" color="secondary" style={styles.debugLabel}>
        {label}
      </AppText>
      <AppText variant="caption" style={styles.debugValue}>
        {String(value || '-')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  headerCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  center: { textAlign: 'center' },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
  },
  logoFallback: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    overflow: 'hidden',
  },
  debugCard: {
    gap: spacing.md,
  },
  debugRows: {
    gap: spacing.xs,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  debugLabel: {
    flex: 0.9,
  },
  debugValue: {
    flex: 1.3,
    textAlign: 'right',
  },
  debugActions: {
    gap: spacing.sm,
  },
});
