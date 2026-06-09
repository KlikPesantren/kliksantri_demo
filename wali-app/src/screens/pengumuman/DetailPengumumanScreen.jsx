import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../constants/colors';
import { formatDate } from '../../utils/formatDate';

// ─── Prioritas Config ─────────────────────────────────────────────────────────

const PRIORITAS = {
  urgent:  { label: 'Urgent',  color: colors.danger,  bg: colors.dangerLight,  icon: '🚨' },
  penting: { label: 'Penting', color: colors.warning, bg: colors.warningLight, icon: '⚠️' },
  normal:  { label: 'Normal',  color: colors.info,    bg: colors.infoLight,    icon: '📢' },
};

function getPrioritasConfig(p) {
  return PRIORITAS[p] ?? PRIORITAS.normal;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function DetailPengumumanScreen({ route }) {
  const { item } = route.params ?? {};

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Data tidak tersedia.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = getPrioritasConfig(item.prioritas);

  const isExpired =
    item.expires_at
      ? new Date(item.expires_at) < new Date()
      : false;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Prioritas badge */}
        <View style={[styles.badge, { backgroundColor: cfg.bg, alignSelf: 'flex-start' }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>
            {cfg.icon} {cfg.label}
          </Text>
        </View>

        {/* Judul */}
        <Text style={styles.judul}>{item.judul}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            🗓 {formatDate(item.published_at)}
          </Text>
          {item.expires_at ? (
            <Text style={[styles.metaText, isExpired && { color: colors.danger }]}>
              {isExpired ? '⛔ Kedaluwarsa' : `✅ s/d ${formatDate(item.expires_at)}`}
            </Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Isi lengkap */}
        <Text style={styles.isi}>{item.isi}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, gap: 12 },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  judul: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
    marginTop: 4,
  },

  metaRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  isi: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 26,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
});
