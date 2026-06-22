import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";

function StatusBadge({ ok, label }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: ok ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.15)",
        color: ok ? "var(--success, #15803d)" : "var(--warning, #b45309)",
      }}
    >
      {label}
    </span>
  );
}

function SantriOperationalChecklist({ santriId }) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!santriId) {
      setChecklist(null);
      setError("");
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/santri/${santriId}/operational-checklist`);
        if (!cancelled) {
          setChecklist(res.data.data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setChecklist(null);
          setError(err.response?.data?.error || "Gagal memuat checklist operasional");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [santriId]);

  if (!santriId) return null;

  if (loading) {
    return (
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 12 }}>
        Memuat checklist operasional...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ fontSize: 13, color: "var(--danger, #dc2626)", marginTop: 12 }}>
        {error}
      </div>
    );
  }

  if (!checklist) return null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        border: "1px solid var(--border-subtle, #e5e7eb)",
        background: "var(--surface-muted, #f9fafb)",
      }}
    >
      <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14 }}>
        Checklist Operasional Santri
      </p>
      <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Data wali</span>
          <StatusBadge ok={checklist.wali?.ok} label={checklist.wali?.label || "Belum"} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Setting sahriyah</span>
          <StatusBadge
            ok={checklist.sahriyah_setting?.ok}
            label={checklist.sahriyah_setting?.label || "Belum"}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Tagihan bulan berjalan</span>
          <StatusBadge
            ok={checklist.tagihan_bulan_berjalan?.ok}
            label={checklist.tagihan_bulan_berjalan?.label || "Belum"}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>RFID UID</span>
          <StatusBadge ok={checklist.rfid_uid?.ok} label={checklist.rfid_uid?.label || "Belum"} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>Saldo RFID</span>
          <strong>{formatCurrency(Number(checklist.saldo_rfid || 0))}</strong>
        </div>
      </div>
    </div>
  );
}

export default SantriOperationalChecklist;
