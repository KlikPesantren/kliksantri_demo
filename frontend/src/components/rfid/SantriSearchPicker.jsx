import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { FormField, Input } from "../ui/form";

const SEARCH_LIMIT = 20;
const DEBOUNCE_MS = 300;

function SantriSearchPicker({
  id = "santri-search",
  label = "Santri",
  value,
  onChange,
  onSelect,
  disabled = false,
  required = false,
  selectedSantri = null,
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (selectedSantri?.nama) {
      setQuery(selectedSantri.nama);
    } else if (!value) {
      setQuery("");
    }
  }, [selectedSantri?.id, selectedSantri?.nama, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const q = query.trim();
    if (!q) {
      setMatches([]);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/rfid/santri/search", {
          params: { search: q, limit: SEARCH_LIMIT },
        });
        setMatches(res.data.data || []);
      } catch (err) {
        console.error(err);
        setMatches([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (santri) => {
    onChange(String(santri.id));
    if (typeof onSelect === "function") {
      onSelect(santri);
    }
    setQuery(santri.nama || "");
    setOpen(false);
    setMatches([]);
  };

  const handleInputChange = (e) => {
    const next = e.target.value;
    setQuery(next);
    setOpen(true);
    if (value && selectedSantri && next !== selectedSantri.nama) {
      onChange("");
      if (typeof onSelect === "function") {
        onSelect(null);
      }
    }
  };

  return (
    <FormField label={label} htmlFor={id} required={required} className={className}>
      <div ref={containerRef} style={{ position: "relative" }}>
        <Input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Ketik nama, NIS, atau UID kartu..."
          disabled={disabled}
          autoComplete="off"
        />

        {open && query.trim() && matches.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 20,
              margin: "4px 0 0",
              padding: 0,
              listStyle: "none",
              background: "var(--surface-card, #fff)",
              border: "1px solid var(--border-subtle, #e5e7eb)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              maxHeight: "240px",
              overflowY: "auto",
            }}
          >
            {matches.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <strong>{s.nama}</strong>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)" }}>
                    {[s.nis && `NIS: ${s.nis}`, s.uid_rfid && `UID: ${s.uid_rfid}`]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && query.trim() && !isSearching && matches.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 20,
              marginTop: "4px",
              padding: "10px 12px",
              background: "var(--surface-card, #fff)",
              border: "1px solid var(--border-subtle, #e5e7eb)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            Tidak ada santri yang cocok
          </div>
        )}

        {open && query.trim() && isSearching && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 20,
              marginTop: "4px",
              padding: "10px 12px",
              background: "var(--surface-card, #fff)",
              border: "1px solid var(--border-subtle, #e5e7eb)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            Mencari...
          </div>
        )}
      </div>
    </FormField>
  );
}

export default SantriSearchPicker;
