import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../layouts/AppShell";
import Card from "../components/ui/Card";
import { fetchPublicPlatformAnnouncements } from "../services/platformPublicApi";
import { formatDateShort } from "../utils/formatDate";

function PlatformInfoAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchPublicPlatformAnnouncements()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat info dari KlikSantri.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Info dari KlikSantri" breadcrumb="Info dari KlikSantri">
      <p style={introStyle}>
        Pengumuman resmi dari tim KlikSantri untuk admin pesantren.{" "}
        <Link to="/about">Tentang KlikSantri</Link>
      </p>

      {loading ? (
        <p style={mutedStyle}>Memuat...</p>
      ) : error ? (
        <p style={errorStyle}>{error}</p>
      ) : items.length === 0 ? (
        <Card padding="md" shadow="card" radius="xl">
          <p style={mutedStyle}>Belum ada pengumuman dari KlikSantri.</p>
        </Card>
      ) : (
        <div style={listStyle}>
          {items.map((item) => (
            <Card key={item.id} padding="md" shadow="card" radius="xl">
              <h2 style={titleStyle}>{item.title}</h2>
              <p style={metaStyle}>Dipublikasikan {formatDateShort(item.updated_at)}</p>
              <p style={bodyStyle}>{item.body}</p>
              {item.video_url ? (
                <p style={bodyStyle}>
                  Video:{" "}
                  <a href={item.video_url} target="_blank" rel="noreferrer">
                    {item.video_url}
                  </a>
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

const introStyle = {
  margin: "0 0 16px",
  color: "var(--text-secondary)",
  fontSize: "14px",
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const titleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800,
};

const metaStyle = {
  margin: "6px 0 10px",
  fontSize: "12px",
  color: "var(--text-muted)",
};

const bodyStyle = {
  margin: 0,
  color: "var(--text-secondary)",
  lineHeight: 1.6,
  fontSize: "14px",
  whiteSpace: "pre-wrap",
};

const mutedStyle = {
  color: "var(--text-secondary)",
};

const errorStyle = {
  color: "var(--danger)",
  fontWeight: 600,
};

export default PlatformInfoAnnouncementsPage;
