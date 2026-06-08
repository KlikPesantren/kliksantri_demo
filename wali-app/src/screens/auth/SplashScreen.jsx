import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Text style={styles.logoIcon}>🕌</Text>
        <Text style={styles.appName}>KlikSantri</Text>
        <Text style={styles.tagline}>Portal Orang Tua</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={colors.primaryLight}
        style={styles.spinner}
      />
      <Text style={styles.loadingText}>Memuat sesi...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  spinner: {
    marginTop: 8,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});
