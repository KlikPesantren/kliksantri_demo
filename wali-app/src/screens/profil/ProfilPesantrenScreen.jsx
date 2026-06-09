import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  Linking,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useProfilPesantren } from '../../hooks/useProfilPesantren';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorView } from '../../components/common/ErrorView';
import { colors } from '../../constants/colors';

// ─── Logo / Emblem ────────────────────────────────────────────────────────────

const LOGO_SIZE = 88;

function LogoHero({ logoUrl, namaPesantren }) {
  const initials = (namaPesantren ?? 'PP')
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={styles.logo}
        resizeMode="contain"
        onError={() => {}}
      />
    );
  }

  return (
    <View style={styles.logoFallback}>
      <Text style={styles.logoInitials}>{initials}</Text>
    </View>
  );
}

// ─── Contact Row ─────────────────────────────────────────────────────────────

function ContactRow({ icon, label, value, onPress }) {
  if (!value) return null;
  return (
    <TouchableOpacity
      style={styles.contactRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={styles.contactLeft}>
        <Text style={styles.contactIcon}>{icon}</Text>
        <View>
          <Text style={styles.contactLabel}>{label}</Text>
          <Text style={styles.contactValue} numberOfLines={2}>
            {value}
          </Text>
        </View>
      </View>
      {onPress ? (
        <Text style={styles.contactChevron}>›</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Long Text Section ────────────────────────────────────────────────────────

function TextSection({ icon, title, body }) {
  if (!body) return null;
  return (
    <View style={styles.textSection}>
      <View style={styles.textSectionHeader}>
        <Text style={styles.textSectionIcon}>{icon}</Text>
        <Text style={styles.textSectionTitle}>{title}</Text>
      </View>
      <Text style={styles.textSectionBody}>{body}</Text>
    </View>
  );
}

// ─── Empty (tabel kosong di backend) ─────────────────────────────────────────

function EmptyProfil() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏫</Text>
      <Text style={styles.emptyTitle}>Profil Belum Tersedia</Text>
      <Text style={styles.emptySubtitle}>
        Admin pesantren belum mengisi data profil pesantren.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function ProfilPesantrenScreen() {
  const { data, isLoading, isRefreshing, error, refresh } = useProfilPesantren();

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner message="Memuat profil pesantren..." />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const p = data;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {!p ? (
          <EmptyProfil />
        ) : (
          <>
            {/* ── Hero ── */}
            <View style={styles.hero}>
              <LogoHero logoUrl={p.logo_url} namaPesantren={p.nama_pesantren} />

              <Text style={styles.heroName}>{p.nama_pesantren}</Text>

              {p.alamat ? (
                <View style={styles.heroAlamat}>
                  <Text style={styles.heroAlamatText} numberOfLines={3}>
                    📍 {p.alamat}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* ── Kontak ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📞</Text>
                <Text style={styles.cardTitle}>Kontak</Text>
              </View>
              <View style={styles.cardBody}>
                <ContactRow
                  icon="📱"
                  label="Telepon"
                  value={p.telepon}
                  onPress={
                    p.telepon
                      ? () => Linking.openURL(`tel:${p.telepon.replace(/\D/g, '')}`)
                      : null
                  }
                />
                <ContactRow
                  icon="✉️"
                  label="Email"
                  value={p.email}
                  onPress={
                    p.email
                      ? () => Linking.openURL(`mailto:${p.email}`)
                      : null
                  }
                />
                <ContactRow
                  icon="🌐"
                  label="Website"
                  value={p.website}
                  onPress={
                    p.website
                      ? () => Linking.openURL(p.website)
                      : null
                  }
                />
                {!p.telepon && !p.email && !p.website ? (
                  <Text style={styles.emptyContactText}>Kontak belum tersedia.</Text>
                ) : null}
              </View>
            </View>

            {/* ── Visi ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎯</Text>
                <Text style={styles.cardTitle}>Visi</Text>
              </View>
              <View style={styles.cardBody}>
                <TextSection body={p.visi} />
                {!p.visi ? (
                  <Text style={styles.emptyContactText}>Visi belum diisi.</Text>
                ) : null}
              </View>
            </View>

            {/* ── Misi ── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📋</Text>
                <Text style={styles.cardTitle}>Misi</Text>
              </View>
              <View style={styles.cardBody}>
                <TextSection body={p.misi} />
                {!p.misi ? (
                  <Text style={styles.emptyContactText}>Misi belum diisi.</Text>
                ) : null}
              </View>
            </View>

            {/* ── Footer ── */}
            {p.updated_at ? (
              <Text style={styles.updatedAt}>
                Terakhir diperbarui:{' '}
                {new Date(p.updated_at).toLocaleDateString('id-ID', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </Text>
            ) : null}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 0 },

  // ── Hero ──
  hero: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoFallback: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
  },
  heroAlamat: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '90%',
  },
  heroAlamatText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Card ──
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
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  // ── Contact Row ──
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  contactIcon: { fontSize: 20 },
  contactLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  contactChevron: {
    fontSize: 22,
    color: colors.gray300,
    marginLeft: 8,
  },
  emptyContactText: {
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: 14,
    fontStyle: 'italic',
  },

  // ── Text Section ──
  textSection: { paddingVertical: 14 },
  textSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  textSectionIcon: { fontSize: 16 },
  textSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  textSectionBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 24,
  },

  // ── Updated at ──
  updatedAt: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 20,
    marginHorizontal: 16,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
