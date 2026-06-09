import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const PRIORITAS_OPTIONS = [
  { value: "normal",  label: "Normal",  color: "#6b7280" },
  { value: "penting", label: "Penting", color: "#d97706" },
  { value: "urgent",  label: "Urgent",  color: "#e53e3e" },
];

function prioritasColor(p) {
  return PRIORITAS_OPTIONS.find((o) => o.value === p)?.color ?? "#6b7280";
}

function prioritasLabel(p) {
  return PRIORITAS_OPTIONS.find((o) => o.value === p)?.label ?? "Normal";
}

function formatDt(dt) {
  if (!dt) return "-";
  return new Date(dt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const EMPTY_FORM = {
  judul: "",
  isi: "",
  prioritas: "normal",
  expires_at: "",
  is_active: true,
};

function PengumumanPage() {

  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // ======================
  // GET
  // ======================

  const getList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pengumuman");
      setList(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getList(); }, []);

  // ======================
  // SAVE (CREATE / UPDATE)
  // ======================

  const save = async () => {
    if (!form.judul.trim() || !form.isi.trim()) {
      alert("Judul dan isi wajib diisi.");
      return;
    }
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at || null,
      };
      if (editId) {
        await api.put(`/pengumuman/${editId}`, payload);
      } else {
        await api.post("/pengumuman", payload);
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setFormOpen(false);
      getList();
    } catch (err) {
      console.log(err);
      alert("Gagal menyimpan pengumuman.");
    }
  };

  // ======================
  // EDIT
  // ======================

  const startEdit = (item) => {
    setForm({
      judul: item.judul,
      isi: item.isi,
      prioritas: item.prioritas ?? "normal",
      expires_at: item.expires_at
        ? item.expires_at.split("T")[0]
        : "",
      is_active: item.is_active,
    });
    setEditId(item.id);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ======================
  // TOGGLE ACTIVE
  // ======================

  const toggleActive = async (item) => {
    try {
      await api.put(`/pengumuman/${item.id}`, {
        is_active: !item.is_active,
      });
      getList();
    } catch (err) {
      console.log(err);
      alert("Gagal mengubah status.");
    }
  };

  // ======================
  // DELETE
  // ======================

  const remove = async (id) => {
    if (!window.confirm("Hapus pengumuman ini?")) return;
    try {
      await api.delete(`/pengumuman/${id}`);
      getList();
    } catch (err) {
      console.log(err);
      alert("Gagal menghapus.");
    }
  };

  // ======================
  // CANCEL
  // ======================

  const cancel = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormOpen(false);
  };

  const filtered = list.filter((p) =>
    p.judul?.toLowerCase().includes(search.toLowerCase()) ||
    p.isi?.toLowerCase().includes(search.toLowerCase())
  );

  // ======================
  // RENDER
  // ======================

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fb" }}>

      <Sidebar />

      <div style={{
        marginLeft: "240px",
        width: "calc(100% - 240px)",
        padding: "24px",
        boxSizing: "border-box",
      }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>📢 Pengumuman</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "13px" }}>
              Kelola pengumuman yang tampil di APK Wali Santri.
            </p>
          </div>
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              style={btnStyle("#1a7f5a")}
            >
              + Tambah Pengumuman
            </button>
          )}
        </div>

        {/* ── Form ── */}
        {formOpen && (
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>
              {editId ? "✏️ Edit Pengumuman" : "➕ Tambah Pengumuman"}
            </h3>

            <label style={labelStyle}>Judul *</label>
            <input
              style={inputStyle}
              placeholder="Judul pengumuman"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              maxLength={200}
            />

            <label style={labelStyle}>Isi *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
              placeholder="Isi pengumuman secara lengkap..."
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={labelStyle}>Prioritas</label>
                <select
                  style={inputStyle}
                  value={form.prioritas}
                  onChange={(e) => setForm({ ...form, prioritas: e.target.value })}
                >
                  {PRIORITAS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={labelStyle}>Berlaku Hingga (opsional)</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>

              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={labelStyle}>Status</label>
                <select
                  style={inputStyle}
                  value={form.is_active ? "1" : "0"}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.value === "1" })
                  }
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={save} style={btnStyle("#1a7f5a")}>
                {editId ? "Simpan Perubahan" : "Buat Pengumuman"}
              </button>
              <button onClick={cancel} style={btnStyle("#6b7280")}>
                Batal
              </button>
            </div>
          </div>
        )}

        {/* ── Search ── */}
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            style={{ ...inputStyle, width: "300px", margin: 0 }}
            placeholder="Cari judul atau isi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            {filtered.length} pengumuman
          </span>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <p style={{ color: "#9ca3af" }}>Memuat data...</p>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Judul", "Prioritas", "Status", "Dibuat", "Berlaku Hingga", "Aksi"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                      Tidak ada pengumuman.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: "1px solid #f3f4f6", opacity: item.is_active ? 1 : 0.5 }}
                    >
                      <td style={tdStyle}>
                        <div
                          style={{ fontWeight: 600, cursor: "pointer", color: "#1a7f5a" }}
                          onClick={() => setPreviewItem(item)}
                          title="Klik untuk preview isi"
                        >
                          {item.judul}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                          {item.isi?.slice(0, 60)}{item.isi?.length > 60 ? "…" : ""}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(prioritasColor(item.prioritas))}>
                          {prioritasLabel(item.prioritas)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(item.is_active ? "#16a34a" : "#9ca3af")}>
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td style={tdStyle}>{formatDt(item.published_at ?? item.created_at)}</td>
                      <td style={tdStyle}>{formatDt(item.expires_at)}</td>
                      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => startEdit(item)}
                          style={{ ...smallBtn, background: "#2563eb" }}
                        >
                          Edit
                        </button>
                        {" "}
                        <button
                          onClick={() => toggleActive(item)}
                          style={{ ...smallBtn, background: item.is_active ? "#d97706" : "#16a34a" }}
                        >
                          {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        {" "}
                        <button
                          onClick={() => remove(item.id)}
                          style={{ ...smallBtn, background: "#e53e3e" }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Preview Modal ── */}
        {previewItem && (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setPreviewItem(null)}
          >
            <div
              style={{
                background: "white", borderRadius: "16px", padding: "28px",
                maxWidth: "600px", width: "90%", maxHeight: "80vh",
                overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={badgeStyle(prioritasColor(previewItem.prioritas))}>
                  {prioritasLabel(previewItem.prioritas)}
                </span>
                <button
                  onClick={() => setPreviewItem(null)}
                  style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#9ca3af" }}
                >
                  ✕
                </button>
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>{previewItem.judul}</h2>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 16px" }}>
                {formatDt(previewItem.published_at ?? previewItem.created_at)}
                {previewItem.expires_at ? ` · Berlaku s/d ${formatDt(previewItem.expires_at)}` : ""}
              </p>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#374151", whiteSpace: "pre-wrap" }}>
                {previewItem.isi}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

function btnStyle(bg) {
  return {
    background: bg, color: "white", border: "none",
    padding: "10px 18px", borderRadius: "8px",
    cursor: "pointer", fontSize: "14px", fontWeight: 600,
  };
}

const cardStyle = {
  background: "white", padding: "24px", borderRadius: "12px",
  marginBottom: "20px", border: "1px solid #e5e7eb",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

const labelStyle = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "#374151", marginBottom: "6px", marginTop: "12px",
};

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: "8px",
  border: "1px solid #d1d5db", fontSize: "14px",
  boxSizing: "border-box", outline: "none",
  fontFamily: "inherit",
};

const thStyle = {
  padding: "12px 16px", textAlign: "left",
  fontSize: "12px", fontWeight: 700,
  color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em",
};

const tdStyle = {
  padding: "12px 16px", fontSize: "14px", color: "#374151",
  verticalAlign: "top",
};

const smallBtn = {
  color: "white", border: "none", padding: "5px 10px",
  borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
};

function badgeStyle(color) {
  return {
    display: "inline-block", padding: "3px 10px", borderRadius: "99px",
    fontSize: "11px", fontWeight: 700, background: color + "22", color,
  };
}

export default PengumumanPage;
