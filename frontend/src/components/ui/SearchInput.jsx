import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  name,
  id,
  style,
  ...rest
}) {
  const [focused, setFocused] = useState(false);

  const showClear = String(value || "").length > 0;

  return (
    <div
      style={{
        ...wrapperStyle,
        borderColor: focused ? "var(--primary)" : "var(--border)",
        boxShadow: focused ? "0 0 0 3px var(--focus-ring)" : "none",
        ...style,
      }}
    >
      <FaSearch style={searchIconStyle} aria-hidden />
      <input
        type="search"
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => {
            onChange({ target: { value: "", name: name || "" } });
          }}
          style={clearButtonStyle}
        >
          <FaTimes size={12} />
        </button>
      )}
    </div>
  );
}

const wrapperStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  width: "100%",
  minHeight: "var(--form-control-height, 44px)",
  padding: "0 var(--space-3)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const searchIconStyle = {
  flexShrink: 0,
  color: "var(--text-muted)",
  fontSize: "14px",
};

const inputStyle = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "14px",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  lineHeight: 1.4,
};

const clearButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px",
  padding: 0,
  border: "none",
  borderRadius: "var(--radius-sm)",
  background: "var(--neutral-subtle)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  flexShrink: 0,
};

export default SearchInput;
