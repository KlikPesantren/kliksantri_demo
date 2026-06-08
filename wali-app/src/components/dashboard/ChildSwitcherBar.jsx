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

export function ChildSwitcherBar() {
  const navigation = useNavigation();
  const { anak } = useAuth();
  const { activeChild } = useActiveChild();

  if (!activeChild) return null;

  const hasMultipleAnak = anak.length > 1;

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {activeChild.nama?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View>
          <Text style={styles.namaText} numberOfLines={1}>
            {activeChild.nama}
          </Text>
          {activeChild.nama_kelas ? (
            <Text style={styles.kelasText}>{activeChild.nama_kelas}</Text>
          ) : null}
        </View>
      </View>

      {hasMultipleAnak && (
        <TouchableOpacity
          style={styles.gantiButton}
          onPress={() => navigation.navigate('AnakPilih')}
          activeOpacity={0.75}
        >
          <Text style={styles.gantiText}>Ganti ↕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  namaText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
    maxWidth: 200,
  },
  kelasText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 1,
  },
  gantiButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  gantiText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
