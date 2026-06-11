function Card({ children }) {
  return <div style={cardStyle}>{children}</div>;
}

const cardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-sm)",
};

export default Card;
