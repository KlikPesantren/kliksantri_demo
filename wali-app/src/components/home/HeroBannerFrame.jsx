import React, { useEffect } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeroBottomGradient } from './HeroBottomGradient';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/theme';
import { BANNER_HEIGHT, BANNER_RADIUS } from './carouselShared';
import { resolveMediaUrl } from '../../utils/mediaUrl';

function logBannerDebug(rawImageUrl, resolvedUrl, imageError) {
  console.log('RAW IMAGE URL', rawImageUrl);
  console.log('RESOLVED URL', resolvedUrl);
  console.log('IMAGE ERROR', imageError);
}

export function HeroImageFallback({ icon = 'school-outline', size = 40 }) {
  return (
    <View style={styles.fallback}>
      <Ionicons name={icon} size={size} color="rgba(255,255,255,0.92)" />
    </View>
  );
}

/**
 * Premium banner — gradient inside ImageBackground; footer sibling on top (Android-safe).
 */
export function HeroBannerFrame({
  rawImageUrl,
  imageUrl,
  imageError = false,
  onImageError,
  fallbackIcon = 'school-outline',
  footer,
  style,
}) {
  const resolvedUrl = imageUrl ?? resolveMediaUrl(rawImageUrl);
  const hasUri = Boolean(resolvedUrl);
  const showImage = hasUri && !imageError;

  useEffect(() => {
    logBannerDebug(rawImageUrl, resolvedUrl, imageError);
    console.log('IMAGE URL', resolvedUrl);
  }, [rawImageUrl, resolvedUrl, imageError]);

  function handleImageError(event) {
    console.log('BANNER onError fired', resolvedUrl, event?.nativeEvent?.error);
    onImageError?.(event);
  }

  function handleImageLoad() {
    console.log('BANNER onLoad OK', resolvedUrl);
  }

  return (
    <View style={[styles.bannerContainer, style]}>
      {showImage ? (
        <ImageBackground
          source={{ uri: resolvedUrl }}
          style={styles.image}
          imageStyle={styles.imageClip}
          resizeMode="cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
        >
          <View style={styles.overlayHost} pointerEvents="box-none">
            <HeroBottomGradient />
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.fallback}>
          <Ionicons name={fallbackIcon} size={40} color="rgba(255,255,255,0.92)" />
          <View style={styles.overlayHost} pointerEvents="box-none">
            <HeroBottomGradient />
          </View>
        </View>
      )}

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'relative',
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: BANNER_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    ...shadows.sm,
  },
  image: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  overlayHost: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  imageClip: {
    borderRadius: BANNER_RADIUS,
  },
  fallback: {
    width: '100%',
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 10,
    elevation: 10,
  },
});

export { BANNER_HEIGHT as HERO_SLIDE_HEIGHT };
