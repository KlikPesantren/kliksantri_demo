function PlatformMark() {
  return (
    <div style={containerStyle}>
      <div style={poweredStyle}>Powered by KlikPesantren</div>
      <div style={taglineStyle}>Amanah Kita Bersama</div>
    </div>
  );
}

const containerStyle = {
  opacity: 0.62,
  color: "var(--text-secondary)",
  fontSize: "11px",
  lineHeight: 1.45,
};

const poweredStyle = {
  fontWeight: 600,
};

const taglineStyle = {
  fontWeight: 400,
  marginTop: "2px",
};

export default PlatformMark;
