import React from 'react';
import { ScrollView, View, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProfilPesantren } from '../../hooks/useProfilPesantren';
import { TabPesantrenHeader } from '../../components/home/TabPesantrenHeader';
import {
  ScreenContainer,
  AppCard,
  AppText,
  MenuRow,
} from '../../components/ui';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/theme';

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
      </ScrollView>
    </ScreenContainer>
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
});
