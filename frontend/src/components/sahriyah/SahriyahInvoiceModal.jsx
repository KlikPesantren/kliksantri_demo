import { FaPrint, FaWhatsapp } from "react-icons/fa";
import Modal from "../Modal";
import Button from "../ui/Button";
import { FormActionBar } from "../ui/form";
import { formatCurrency } from "../../utils/formatCurrency";

function InfoRow({ label, value }) {
  return (
    <div className="invoice-preview__row">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function SahriyahInvoiceModal({
  open,
  invoice,
  loading = false,
  onClose,
  onPrint,
  onWhatsApp,
}) {
  const item = invoice?.items?.[0] || {};
  const tenantName = invoice?.tenant?.nama || "Pesantren";

  return (
    <Modal open={open} title="Invoice Pembayaran" onClose={onClose} width={760}>
      {loading ? (
        <div className="invoice-preview__empty">Memuat invoice...</div>
      ) : invoice ? (
        <>
          <style>{`
            .invoice-preview {
              border: 1px solid var(--border);
              border-radius: var(--radius-md);
              background: var(--card);
              overflow: hidden;
            }
            .invoice-preview__header {
              display: flex;
              align-items: center;
              gap: 14px;
              padding: 18px;
              border-bottom: 2px solid var(--primary);
              background: var(--neutral-subtle);
            }
            .invoice-preview__logo {
              width: 56px;
              height: 56px;
              border-radius: var(--radius-sm);
              border: 1px solid var(--border);
              object-fit: contain;
              background: #fff;
              flex-shrink: 0;
            }
            .invoice-preview__logo-fallback {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: var(--primary);
              font-size: 24px;
              font-weight: 800;
            }
            .invoice-preview__tenant {
              margin: 0;
              font-size: 18px;
              color: var(--text-primary);
            }
            .invoice-preview__meta {
              margin: 2px 0 0;
              color: var(--text-secondary);
              font-size: 13px;
            }
            .invoice-preview__title {
              padding: 16px 18px 0;
              margin: 0;
              font-size: 18px;
              text-align: center;
              letter-spacing: 0;
              color: var(--text-primary);
            }
            .invoice-preview__grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px;
              padding: 18px;
            }
            .invoice-preview__box {
              border: 1px solid var(--border);
              border-radius: var(--radius-sm);
              padding: 12px;
              min-width: 0;
            }
            .invoice-preview__row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              padding: 6px 0;
              border-bottom: 1px dashed var(--border);
              color: var(--text-secondary);
            }
            .invoice-preview__row:last-child {
              border-bottom: 0;
            }
            .invoice-preview__row strong {
              color: var(--text-primary);
              text-align: right;
            }
            .invoice-preview__table {
              width: calc(100% - 36px);
              margin: 0 18px 18px;
              border-collapse: collapse;
              color: var(--text-primary);
            }
            .invoice-preview__table th,
            .invoice-preview__table td {
              border: 1px solid var(--border);
              padding: 10px;
              text-align: left;
            }
            .invoice-preview__table th {
              background: var(--neutral-subtle);
              color: var(--text-secondary);
            }
            .invoice-preview__right {
              text-align: right !important;
            }
            .invoice-preview__footer {
              padding: 0 18px 18px;
              color: var(--text-secondary);
              text-align: center;
            }
            .invoice-preview__footer-main {
              color: var(--text-primary);
              font-weight: 800;
            }
            .invoice-preview__powered {
              margin-top: 2px;
              font-size: 12px;
            }
            .invoice-preview__empty {
              padding: 32px;
              text-align: center;
              color: var(--text-secondary);
            }
            @media (max-width: 720px) {
              .invoice-preview__grid {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
          <div className="invoice-preview">
            <div className="invoice-preview__header">
              {invoice.tenant?.logo_url ? (
                <img
                  className="invoice-preview__logo"
                  src={invoice.tenant.logo_url}
                  alt="Logo pesantren"
                />
              ) : (
                <div className="invoice-preview__logo invoice-preview__logo-fallback">
                  {(invoice.tenant?.nama || "K").slice(0, 1)}
                </div>
              )}
              <div>
                <h3 className="invoice-preview__tenant">{invoice.tenant?.nama}</h3>
                <p className="invoice-preview__meta">{invoice.tenant?.alamat}</p>
                <p className="invoice-preview__meta">{invoice.tenant?.telepon}</p>
              </div>
            </div>

            <h3 className="invoice-preview__title">BUKTI PEMBAYARAN</h3>

            <div className="invoice-preview__grid">
              <div className="invoice-preview__box">
                <InfoRow label="No Invoice" value={invoice.invoice_no} />
                <InfoRow label="Tanggal" value={invoice.tanggal_label} />
                <InfoRow label="Status" value={invoice.status} />
                <InfoRow label="Petugas" value={invoice.petugas} />
              </div>
              <div className="invoice-preview__box">
                <InfoRow label="Nama Santri" value={invoice.santri?.nama} />
                <InfoRow label="Kelas" value={invoice.kelas?.nama} />
                <InfoRow label="Nama Wali" value={invoice.wali?.nama} />
                <InfoRow label="No HP Wali" value={invoice.wali?.nomor_hp} />
              </div>
            </div>

            <table className="invoice-preview__table">
              <thead>
                <tr>
                  <th>Jenis Pembayaran</th>
                  <th>Periode</th>
                  <th className="invoice-preview__right">Nominal</th>
                  <th className="invoice-preview__right">Beras</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{item.description || "Sahriyah"}</td>
                  <td>{`${item.bulan_label || "-"} ${item.tahun || ""}`}</td>
                  <td className="invoice-preview__right">
                    {item.nominal_label || formatCurrency(invoice.total || 0)}
                  </td>
                  <td className="invoice-preview__right">
                    {Number(item.nominal_beras || 0)} Kg
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="invoice-preview__footer">
              <p>Terima kasih</p>
              <strong className="invoice-preview__footer-main">
                Dicetak secara digital oleh {tenantName}
              </strong>
              <p className="invoice-preview__powered">Didukung oleh KlikSantri</p>
            </div>
          </div>

          <FormActionBar className="form-action-bar-v3--compact">
            <Button variant="success" icon={<FaWhatsapp />} onClick={onWhatsApp}>
              WhatsApp
            </Button>
            <Button variant="secondary" icon={<FaPrint />} onClick={onPrint}>
              Print
            </Button>
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </FormActionBar>
        </>
      ) : (
        <div className="invoice-preview__empty">Invoice belum dipilih.</div>
      )}
    </Modal>
  );
}

export default SahriyahInvoiceModal;
