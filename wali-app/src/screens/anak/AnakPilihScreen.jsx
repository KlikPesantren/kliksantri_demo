import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useActiveChild } from '../../context/ActiveChildContext';
import { colors } from '../../constants/colors';

function AnakCard({ anak, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.avatar, isActive && styles.avatarActive]}>
        <Text style={styles.avatarText}>
          {anak.nama?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.namaText, isActive && styles.namaTextActive]}>
          {anak.nama}
        </Text>
        {anak.nis ? (
          <Text style={styles.nisText}>NIS: {anak.nis}</Text>
        ) : null}
        {anak.nama_kelas ? (
          <Text style={styles.kelasText}>{anak.nama_kelas}</Text>
        ) : null}
        {anak.kamar ? (
          <Text style={styles.kamarText}>Kamar {anak.kamar}</Text>
        ) : null}
      </View>

      <View style={styles.checkWrapper}>
        {isActive ? (
          <View style={styles.checkBadge}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        ) : (
          <View style={styles.checkEmpty} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export function AnakPilihScreen() {
  const navigation = useNavigation();
  const { anak } = useAuth();
  const { activeSantriId, setActiveSantri } = useActiveChild();

  async function handlePilih(child) {
    await setActiveSantri(child);
    // Kembali ke screen sebelumnya atau ke root
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.titleText}>Pilih Anak</Text>
          <Text style={styles.subtitleText}>
            Data ditampilkan sesuai anak yang dipilih
          </Text>
        </View>

        <FlatList
          data={anak}
          keyExtractor={(item) => String(item.santri_id ?? item.id)}
          renderItem={({ item }) => (
            <AnakCard
              anak={item}
              isActive={(item.santri_id ?? item.id) === activeSantriId}
              onPress={() => handlePilih(item)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👦</Text>
              <Text style={styles.emptyText}>
                Tidak ada santri yang terdaftar.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },

  headerSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitleText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  list: { padding: 16 },
  separator: { height: 10 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarActive: { backgroundColor: colors.primary },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },

  // Body
  cardBody: { flex: 1 },
  namaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  namaTextActive: { color: colors.primaryDark },
  nisText: { fontSize: 12, color: colors.textMuted },
  kelasText: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  kamarText: { fontSize: 12, color: colors.textSecondary },

  // Check
  checkWrapper: { marginLeft: 8 },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: { color: colors.white, fontSize: 14, fontWeight: '700' },
  checkEmpty: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.gray300,
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
