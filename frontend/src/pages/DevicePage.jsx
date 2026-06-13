import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
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

function DevicePage() {
  const [devices, setDevices] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const getDevices = async () => {
    try {
      const res = await api.get("/devices");
      setDevices(res.data.data || []);
    } catch (err) {
      console.error(err);
      setDevices([]);
    }
  };

  useEffect(() => {
    getDevices();

    const interval = setInterval(() => {
      getDevices();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const isOnline = (last_ping) => {
    if (!last_ping) return false;

    const now = new Date();
    const ping = new Date(last_ping);
    const diff = (now - ping) / 1000;

    return diff < 15;
  };

  const filteredDevices = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      [d.id, d.nama_device, d.device_id, d.ip_address, d.last_ping]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [devices, tableSearch]);

  const { page, setPage, paginatedItems, totalItems, pageSize } =
    useClientPagination(filteredDevices);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

  return (
    <AppShell title="Device Monitoring" breadcrumb="Sistem / Perangkat">
      <DataTableCard
        title="Status Perangkat"
        subtitle="Monitoring koneksi perangkat secara real-time"
        actions={
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {filteredDevices.length} perangkat
          </span>
        }
      >
        <TableToolbar
          search={
            <SearchInput
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cari ID, nama device, IP..."
            />
          }
        />

        {filteredDevices.length === 0 ? (
          <EmptyState
            title={
              devices.length === 0
                ? "Belum ada perangkat terdaftar"
                : "Tidak ada hasil pencarian"
            }
            description={
              devices.length === 0
                ? "Perangkat akan muncul setelah terhubung ke sistem."
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
                    <th>Nama Device</th>
                    <th>Device ID</th>
                    <th>Status</th>
                    <th>IP</th>
                    <th>Last Ping</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((d) => {
                    const online = isOnline(d.last_ping);
                    return (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td className="table-v3__cell--strong">
                          {d.nama_device || "—"}
                        </td>
                        <td>{d.device_id}</td>
                        <td>
                          <StatusBadge status={online ? "Online" : "Offline"} />
                        </td>
                        <td>{d.ip_address || "—"}</td>
                        <td className="table-v3__cell--mono">
                          {d.last_ping
                            ? new Date(d.last_ping).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
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

export default DevicePage;
