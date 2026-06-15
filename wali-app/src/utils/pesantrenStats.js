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

/**
 * Extract pesantren stats from profil fields already returned by API.
 * No extra network calls — uses direct fields or parses tentang/tagline/visi.
 */
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

export function formatStatValue(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('id-ID');
}
