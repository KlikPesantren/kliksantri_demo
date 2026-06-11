import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const FORM_INIT = {
  nama:          "",
  jabatan:       "",
  nomor_hp:      "",
  email:         "",
  alamat:        "",
  tanggal_masuk: "",
  status:        "Aktif",
  catatan:       "",
};

function GuruPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "";

  const [guru,     setGuru]     = useState([]);
  const [search,   setSearch]   = useState("");
  const [form,     setForm]     = useState(FORM_INIT);
  const [editId,   setEditId]   = useState(null);
  const [showForm, setShowForm] = useState(false);

  // ============================================================
  // GET
  // ============================================================

  const getGuru = async (q = "") => {
    try {
      const params = q ? { q } : {};
      const res    = await api.get("/guru", { params });
      setGuru(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { getGuru(); }, []);

  // ============================================================
  // SEARCH (debounced via onChange)
  // ============================================================

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    getGuru(val);
  };

  // ============================================================
  // FORM
  // ============================================================

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAdd = () => {
    setForm(FORM_INIT);
    setEditId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (g) => {
    setForm({
      nama:          g.nama          || "",
      jabatan:       g.jabatan       || "",
      nomor_hp:      g.nomor_hp      || "",
      email:         g.email         || "",
      alamat:        g.alamat        || "",
      tanggal_masuk: g.tanggal_masuk ? String(g.tanggal_masuk).slice(0, 10) : "",
      status:        g.status        || "Aktif",
      catatan:       g.catatan       || "",
    });
    setEditId(g.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(FORM_INIT);
  };

  // ============================================================
  // SIMPAN (Tambah / Edit)
  // ============================================================

  const handleSimpan = async () => {
    if (!form.nama.trim()) {
      alert("Nama guru wajib diisi.");
      return;
    }
    try {
      if (editId) {
        await api.put(`/guru/${editId}`, form);
      } else {
        await api.post("/guru", form);
      }
      closeForm();
      getGuru(search);
    } catch (err) {
      alert("Gagal menyimpan: " + (err.response?.data?.error || err.message));
    }
  };

  // ============================================================
  // TOGGLE STATUS — tidak hapus data historis
  // ============================================================

  const handleToggleStatus = async (g) => {
    const newStatus = g.status === "Aktif" ? "Nonaktif" : "Aktif";
    const label     = newStatus === "Nonaktif" ? "Nonaktifkan" : "Aktifkan kembali";
    if (!window.confirm(`${label} guru "${g.nama}"?`)) return;

    try {
      await api.put(`/guru/${g.id}`, {
        nama:          g.nama,
        jabatan:       g.jabatan       || "",
        nomor_hp:      g.nomor_hp      || "",
        email:         g.email         || "",
        alamat:        g.alamat        || "",
        tanggal_masuk: g.tanggal_masuk ? String(g.tanggal_masuk).slice(0, 10) : "",
        status:        newStatus,
        catatan:       g.catatan       || "",
      });
      getGuru(search);
    } catch (err) {
      alert("Gagal mengubah status: " + (err.response?.data?.error || err.message));
    }
  };

  // ============================================================
  // HAPUS FISIK — superadmin only
  // ============================================================

  const handleHapus = async (g) => {
    if (!window.confirm(
      `HAPUS PERMANEN guru "${g.nama}"?\n\nPeringatan: Aksi ini tidak dapat dibatalkan.\nGunakan "Nonaktifkan" jika ingin mempertahankan riwayat.`
    )) return;

    try {
      await api.delete(`/guru/${g.id}`);
      getGuru(search);
    } catch (err) {
      alert("Gagal menghapus: " + (err.response?.data?.error || err.message));
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={{ display: "flex", background: "#f5f7fb", minHeight: "100vh" }}>
      <Sidebar />

      <div style={{ marginLeft: "240px", width: "calc(100% - 240px)", padding: "28px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Master Guru
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0" }}>
            Kelola data guru dan tenaga pendidik pesantren
          </p>
        </div>

        {/* TOOLBAR */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Cari nama, jabatan, atau email..."
            value={search}
            onChange={handleSearch}
            style={searchStyle}
          />
          <button onClick={openAdd} style={btnPrimaryStyle}>
            + Tambah Guru
          </button>
        </div>

        {/* ======================================================
            FORM TAMBAH / EDIT
        ====================================================== */}
        {showForm && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: "0 0 18px" }}>
              {editId ? "Edit Data Guru" : "Tambah Guru Baru"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

              {/* Nama */}
              <div>
                <label style={labelStyle}>
                  Nama Lengkap <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Nama lengkap guru"
                  style={inputStyle}
                />
              </div>

              {/* Jabatan */}
              <div>
                <label style={labelStyle}>Jabatan / Mata Pelajaran</label>
                <input
                  name="jabatan"
                  value={form.jabatan}
                  onChange={handleChange}
                  placeholder="Contoh: Wali Kelas, Guru Tahfidz"
                  style={inputStyle}
                />
              </div>

              {/* Nomor HP */}
              <div>
                <label style={labelStyle}>Nomor HP</label>
                <input
                  name="nomor_hp"
                  value={form.nomor_hp}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="guru@pesantren.id"
                  style={inputStyle}
                />
              </div>

              {/* Tanggal Masuk */}
              <div>
                <label style={labelStyle}>Tanggal Masuk</label>
                <input
                  type="date"
                  name="tanggal_masuk"
                  value={form.tanggal_masuk}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              {/* Status */}
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* Alamat — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Alamat</label>
                <textarea
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  placeholder="Alamat lengkap"
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Catatan — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Catatan</label>
                <textarea
                  name="catatan"
                  value={form.catatan}
                  onChange={handleChange}
                  placeholder="Catatan tambahan (opsional)"
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button onClick={handleSimpan} style={btnPrimaryStyle}>
                {editId ? "Simpan Perubahan" : "Simpan"}
              </button>
              <button onClick={closeForm} style={btnSecondaryStyle}>
                Batal
              </button>
            </div>
          </div>
        )}

        {/* ======================================================
            TABEL
        ====================================================== */}
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama</th>
                <th style={thStyle}>Jabatan</th>
                <th style={thStyle}>Nomor HP</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Tgl Masuk</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {guru.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}
                  >
                    {search
                      ? `Tidak ada guru yang cocok dengan pencarian "${search}".`
                      : 'Belum ada data guru. Klik "+ Tambah Guru" untuk memulai.'}
                  </td>
                </tr>
              ) : (
                guru.map((g, idx) => (
                  <tr
                    key={g.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background:   editId === g.id ? "#f0fdf4" : "white",
                      opacity:      g.status === "Nonaktif" ? 0.65 : 1,
                    }}
                  >
                    <td style={{ ...tdStyle, color: "#94a3b8", width: "44px" }}>{idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{g.nama}</td>
                    <td style={tdStyle}>{g.jabatan || <Dash />}</td>
                    <td style={tdStyle}>{g.nomor_hp || <Dash />}</td>
                    <td style={tdStyle}>{g.email    || <Dash />}</td>
                    <td style={tdStyle}>
                      {g.tanggal_masuk
                        ? new Date(g.tanggal_masuk).toLocaleDateString("id-ID", {
                            day:   "2-digit",
                            month: "short",
                            year:  "numeric",
                          })
                        : <Dash />}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={g.status} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>

                      {/* Edit — semua role */}
                      <button
                        onClick={() => openEdit(g)}
                        style={btnEditStyle}
                        title="Edit data guru"
                      >
                        Edit
                      </button>

                      {/* Toggle status — semua role */}
                      {g.status === "Aktif" ? (
                        <button
                          onClick={() => handleToggleStatus(g)}
                          style={btnNonaktifStyle}
                          title="Nonaktifkan guru (data historis tetap tersimpan)"
                        >
                          Nonaktifkan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(g)}
                          style={btnAktifkanStyle}
                          title="Aktifkan kembali guru"
                        >
                          Aktifkan
                        </button>
                      )}

                      {/* Hapus fisik — superadmin only */}
                      {role === "superadmin" && (
                        <button
                          onClick={() => handleHapus(g)}
                          style={btnHapusStyle}
                          title="Hapus permanen (tidak dapat dibatalkan)"
                        >
                          Hapus
                        </button>
                      )}

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: "10px", color: "#94a3b8", fontSize: "13px" }}>
          {guru.filter((g) => g.status === "Aktif").length} aktif
          {" · "}
          {guru.filter((g) => g.status === "Nonaktif").length} nonaktif
          {" · "}
          Total {guru.length} guru
          {search ? ` untuk pencarian "${search}"` : ""}
        </p>

      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN KECIL
// ============================================================

function Dash() {
  return <span style={{ color: "#cbd5e1" }}>—</span>;
}

function StatusBadge({ status }) {
  const isAktif = status === "Aktif";
  return (
    <span
      style={{
        display:      "inline-block",
        padding:      "3px 12px",
        borderRadius: "20px",
        fontSize:     "12px",
        fontWeight:   600,
        background:   isAktif ? "#dcfce7" : "#f1f5f9",
        color:        isAktif ? "#15803d" : "#64748b",
      }}
    >
      {status}
    </span>
  );
}

// ============================================================
// STYLES
// ============================================================

const cardStyle = {
  background:   "white",
  borderRadius: "12px",
  padding:      "20px",
  marginBottom: "20px",
  boxShadow:    "0 1px 4px rgba(0,0,0,.06)",
};

const searchStyle = {
  padding:      "9px 14px",
  borderRadius: "8px",
  border:       "1px solid #d1d5db",
  fontSize:     "14px",
  width:        "340px",
  outline:      "none",
};

const labelStyle = {
  display:      "block",
  fontSize:     "13px",
  fontWeight:   500,
  marginBottom: "5px",
  color:        "#374151",
};

const inputStyle = {
  width:        "100%",
  padding:      "9px 10px",
  borderRadius: "8px",
  border:       "1px solid #d1d5db",
  boxSizing:    "border-box",
  fontSize:     "14px",
  outline:      "none",
};

const thStyle = {
  padding:       "11px 14px",
  textAlign:     "left",
  fontSize:      "12px",
  fontWeight:    600,
  color:         "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom:  "1px solid #e2e8f0",
  whiteSpace:    "nowrap",
};

const tdStyle = {
  padding:       "11px 14px",
  fontSize:      "14px",
  color:         "#1e293b",
  verticalAlign: "middle",
};

const btnPrimaryStyle = {
  padding:      "9px 20px",
  background:   "#0F766E",
  color:        "white",
  border:       "none",
  borderRadius: "8px",
  cursor:       "pointer",
  fontWeight:   600,
  fontSize:     "14px",
};

const btnSecondaryStyle = {
  padding:      "9px 20px",
  background:   "#f1f5f9",
  color:        "#475569",
  border:       "none",
  borderRadius: "8px",
  cursor:       "pointer",
  fontSize:     "14px",
};

const btnEditStyle = {
  padding:      "4px 12px",
  background:   "#eff6ff",
  color:        "#2563eb",
  border:       "none",
  borderRadius: "6px",
  cursor:       "pointer",
  fontWeight:   500,
  fontSize:     "12px",
  marginRight:  "5px",
};

const btnNonaktifStyle = {
  padding:      "4px 12px",
  background:   "#fffbeb",
  color:        "#d97706",
  border:       "none",
  borderRadius: "6px",
  cursor:       "pointer",
  fontWeight:   500,
  fontSize:     "12px",
  marginRight:  "5px",
};

const btnAktifkanStyle = {
  padding:      "4px 12px",
  background:   "#f0fdf4",
  color:        "#15803d",
  border:       "none",
  borderRadius: "6px",
  cursor:       "pointer",
  fontWeight:   500,
  fontSize:     "12px",
  marginRight:  "5px",
};

const btnHapusStyle = {
  padding:      "4px 12px",
  background:   "#fef2f2",
  color:        "#dc2626",
  border:       "none",
  borderRadius: "6px",
  cursor:       "pointer",
  fontWeight:   500,
  fontSize:     "12px",
};

export default GuruPage;
