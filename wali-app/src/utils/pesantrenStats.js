const STAT_API_KEYS = {
  santri: 'total_santri_aktif',
  ustadz: 'total_guru',
  kelas: 'total_kelas',
};

const STAT_PROFILE_FIELDS = {
  santri: ['jumlah_santri', 'total_santri'],
  ustadz: ['jumlah_ustadz', 'jumlah_guru', 'total_guru'],
  kelas: ['jumlah_kelas', 'total_kelas'],
};

export const PESANTREN_STAT_ITEMS = [
  { key: 'tahun', label: 'Berdiri' },
  { key: 'santri', label: 'Santri Aktif' },
  { key: 'ustadz', label: 'Guru' },
  { key: 'kelas', label: 'Kelas' },
];

/** Resolve tenant-wide stat from dashboard API first, then explicit profil numeric fields. */
export function resolvePesantrenStatNumber(key, statistik, pesantren) {
  if (key === 'tahun') {
    const year = pesantren?.tahun_berdiri;
    if (year == null || year === '') return null;
    const n = Number(year);
    const maxYear = new Date().getFullYear();
    if (!Number.isInteger(n) || n < 1800 || n > maxYear) return null;
    return n;
  }

  const apiKey = STAT_API_KEYS[key];
  if (statistik != null && apiKey && Object.prototype.hasOwnProperty.call(statistik, apiKey)) {
    const fromApi = Number(statistik[apiKey]);
    if (Number.isFinite(fromApi)) return fromApi;
  }

  if (pesantren) {
    for (const field of STAT_PROFILE_FIELDS[key] ?? []) {
      const value = pesantren[field];
      if (value == null || value === '') continue;
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }

  return null;
}

/** Format stat count; returns null when unavailable (never "-"). */
export function formatStatDisplay(value) {
  if (value == null) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (Number.isInteger(number) && number >= 1800 && number <= 9999) {
    return String(number);
  }
  return number.toLocaleString('id-ID');
}

export function buildVisiblePesantrenStats(statistik, pesantren) {
  return PESANTREN_STAT_ITEMS.map((item) => {
    const raw = resolvePesantrenStatNumber(item.key, statistik, pesantren);
    const display = formatStatDisplay(raw);
    return display != null ? { ...item, display } : null;
  }).filter(Boolean);
}

/** Dev/runtime audit — why stats are missing per field. */
export function explainPesantrenStatsGap(statistik, pesantren) {
  return PESANTREN_STAT_ITEMS.map((item) => {
    const apiKey = STAT_API_KEYS[item.key];
    const raw = resolvePesantrenStatNumber(item.key, statistik, pesantren);
    let reason = 'ok';

    if (raw == null) {
      if (item.key === 'tahun') {
        reason = pesantren?.tahun_berdiri == null
          ? 'tahun_berdiri kosong di profil'
          : 'tahun_berdiri tidak valid';
      } else if (statistik == null) {
        reason = 'statistik prop undefined (dashboard belum load / API tanpa statistik_pesantren)';
      } else if (!Object.prototype.hasOwnProperty.call(statistik, apiKey)) {
        reason = `field API hilang: ${apiKey}`;
      } else {
        reason = `nilai ${apiKey} tidak valid`;
      }
    }

    return { key: item.key, label: item.label, raw, reason };
  });
}

/** @deprecated use formatStatDisplay — kept for legacy callers */
export function formatStatValue(value) {
  return formatStatDisplay(value) ?? '—';
}

function pickNumber(...values) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function parseFromText(text, patterns) {
  if (!text) return null;
  for (const re of patterns) {
    const m = String(text).match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function parseYear(text) {
  if (!text) return null;
  const m = String(text).match(/\b(19\d{2}|20\d{2})\b/);
  return m ? m[1] : null;
}

/** Legacy text-parse helper — not used for stats strip totals. */
export function extractPesantrenStats(pesantren) {
  if (!pesantren) {
    return { santri: null, ustadz: null, kelas: null, tahun: null };
  }

  const blob = [pesantren.tentang, pesantren.tagline, pesantren.visi, pesantren.misi]
    .filter(Boolean)
    .join('\n');

  return {
    santri: pickNumber(
      pesantren.jumlah_santri,
      pesantren.total_santri,
      parseFromText(blob, [/(\d[\d.,]*)\s*santri/i])
    ),
    ustadz: pickNumber(
      pesantren.jumlah_ustadz,
      pesantren.jumlah_guru,
      pesantren.total_guru,
      parseFromText(blob, [/(\d[\d.,]*)\s*(ustadz|guru)/i])
    ),
    kelas: pickNumber(
      pesantren.jumlah_kelas,
      pesantren.total_kelas,
      parseFromText(blob, [/(\d[\d.,]*)\s*kelas/i])
    ),
    tahun: pickNumber(
      pesantren.tahun_berdiri,
      pesantren.tahun,
      parseYear(blob)
    ),
  };
}
