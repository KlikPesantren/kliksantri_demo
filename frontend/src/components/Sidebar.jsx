import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FaChevronRight,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { hasPermission } from "../utils/hasPermission";

const SCROLL_KEY = "kliksantri_sidebar_scroll";
const COLLAPSE_KEY = "kliksantri_sidebar_collapsed";

const SIDEBAR = {
  bg: "#0F172A",
  border: "rgba(148, 163, 184, 0.12)",
  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  hoverBg: "rgba(148, 163, 184, 0.08)",
  activeBg: "rgba(20, 184, 166, 0.14)",
  activeBorder: "var(--accent-teal)",
  activeText: "#F0FDFA",
};

const MENU = [
  { name: "Dashboard", path: "/dashboard", perm: "dashboard.view", icon: <FaHome /> },
  { name: "Santri", path: "/santri", perm: "santri.view", icon: <FaUsers /> },
  { name: "Wali Santri", path: "/wali", perm: "wali.view", icon: <FaUsers /> },
  { name: "Guru", path: "/guru", perm: "guru.view", icon: <FaUsers /> },
  { name: "Kelas", path: "/kelas", perm: "kelas.view", icon: <FaSchool /> },
  { name: "Profil Pesantren", path: "/profil-pesantren", perm: "profil.view", icon: <FaSchool /> },
  { name: "Pengumuman", path: "/pengumuman", perm: "pengumuman.view", icon: <FaClipboardList /> },
  { name: "Nilai", path: "/nilai", perm: "nilai.view", icon: <FaClipboardList /> },
  { name: "Hafalan", path: "/hafalan", perm: "hafalan.view", icon: <FaClipboardList /> },
  { name: "Absensi", path: "/absensi", perm: "absensi.view", icon: <FaClipboardList /> },
  { name: "Absensi Guru", path: "/absensi-guru", perm: "absensi_guru.view", icon: <FaClipboardList /> },
  { name: "Pembayaran", path: "/pembayaran", perm: "pembayaran.view", icon: <FaMoneyBill /> },
  { name: "Buku Kas", path: "/buku-kas", perm: "bukukas.view", icon: <FaMoneyBill /> },
  { name: "Sahriyah", path: "/sahriyah", perm: "sahriyah.view", icon: <FaMoneyBill /> },
  { name: "Setting Sahriyah", path: "/sahriyah-setting", perm: "sahriyah.manage", icon: <FaMoneyBill /> },
  { name: "RFID Dashboard", path: "/rfid-dashboard", perm: "rfid.view", icon: <FaWifi /> },
  { name: "RFID Monitor", path: "/rfid-monitor", perm: "rfid.view", icon: <FaWifi /> },
  { name: "RFID Transaksi", path: "/rfid-transactions", perm: "rfid.view", icon: <FaWifi /> },
  { name: "RFID Topup", path: "/rfid-topup", perm: "rfid.view", icon: <FaWifi /> },
  { name: "RFID Refund", path: "/rfid-refund", perm: "rfid.view", icon: <FaWifi /> },
  { name: "RFID Mutasi", path: "/rfid-mutasi", perm: "rfid.view", icon: <FaWifi /> },
  { name: "RFID Merchant", path: "/rfid-merchant", perm: "rfid.view", icon: <FaWifi /> },
  { name: "RFID Device", path: "/rfid-devices", perm: "rfid.view", icon: <FaWifi /> },
  { name: "Perizinan", path: "/perizinan", perm: "perizinan.view", icon: <FaClipboardList /> },
  { name: "Pelanggaran", path: "/pelanggaran", perm: "pelanggaran.view", icon: <FaClipboardList /> },
  { name: "Tamu", path: "/tamu", perm: "tamu.view", icon: <FaClipboardList /> },
  { name: "Users", path: "/users", perm: "user.view", icon: <FaUserShield /> },
  { name: "Roles", path: "/roles", perm: "role.manage", icon: <FaUserShield /> },
  { name: "Audit", path: "/audit", perm: "audit.view", icon: <FaClipboardList /> },
  { name: "Devices", path: "/devices", perm: "device.view", icon: <FaMicrochip /> },
];

