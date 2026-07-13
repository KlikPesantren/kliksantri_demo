import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScreenContainer, AppCard, AppText } from '../../components/ui';
import { spacing } from '../../constants/theme';

const SECTIONS = [
  ['Data yang diproses', 'Aplikasi memproses data akun wali, data santri, pendidikan, kehadiran, perizinan, pelanggaran, kesehatan, pembayaran, saldo, transaksi, dan notifikasi sesuai fitur yang digunakan pesantren.'],
  ['Tujuan penggunaan', 'Data digunakan untuk autentikasi, menampilkan layanan pesantren kepada wali, menjaga keamanan akun, mengirim notifikasi, dan menangani dukungan layanan.'],
  ['Penyimpanan dan keamanan', 'Komunikasi production menggunakan HTTPS. Token sesi disimpan menggunakan penyimpanan aman perangkat. Pengelolaan dan retensi data pada server mengikuti kebijakan pengelola KlikPesantren dan pesantren terkait.'],
  ['Pihak ketiga', 'Aplikasi menggunakan layanan Expo dan Firebase untuk fungsi aplikasi dan notifikasi. Penyedia infrastruktur dapat memproses data teknis yang diperlukan untuk menjalankan layanan.'],
  ['Hak pengguna', 'Wali dapat meminta akses, koreksi, atau penghapusan data melalui admin pesantren atau kontak dukungan resmi yang dipublikasikan oleh pengelola. Permintaan dapat tunduk pada kewajiban hukum dan administrasi pesantren.'],
  ['Data santri', 'Data santri ditampilkan hanya kepada akun wali yang terhubung. Pesantren dan pengelola wajib memperlakukan data anak secara hati-hati dan sesuai ketentuan yang berlaku.'],
];

export function KebijakanPrivasiScreen() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppCard padding="lg" style={styles.card}>
          <AppText variant="h2">Kebijakan Privasi</AppText>
          <AppText variant="caption" color="muted">KlikPesantren · Wali Santri</AppText>
          <AppText variant="body" color="secondary">
            Ringkasan ini menjelaskan pemrosesan data pada aplikasi. Versi lengkap harus tersedia pada URL HTTPS publik sebelum aplikasi diajukan ke Google Play.
          </AppText>
          {SECTIONS.map(([title, body]) => (
            <View key={title} style={styles.section}>
              <AppText variant="h3">{title}</AppText>
              <AppText variant="body" color="secondary">{body}</AppText>
            </View>
          ))}
        </AppCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  card: { gap: spacing.md },
  section: { gap: spacing.xs },
});
