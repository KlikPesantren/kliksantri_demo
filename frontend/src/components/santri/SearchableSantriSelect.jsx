import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../ui/form";

const MAX_RESULTS = 30;

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function getSantriLabel(santri) {
  return santri?.nama || "";
}

function getSantriMeta(santri) {
  return [santri?.nis && `NIS: ${santri.nis}`, santri?.kelas || santri?.nama_kelas]
    .filter(Boolean)
    .join(" - ");
}

function SearchableSantriSelect({
  id,
  value,
  santri = [],
  onChange,
  placeholder = "Cari nama santri...",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  const selectedSantri = useMemo(
    () => santri.find((item) => String(item.id) === String(value)),
    [santri, value],
  );

  const selectedLabel = getSantriLabel(selectedSantri);
  const displayValue = focused ? query : selectedLabel;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = normalize(displayValue);
    const source = q
      ? santri.filter((item) => {
          const haystack = normalize(
            [item.nama, item.nis, item.kelas, item.nama_kelas].filter(Boolean).join(" "),
          );
          return haystack.includes(q);
        })
      : santri;

    return source.slice(0, MAX_RESULTS);
  }, [displayValue, santri]);

  const handleInputChange = (event) => {
    const next = event.target.value;
    setQuery(next);
    setOpen(true);

    if (value && next !== selectedLabel) {
      onChange("");
    }
  };

  const handleSelect = (item) => {
    onChange(String(item.id));
    setQuery(getSantriLabel(item));
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Input
        id={id}
        type="search"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={() => {
          setFocused(true);
          setQuery(selectedLabel);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open ? (
        <div style={dropdownStyle}>
          {matches.length > 0 ? (
            matches.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(item)}
                style={optionStyle}
              >
                <span style={nameStyle}>{item.nama}</span>
                {getSantriMeta(item) ? <span style={metaStyle}>{getSantriMeta(item)}</span> : null}
              </button>
            ))
          ) : (
            <div style={emptyStyle}>Santri tidak ditemukan</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const dropdownStyle = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 30,
  maxHeight: 240,
  overflowY: "auto",
  background: "var(--surface-card, #fff)",
  border: "1px solid var(--border-subtle, #e5e7eb)",
  borderRadius: 8,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
  padding: 4,
};

const optionStyle = {
  display: "block",
  width: "100%",
  border: "none",
  borderRadius: 6,
  background: "transparent",
  cursor: "pointer",
  padding: "9px 10px",
  textAlign: "left",
};

const nameStyle = {
  display: "block",
  color: "var(--text-primary)",
  fontSize: 14,
  fontWeight: 700,
};

const metaStyle = {
  display: "block",
  marginTop: 2,
  color: "var(--text-secondary)",
  fontSize: 12,
};

const emptyStyle = {
  padding: "10px 12px",
  color: "var(--text-secondary)",
  fontSize: 13,
};

export default SearchableSantriSelect;
