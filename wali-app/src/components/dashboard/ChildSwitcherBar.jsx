import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useActiveChild } from '../../context/ActiveChildContext';
import { colors } from '../../constants/colors';
import { interaction, radius, spacing } from '../../constants/theme';

export function ChildSwitcherBar() {
  const navigation = useNavigation();
  const { anak } = useAuth();
  const { activeChild } = useActiveChild();

  if (!activeChild) return null;

  const hasMultipleAnak = anak.length > 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {activeChild.nama?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.textCol}>
            <Text style={styles.namaText} numberOfLines={1}>
              {activeChild.nama}
            </Text>
            {activeChild.nama_kelas ? (
              <Text style={styles.kelasText}>{activeChild.nama_kelas}</Text>
            ) : null}
          </View>
        </View>

        {hasMultipleAnak ? (
          <TouchableOpacity
            style={styles.gantiButton}
            onPress={() => navigation.navigate('AnakPilih')}
            activeOpacity={interaction.activeOpacity}
          >
            <Text style={styles.gantiText}>Ganti</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  namaText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  kelasText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  gantiButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  gantiText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
