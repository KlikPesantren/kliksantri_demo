import {
  FaHome,
  FaUsers,
  FaMoneyBill,
  FaMicrochip,
  FaClipboardList,
  FaSchool,
  FaSignOutAlt,
  FaWifi,
  FaUserShield,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";
import { hasPermission } from "../utils/hasPermission";
import TenantBrand from "./TenantBrand";
import PlatformMark from "./PlatformMark";

// =============================================================
// MENU CONFIG — satu sumber, digate oleh permission
// =============================================================

const MENU = [
  { name: "Dashboard",         path: "/dashboard",        perm: "dashboard.view",    icon: <FaHome /> },
  { name: "Kelas",             path: "/kelas",            perm: "kelas.view",        icon: <FaSchool /> },
  { name: "Santri",            path: "/santri",           perm: "santri.view",       icon: <FaUsers /> },
  { name: "Wali Santri",       path: "/wali",             perm: "wali.view",         icon: <FaUsers /> },
  { name: "Master Guru",       path: "/guru",             perm: "guru.view",         icon: <FaUsers /> },
  { name: "Absensi",           path: "/absensi",          perm: "absensi.view",      icon: <FaClipboardList /> },
  { name: "Absensi Guru",      path: "/absensi-guru",     perm: "absensi_guru.view", icon: <FaClipboardList /> },
  { name: "Hafalan",           path: "/hafalan",          perm: "hafalan.view",      icon: <FaClipboardList /> },
  { name: "Nilai",             path: "/nilai",            perm: "nilai.view",        icon: <FaClipboardList /> },
  { name: "Pembayaran",        path: "/pembayaran",       perm: "pembayaran.view",   icon: <FaMoneyBill /> },
  { name: "Buku Kas",          path: "/buku-kas",         perm: "bukukas.view",      icon: <FaMoneyBill /> },
  { name: "Sahriyah",          path: "/sahriyah",         perm: "sahriyah.view",     icon: <FaMoneyBill /> },
  { name: "Setting Sahriyah",  path: "/sahriyah-setting", perm: "sahriyah.manage",   icon: <FaMoneyBill /> },
  { name: "Perizinan",         path: "/perizinan",        perm: "perizinan.view",    icon: <FaClipboardList /> },
  { name: "Pelanggaran",       path: "/pelanggaran",      perm: "pelanggaran.view",  icon: <FaClipboardList /> },
  { name: "Daftar Hadir Tamu", path: "/tamu",             perm: "tamu.view",         icon: <FaClipboardList /> },
  { name: "Pengumuman",        path: "/pengumuman",       perm: "pengumuman.view",   icon: <FaClipboardList /> },
  { name: "Profil Pesantren",  path: "/profil-pesantren", perm: "profil.view",       icon: <FaSchool /> },
  { name: "RFID Dashboard",    path: "/rfid-dashboard",   perm: "rfid.view",         icon: <FaWifi /> },
  { name: "RFID Monitor",      path: "/rfid-monitor",     perm: "rfid.view",         icon: <FaWifi /> },
  { name: "RFID Transactions", path: "/rfid-transactions",perm: "rfid.view",         icon: <FaWifi /> },
  { name: "RFID Topup",        path: "/rfid-topup",       perm: "rfid.view",         icon: <FaWifi /> },
  { name: "RFID Merchant",     path: "/rfid-merchant",    perm: "rfid.view",         icon: <FaWifi /> },
  { name: "RFID Devices",      path: "/rfid-devices",     perm: "rfid.view",         icon: <FaWifi /> },
  { name: "RFID Refund",       path: "/rfid-refund",      perm: "rfid.view",         icon: <FaWifi /> },
  { name: "RFID Mutasi",       path: "/rfid-mutasi",      perm: "rfid.view",         icon: <FaWifi /> },
  { name: "Perangkat",         path: "/devices",          perm: "device.view",       icon: <FaMicrochip /> },
  { name: "Manajemen User",    path: "/users",            perm: "user.view",         icon: <FaUserShield /> },
  { name: "Role & Hak Akses",  path: "/roles",            perm: "role.manage",       icon: <FaUserShield /> },
  { name: "Audit",             path: "/audit",            perm: "audit.view",        icon: <FaClipboardList /> },
];

const MENU_GROUPS = [
  {
    title: "Dashboard",
    items: ["Dashboard"],
  },
  {
    title: "Master Data",
    items: ["Santri", "Wali Santri", "Master Guru", "Kelas"],
  },
  {
    title: "Akademik",
    items: ["Absensi", "Absensi Guru", "Hafalan", "Nilai"],
  },
  {
    title: "Keuangan",
    items: ["Pembayaran", "Buku Kas", "Sahriyah", "Setting Sahriyah"],
  },
  {
    title: "Keamanan",
    items: [
      "Perizinan",
      "Pelanggaran",
      "Daftar Hadir Tamu",
      "RFID Dashboard",
      "RFID Monitor",
      "RFID Transactions",
      "RFID Topup",
      "RFID Merchant",
      "RFID Devices",
      "RFID Refund",
      "RFID Mutasi",
    ],
  },
  {
    title: "Sistem",
    items: [
      "Perangkat",
      "Manajemen User",
      "Role & Hak Akses",
      "Audit",
      "Profil Pesantren",
      "Pengumuman",
    ],
  },
];

function Sidebar() {
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const menus = MENU.filter((m) => hasPermission(m.perm));
  const menuByName = new Map(menus.map((menu) => [menu.name, menu]));

  const renderMenuLink = (menu) => {
    const active = location.pathname === menu.path;

    return (
      <Link
        key={menu.path}
        to={menu.path}
        style={{
          ...menuLinkStyle,
          background: active ? "#DCFCE7" : "transparent",
          color: active ? "var(--primary)" : "var(--text-primary)",
          fontWeight: active ? 600 : 500,
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = "#F0FDF4";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={iconStyle}>{menu.icon}</span>
        <span style={menuTextStyle}>{menu.name}</span>
      </Link>
    );
  };

  const renderGroup = (group) => {
    const groupMenus = group.items
      .map((name) => menuByName.get(name))
      .filter(Boolean);

    if (groupMenus.length === 0) return null;

    return (
      <div key={group.title} style={sectionStyle}>
        <div style={sectionTitleStyle}>{group.title}</div>
        <div style={sectionMenuStyle}>
          {groupMenus.map(renderMenuLink)}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: "var(--sidebar-width)",
        height: "100vh",
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        fontSize: "14px",
        position: "fixed",
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
      }}
    >
      {/* TOP */}
      <div style={topStyle}>
        <div style={brandWrapperStyle}>
          <TenantBrand
            logo={null}
            name="Pesantren Demo"
            location="Kabupaten Kuningan"
          />
        </div>

        {/* MENUS */}
        <nav style={navStyle}>
          {MENU_GROUPS.map(renderGroup)}
        </nav>
      </div>

      {/* LOGOUT */}
      <div style={footerStyle}>
        <button
          onClick={logout}
          style={logoutStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FEF2F2";
            e.currentTarget.style.color = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
        >
          <FaSignOutAlt /> Logout
        </button>

        <PlatformMark />
      </div>
    </div>
  );
}

const topStyle = {
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const brandWrapperStyle = {
  paddingBottom: "var(--space-5)",
  marginBottom: "var(--space-4)",
  borderBottom: "1px solid var(--border)",
};

const navStyle = {
  overflowY: "auto",
  paddingRight: "2px",
  flex: 1,
};

const sectionStyle = {
  marginBottom: "var(--space-5)",
};

const sectionTitleStyle = {
  color: "var(--text-secondary)",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "var(--space-2)",
};

const sectionMenuStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

const menuLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-3)",
  padding: "10px var(--space-3)",
  borderRadius: "var(--radius-md)",
  transition: "background 150ms ease, color 150ms ease",
  textDecoration: "none",
  minHeight: "40px",
};

const iconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  flexShrink: 0,
};

const menuTextStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const footerStyle = {
  paddingTop: "var(--space-4)",
  marginTop: "var(--space-4)",
  borderTop: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  flexShrink: 0,
};

const logoutStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  width: "100%",
  background: "transparent",
  color: "var(--text-primary)",
  border: "none",
  padding: "10px var(--space-3)",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  transition: "background 150ms ease, color 150ms ease",
};

export default Sidebar;