const MENU_GROUPS = [
  {
    id: "dashboard",
    title: "Dashboard",
    collapsible: false,
    items: ["Dashboard"],
  },
  {
    id: "data-utama",
    title: "Data Utama",
    collapsible: true,
    items: ["Santri", "Wali Santri", "Guru", "Kelas", "Profil Pesantren", "Pengumuman"],
  },
  {
    id: "akademik",
    title: "Akademik",
    collapsible: true,
    items: ["Nilai", "Hafalan", "Absensi", "Absensi Guru"],
  },
  {
    id: "keuangan",
    title: "Keuangan",
    collapsible: true,
    items: [
      "Pembayaran",
      "Buku Kas",
      "Sahriyah",
      "Setting Sahriyah",
      "RFID Dashboard",
      "RFID Monitor",
      "RFID Transaksi",
      "RFID Topup",
      "RFID Refund",
      "RFID Mutasi",
      "RFID Merchant",
      "RFID Device",
    ],
  },
  {
    id: "kedisiplinan",
    title: "Kedisiplinan",
    collapsible: true,
    items: ["Perizinan", "Pelanggaran", "Tamu"],
  },
  {
    id: "sistem",
    title: "Sistem",
    collapsible: true,
    items: ["Users", "Roles", "Audit", "Devices"],
  },
];

const RFID_PATHS = new Set([
  "/rfid-dashboard",
  "/rfid-monitor",
  "/rfid-transactions",
  "/rfid-topup",
  "/rfid-refund",
  "/rfid-mutasi",
  "/rfid-merchant",
  "/rfid-devices",
]);

