import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

function AppShell({ children, title, description, breadcrumb }) {
  return (
    <div style={shellStyle}>
      <Sidebar />

      <main style={mainStyle}>
        <PageHeader
          title={title}
          description={description}
          breadcrumb={breadcrumb}
        />

        <div style={contentStyle}>{children}</div>
      </main>
    </div>
  );
}

const shellStyle = {
  minHeight: "100vh",
  background: "var(--background)",
};

const mainStyle = {
  marginLeft: "var(--sidebar-width)",
  width: "calc(100% - var(--sidebar-width))",
  minHeight: "100vh",
  padding: "24px",
  boxSizing: "border-box",
};

const contentStyle = {
  minWidth: 0,
};

export default AppShell;
