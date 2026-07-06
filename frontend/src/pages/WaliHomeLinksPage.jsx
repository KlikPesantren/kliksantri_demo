import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import DataTableCard from "../components/ui/DataTableCard";
import EmptyState from "../components/ui/EmptyState";
import SearchInput from "../components/ui/SearchInput";
import StatusBadge from "../components/ui/StatusBadge";
import TableToolbar from "../components/ui/TableToolbar";
import { FormActionBar, FormField, FormGrid, Input, Select, Textarea } from "../components/ui/form";
import {
  Table,
  TableActions,
  TablePagination,
  TableScroll,
  useClientPagination,
} from "../components/ui/table";

function getApiError(err, fallback) {
  return err.response?.data?.error || err.response?.data?.message || fallback;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  url: "",
  type: "website",
  thumbnail_url: "",
  is_active: true,
  sort_order: 0,
};

const TYPE_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "live", label: "Live Streaming" },
  { value: "form", label: "Form" },
  { value: "donation", label: "Donasi" },
  { value: "pdf", label: "PDF" },
  { value: "drive", label: "Google Drive" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "telegram", label: "Telegram" },
  { value: "other", label: "Lainnya" },
];

function WaliHomeLinksPage() {
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const loadLinks = async () => {
    setError("");
    try {
      const res = await api.get("/wali-home-links");
      setLinks(res.data?.data || []);
    } catch (err) {
      setError(getApiError(err, "Gagal memuat tautan wali."));
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter((item) =>
      [item.title, item.description, item.url, item.type, item.is_active ? "aktif" : "nonaktif"]
        .some((value) => String(value || "").toLowerCase().includes(q)),
    );
  }, [links, search]);

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      sort_order: Number(form.sort_order || 0),
    };

    try {
      if (editId) {
        await api.put(`/wali-home-links/${editId}`, payload);
        setSuccess("Tautan berhasil diperbarui.");
      } else {
        await api.post("/wali-home-links", payload);
        setSuccess("Tautan berhasil ditambahkan.");
      }
      resetForm();
      loadLinks();
    } catch (err) {
      setError(getApiError(err, "Gagal menyimpan tautan."));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      title: item.title || "",
      description: item.description || "",
      url: item.url || "",
      type: item.type || "other",
      thumbnail_url: item.thumbnail_url || "",
      is_active: item.is_active !== false,
      sort_order: item.sort_order || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async (item) => {
    setError("");
    try {
      await api.put(`/wali-home-links/${item.id}`, {
        is_active: !item.is_active,
      });
      loadLinks();
    } catch (err) {
      setError(getApiError(err, "Gagal mengubah status tautan."));
    }
  };

  const deleteLink = async (item) => {
    if (!window.confirm(`Hapus tautan "${item.title}"?`)) return;
    setError("");
    try {
      await api.delete(`/wali-home-links/${item.id}`);
      loadLinks();
    } catch (err) {
      setError(getApiError(err, "Gagal menghapus tautan."));
    }
  };

  return (
    <AppShell
      title="Konten Pesantren"
      description="Kelola konten dan tautan penting yang tampil di Beranda APK Wali Santri."
      breadcrumb="Data Utama / Konten Pesantren"
    >
      {error ? <div className="theme-alert theme-alert--danger">{error}</div> : null}
      {success ? <div className="theme-alert theme-alert--success">{success}</div> : null}

      <Card padding="md" shadow="card" radius="xl">
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <FormField label="Judul" htmlFor="wali-link-title" required>
              <Input
                id="wali-link-title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Contoh: Form izin pulang"
              />
            </FormField>
            <FormField label="Tipe Link" htmlFor="wali-link-type">
              <Select
                id="wali-link-type"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="URL" htmlFor="wali-link-url" required>
              <Input
                id="wali-link-url"
                value={form.url}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Thumbnail URL" htmlFor="wali-link-thumb" helper="Opsional. YouTube otomatis memakai thumbnail video jika kosong.">
              <Input
                id="wali-link-thumb"
                value={form.thumbnail_url}
                onChange={(e) => handleChange("thumbnail_url", e.target.value)}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Urutan" htmlFor="wali-link-order">
              <Input
                id="wali-link-order"
                type="number"
                value={form.sort_order}
                onChange={(e) => handleChange("sort_order", e.target.value)}
              />
            </FormField>
            <FormField label="Status" htmlFor="wali-link-active">
              <Select
                id="wali-link-active"
                value={form.is_active ? "true" : "false"}
                onChange={(e) => handleChange("is_active", e.target.value === "true")}
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </Select>
            </FormField>
          </FormGrid>

          <FormField label="Deskripsi" htmlFor="wali-link-description">
            <Textarea
              id="wali-link-description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Ringkasan singkat untuk wali santri"
            />
          </FormField>

          <FormActionBar>
            {editId ? (
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Batal Edit
              </Button>
            ) : null}
            <Button type="submit" variant="primary" loading={saving}>
              {editId ? "Simpan Perubahan" : "Tambah Tautan"}
            </Button>
          </FormActionBar>
        </form>
      </Card>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Tautan"
          subtitle="Tautan aktif akan tampil di APK Wali sesuai urutan."
          actions={<span className="theme-muted">{filtered.length} tautan</span>}
        >
          <TableToolbar
            search={
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tautan..."
              />
            }
          />

          {filtered.length === 0 ? (
            <EmptyState
              title={links.length === 0 ? "Belum ada tautan" : "Tidak ada hasil pencarian"}
              description={
                links.length === 0
                  ? "Tambahkan tautan penting pertama untuk Beranda APK Wali."
                  : "Coba kata kunci lain."
              }
            />
          ) : (
            <>
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>Urutan</th>
                      <th>Judul</th>
                      <th>Tipe</th>
                      <th>URL</th>
                      <th>Status</th>
                      <th className="table-v3__cell--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.sort_order ?? 0}</td>
                        <td className="table-v3__cell--strong">{item.title}</td>
                        <td>{item.type}</td>
                        <td className="table-v3__cell--mono">{item.url}</td>
                        <td>
                          <StatusBadge status={item.is_active ? "Aktif" : "Nonaktif"} />
                        </td>
                        <td className="table-v3__cell--actions">
                          <TableActions
                            items={[
                              { type: "edit", onClick: () => startEdit(item) },
                              {
                                type: "toggle",
                                active: item.is_active,
                                onClick: () => toggleActive(item),
                              },
                              { type: "delete", onClick: () => deleteLink(item) },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
              <TablePagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
              />
            </>
          )}
        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default WaliHomeLinksPage;
