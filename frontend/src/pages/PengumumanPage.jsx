import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaImage,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button, { actionBarStyle } from "../components/ui/Button";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 675;
const COVER_RATIO = 16 / 9;

const PRIORITAS_OPTIONS = [
  { value: "normal", label: "Normal", variant: "neutral" },
  { value: "penting", label: "Penting", variant: "warning" },
  { value: "urgent", label: "Urgent", variant: "danger" },
];

function prioritasMeta(p) {
  return PRIORITAS_OPTIONS.find((o) => o.value === p) ?? PRIORITAS_OPTIONS[0];
}

function formatDt(dt) {
  if (!dt) return "-";
  return new Date(dt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function itemTimestamp(item) {
  return new Date(item.published_at ?? item.created_at ?? 0).getTime();
}

async function processCoverImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        let sx = 0;
        let sy = 0;
        let sw = width;
        let sh = height;
        const ratio = width / height;

        if (ratio > COVER_RATIO) {
          sw = height * COVER_RATIO;
          sx = (width - sw) / 2;
        } else if (ratio < COVER_RATIO) {
          sh = width / COVER_RATIO;
          sy = (height - sh) / 2;
        }

        canvas.width = COVER_WIDTH;
        canvas.height = COVER_HEIGHT;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, COVER_WIDTH, COVER_HEIGHT);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  judul: "",
  isi: "",
  cover_url: "",
  prioritas: "normal",
  expires_at: "",
  is_active: true,
};

function PengumumanPageStyles() {
  return (
    <style>{`
      .pengumuman-page {
        min-width: 0;
        max-width: 100%;
      }

      .pengumuman-cover {
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: var(--radius-xl);
        overflow: hidden;
        background: #e2e8f0;
      }

      .pengumuman-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .pengumuman-cover--thumb {
        border-radius: var(--radius-lg);
      }

      .pengumuman-cover--hero {
        border-radius: var(--radius-xl);
      }

      .pengumuman-cover-placeholder {
        width: 100%;
        height: 100%;
        min-height: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--text-muted);
        background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 48%, #0d9488 100%);
      }

      .pengumuman-cover-placeholder span {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        opacity: 0.85;
        color: rgba(255, 255, 255, 0.75);
      }

      .pengumuman-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .pengumuman-hero {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        overflow: hidden;
        box-shadow: var(--shadow-card);
      }

      .pengumuman-hero-body {
        padding: var(--space-5) var(--space-6);
      }

      .pengumuman-hero-title {
        margin: 0;
        font-size: clamp(1.35rem, 2.5vw, 1.75rem);
        font-weight: 800;
        line-height: 1.25;
        color: var(--text-primary);
        cursor: pointer;
      }

      .pengumuman-hero-preview {
        margin: var(--space-3) 0 0;
        font-size: 15px;
        line-height: 1.65;
        color: var(--text-secondary);
      }

      .pengumuman-feed-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-top: var(--space-6);
      }

      .pengumuman-feed-item {
        display: grid;
        grid-template-columns: minmax(0, 220px) minmax(0, 1fr) auto;
        gap: var(--space-4);
        align-items: start;
        padding: var(--space-4);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
      }

      .pengumuman-feed-item--inactive {
        opacity: 0.72;
      }

      .pengumuman-feed-thumb {
        cursor: pointer;
      }

      .pengumuman-feed-title {
        margin: 0;
        font-size: 17px;
        font-weight: 800;
        line-height: 1.35;
        color: var(--text-primary);
        cursor: pointer;
      }

      .pengumuman-feed-preview {
        margin: var(--space-2) 0 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-secondary);
      }

      .pengumuman-feed-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
      }

      .pengumuman-feed-date {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .pengumuman-icon-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: flex-start;
        justify-content: flex-end;
      }

      .pengumuman-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--text-secondary);
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }

      .pengumuman-icon-btn:hover {
        background: var(--neutral-subtle);
        color: var(--text-primary);
        border-color: #cbd5e1;
      }

      .pengumuman-icon-btn--danger:hover {
        background: #fef2f2;
        color: var(--danger);
        border-color: #fecaca;
      }

      .pengumuman-filter-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .pengumuman-filter-pill {
        padding: 8px 14px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--surface);
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }

      .pengumuman-filter-pill--active {
        background: var(--primary);
        border-color: var(--primary);
        color: #fff;
      }

      .pengumuman-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-5);
      }

      .pengumuman-toolbar-search {
        flex: 1 1 240px;
        min-width: 0;
        max-width: 420px;
      }

      .pengumuman-read-modal {
        background: var(--surface);
        border-radius: var(--radius-xl);
        width: 100%;
        max-width: 760px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
      }

      .pengumuman-read-body {
        padding: var(--space-6);
      }

      .pengumuman-read-title {
        margin: var(--space-4) 0 var(--space-3);
        font-size: clamp(1.35rem, 3vw, 1.875rem);
        font-weight: 800;
        line-height: 1.25;
        color: var(--text-primary);
      }

      .pengumuman-read-content {
        margin: var(--space-4) 0 0;
        font-size: 15px;
        line-height: 1.75;
        color: var(--text-primary);
        white-space: pre-wrap;
      }

      .pengumuman-read-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;
        box-sizing: border-box;
      }

      @media (max-width: 767px) {
        .pengumuman-feed-item {
          grid-template-columns: 1fr;
        }

        .pengumuman-icon-actions {
          justify-content: flex-start;
        }

        .pengumuman-hero-body {
          padding: var(--space-4);
        }

        .pengumuman-read-body {
          padding: var(--space-4);
        }

        .pengumuman-toolbar-search {
          max-width: none;
          flex: 1 1 100%;
        }
      }
    `}</style>
  );
}

