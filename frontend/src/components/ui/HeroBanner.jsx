const titleStyle = {
  margin: 0,
  fontSize: "1.75rem",
  fontWeight: 700,
  lineHeight: 1.25,
};

const subtitleStyle = {
  margin: "10px 0 0",
  fontSize: "15px",
  lineHeight: 1.5,
  opacity: 0.95,
};

const statsRowStyle = {
  marginTop: "20px",
  display: "flex",
  gap: "30px",
  flexWrap: "wrap",
};

const welcomeStatsRowStyle = {
  display: "flex",
  alignItems: "stretch",
  gap: "10px",
  flexWrap: "wrap",
};

const statValueStyle = {
  margin: 0,
  fontSize: "1.75rem",
  fontWeight: 700,
  lineHeight: 1.2,
};

const statLabelStyle = {
  fontSize: "13px",
  opacity: 0.9,
};

const welcomeStatItemStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "2px",
  flex: "1 1 140px",
  minWidth: 0,
  padding: "8px 12px",
  background: "rgba(255,255,255,0.14)",
  borderRadius: "var(--radius-sm)",
};

const welcomeStatValueStyle = {
  margin: 0,
  fontSize: "1.0625rem",
  fontWeight: 700,
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const welcomeStatLabelStyle = {
  fontSize: "10px",
  opacity: 0.88,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  lineHeight: 1.2,
};

function HeroBanner({
  variant = "accent",
  title = "",
  subtitle = "",
  stats = [],
  statsOnly = false,
  children = null,
  marginBottom = 24,
}) {
  const marginBottomValue =
    typeof marginBottom === "number" ? `${marginBottom}px` : marginBottom;

  const isWelcome = variant === "welcome";
  const showStatsOnly = isWelcome && statsOnly;

  const shellStyle = {
    background: "var(--accent-teal-gradient)",
    borderRadius: "var(--radius-xl)",
    padding: showStatsOnly ? "10px 14px" : isWelcome ? "14px 18px" : "30px",
    marginBottom: marginBottomValue,
    color: "#FFFFFF",
  };

  if (variant === "accent") {
    return <div style={shellStyle}>{children}</div>;
  }

  if (variant === "minimal") {
    return (
      <div style={shellStyle}>
        {title && <h1 style={titleStyle}>{title}</h1>}
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        {children}
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      {!showStatsOnly && title && (
        <h1 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.3 }}>
          {title}
        </h1>
      )}
      {!showStatsOnly && (subtitle || children) && (
        <div style={{ marginTop: subtitle ? "2px" : 0 }}>
          {subtitle && (
            <span style={{ fontSize: "13px", lineHeight: 1.4, opacity: 0.92 }}>
              {subtitle}
            </span>
          )}
          {children}
        </div>
      )}
      {stats.length > 0 && (
        <div
          style={
            isWelcome
              ? { ...welcomeStatsRowStyle, marginTop: showStatsOnly ? 0 : "10px" }
              : statsRowStyle
          }
          className="hero-banner-stats"
        >
          {stats.map((stat, index) =>
            isWelcome ? (
              <div key={stat.label || index} style={welcomeStatItemStyle}>
                <span style={welcomeStatValueStyle}>{stat.value}</span>
                <small style={welcomeStatLabelStyle}>{stat.label}</small>
              </div>
            ) : (
              <div key={stat.label || index}>
                <h2 style={statValueStyle}>{stat.value}</h2>
                <small style={statLabelStyle}>{stat.label}</small>
              </div>
            )
          )}
        </div>
      )}
      <style>{`
        @media (max-width: 640px) {
          .hero-banner-stats {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default HeroBanner;
