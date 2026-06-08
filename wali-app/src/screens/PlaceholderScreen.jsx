import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useActiveChild } from '../context/ActiveChildContext';
import { colors } from '../constants/colors';

export function PlaceholderScreen({ route }) {
  const { activeChild } = useActiveChild();
  const screenName = route?.name ?? 'Screen';

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚧</Text>
      <Text style={styles.title}>{screenName}</Text>
      <Text style={styles.subtitle}>Segera hadir</Text>
      {activeChild ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Anak aktif: {activeChild.nama}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  badge: {
    marginTop: 16,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});