function CoverPlaceholder({ compact = false }) {
  return (
    <div className="pengumuman-cover-placeholder">
      <FaImage style={{ fontSize: compact ? "22px" : "28px", opacity: 0.7, color: "#fff" }} />
      <span>Pengumuman Pesantren</span>
    </div>
  );
}

function AnnouncementCover({
  coverUrl,
  variant = "hero",
  onClick,
  className = "",
}) {
  const coverClass = `pengumuman-cover pengumuman-cover--${variant} ${className}`.trim();

  return (
    <div
      className={coverClass}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {coverUrl ? (
        <img src={coverUrl} alt="" />
      ) : (
        <CoverPlaceholder compact={variant === "thumb"} />
      )}
    </div>
  );
}

function IconAction({ label, onClick, danger = false, children }) {
  return (
    <button
      type="button"
      className={`pengumuman-icon-btn${danger ? " pengumuman-icon-btn--danger" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CardActions({ item, onPreview, onEdit, onToggle, onRemove }) {
  return (
    <div className="pengumuman-icon-actions">
      <IconAction label="Baca" onClick={() => onPreview(item)}>
        <FaEye size={14} />
      </IconAction>
      <IconAction label="Edit" onClick={() => onEdit(item)}>
        <FaEdit size={14} />
      </IconAction>
      <IconAction label={item.is_active ? "Nonaktifkan" : "Aktifkan"} onClick={() => onToggle(item)}>
        {item.is_active ? <FaToggleOn size={15} /> : <FaToggleOff size={15} />}
      </IconAction>
      <IconAction label="Hapus" danger onClick={() => onRemove(item.id)}>
        <FaTrash size={13} />
      </IconAction>
    </div>
  );
}

function FeaturedHero({ item, onPreview, onEdit, onToggle, onRemove }) {
  const prioritas = prioritasMeta(item.prioritas);

  return (
    <article className="pengumuman-hero">
      <AnnouncementCover
        coverUrl={item.cover_url}
        variant="hero"
        onClick={() => onPreview(item)}
      />
      <div className="pengumuman-hero-body">
        <div className="pengumuman-feed-meta">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <Badge variant="success" size="sm">
              Terbaru
            </Badge>
            <Badge variant={prioritas.variant} size="sm">
              {prioritas.label}
            </Badge>
            <Badge variant={item.is_active ? "success" : "neutral"} size="sm">
              {item.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <time className="pengumuman-feed-date">
            {formatDt(item.published_at ?? item.created_at)}
          </time>
        </div>

        <h2 className="pengumuman-hero-title" onClick={() => onPreview(item)}>
          {item.judul}
        </h2>

        <p className="pengumuman-hero-preview pengumuman-clamp-3">{item.isi}</p>

        {item.expires_at && (
          <p style={{ margin: "var(--space-2) 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            Berlaku s/d {formatDt(item.expires_at)}
          </p>
        )}

        <div style={{ ...actionBarStyle, marginTop: "var(--space-4)", justifyContent: "flex-start" }}>
          <CardActions
            item={item}
            onPreview={onPreview}
            onEdit={onEdit}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        </div>
      </div>
    </article>
  );
}

function FeedListItem({ item, onPreview, onEdit, onToggle, onRemove }) {
  const prioritas = prioritasMeta(item.prioritas);

  return (
    <article
      className={`pengumuman-feed-item${item.is_active ? "" : " pengumuman-feed-item--inactive"}`}
    >
      <div className="pengumuman-feed-thumb">
        <AnnouncementCover
          coverUrl={item.cover_url}
          variant="thumb"
          onClick={() => onPreview(item)}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        <div className="pengumuman-feed-meta">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <Badge variant={prioritas.variant} size="sm">
              {prioritas.label}
            </Badge>
            <Badge variant={item.is_active ? "success" : "neutral"} size="sm">
              {item.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <time className="pengumuman-feed-date">
            {formatDt(item.published_at ?? item.created_at)}
          </time>
        </div>

        <h3 className="pengumuman-feed-title" onClick={() => onPreview(item)}>
          {item.judul}
        </h3>

        <p className="pengumuman-feed-preview pengumuman-clamp-3">{item.isi}</p>

        {item.expires_at && (
          <p style={{ margin: "var(--space-2) 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            Berlaku s/d {formatDt(item.expires_at)}
          </p>
        )}
      </div>

      <CardActions
        item={item}
        onPreview={onPreview}
        onEdit={onEdit}
        onToggle={onToggle}
        onRemove={onRemove}
      />
    </article>
  );
}

function ReadArticleModal({ item, onClose }) {
  if (!item) return null;

  const prioritas = prioritasMeta(item.prioritas);

  return (
    <div className="pengumuman-read-overlay" onClick={onClose}>
      <article className="pengumuman-read-modal" onClick={(e) => e.stopPropagation()}>
        <AnnouncementCover coverUrl={item.cover_url} variant="hero" />
        <div className="pengumuman-read-body">
          <div className="pengumuman-feed-meta">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <Badge variant={prioritas.variant}>{prioritas.label}</Badge>
              <Badge variant={item.is_active ? "success" : "neutral"}>
                {item.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <time className="pengumuman-feed-date">
              {formatDt(item.published_at ?? item.created_at)}
            </time>
          </div>

          <h1 className="pengumuman-read-title">{item.judul}</h1>

          {item.expires_at && (
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
              Berlaku s/d {formatDt(item.expires_at)}
            </p>
          )}

          <div className="pengumuman-read-content">{item.isi}</div>

          <div style={{ ...actionBarStyle, marginTop: "var(--space-5)" }}>
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}

function PengumumanPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    getList();
  }, []);

  const save = async () => {
    if (!form.judul.trim() || !form.isi.trim()) {
      alert("Judul dan isi wajib diisi.");
      return;
    }
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at || null,
        cover_url: form.cover_url || null,
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

  const startEdit = (item) => {
    setForm({
      judul: item.judul,
      isi: item.isi,
      cover_url: item.cover_url || "",
      prioritas: item.prioritas ?? "normal",
      expires_at: item.expires_at ? item.expires_at.split("T")[0] : "",
      is_active: item.is_active,
    });
    setEditId(item.id);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const cancel = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormOpen(false);
  };

  const handleCoverPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar.");
      return;
    }
    try {
      setCoverUploading(true);
      const dataUrl = await processCoverImage(file);
      setForm((prev) => ({ ...prev, cover_url: dataUrl }));
    } catch (err) {
      console.log(err);
      alert("Gagal memproses gambar cover.");
    } finally {
      setCoverUploading(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: list.length,
      aktif: list.filter((p) => p.is_active).length,
      prioritasTinggi: list.filter(
        (p) => p.prioritas === "urgent" || p.prioritas === "penting",
      ).length,
    }),
    [list],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...list]
      .filter((p) => {
        const matchesSearch =
          !q ||
          p.judul?.toLowerCase().includes(q) ||
          p.isi?.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && p.is_active) ||
          (statusFilter === "inactive" && !p.is_active);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => itemTimestamp(b) - itemTimestamp(a));
  }, [list, search, statusFilter]);

  const featuredItem = filtered[0] ?? null;
  const feedItems = filtered.slice(1);

  return (
    <AppShell
      title="Pengumuman"
      description="Kelola pengumuman yang tampil di APK Wali Santri."
      breadcrumb="Sistem / Pengumuman"
    >
      <PengumumanPageStyles />
      <div className="pengumuman-page">
        {!formOpen && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <KpiGrid minColumnWidth={180} gap={16}>
              <KpiCard layout="metric" label="Total Pengumuman" value={stats.total} accent="teal" />
              <KpiCard layout="metric" label="Aktif" value={stats.aktif} accent="success" />
              <KpiCard
                layout="metric"
                label="Prioritas Tinggi"
                value={stats.prioritasTinggi}
                accent="danger"
              />
            </KpiGrid>
          </div>
        )}

        {!formOpen && (
          <div className="pengumuman-toolbar">
            <div className="pengumuman-toolbar-search">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau isi pengumuman..."
              />
            </div>
            <div className="pengumuman-filter-pills">
              {[
                { key: "all", label: "Semua" },
                { key: "active", label: "Aktif" },
                { key: "inactive", label: "Nonaktif" },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  className={`pengumuman-filter-pill${
                    statusFilter === pill.key ? " pengumuman-filter-pill--active" : ""
                  }`}
                  onClick={() => setStatusFilter(pill.key)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
            <Button type="button" variant="primary" onClick={() => setFormOpen(true)}>
              + Buat Pengumuman
            </Button>
          </div>
        )}

        {formOpen && (
          <Card padding="md" shadow="card" border={false} radius="xl">
            <p style={formEyebrowStyle}>{editId ? "Edit Pengumuman" : "Pengumuman Baru"}</p>

            <label style={labelStyle}>Cover Image</label>
            <p style={hintStyle}>Rasio 16:9 · direkomendasikan 1200 × 675 px</p>
            <div style={coverEditorStyle}>
              <AnnouncementCover coverUrl={form.cover_url} variant="hero" />
              <div style={coverActionsStyle}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleCoverPick}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={coverUploading}
                >
                  {coverUploading ? "Memproses..." : form.cover_url ? "Ganti Cover" : "Upload Cover"}
                </Button>
                {form.cover_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, cover_url: "" })}
                  >
                    Hapus Cover
                  </Button>
                )}
              </div>
            </div>

            <label style={labelStyle}>Judul *</label>
            <input
              style={inputStyle}
              placeholder="Judul pengumuman"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              maxLength={200}
            />

            <label style={labelStyle}>Isi Pengumuman *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
              placeholder="Tulis informasi pesantren, kegiatan, agenda, atau pengumuman penting..."
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
            />

            <details style={advancedWrapStyle}>
              <summary style={advancedSummaryStyle}>Pengaturan lanjutan</summary>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "12px" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={labelStyle}>Prioritas</label>
                  <select
                    style={inputStyle}
                    value={form.prioritas}
                    onChange={(e) => setForm({ ...form, prioritas: e.target.value })}
                  >
                    {PRIORITAS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
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
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              </div>
            </details>

            <div style={{ ...actionBarStyle, marginTop: "var(--space-5)" }}>
              <Button type="button" variant="primary" onClick={save}>
                {editId ? "Simpan Perubahan" : "Simpan Pengumuman"}
              </Button>
              <Button type="button" variant="outline" onClick={cancel}>
                Batal
              </Button>
            </div>
          </Card>
        )}

        <div style={{ marginTop: formOpen ? "var(--space-6)" : 0 }}>
          <div style={feedHeaderStyle}>
            <div>
              <h2 style={feedTitleStyle}>Portal Berita Pesantren</h2>
              <p style={feedSubtitleStyle}>
                Feed informasi modern — siap ditampilkan di APK Wali Santri
              </p>
            </div>
            <span style={feedCountStyle}>{filtered.length} pengumuman</span>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-4)" }}>Memuat feed...</p>
          ) : filtered.length === 0 ? (
            <Card padding="none" shadow="card" border={false} radius="xl">
              <EmptyState
                title={list.length === 0 ? "Belum ada pengumuman" : "Tidak ada hasil pencarian"}
                description={
                  list.length === 0
                    ? "Buat pengumuman pertama untuk membagikan informasi ke wali santri."
                    : "Coba kata kunci lain atau ubah filter status."
                }
                action={
                  list.length === 0 && !formOpen ? (
                    <Button type="button" variant="primary" onClick={() => setFormOpen(true)}>
                      + Buat Pengumuman Pertama
                    </Button>
                  ) : null
                }
              />
            </Card>
          ) : (
            <>
              {featuredItem && (
                <FeaturedHero
                  item={featuredItem}
                  onPreview={setPreviewItem}
                  onEdit={startEdit}
                  onToggle={toggleActive}
                  onRemove={remove}
                />
              )}

              {feedItems.length > 0 && (
                <div className="pengumuman-feed-list">
                  {feedItems.map((item) => (
                    <FeedListItem
                      key={item.id}
                      item={item}
                      onPreview={setPreviewItem}
                      onEdit={startEdit}
                      onToggle={toggleActive}
                      onRemove={remove}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <ReadArticleModal item={previewItem} onClose={() => setPreviewItem(null)} />
      </div>
    </AppShell>
  );
}

const formEyebrowStyle = {
  margin: "0 0 var(--space-4)",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "6px",
  marginTop: "16px",
};

const hintStyle = {
  margin: "0 0 10px",
  fontSize: "12px",
  color: "var(--text-secondary)",
};

const inputStyle = {
  width: "100%",
  maxWidth: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  background: "var(--surface)",
};

const coverEditorStyle = {
  borderRadius: "var(--radius-xl)",
  overflow: "hidden",
  border: "1px solid var(--border)",
  background: "var(--background)",
};

const coverActionsStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  padding: "12px 14px",
  borderTop: "1px solid var(--border)",
  background: "var(--surface)",
};

const advancedWrapStyle = {
  marginTop: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--background)",
};

const advancedSummaryStyle = {
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-secondary)",
};

const feedHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "var(--space-4)",
  flexWrap: "wrap",
};

const feedTitleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 700,
  color: "var(--text-primary)",
};

const feedSubtitleStyle = {
  margin: "4px 0 0",
  fontSize: "13px",
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

const feedCountStyle = {
  fontSize: "13px",
  color: "var(--text-secondary)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export default PengumumanPage;
