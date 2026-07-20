const PESANTREN_CODES = new Set(['PESANTREN', 'MADINAH', 'MADIN']);

export function isPesantrenUnit(unit) {
  if (!unit || !unit.unit_id) return true;
  const code = String(unit.unit_kode || '').trim().toUpperCase();
  const name = String(unit.unit_nama || '').trim().toLowerCase();
  return PESANTREN_CODES.has(code) || name.includes('pesantren');
}

export function getUnitFeatureFallback(unit) {
  const pesantren = isPesantrenUnit(unit);
  return {
    absensi: true,
    nilai: true,
    hafalan: pesantren,
    perizinan: pesantren,
    pelanggaran: pesantren,
    kesehatan: pesantren,
    sahriyah: true,
    rfid: false,
    pengumuman: true,
    unit_id: unit?.unit_id || null,
    unit_kode: unit?.unit_kode || null,
    unit_nama: unit?.unit_nama || null,
    unit_kategori: pesantren ? 'pesantren' : 'pendidikan',
  };
}
