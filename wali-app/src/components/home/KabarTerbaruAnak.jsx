import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import { colors } from '../../constants/colors';
import { radius, shadows, spacing } from '../../constants/theme';

const PENANGANAN_LABELS = {
  observasi: 'dalam observasi',
  istirahat: 'sedang istirahat',
  sudah_berobat: 'sudah berobat',
  pulang: 'sudah pulang',
  rawat_lanjut: 'perlu rawat lanjut',
};

const TONES = {
  success: { bg: colors.successSoft, icon: colors.primary, text: colors.primaryHover },
  warning: { bg: colors.warningSoft, icon: colors.warning, text: colors.warning },
  danger: { bg: colors.dangerSoft, icon: colors.danger, text: colors.danger },
  info: { bg: colors.infoSoft, icon: colors.info, text: colors.info },
};

function importantAnnouncement(pengumuman = []) {
  return pengumuman.find((item) => item.prioritas === 'urgent' || item.prioritas === 'penting') ?? pengumuman[0];
}

function buildNews(data, pengumuman) {
  const items = [];
  if (!data) return items;

  const kesehatan = data.kesehatan_aktif;
  if (kesehatan?.status_kesehatan === 'sakit') {
    const penanganan = PENANGANAN_LABELS[kesehatan.status_penanganan] ?? 'dalam penanganan';
    items.push({
      key: 'kesehatan',
      icon: 'medkit-outline',
      tone: 'danger',
      title: 'Kesehatan perlu perhatian',
      desc: kesehatan.keluhan ? `${kesehatan.keluhan} - ${penanganan}` : `Ananda ${penanganan}.`,
    });
  }

  if ((data.izin_aktif ?? 0) > 0) {
    items.push({
      key: 'izin',
      icon: 'exit-outline',
      tone: 'warning',
      title: 'Sedang dalam perizinan',
      desc: 'Ananda tercatat sedang izin keluar pesantren.',
    });
  }

  if ((data.pelanggaran_bulan_ini ?? 0) > 0) {
    items.push({
      key: 'pelanggaran',
      icon: 'alert-circle-outline',
      tone: 'warning',
      title: 'Ada catatan kedisiplinan',
      desc: `${data.pelanggaran_bulan_ini} catatan bulan ini.`,
    });
  }

  const sahStatus = data.sahriyah_aktif?.status?.toLowerCase();
  if (data.sahriyah_aktif && sahStatus !== 'lunas') {
    items.push({
      key: 'sahriyah',
      icon: 'receipt-outline',
      tone: 'info',
      title: 'Sahriyah masih aktif',
      desc: `Sisa tagihan tercatat untuk periode ${data.sahriyah_aktif.bulan}/${data.sahriyah_aktif.tahun}.`,
    });
  }

  const item = importantAnnouncement(pengumuman);
  if (item) {
    items.push({
      key: `pengumuman-${item.id}`,
      icon: 'megaphone-outline',
      tone: item.prioritas === 'urgent' ? 'danger' : item.prioritas === 'penting' ? 'warning' : 'info',
      title: item.judul,
      desc: item.prioritas === 'urgent' ? 'Pengumuman urgent dari pesantren.' : 'Pengumuman terbaru dari pesantren.',
    });
  }

  return items.slice(0, 4);
}

function NewsItem({ item }) {
  const tone = TONES[item.tone] ?? TONES.info;

  return (
    <View style={styles.item}>
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <Ionicons name={item.icon} size={18} color={tone.icon} />
      </View>
      <View style={styles.itemText}>
        <AppText variant="bodyMedium" numberOfLines={2} style={[styles.itemTitle, { color: tone.text }]}>
          {item.title}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={2} style={styles.itemDesc}>
          {item.desc}
        </AppText>
      </View>
    </View>
  );
}

export function KabarTerbaruAnak({ data, pengumuman }) {
  const items = buildNews(data, pengumuman);

  return (
    <View style={styles.wrap}>
      <AppText variant="h3" style={styles.title}>
        Kabar Terbaru Anak
      </AppText>
      <View style={[styles.card, shadows.sm]}>
        {items.length ? (
          items.map((item, index) => (
            <React.Fragment key={item.key}>
              <NewsItem item={item} />
              {index < items.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />
            <AppText variant="caption" color="muted">
              Belum ada kabar khusus hari ini.
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  itemTitle: {
    fontWeight: '800',
  },
  itemDesc: {
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginLeft: 64,
    backgroundColor: colors.border,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
});
