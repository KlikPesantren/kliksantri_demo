import Modal from "../Modal";

import Button from "../ui/Button";

import { formatCurrency } from "../../utils/formatCurrency";

import { FormField, Input, FormActionBar } from "../ui/form";

import { getTagihanSisa } from "./pembayaranShared";



function BayarModal({ tagihan, nominalBayar, onNominalChange, onSave, onClose, isSaving = false }) {

  if (!tagihan) return null;



  const totalTagihan = Number(tagihan.nominal_tagihan || 0);

  const sudahDibayar = Number(tagihan.nominal_bayar || 0);

  const sisaTagihan = getTagihanSisa(tagihan);



  const isiBayarSisa = () => {

    if (sisaTagihan > 0) {

      onNominalChange(String(sisaTagihan));

    }

  };



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

          <strong>Total Tagihan:</strong> {formatCurrency(totalTagihan)}

        </p>

        <p>

          <strong>Sudah Dibayar:</strong> {formatCurrency(sudahDibayar)}

        </p>

        <p>

          <strong>Sisa Tagihan:</strong> {formatCurrency(sisaTagihan)}

        </p>

      </div>



      <FormField label="Nominal Bayar" htmlFor="bayar-nominal" required>

        <Input

          id="bayar-nominal"

          type="number"

          value={nominalBayar}

          onChange={(e) => onNominalChange(e.target.value)}

          disabled={isSaving}

        />

      </FormField>



      <FormActionBar className="form-action-bar-v3--compact">

        <Button onClick={isiBayarSisa} variant="secondary" disabled={isSaving || sisaTagihan <= 0}>

          Bayar Sisa

        </Button>

        <Button onClick={onSave} disabled={isSaving}>

          {isSaving ? "Menyimpan..." : "Bayar"}

        </Button>

        <Button variant="outline" onClick={onClose} disabled={isSaving}>

          Batal

        </Button>

      </FormActionBar>

    </Modal>

  );

}



export default BayarModal;

