import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatCurrency';

export function SaldoCard({ saldo, limitHarian, kartuAktif }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>💳</Text>
        <Text style={styles.title}>Saldo RFID</Text>
        <View style={[styles.badge, kartuAktif ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, kartuAktif ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {kartuAktif ? '● Aktif' : '○ Tidak Ada'}
          </Text>
        </View>
      </View>

      <Text style={styles.saldoAmount}>{formatCurrency(saldo)}</Text>

      {limitHarian > 0 && (
        <Text style={styles.limitText}>
          Limit harian: {formatCurrency(limitHarian)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  icon: { fontSize: 18 },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  badgeInactive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#86efac' },
  badgeTextInactive: { color: 'rgba(255,255,255,0.5)' },

  saldoAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  limitText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
  },
});
