import Modal from "../Modal";
import Button from "../ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { FormField, Input, FormActionBar } from "../ui/form";

function BayarModal({ tagihan, nominalBayar, onNominalChange, onSave, onClose }) {
  if (!tagihan) return null;

  return (
    <Modal open title="Pembayaran Tagihan" onClose={onClose} width={440}>
      <div className="form-modal-summary-v3">
        <p>
          <strong>Santri:</strong> {tagihan.nama}
        </p>
        <p>
          <strong>Tagihan:</strong> {tagihan.nama_tagihan}
        </p>
        <p>
          <strong>Sisa:</strong> {formatCurrency(tagihan.sisa_tunggakan || 0)}
        </p>
      </div>

      <FormField label="Nominal Bayar" htmlFor="bayar-nominal" required>
        <Input
          id="bayar-nominal"
          type="number"
          value={nominalBayar}
          onChange={(e) => onNominalChange(e.target.value)}
        />
      </FormField>

      <FormActionBar className="form-action-bar-v3--compact">
        <Button onClick={onSave}>Bayar</Button>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
      </FormActionBar>
    </Modal>
  );
}

export default BayarModal;
