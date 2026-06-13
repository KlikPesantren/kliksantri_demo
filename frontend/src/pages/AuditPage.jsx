import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AppShell from "../layouts/AppShell";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import {
  Table,
  TableScroll,
  TablePagination,
  useClientPagination,
} from "../components/ui/table";

function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const getLogs = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/audit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLogs(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getLogs();

    const interval = setInterval(() => {
      getLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) =>
      [log.id, log.device_id, log.event_type, log.detail, log.created_at]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [logs, tableSearch]);

  const { page, setPage, paginatedItems, totalItems, pageSize } =
    useClientPagination(filteredLogs);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

  return (
    <AppShell title="Audit Log" breadcrumb="Sistem / Audit">
      <DataTableCard
        title="Log Aktivitas Device"
        subtitle="Riwayat event perangkat tercatat otomatis"
        actions={
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {filteredLogs.length} entri
          </span>
        }
      >
        <TableToolbar
          search={
            <SearchInput
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cari device, event, detail..."
            />
          }
        />

        {filteredLogs.length === 0 ? (
          <EmptyState
            title={
              logs.length === 0 ? "Belum ada log audit" : "Tidak ada hasil pencarian"
            }
            description={
              logs.length === 0
                ? "Aktivitas perangkat akan tercatat di sini secara otomatis."
                : "Coba kata kunci lain atau hapus filter pencarian."
            }
          />
        ) : (
          <>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Device</th>
                    <th>Event</th>
                    <th>Detail</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td className="table-v3__cell--strong">{log.device_id}</td>
                      <td>
                        <StatusBadge status={log.event_type} />
                      </td>
                      <td>{log.detail || "—"}</td>
                      <td className="table-v3__cell--mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          </>
        )}
      </DataTableCard>
    </AppShell>
  );
}

export default AuditPage;
