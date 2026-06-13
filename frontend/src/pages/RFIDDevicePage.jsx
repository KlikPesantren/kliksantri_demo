import { useEffect, useMemo, useState } from "react";
import AppShell from "../layouts/AppShell";
import api from "../services/api";
import KpiCard from "../components/ui/KpiCard";
import KpiGrid from "../components/ui/KpiGrid";
import { formatNumber } from "../utils/formatCurrency";
import DataTableCard from "../components/ui/DataTableCard";
import TableToolbar from "../components/ui/TableToolbar";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";
import { Table, TableScroll, TablePagination, useClientPagination } from "../components/ui/table";

function RFIDDevicePage() {  const [devices, setDevices] = useState([]);
  const [tableSearch, setTableSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await api.get("/devices");
      setDevices(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredDevices = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      [d.id, d.device_id, d.status, d.ip_address, d.firmware_version]
        .some((field) => String(field || "").toLowerCase().includes(q)),
    );
  }, [devices, tableSearch]);

  const { page, setPage, paginatedItems, totalItems, pageSize } = useClientPagination(filteredDevices);

  useEffect(() => {
    setPage(1);
  }, [tableSearch, setPage]);

  const online = devices.filter((d) => d.status === "online").length;
  const offline = devices.filter((d) => d.status !== "online").length;
  const synced = devices.filter((d) => d.last_sync).length;

  return (
    <AppShell
      title="RFID Devices"
      description="Monitoring seluruh RFID EDC"
      breadcrumb="Keamanan / RFID Devices"
    >
      <KpiGrid>
        <KpiCard label="Total Device" value={formatNumber(devices.length)} accent="primary" />
        <KpiCard label="Device Online" value={formatNumber(online)} accent="success" />
        <KpiCard label="Device Offline" value={formatNumber(offline)} accent="danger" />
        <KpiCard label="Sync" value={formatNumber(synced)} accent="info" />
      </KpiGrid>

      <div style={{ marginTop: "var(--space-6)" }}>
        <DataTableCard
          title="Daftar Perangkat RFID"
          subtitle="Status koneksi dan sinkronisasi EDC"
          actions={
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {filteredDevices.length} device
            </span>
          }
        >
          <TableToolbar
            search={
              <SearchInput
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari device ID, IP, firmware..."
              />
            }
          />

          {filteredDevices.length === 0 ? (
            <EmptyState
              title={devices.length === 0 ? "Belum ada perangkat" : "Tidak ada hasil pencarian"}
              description={
                devices.length === 0
                  ? "Perangkat EDC akan muncul setelah terdaftar."
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
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Last Ping</th>
                    <th>Last Sync</th>
                    <th>Firmware</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((d) => (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td className="table-v3__cell--strong">{d.device_id}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td>{d.ip_address ? d.ip_address.replace("::ffff:", "") : "—"}</td>
                      <td className="table-v3__cell--mono">
                        {d.last_ping ? new Date(d.last_ping).toLocaleString() : "—"}
                      </td>
                      <td className="table-v3__cell--mono">
                        {d.last_sync ? new Date(d.last_sync).toLocaleString() : "—"}
                      </td>
                      <td>{d.firmware_version || "—"}</td>
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
          )}        </DataTableCard>
      </div>
    </AppShell>
  );
}

export default RFIDDevicePage;
