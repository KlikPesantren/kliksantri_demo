# Arsitektur Produk Dompet Santri

## Posisi produk

- Core: **Dompet Santri** — saldo, topup, penarikan, mutasi, riwayat transaksi, dan pengaturan limit.
- Add-on: **RFID Cashless** — kartu, device, merchant, monitoring, dan refund pembayaran RFID.
- RFID adalah metode transaksi, bukan pemilik saldo.

## Kompatibilitas sprint ini

- Tabel dan endpoint lama (`transaksi_rfid`, `merchant_rfid`, `devices`, dan `/rfid/*`) tetap dipakai.
- Tidak ada perubahan perhitungan atau mutasi saldo.
- UI memakai istilah Dompet Santri untuk fungsi saldo, topup, mutasi, dan riwayat.
- `transaction_method` masih berupa mapping presentasi: `manual`, `rfid`, `future_qris`, `future_transfer`, `future_cashier`.
- Permission target dipisah menjadi `wallet.*` untuk core dan `rfid.*` untuk add-on. Selama masa kompatibilitas, layar core menerima `wallet.*` atau permission lama `rfid.*`.

## Limit

Limit adalah pengaturan Dompet Santri, tetapi penegakannya hanya berlaku pada transaksi RFID mode online. Pada mode offline limit dinyatakan nonaktif. Sprint ini hanya mengubah penjelasan; implementasi limit yang stabil tidak diubah.

## Sprint berikutnya

1. Migration feature catalog untuk core `wallet` dan add-on `rfid`.
2. Migration permission `wallet.view` dan `wallet.manage`, termasuk backfill role.
3. Migration nullable `transaction_method` beserta backfill yang dapat diaudit.
4. Pisahkan middleware endpoint core dompet dari feature gate RFID tanpa mengganti URL lama.
5. Sediakan pengaturan limit dompet dengan transaksi database yang aman.
6. Tambahkan pengelolaan RFID Card dan flag mode online/offline yang eksplisit.
