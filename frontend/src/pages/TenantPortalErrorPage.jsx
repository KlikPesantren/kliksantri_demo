const COPY = {
  not_found: {
    eyebrow: "Portal tidak ditemukan",
    title: "Pesantren belum terdaftar",
    description:
      "Alamat portal ini tidak tersedia. Periksa kembali alamat yang Anda buka atau hubungi admin pesantren.",
  },
  inactive: {
    eyebrow: "Layanan tidak aktif",
    title: "Portal sedang tidak tersedia",
    description:
      "Layanan KlikPesantren untuk pesantren ini sedang tidak aktif. Silakan hubungi admin pesantren.",
  },
  suspended: {
    eyebrow: "Layanan tidak aktif",
    title: "Portal sedang tidak tersedia",
    description:
      "Layanan KlikPesantren untuk pesantren ini sedang tidak aktif. Silakan hubungi admin pesantren.",
  },
};

export default function TenantPortalErrorPage({ type = "not_found" }) {
  const copy = COPY[type] || COPY.not_found;

  return (
    <main style={styles.page}>
      <div style={styles.glow} aria-hidden="true" />
      <section style={styles.card}>
        <div style={styles.mark} aria-hidden="true">KP</div>
        <p style={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 style={styles.title}>{copy.title}</h1>
        <p style={styles.description}>{copy.description}</p>
        <div style={styles.divider} />
        <p style={styles.footer}>Portal administrasi pesantren · KlikPesantren</p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: 24,
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at 15% 10%, rgba(21,128,61,.18), transparent 30%), linear-gradient(145deg, #07130d 0%, #0f172a 58%, #122419 100%)",
  },
  glow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: "50%",
    right: "-10%",
    bottom: "-20%",
    background: "rgba(34,197,94,.12)",
    filter: "blur(24px)",
  },
  card: {
    width: "min(100%, 540px)",
    position: "relative",
    boxSizing: "border-box",
    padding: "clamp(28px, 6vw, 52px)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 28,
    background: "rgba(255,255,255,.96)",
    boxShadow: "0 30px 80px rgba(0,0,0,.34)",
    textAlign: "center",
  },
  mark: {
    width: 58,
    height: 58,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 24px",
    borderRadius: 18,
    background: "linear-gradient(145deg, #15803d, #166534)",
    color: "white",
    fontWeight: 900,
    letterSpacing: "-.04em",
    boxShadow: "0 12px 30px rgba(21,128,61,.28)",
  },
  eyebrow: {
    margin: "0 0 12px",
    color: "#15803d",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: ".14em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "clamp(28px, 6vw, 42px)",
    lineHeight: 1.12,
    letterSpacing: "-.04em",
  },
  description: {
    maxWidth: 430,
    margin: "18px auto 0",
    color: "#475569",
    fontSize: 15,
    lineHeight: 1.75,
  },
  divider: {
    width: 42,
    height: 3,
    margin: "30px auto 18px",
    borderRadius: 99,
    background: "#22c55e",
  },
  footer: { margin: 0, color: "#94a3b8", fontSize: 12, fontWeight: 600 },
};

