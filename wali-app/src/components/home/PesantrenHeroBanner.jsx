import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatShortAddress } from '../../utils/formatAddress';
import { HeroBannerFrame } from './HeroBannerFrame';
import { spacing } from '../../constants/theme';
import { BANNER_RADIUS } from './carouselShared';

/** @deprecated Use HeroBannerFrame directly — kept for imports */
export function HeroSlideShell({ children, style, footer }) {
  return (
    <View style={style}>
      {children}
      {footer}
    </View>
  );
}

export { HeroImageFallback } from './HeroBannerFrame';

export function PesantrenBannerSlideContent({
  bannerUrl,
  nama,
  alamat,
  fullBleed = false,
}) {
  const uri = resolveMediaUrl(bannerUrl);
  const [imageError, setImageError] = useState(false);
  const shortAddr = formatShortAddress(alamat) ?? alamat;

  const footer = (
    <View style={styles.content}>
      <AppText variant="label" color="inverse" style={styles.badge}>
        Pesantren
      </AppText>
      {nama ? (
        <AppText variant="h3" color="inverse" style={styles.title} numberOfLines={2}>
          {nama}
        </AppText>
      ) : null}
      {shortAddr ? (
        <AppText variant="caption" color="inverse" style={styles.subtitle} numberOfLines={2}>
          {shortAddr}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <HeroBannerFrame
      rawImageUrl={bannerUrl}
      imageUrl={uri}
      imageError={imageError}
      onImageError={() => setImageError(true)}
      fallbackIcon="school-outline"
      footer={footer}
      style={fullBleed ? styles.fullBleed : null}
    />
  );
}

export function PesantrenWelcomeSlideContent({ fullBleed = false }) {
  const footer = (
    <View style={styles.content}>
      <AppText variant="label" color="inverse" style={styles.badge}>
        Selamat Datang
      </AppText>
      <AppText variant="h3" color="inverse" style={styles.title}>
        Bapak/Ibu Wali Santri
      </AppText>
      <AppText variant="caption" color="inverse" style={styles.subtitle}>
        Pantau perkembangan ananda di pesantren
      </AppText>
    </View>
  );

  return (
    <HeroBannerFrame
      imageUrl={null}
      fallbackIcon="school-outline"
      footer={footer}
      style={fullBleed ? styles.fullBleed : null}
    />
  );
}

export function PesantrenHeroBanner({ bannerUrl, nama, alamat }) {
  const uri = resolveMediaUrl(bannerUrl);

  if (!uri && !nama) return null;

  return (
    <View style={styles.wrap}>
      <PesantrenBannerSlideContent bannerUrl={bannerUrl} nama={nama} alamat={alamat} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  fullBleed: {
    borderRadius: BANNER_RADIUS,
  },
  content: {
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  badge: {
    opacity: 0.92,
    letterSpacing: 0.4,
  },
  title: {
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'left',
  },
  subtitle: {
    opacity: 0.9,
    lineHeight: 18,
    textAlign: 'left',
  },
});
