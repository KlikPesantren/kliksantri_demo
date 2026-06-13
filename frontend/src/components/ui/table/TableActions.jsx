import {
  FaEdit,
  FaEye,
  FaHistory,
  FaToggleOff,
  FaToggleOn,
  FaTrash,
} from "react-icons/fa";

const TYPE_META = {
  edit: { icon: FaEdit, title: "Edit" },
  detail: { icon: FaEye, title: "Detail" },
  history: { icon: FaHistory, title: "Riwayat" },
  delete: { icon: FaTrash, title: "Hapus" },
};

function TableActions({ items = [] }) {
  const visible = items.filter((item) => !item.hidden);

  if (visible.length === 0) return null;

  return (
    <div className="table-actions-v3">
      {visible.map((item, index) => {
        if (item.type === "toggle") {
          const active = Boolean(item.active);
          const Icon = active ? FaToggleOff : FaToggleOn;
          const title = item.title || (active ? "Nonaktifkan" : "Aktifkan");

          return (
            <button
              key={item.key || `toggle-${index}`}
              type="button"
              className={`table-action-v3${active ? " table-action-v3--warning" : " table-action-v3--success"}`}
              title={title}
              aria-label={title}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              <Icon size={14} />
            </button>
          );
        }

        if (item.type === "custom") {
          const Icon = item.icon;
          if (!Icon) return null;

          return (
            <button
              key={item.key || `custom-${index}`}
              type="button"
              className={`table-action-v3${item.variant ? ` table-action-v3--${item.variant}` : ""}`}
              title={item.title || ""}
              aria-label={item.title || "Aksi"}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              <Icon size={14} />
            </button>
          );
        }

        const meta = TYPE_META[item.type];
        if (!meta) return null;

        const Icon = meta.icon;
        const title = item.title || meta.title;

        return (
          <button
            key={item.key || `${item.type}-${index}`}
            type="button"
            className={`table-action-v3${item.type === "delete" ? " table-action-v3--danger" : ""}`}
            title={title}
            aria-label={title}
            disabled={item.disabled}
            onClick={item.onClick}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

export default TableActions;