function loadCollapsedState() {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCollapsedState(state) {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
}

function saveScrollPosition(scrollTop) {
  localStorage.setItem(SCROLL_KEY, String(scrollTop));
}

function restoreScrollPosition(navEl) {
  if (!navEl) return;
  const saved = localStorage.getItem(SCROLL_KEY);
  if (saved == null) return;
  navEl.scrollTop = Number(saved);
}

function getActiveGroupId(pathname, menuByPath) {
  const menu = menuByPath.get(pathname);
  if (!menu) return null;

  for (const group of MENU_GROUPS) {
    if (group.items.includes(menu.name)) {
      return group.id;
    }
  }
  return null;
}

function SidebarBrand() {
  return (
    <div style={brandContainerStyle} className="sidebar-brand-wrap">
      <div style={brandMarkStyle}>K</div>
      <div style={{ minWidth: 0 }} className="sidebar-brand-text">
        <div style={brandTitleStyle}>KlikSantri</div>
        <div style={brandSubtitleStyle}>Administrasi Pesantren</div>
      </div>
    </div>
  );
}

function Sidebar({ drawerOpen = false, onDrawerClose }) {
  const location = useLocation();
  const navRef = useRef(null);
  const scrollRafRef = useRef(null);

  const [collapsed, setCollapsed] = useState(loadCollapsedState);

  const menus = useMemo(() => MENU.filter((m) => hasPermission(m.perm)), []);

  const menuByName = useMemo(
    () => new Map(menus.map((menu) => [menu.name, menu])),
    [menus],
  );

  const menuByPath = useMemo(
    () => new Map(menus.map((menu) => [menu.path, menu])),
    [menus],
  );

  const persistScroll = useCallback(() => {
    if (!navRef.current) return;
    saveScrollPosition(navRef.current.scrollTop);
  }, []);

  const handleNavScroll = useCallback(() => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      persistScroll();
    });
  }, [persistScroll]);

  useEffect(() => {
    const navEl = navRef.current;
    restoreScrollPosition(navEl);

    const frame = requestAnimationFrame(() => {
      restoreScrollPosition(navEl);
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  useEffect(() => {
    restoreScrollPosition(navRef.current);
    window.addEventListener("beforeunload", persistScroll);
    return () => {
      window.removeEventListener("beforeunload", persistScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [persistScroll]);

  useEffect(() => {
    const activeGroupId = getActiveGroupId(location.pathname, menuByPath);
    if (!activeGroupId) return;

    const group = MENU_GROUPS.find((g) => g.id === activeGroupId);
    if (!group?.collapsible) return;

    setCollapsed((prev) => {
      if (prev[activeGroupId] !== true) return prev;
      const next = { ...prev, [activeGroupId]: false };
      saveCollapsedState(next);
      return next;
    });
  }, [location.pathname, menuByPath]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const toggleGroup = (groupId) => {
    setCollapsed((prev) => {
      const next = { ...prev, [groupId]: prev[groupId] !== true };
      saveCollapsedState(next);
      return next;
    });
  };

  const isGroupOpen = (group) => {
    if (!group.collapsible) return true;
    const activeGroupId = getActiveGroupId(location.pathname, menuByPath);
    if (activeGroupId === group.id) return true;
    return collapsed[group.id] !== true;
  };

  const renderMenuLink = (menu, { nested = false } = {}) => {
    const active = location.pathname === menu.path;

    return (
      <Link
        key={menu.path}
        to={menu.path}
        className={`sidebar-menu-link${nested ? " sidebar-menu-link--nested" : ""}`}
        style={{
          ...menuLinkStyle,
          paddingLeft: nested ? "calc(var(--space-3) + 18px)" : menuLinkStyle.paddingLeft,
          background: active ? SIDEBAR.activeBg : "transparent",
          borderLeftColor: active ? SIDEBAR.activeBorder : "transparent",
          color: active ? SIDEBAR.activeText : SIDEBAR.text,
          fontWeight: active ? 600 : 500,
        }}
        title={menu.name}
        onClick={() => onDrawerClose?.()}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = SIDEBAR.hoverBg;
            e.currentTarget.style.transform = "translateX(2px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "translateX(0)";
          }
        }}
      >
        <span
          style={{
            ...iconStyle,
            color: active ? "var(--accent-teal)" : SIDEBAR.textMuted,
          }}
        >
          {menu.icon}
        </span>
        <span style={menuTextStyle} className="sidebar-menu-label">
          {menu.name}
        </span>
      </Link>
    );
  };

  const renderGroup = (group) => {
    const groupMenus = group.items
      .map((name) => menuByName.get(name))
      .filter(Boolean);

    if (groupMenus.length === 0) return null;

    const open = isGroupOpen(group);
    const rfidStartIndex = group.id === "keuangan"
      ? groupMenus.findIndex((m) => RFID_PATHS.has(m.path))
      : -1;

    return (
      <div key={group.id} style={sectionStyle}>
        {group.collapsible ? (
          <button
            type="button"
            onClick={() => toggleGroup(group.id)}
            className="sidebar-group-toggle"
            style={sectionHeaderButtonStyle}
            aria-expanded={open}
            title={group.title}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = SIDEBAR.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ ...sectionTitleStyle, marginBottom: 0 }} className="sidebar-group-title">
              {group.title}
            </span>
            <span
              className="sidebar-chevron"
              style={{
                ...chevronStyle,
                marginBottom: 0,
                transform: open ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              <FaChevronRight size={10} />
            </span>
          </button>
        ) : (
          <div style={sectionTitleStyle} className="sidebar-group-title">
            {group.title}
          </div>
        )}

        {open && (
          <div style={sectionMenuStyle}>
            {groupMenus.map((menu, index) =>
              renderMenuLink(menu, {
                nested: group.id === "keuangan" && rfidStartIndex >= 0 && index >= rfidStartIndex,
              }),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`sidebar-root${drawerOpen ? " sidebar-root--open" : ""}`}>
      <div style={topStyle}>
        <div style={brandWrapperStyle}>
          <SidebarBrand />
        </div>

        <nav
          ref={navRef}
          style={navStyle}
          onScroll={handleNavScroll}
          aria-label="Navigasi utama"
        >
          {MENU_GROUPS.map(renderGroup)}
        </nav>
      </div>

      <div style={footerStyle}>
        <button
          type="button"
          onClick={logout}
          className="sidebar-logout-btn"
          style={logoutStyle}
          title="Logout"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
            e.currentTarget.style.color = "#FCA5A5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = SIDEBAR.text;
          }}
        >
          <FaSignOutAlt /> <span className="sidebar-logout-text">Logout</span>
        </button>

        <div style={platformMarkWrapStyle} className="sidebar-platform">
          <div style={{ fontWeight: 600 }}>Powered by KlikSantri</div>
          <div style={{ fontWeight: 400, marginTop: "2px", opacity: 0.9 }}>Amanah Kita Bersama</div>
        </div>
      </div>
    </div>
  );
}

const topStyle = {
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
};

const brandContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-3)",
  minWidth: 0,
};

const brandMarkStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "var(--accent-teal-gradient)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "15px",
  flexShrink: 0,
  boxShadow: "0 4px 12px rgba(20, 184, 166, 0.25)",
};

const brandTitleStyle = {
  color: "#F8FAFC",
  fontWeight: 700,
  fontSize: "14px",
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const brandSubtitleStyle = {
  color: SIDEBAR.textFaint,
  fontWeight: 500,
  fontSize: "11px",
  lineHeight: 1.35,
  marginTop: "2px",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const brandWrapperStyle = {
  paddingBottom: "var(--space-4)",
  marginBottom: "var(--space-4)",
  borderBottom: `1px solid ${SIDEBAR.border}`,
  flexShrink: 0,
};

const navStyle = {
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: "var(--space-1)",
  flex: 1,
  minHeight: 0,
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(148, 163, 184, 0.35) transparent",
};

const sectionStyle = {
  marginBottom: "var(--space-4)",
};

const sectionHeaderButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 8px",
  marginBottom: "var(--space-2)",
  marginLeft: "-8px",
  width: "calc(100% + 8px)",
  background: "transparent",
  border: "none",
  borderRadius: "var(--radius-md)",
  cursor: "pointer",
  textAlign: "left",
  transition: "background 180ms ease",
};

const sectionTitleStyle = {
  color: SIDEBAR.textFaint,
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "var(--space-2)",
  paddingLeft: "var(--space-1)",
};

const chevronStyle = {
  display: "inline-flex",
  alignItems: "center",
  color: SIDEBAR.textMuted,
  marginBottom: "var(--space-2)",
  transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
  transformOrigin: "center",
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
  padding: "9px var(--space-3)",
  paddingLeft: "calc(var(--space-3) - 3px)",
  borderRadius: "10px",
  borderLeft: "3px solid transparent",
  transition: "background 180ms ease, color 180ms ease, transform 180ms ease, border-color 180ms ease",
  textDecoration: "none",
  minHeight: "38px",
  boxSizing: "border-box",
};

const iconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  flexShrink: 0,
  fontSize: "14px",
  transition: "color 180ms ease",
};

const menuTextStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  lineHeight: 1.3,
};

const footerStyle = {
  paddingTop: "var(--space-4)",
  marginTop: "var(--space-4)",
  borderTop: `1px solid ${SIDEBAR.border}`,
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
  color: SIDEBAR.text,
  border: "none",
  padding: "9px var(--space-3)",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  transition: "background 180ms ease, color 180ms ease",
};

const platformMarkWrapStyle = {
  color: SIDEBAR.textFaint,
  fontSize: "11px",
  lineHeight: 1.45,
  opacity: 0.85,
};

export default Sidebar;
