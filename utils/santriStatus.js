function isSantriAktif(status) {
  const normalized = String(status ?? "aktif").trim().toLowerCase();
  return normalized === "aktif" || normalized === "active" || normalized === "";
}

function isSantriNonAktif(status) {
  return !isSantriAktif(status);
}

const SQL_SANTri_AKTIF = `LOWER(TRIM(COALESCE(s.status, 'aktif'))) IN ('aktif', 'active', '')`;

module.exports = {
  isSantriAktif,
  isSantriNonAktif,
  SQL_SANTri_AKTIF,
};
