function TableToolbar({
  search = null,
  searchPlaceholder,
  actions = null,
  children = null,
}) {
  const searchNode =
    search ??
    (searchPlaceholder ? (
      <input
        type="search"
        placeholder={searchPlaceholder}
        readOnly
        style={{ display: "none" }}
        aria-hidden
      />
    ) : null);

  return (
    <div style={toolbarStyle} className="table-toolbar">
      {searchNode && (
        <div style={searchWrapStyle} className="table-toolbar-search">
          {searchNode}
        </div>
      )}
      {(actions || children) && (
        <div style={actionsWrapStyle} className="table-toolbar-actions">
          {children}
          {actions}
        </div>
      )}
      <style>{`
        .table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          flex-wrap: wrap;
          margin-bottom: var(--space-4);
        }
        .table-toolbar-search {
          flex: 1 1 240px;
          min-width: 0;
          max-width: 420px;
        }
        .table-toolbar-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .table-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .table-toolbar-search {
            flex: 1 1 auto;
            max-width: none;
            width: 100%;
          }
          .table-toolbar-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }
          .table-toolbar-actions > * {
            width: 100%;
          }
          .table-toolbar-actions button,
          .table-toolbar-actions a {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

const toolbarStyle = {};

const searchWrapStyle = {};

const actionsWrapStyle = {};

export default TableToolbar;
