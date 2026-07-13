import React, { useCallback } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { ScreenContainer, AppCard, AppText, AppButton } from '../../components/ui';
import {
  ACCOUNT_DELETION_URL,
  SUPPORT_EMAIL,
  HAS_DELETION_REQUEST_CHANNEL,
} from '../../config/support';
import { spacing } from '../../constants/theme';

const ITEMS = [
  'Akun login wali dapat diminta untuk dinonaktifkan atau dihapus setelah identitas pemohon diverifikasi.',
  'Nomor HP dan token notifikasi dapat diminta untuk dikoreksi atau dihapus sesuai hasil verifikasi.',
  'Penghapusan akun wali tidak otomatis menghapus data akademik, keuangan, pelanggaran, kesehatan, perizinan, atau administrasi santri.',
  'Pesantren dapat mempertahankan arsip santri untuk kebutuhan operasional, kewajiban hukum, perjanjian, keamanan, dan penyelesaian sengketa.',
  'Pengelola atau pesantren akan menjelaskan hasil permintaan dan data yang tetap dipertahankan beserta alasannya.',
];

export function PermintaanPenghapusanAkunScreen({ navigation }) {
  const openRequestChannel = useCallback(async () => {
    const target = ACCOUNT_DELETION_URL || (
      SUPPORT_EMAIL
        ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Permintaan penghapusan akun Wali Santri')}`
        : null
    );

    if (!target) {
      Alert.alert(
        'Layanan belum tersedia',
        'Kanal permintaan penghapusan belum dikonfigurasi. Silakan hubungi admin pesantren.',
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(target);
      if (!supported) throw new Error('unsupported_link');
      await Linking.openURL(target);
    } catch {
      Alert.alert(
        'Tidak dapat membuka layanan',
        'Silakan hubungi admin pesantren untuk mengajukan permintaan.',
      );
    }
  }, []);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppCard padding="lg" style={styles.card}>
          <AppText variant="h2">Permintaan Penghapusan Akun</AppText>
          <AppText variant="body" color="secondary">
            Permintaan tidak diproses otomatis. Identitas dan hubungan Anda dengan santri perlu diverifikasi terlebih dahulu.
          </AppText>

          <View style={styles.list}>
            {ITEMS.map((item) => (
              <View key={item} style={styles.row}>
                <AppText color="brand">•</AppText>
                <AppText variant="body" color="secondary" style={styles.rowText}>
                  {item}
                </AppText>
              </View>
            ))}
          </View>

          {!HAS_DELETION_REQUEST_CHANNEL ? (
            <AppText variant="caption" color="warning">
              Kanal online belum dikonfigurasi. Untuk sementara, hubungi admin pesantren. Aplikasi tidak akan mengirim permintaan tanpa tujuan yang valid.
            </AppText>
          ) : null}

          <AppButton
            onPress={openRequestChannel}
            disabled={!HAS_DELETION_REQUEST_CHANNEL}
            fullWidth
          >
            Ajukan Permintaan
          </AppButton>
          <AppButton
            variant="outline"
            onPress={() => navigation.navigate('KebijakanPrivasi')}
            fullWidth
          >
            Baca Kebijakan Privasi
          </AppButton>
        </AppCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  card: { gap: spacing.lg },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rowText: { flex: 1 },
});
