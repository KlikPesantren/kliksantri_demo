import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useActiveChild } from '../../context/ActiveChildContext';
import { useAuth } from '../../context/AuthContext';
import { useProfil } from '../../hooks/useProfil';
import { ChildSwitcherBar } from '../../components/dashboard/ChildSwitcherBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ foto, nama }) {
  const initials = (nama ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={styles.avatarImage}
        defaultSource={null}
        onError={() => {}}
      />
    );
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, last }) {
  if (!value) return null;
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function ProfilSantriScreen({ navigation }) {
  const { activeSantriId } = useActiveChild();
  const { logout } = useAuth();
  const { data, isLoading, isRefreshing, error, refresh } = useProfil(activeSantriId);

  function handleLogout() {
    Alert.alert(
      'Keluar Akun',
      'Yakin ingin keluar? Anda perlu login ulang untuk mengakses aplikasi.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: logout,
        },
      ],
      { cancelable: true }
    );
  }

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <LoadingSpinner message="Memuat profil santri..." />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ChildSwitcherBar />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const p = data ?? {};

  return (
    <SafeAreaView style={styles.safe}>
      <ChildSwitcherBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <Avatar foto={p.foto} nama={p.nama} />

          <Text style={styles.heroName}>{p.nama ?? '-'}</Text>

          <View style={styles.nisBadge}>
            <Text style={styles.nisBadgeText}>NIS {p.nis ?? '-'}</Text>
          </View>

          <View style={styles.heroMeta}>
            {p.nama_kelas ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipIcon}>🎓</Text>
                <Text style={styles.metaChipText}>{p.nama_kelas}</Text>
              </View>
            ) : null}
            {p.kamar ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipIcon}>🛏</Text>
                <Text style={styles.metaChipText}>Kamar {p.kamar}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Akademik ── */}
        <SectionCard icon="🎓" title="Akademik">
          <InfoRow label="Kelas" value={p.nama_kelas} />
          <InfoRow label="Kamar" value={p.kamar} last />
        </SectionCard>

        {/* ── Identitas ── */}
        <SectionCard icon="📋" title="Identitas">
          <InfoRow label="NIS" value={p.nis} />
          <InfoRow label="Nama Lengkap" value={p.nama} />
          <InfoRow label="Nama Orang Tua" value={p.orang_tua} />
          <InfoRow label="Alamat" value={p.alamat} last />
        </SectionCard>

        {/* ── Kontak ── */}
        <SectionCard icon="📞" title="Kontak">
          <InfoRow label="HP Orang Tua" value={p.nomor_hp_ortu} last />
        </SectionCard>

        {/* ── Data Wali ── */}
        <SectionCard icon="👨‍👩‍👦" title="Data Wali Terdaftar">
          <InfoRow label="Nama Wali" value={p.nama_wali} />
          <InfoRow label="HP Wali" value={p.nomor_hp_wali} />
          <InfoRow label="Alamat Wali" value={p.alamat_wali} last />
        </SectionCard>

        {/* ── RFID ── */}
        <SectionCard icon="💳" title="Kartu RFID">
          <InfoRow
            label="Saldo"
            value={p.saldo != null ? formatCurrency(p.saldo) : null}
          />
          <InfoRow
            label="Limit Harian"
            value={p.limit_harian != null ? formatCurrency(p.limit_harian) : null}
            last
          />
        </SectionCard>

        {/* ── Tentang Pesantren ── */}
        <TouchableOpacity
          style={styles.pesantrenCard}
          onPress={() => navigation.navigate('ProfilPesantren')}
          activeOpacity={0.75}
        >
          <View style={styles.pesantrenCardLeft}>
            <Text style={styles.pesantrenCardIcon}>🏫</Text>
            <View>
              <Text style={styles.pesantrenCardTitle}>Tentang Pesantren</Text>
              <Text style={styles.pesantrenCardSub}>Visi, misi & kontak</Text>
            </View>
          </View>
          <Text style={styles.pesantrenCardChevron}>›</Text>
        </TouchableOpacity>

        {/* ── Ganti PIN ── */}
        <TouchableOpacity
          style={[styles.pesantrenCard, styles.pinCard]}
          onPress={() => navigation.navigate('GantiPin')}
          activeOpacity={0.75}
        >
          <View style={styles.pesantrenCardLeft}>
            <Text style={styles.pesantrenCardIcon}>🔐</Text>
            <View>
              <Text style={styles.pesantrenCardTitle}>Ganti PIN</Text>
              <Text style={styles.pesantrenCardSub}>Ubah PIN masuk aplikasi</Text>
            </View>
          </View>
          <Text style={styles.pesantrenCardChevron}>›</Text>
        </TouchableOpacity>

        {/* ── Keluar Akun ── */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <View style={styles.pesantrenCardLeft}>
            <Text style={styles.pesantrenCardIcon}>🚪</Text>
            <View>
              <Text style={styles.logoutCardTitle}>Keluar Akun</Text>
              <Text style={styles.pesantrenCardSub}>Logout dari KlikSantri</Text>
            </View>
          </View>
          <Text style={styles.pesantrenCardChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Data profil diambil langsung dari sistem pesantren. Hubungi admin untuk perubahan data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: colors.primaryDark,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  heroName: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  nisBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  nisBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
  },
  metaChipIcon: { fontSize: 14 },
  metaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },

  // ── Cards ──
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardIcon: { fontSize: 16 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: { paddingHorizontal: 16 },

  // ── Info Row ──
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 8,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },

  // ── Tentang Pesantren card ──
  pesantrenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  pesantrenCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pesantrenCardIcon: { fontSize: 28 },
  pesantrenCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  pesantrenCardSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  pesantrenCardChevron: {
    fontSize: 24,
    color: colors.gray300,
    fontWeight: '300',
  },
  pinCard: {
    borderColor: colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fde8e8',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  logoutCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },

  // ── Disclaimer ──
  disclaimer: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
