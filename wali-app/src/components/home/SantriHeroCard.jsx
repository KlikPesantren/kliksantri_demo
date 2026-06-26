import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { colors } from '../../constants/colors';
import { interaction, radius, spacing } from '../../constants/theme';

function Avatar({ foto }) {
  const uri = resolveMediaUrl(foto);

  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} resizeMode="cover" />;
  }

  return (
    <View style={styles.avatarFallback}>
      <Ionicons name="person-outline" size={26} color={colors.primary} />
    </View>
  );
}

function HeaderIcon({ icon, onPress, badgeCount = 0 }) {
  const content = (
    <>
      <Ionicons name={icon} size={21} color={colors.surface} />
      {badgeCount > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" color="inverse" style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </AppText>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.headerIcon}
        activeOpacity={interaction.activeOpacity}
        onPress={onPress}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.headerIcon}>{content}</View>;
}

export function SantriHeroCard({
  activeChild,
  dashboardProfil,
  wali,
  onGantiPress,
  onNotificationPress,
  unreadNotificationCount = 0,
}) {
  const insets = useSafeAreaInsets();
  const profil = dashboardProfil ?? activeChild ?? {};
  const santriName = profil.nama ?? activeChild?.nama ?? 'Ananda';
  const waliName = wali?.nama || 'Bapak/Ibu';
  const foto = wali?.foto || profil.foto || activeChild?.foto;

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + spacing.sm }]}>
      <View style={styles.glowOne} pointerEvents="none" />
      <View style={styles.glowTwo} pointerEvents="none" />

      <View style={styles.row}>
        <Avatar foto={foto} />
        <TouchableOpacity
          style={styles.greeting}
          activeOpacity={onGantiPress ? interaction.activeOpacity : 1}
          onPress={onGantiPress}
          disabled={!onGantiPress}
        >
          <AppText variant="caption" color="inverse" style={styles.salam}>
            Assalamu'alaikum
          </AppText>
          <AppText variant="bodyMedium" color="inverse" numberOfLines={1} style={styles.waliName}>
            Bapak/Ibu {waliName}
          </AppText>
          <View style={styles.childLine}>
            <AppText variant="caption" color="inverse" numberOfLines={1} style={styles.childText}>
              Wali dari{' '}
              <AppText variant="caption" color="inverse" style={styles.childName}>
                {santriName}
              </AppText>
            </AppText>
            {onGantiPress ? (
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.82)" />
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <HeaderIcon
            icon="notifications-outline"
            onPress={onNotificationPress}
            badgeCount={unreadNotificationCount}
          />
          <HeaderIcon icon="scan-outline" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 42,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  glowOne: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -72,
    top: -56,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  glowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    left: -72,
    bottom: -72,
    backgroundColor: 'rgba(21,128,61,0.40)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  greeting: {
    flex: 1,
    minWidth: 0,
  },
  salam: {
    opacity: 0.92,
    fontWeight: '600',
  },
  waliName: {
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 19,
  },
  childLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  childText: {
    flexShrink: 1,
    opacity: 0.9,
    fontWeight: '500',
  },
  childName: {
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
});
