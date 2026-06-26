const express = require("express");
const invoiceService = require("../services/invoiceService");

const router = express.Router();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function withAbsoluteAssetUrl(req, invoice) {
  const logoUrl = invoice.tenant?.logo_url;
  if (!logoUrl || !String(logoUrl).startsWith("/")) return invoice;

  const origin = `${req.protocol}://${req.get("host")}`;
  return {
    ...invoice,
    tenant: {
      ...invoice.tenant,
      logo_url: `${origin}${logoUrl}`,
    },
  };
}

function renderSahriyahPrintHtml(invoice) {
  const item = invoice.items[0] || {};
  const logoHtml = invoice.tenant.logo_url
    ? `<img class="logo" src="${escapeHtml(invoice.tenant.logo_url)}" alt="Logo" />`
    : `<div class="logo logo--placeholder">${escapeHtml((invoice.tenant.nama || "K").slice(0, 1))}</div>`;

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(invoice.invoice_no)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f3f4f6;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 22mm;
      background: #ffffff;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 3px solid #16a34a;
      padding-bottom: 16px;
      margin-bottom: 22px;
    }
    .logo {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .logo--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #16a34a;
      font-weight: 800;
      font-size: 28px;
    }
    .tenant-name { margin: 0; font-size: 20px; }
    .tenant-meta { margin: 2px 0 0; color: #4b5563; }
    .title {
      text-align: center;
      font-size: 22px;
      letter-spacing: 1px;
      margin: 18px 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 20px;
    }
    .box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      padding: 5px 0;
      border-bottom: 1px dashed #e5e7eb;
    }
    .row:last-child { border-bottom: 0; }
    .label { color: #6b7280; }
    .value { text-align: right; font-weight: 700; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 10px;
      text-align: left;
    }
    th { background: #f9fafb; }
    .right { text-align: right; }
    .total {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
    .total-box {
      min-width: 260px;
      border: 1px solid #16a34a;
      border-radius: 8px;
      padding: 12px;
    }
    .footer {
      margin-top: 36px;
      text-align: center;
      color: #4b5563;
    }
    .brand { color: #16a34a; font-weight: 800; }
    .actions {
      position: sticky;
      top: 0;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      background: #111827;
    }
    .actions button {
      border: 0;
      border-radius: 6px;
      background: #16a34a;
      color: #ffffff;
      padding: 9px 14px;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      body { background: #ffffff; }
      .page { width: auto; min-height: auto; margin: 0; padding: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">Print</button>
  </div>
  <main class="page">
    <header class="header">
      ${logoHtml}
      <div>
        <h1 class="tenant-name">${escapeHtml(invoice.tenant.nama || "-")}</h1>
        <p class="tenant-meta">${escapeHtml(invoice.tenant.alamat || "")}</p>
        <p class="tenant-meta">${escapeHtml(invoice.tenant.telepon || "")}${invoice.tenant.email ? " | " + escapeHtml(invoice.tenant.email) : ""}</p>
      </div>
    </header>

    <h2 class="title">BUKTI PEMBAYARAN</h2>

    <section class="grid">
      <div class="box">
        <div class="row"><span class="label">No Invoice</span><span class="value">${escapeHtml(invoice.invoice_no)}</span></div>
        <div class="row"><span class="label">Tanggal</span><span class="value">${escapeHtml(invoice.tanggal_label || "-")}</span></div>
        <div class="row"><span class="label">Status</span><span class="value">${escapeHtml(invoice.status || "-")}</span></div>
        <div class="row"><span class="label">Petugas</span><span class="value">${escapeHtml(invoice.petugas || "-")}</span></div>
      </div>
      <div class="box">
        <div class="row"><span class="label">Nama Santri</span><span class="value">${escapeHtml(invoice.santri.nama || "-")}</span></div>
        <div class="row"><span class="label">Kelas</span><span class="value">${escapeHtml(invoice.kelas.nama || "-")}</span></div>
        <div class="row"><span class="label">Nama Wali</span><span class="value">${escapeHtml(invoice.wali.nama || "-")}</span></div>
        <div class="row"><span class="label">No HP Wali</span><span class="value">${escapeHtml(invoice.wali.nomor_hp || "-")}</span></div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Jenis Pembayaran</th>
          <th>Periode</th>
          <th class="right">Nominal</th>
          <th class="right">Beras</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(item.description || "Sahriyah")}</td>
          <td>${escapeHtml(`${item.bulan_label || "-"} ${item.tahun || ""}`.trim())}</td>
          <td class="right">${escapeHtml(item.nominal_label || invoice.total_label || "-")}</td>
          <td class="right">${escapeHtml(Number(item.nominal_beras || 0))} Kg</td>
        </tr>
      </tbody>
    </table>

    <div class="total">
      <div class="total-box">
        <div class="row"><span class="label">Total Dibayar</span><span class="value">${escapeHtml(invoice.total_label || "-")}</span></div>
        <div class="row"><span class="label">Metode</span><span class="value">${escapeHtml(invoice.payment_method || "-")}</span></div>
      </div>
    </div>

    <footer class="footer">
      <p>Terima kasih</p>
      <p><span class="brand">KlikSantri</span> - Amanah Kita Bersama</p>
    </footer>
  </main>
</body>
</html>`;
}

router.get("/sahriyah/:id", async (req, res) => {
  try {
    const invoice = await invoiceService.getSahriyahInvoice(
      req.tenantId,
      Number(req.params.id)
    );

    res.json({
      success: true,
      data: withAbsoluteAssetUrl(req, invoice),
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get("/sahriyah/:id/print", async (req, res) => {
  try {
    const invoice = await invoiceService.getSahriyahInvoice(
      req.tenantId,
      Number(req.params.id)
    );
    const html = renderSahriyahPrintHtml(withAbsoluteAssetUrl(req, invoice));

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(err.statusCode || 500).send(
      `<!doctype html><html><body><h1>${escapeHtml(err.message)}</h1></body></html>`
    );
  }
});

module.exports = router;
