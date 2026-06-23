import { useCallback, useEffect, useState } from "react";
import platformApi from "../../services/platformApi";
import Badge from "../../components/ui/Badge";
import PlatformButton from "../../components/platform/PlatformButton";
import Card from "../../components/ui/Card";
import Modal from "../../components/Modal";
import SectionHeading from "../../components/ui/SectionHeading";
import { formatDateShort } from "../../utils/formatDate";

const EMPTY_FORM = {
  title: "",
  body: "",
  video_url: "",
  status: "draft",
};

function PlatformAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await platformApi.get("/platform/announcements");
      setItems(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memuat pengumuman platform");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      body: item.body || "",
      video_url: item.video_url || "",
      status: item.status || "draft",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await platformApi.patch(`/platform/announcements/${editingId}`, form);
      } else {
        await platformApi.post("/platform/announcements", form);
      }
      setModalOpen(false);
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menyimpan pengumuman");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>Pengumuman Platform</h1>
          <p style={pageSubtitleStyle}>
            Informasi dan tutorial dari owner KlikSantri untuk semua admin pesantren.
          </p>
        </div>
        <PlatformButton variant="primary" onClick={openCreate}>
          Buat Pengumuman
        </PlatformButton>
      </div>

      {error ? <div style={errorStyle}>{error}</div> : null}

      <Card padding="md" shadow="card" radius="xl">
        <SectionHeading spacing="first" variant="divider">
          Daftar Pengumuman
        </SectionHeading>

        {loading ? (
          <p style={mutedStyle}>Memuat...</p>
        ) : items.length === 0 ? (
          <p style={mutedStyle}>Belum ada pengumuman.</p>
        ) : (
          <div style={listStyle}>
            {items.map((item) => (
              <div key={item.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={rowTitleStyle}>{item.title}</div>
                  <div style={rowMetaStyle}>
                    <Badge variant={item.status === "published" ? "success" : "neutral"}>
                      {item.status}
                    </Badge>
                    <span>Diperbarui {formatDateShort(item.updated_at)}</span>
                  </div>
                  <p style={rowBodyStyle}>{item.body}</p>
                </div>
                <PlatformButton variant="secondary" size="sm" onClick={() => openEdit(item)}>
                  Edit
                </PlatformButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit Pengumuman" : "Buat Pengumuman"}
        onClose={closeModal}
      >
        <div style={formStyle}>
          <label style={labelStyle}>
            Judul
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>
          <label style={labelStyle}>
            Isi
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
            />
          </label>
          <label style={labelStyle}>
            Video URL (opsional)
            <input
              style={inputStyle}
              value={form.video_url}
              onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
            />
          </label>
          <label style={labelStyle}>
            Status
            <select
              style={inputStyle}
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>
          <div style={actionsStyle}>
            <PlatformButton variant="secondary" onClick={closeModal} disabled={saving}>
              Batal
            </PlatformButton>
            <PlatformButton variant="primary" onClick={handleSave} loading={saving}>
              Simpan
            </PlatformButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20,
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "28px",
  fontWeight: 800,
  color: "var(--text-primary)",
};

const pageSubtitleStyle = {
  margin: "8px 0 0",
  color: "var(--text-secondary)",
  fontSize: "14px",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginTop: 8,
};

const rowStyle = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: "14px 0",
  borderBottom: "1px solid var(--border)",
};

const rowTitleStyle = {
  fontSize: "16px",
  fontWeight: 700,
  color: "var(--text-primary)",
};

const rowMetaStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 6,
  fontSize: "12px",
  color: "var(--text-secondary)",
};

const rowBodyStyle = {
  margin: "8px 0 0",
  fontSize: "14px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-secondary)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-primary)",
  fontSize: "14px",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const errorStyle = {
  marginBottom: 16,
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  background: "var(--danger-subtle)",
  color: "var(--danger)",
  fontWeight: 600,
};

const mutedStyle = {
  color: "var(--text-secondary)",
  fontSize: "14px",
};

export default PlatformAnnouncementsPage;
