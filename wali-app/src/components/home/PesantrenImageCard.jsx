import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { pickPesantrenLogoPath, pickPesantrenBannerPath, resolveProfilCacheBust } from '../../utils/branding';
import { formatShortAddress } from '../../utils/formatAddress';
import { buildVisiblePesantrenStats } from '../../utils/pesantrenStats';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/theme';

const FALLBACK_HERO = require('../../../assets/pesantren-hero.jpeg');

function buildHeroBannerUrl(path, cacheBust, devReloadToken) {
  const resolved = resolveMediaUrl(path, cacheBust);
  if (!resolved) return null;
  if (__DEV__ && devReloadToken != null) {
    const sep = resolved.includes('?') ? '&' : '?';
    return `${resolved}${sep}t=${devReloadToken}`;
  }
  return resolved;
}

const HERO_SHADOW = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.14,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
};

function LogoMark({ pesantren }) {
  const rawPath = useMemo(() => pickPesantrenLogoPath(pesantren), [pesantren]);
  const cacheBust = useMemo(() => resolveProfilCacheBust(pesantren), [pesantren?.updated_at]);
  const [retryBust, setRetryBust] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const resolvedLogoUrl = useMemo(() => {
    const bust = retryBust ?? cacheBust;
    return resolveMediaUrl(rawPath, bust);
  }, [rawPath, cacheBust, retryBust]);

  useEffect(() => {
    setLoadFailed(false);
    setRetryBust(null);
  }, [rawPath]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[HeroMedia] logo fields:', {
      logo_url: pesantren?.logo_url ?? null,
      splash_logo_url: pesantren?.splash_logo_url ?? null,
      app_icon_url: pesantren?.app_icon_url ?? null,
      picked: rawPath,
    });
    console.log('[HeroMedia] resolvedLogoUrl:', resolvedLogoUrl);
  }, [pesantren, rawPath, resolvedLogoUrl]);

  const hasRemoteSource = Boolean(rawPath);

  if (resolvedLogoUrl && !loadFailed) {
    return (
      <View style={styles.logoBox}>
        <Image
          source={{ uri: resolvedLogoUrl }}
          style={styles.logoImage}
          resizeMode="contain"
          onLoad={() => {
            if (__DEV__) console.log('[HeroMedia] logo onLoad OK', resolvedLogoUrl);
          }}
          onError={(event) => {
            console.warn(
              '[HeroMedia] logo onError',
              resolvedLogoUrl,
              event?.nativeEvent?.error
            );
            if (hasRemoteSource && retryBust == null) {
              setRetryBust(Date.now());
              return;
            }
            setLoadFailed(true);
          }}
        />
      </View>
    );
  }

  if (hasRemoteSource && loadFailed) {
    return (
      <View style={styles.logoBox}>
        <Ionicons name="business-outline" size={28} color="#FFFFFF" />
      </View>
    );
  }

  if (!hasRemoteSource) {
    return (
      <View style={styles.logoBox}>
        <Ionicons name="business-outline" size={28} color="#FFFFFF" />
      </View>
    );
  }

  return null;
}

