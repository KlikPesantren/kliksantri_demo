import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { BrandLogo } from '../../components/branding/BrandLogo';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';
import { AppText } from '../../components/ui/AppText';
import { storage } from '../../utils/storage';
import {
  resolveBrandingName,
  resolveBrandingTagline,
  resolveSplashLogoUrl,
} from '../../utils/branding';

export function SplashScreen() {
  const [branding, setBranding] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage
      .getPesantrenBranding()
      .then((cached) => {
        setBranding(cached);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const displayName = resolveBrandingName(branding);
  const splashLogo = resolveSplashLogoUrl(branding);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <BrandLogo logoUrl={splashLogo} nama={displayName} size={72} />
        {ready ? (
          <AppText variant="display" color="primary" style={styles.appName} numberOfLines={2}>
            {displayName}
          </AppText>
        ) : null}
      </View>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      <AppText variant="caption" color="muted" style={styles.loadingText}>
        Memuat sesi...
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
    gap: spacing.md,
    paddingHorizontal: spacing['2xl'],
  },
  appName: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  spinner: {
    marginTop: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
  },
});
