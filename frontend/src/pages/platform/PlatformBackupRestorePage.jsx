import { useCallback, useEffect, useRef, useState } from "react";
import platformApi from "../../services/platformApi";
import PlatformButton from "../../components/platform/PlatformButton";
import { ConsoleCard, PlatformConsoleShell } from "../../components/platform/PlatformConsoleShell";

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getApiError(err, fallback) {
  return err?.response?.data?.error || err?.message || fallback;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function PlatformBackupRestorePage() {
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await platformApi.get("/platform/backup/history");
      setHistory(res.data.data || []);
    } catch (err) {
      setMessage(getApiError(err, "Gagal memuat histori backup"));
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const createBackup = async () => {
    setIsCreating(true);
    setMessage("");
    try {
      const res = await platformApi.post("/platform/backup/create");
      setMessage(`Backup berhasil dibuat: ${res.data.filename}`);
      await fetchHistory();
    } catch (err) {
      setMessage(getApiError(err, "Backup gagal dibuat"));
    } finally {
      setIsCreating(false);
    }
  };

  const downloadBackup = async (filename) => {
    setMessage("");
    try {
      const res = await platformApi.get(`/platform/backup/download/${filename}`, {
        responseType: "blob",
      });
      downloadBlob(res.data, filename);
    } catch (err) {
      setMessage(getApiError(err, "Download backup gagal"));
    }
  };

  const restoreDatabase = async () => {
    if (!selectedFile) {
      setMessage("Pilih file .backup terlebih dahulu");
      return;
    }

    if (!confirmed) {
      setMessage("Centang konfirmasi restore terlebih dahulu");
      return;
    }

    const formData = new FormData();
    formData.append("backup_file", selectedFile);
    formData.append("confirm_restore", "true");

    setIsRestoring(true);
    setMessage("");
    try {
      await platformApi.post("/platform/backup/restore", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Restore database berhasil");
      setSelectedFile(null);
      setConfirmed(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchHistory();
    } catch (err) {
      setMessage(getApiError(err, "Restore database gagal"));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <PlatformConsoleShell
      badge="System"
      title="Backup & Restore"
      subtitle="Kelola backup PostgreSQL KlikSantri dari Platform Console."
      secondaryLink="/platform/system/deployment-checklist"
      secondaryLabel="Deployment Checklist"
    >
      <BackupRestoreStyles />

      {message ? <div className="platform-backup-alert">{message}</div> : null}

      <div className="platform-console__grid">
        <ConsoleCard title="Backup Database" tone="active">
          <p>
            Membuat file PostgreSQL backup <code>.backup</code> dengan
            <code> pg_dump</code>. File disimpan tanpa overwrite backup lama.
          </p>
          <PlatformButton
            onClick={createBackup}
            disabled={isCreating}
            loading={isCreating}
          >
            {isCreating ? "Membuat Backup..." : "Backup Sekarang"}
          </PlatformButton>
        </ConsoleCard>

        <ConsoleCard title="Restore" tone="warn">
          <p>
            Restore akan menjalankan <code>pg_restore --clean --if-exists</code>.
            Pastikan file berasal dari backup KlikSantri yang valid.
          </p>
          <div className="platform-backup-form">
            <input
              ref={fileInputRef}
              type="file"
              accept=".backup"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={isRestoring}
            />
            <label className="platform-backup-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={isRestoring}
              />
              <span>Saya memahami proses restore akan menggantikan database.</span>
            </label>
            <PlatformButton
              variant="danger"
              onClick={restoreDatabase}
              disabled={isRestoring || !selectedFile || !confirmed}
              loading={isRestoring}
            >
              {isRestoring ? "Restore Berjalan..." : "Restore Database"}
            </PlatformButton>
          </div>
        </ConsoleCard>
      </div>

      <section className="platform-console-table-wrap">
        <div className="platform-backup-table-head">
          <div>
            <h2>Backup History</h2>
            <p>{history.length} file backup tersedia</p>
          </div>
          <PlatformButton variant="secondary" onClick={fetchHistory} disabled={isLoadingHistory}>
            Refresh
          </PlatformButton>
        </div>
        {isLoadingHistory ? (
          <div className="platform-console-empty">Memuat histori backup...</div>
        ) : history.length === 0 ? (
          <div className="platform-console-empty">Belum ada file backup.</div>
        ) : (
          <table className="platform-console-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama File</th>
                <th>Ukuran</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.filename}>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <code>{item.filename}</code>
                  </td>
                  <td>{formatBytes(item.size)}</td>
                  <td>
                    <PlatformButton
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadBackup(item.filename)}
                    >
                      Download
                    </PlatformButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PlatformConsoleShell>
  );
}

function BackupRestoreStyles() {
  return (
    <style>{`
      .platform-backup-alert {
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface-muted);
        color: var(--text-primary);
        padding: 12px 14px;
        font-size: 13px;
        font-weight: 700;
      }

      .platform-backup-form {
        display: grid;
        gap: 12px;
      }

      .platform-backup-form input[type="file"] {
        width: 100%;
        color: var(--text-primary);
      }

      .platform-backup-check {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        background: var(--surface-muted);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 700;
        line-height: 1.45;
      }

      .platform-backup-check input {
        margin-top: 2px;
      }

      .platform-backup-table-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
      }

      .platform-backup-table-head h2 {
        margin: 0;
        font-size: 15px;
        color: var(--text-primary);
      }

      .platform-backup-table-head p {
        margin: 4px 0 0;
        color: var(--text-muted);
        font-size: 13px;
      }
    `}</style>
  );
}

export default PlatformBackupRestorePage;