export function PesantrenImageCard({ pesantren, statistik }) {
  const [bannerError, setBannerError] = useState(false);
  const [bannerRetryBust, setBannerRetryBust] = useState(null);
  const [imageVersion, setImageVersion] = useState(0);

  const nama = pesantren?.nama_pesantren ?? 'Pesantren';
  const alamat = formatShortAddress(pesantren?.alamat) ?? pesantren?.alamat;
  const tagline = pesantren?.tagline || 'Amanah Kita Bersama';
  const visibleStats = useMemo(
    () => buildVisiblePesantrenStats(statistik, pesantren),
    [statistik, pesantren]
  );

  const pickedBannerPath = useMemo(
    () => pickPesantrenBannerPath(pesantren),
    [pesantren?.banner_url, pesantren?.banner_active]
  );
  const bannerCacheBust = useMemo(() => {
    const updatedAt = pesantren?.updated_at;
    if (updatedAt != null && updatedAt !== '') return updatedAt;
    if (__DEV__) return Date.now();
    return undefined;
  }, [pesantren?.updated_at]);
  const devReloadToken = useMemo(
    () => Date.now(),
    [pickedBannerPath, pesantren?.updated_at, pesantren?.banner_url, bannerRetryBust]
  );
  const resolvedBannerUrl = buildHeroBannerUrl(
    pickedBannerPath,
    bannerRetryBust ?? bannerCacheBust,
    devReloadToken
  );
  const showRemoteBanner = Boolean(resolvedBannerUrl) && !bannerError;
  const bannerImageKey = resolvedBannerUrl
    ? `${resolvedBannerUrl}-${imageVersion}`
    : `fallback-${imageVersion}`;

  useEffect(() => {
    setBannerError(false);
    setBannerRetryBust(null);
    setImageVersion((v) => v + 1);
  }, [pickedBannerPath, pesantren?.updated_at, pesantren?.banner_url]);

  const hasStats = visibleStats.length > 0;

  return (
    <View style={[styles.wrap, hasStats ? styles.wrapWithStats : styles.wrapNoStats]}>
      <View style={[styles.heroShell, HERO_SHADOW]}>
        <View style={styles.imageFrame}>
          {!showRemoteBanner ? (
            <Image source={FALLBACK_HERO} style={styles.image} resizeMode="cover" />
          ) : null}

          {showRemoteBanner ? (
            <Image
              key={bannerImageKey}
              source={{
                uri: resolvedBannerUrl,
                ...(__DEV__ && Platform.OS === 'ios' ? { cache: 'reload' } : {}),
              }}
              style={styles.image}
              resizeMode="cover"
              onError={(event) => {
                console.warn(
                  '[HeroMedia] banner onError',
                  resolvedBannerUrl,
                  event?.nativeEvent?.error
                );
                if (pickedBannerPath && bannerRetryBust == null) {
                  setBannerRetryBust(Date.now());
                  return;
                }
                setBannerError(true);
              }}
            />
          ) : null}

          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', 'transparent']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />

          <View style={styles.logoCorner}>
            <LogoMark pesantren={pesantren} />
          </View>

          <View style={[styles.heroText, hasStats ? styles.heroTextWithStats : null]}>
            <AppText variant="bodyMedium" color="inverse" numberOfLines={2} style={styles.name}>
              {nama}
            </AppText>
            {alamat ? (
              <AppText variant="caption" color="inverse" numberOfLines={1} style={styles.address}>
                {alamat}
              </AppText>
            ) : null}
            <AppText variant="caption" color="inverse" numberOfLines={2} style={styles.tagline}>
              "{tagline}"
            </AppText>
          </View>
        </View>

        {hasStats ? (
          <View style={styles.statsFloating} pointerEvents="none">
            {visibleStats.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 ? <View style={styles.statDivider} /> : null}
                <View style={styles.statCell}>
                  <AppText variant="caption" color="brand" numberOfLines={1} style={styles.statValue}>
                    {item.display}
                  </AppText>
                  <AppText variant="caption" color="muted" numberOfLines={1} style={styles.statLabel}>
                    {item.label}
                  </AppText>
                </View>
              </React.Fragment>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: -34,
    overflow: 'visible',
  },
  wrapNoStats: {
    marginBottom: spacing.lg,
    paddingBottom: Platform.OS === 'android' ? 10 : 6,
  },
  wrapWithStats: {
    marginBottom: 6,
    paddingBottom: 28,
  },
  heroShell: {
    position: 'relative',
    borderRadius: radius['3xl'],
    backgroundColor: 'transparent',
    overflow: 'visible',
    zIndex: 1,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 19 / 8,
    overflow: 'hidden',
    borderRadius: radius['3xl'],
    backgroundColor: colors.surfaceSoft,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroText: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: 1,
  },
  heroTextWithStats: {
    bottom: 36,
    paddingRight: 4,
  },
  logoCorner: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  logoBox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 18,
  },
  address: {
    opacity: 0.9,
    fontSize: 12,
    lineHeight: 14,
    marginTop: 1,
  },
  tagline: {
    marginTop: 2,
    maxWidth: '90%',
    opacity: 0.88,
    fontSize: 11,
    lineHeight: 13,
  },
  statsFloating: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(241, 245, 249, 0.95)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 20,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 19,
    color: colors.primary,
  },
  statLabel: {
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 13,
    marginTop: 1,
    color: colors.textMuted,
  },
});
