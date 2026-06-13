import Modal from "../Modal";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import { Table, TableScroll } from "../ui/table";
import { formatCurrency } from "../../utils/formatCurrency";
import { FormActionBar } from "../ui/form";

function HistoriModal({ open, riwayat, onClose }) {
  return (
    <Modal open={open} title="Histori Pembayaran" onClose={onClose} width={520}>
      {riwayat.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          description="Pembayaran untuk tagihan ini belum tercatat."
        />
      ) : (
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nominal</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((r) => (
                <tr key={r.id}>
                  <td>{r.tanggal}</td>
                  <td className="table-v3__cell--strong">{formatCurrency(r.nominal)}</td>
                  <td>{r.petugas || "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      )}
      <FormActionBar className="form-action-bar-v3--compact">
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
      </FormActionBar>
    </Modal>
  );
}

export default HistoriModal;
