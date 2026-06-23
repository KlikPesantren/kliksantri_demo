import { useRef, useState, useEffect } from "react";
import { uploadImage } from "../services/upload";
import { resolveDisplayMediaUrl } from "../utils/mediaUrl";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const pickFileButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 18px",
  fontSize: "14px",
  fontWeight: 600,
  fontFamily: "inherit",
  lineHeight: 1.2,
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function validateFile(file) {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Format file tidak didukung";
  }
  if (file.size > MAX_SIZE) {
    return "Ukuran maksimal 5MB";
  }
  return null;
}

export default function ImageUploadField({
  id,
  label,
  value,
  onChange,
  accept = "image/png,image/jpeg,image/jpg,image/webp",
  pickLabel = "Pilih File",
  previewHeight = 96,
  uploadFn: uploadFnProp,
}) {
  const inputRef = useRef(null);
  const ownedBlobsRef = useRef(new Set());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);

  useEffect(() => {
    const owned = ownedBlobsRef.current;
    return () => {
      owned.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      owned.clear();
    };
  }, []);

  const savedPreview = resolveDisplayMediaUrl(value);
  const previewSrc = pendingPreview || savedPreview;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    const blobUrl = URL.createObjectURL(file);
    ownedBlobsRef.current.add(blobUrl);
    setPendingPreview(blobUrl);

    setUploading(true);
    try {
      const uploadFn = uploadFnProp || uploadImage;
      const url = await uploadFn(file);
      if (!url) {
        throw new Error("Upload gagal");
      }

      onChange(url);
      setPendingPreview(null);
    } catch (err) {
      setPendingPreview(null);

      const message =
        err.response?.data?.error ??
        (err.response?.status === 404
          ? "Upload tidak tersedia di server. Pastikan backend sudah di-restart."
          : null) ??
        err.message ??
        "Upload gagal";

      setError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          height: previewSrc ? previewHeight : 0,
          borderRadius: previewSrc ? "var(--radius-lg)" : 0,
          border: previewSrc ? "1px solid var(--border)" : "none",
          background: previewSrc ? "var(--surface-muted)" : "transparent",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: previewSrc ? 1 : 0,
          pointerEvents: previewSrc ? "auto" : "none",
        }}
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={`Preview ${label}`}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{
            ...pickFileButtonStyle,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.65 : 1,
          }}
        >
          {pickLabel}
        </button>
        {uploading ? (
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Mengupload...</span>
        ) : null}
      </div>

      {value && !value.startsWith("blob:") ? (
        <input
          type="text"
          readOnly
          value={value}
          style={{
            width: "100%",
            fontSize: 12,
            color: "var(--text-muted)",
            background: "var(--surface-muted)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 10px",
            boxSizing: "border-box",
          }}
          aria-label="URL hasil upload"
        />
      ) : null}

      {error ? (
        <span style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600 }} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
