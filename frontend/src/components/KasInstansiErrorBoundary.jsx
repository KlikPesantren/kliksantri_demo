import { Component } from "react";
import Button from "./ui/Button";

class KasInstansiErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Terjadi kesalahan tampilan",
    };
  }

  componentDidCatch(error, info) {
    console.error("[KasInstansiErrorBoundary]", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "var(--space-6)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 8px", color: "var(--text-primary)" }}>
            Gagal menampilkan Kas Instansi
          </h3>
          <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: "14px" }}>
            {this.state.message}
          </p>
          <Button onClick={this.handleRetry}>Muat Ulang</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default KasInstansiErrorBoundary;
