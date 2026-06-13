import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { StatusBadge } from '../ui/StatusBadge';
import { PengumumanCover } from './PengumumanCover';
import { formatDate } from '../../utils/formatDate';
import { spacing } from '../../constants/theme';
import { colors } from '../../constants/colors';

export function PengumumanDetailModal({ visible, item, onClose }) {
  if (!item) return null;

  const isExpired =
    item.expires_at ? new Date(item.expires_at) < new Date() : false;

  return (
    <AppModal visible={visible} title={item.judul} onClose={onClose}>
      <PengumumanCover coverUrl={item.cover_url} variant="hero" />
      <View style={styles.meta}>
        <StatusBadge status={item.prioritas} size="md" />
        <AppText variant="caption" color="muted">
          {formatDate(item.published_at)}
        </AppText>
      </View>
      {isExpired ? (
        <AppText variant="caption" color="danger" style={styles.expired}>
          Pengumuman ini sudah tidak berlaku.
        </AppText>
      ) : null}
      <AppText variant="body" color="secondary" style={styles.isi}>
        {item.isi}
      </AppText>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  expired: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  isi: {
    lineHeight: 22,
    color: colors.textPrimary,
  },
});
