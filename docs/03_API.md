# API

## PENDIDIKAN

GET /absensi
POST /absensi

GET /absensi-guru
POST /absensi-guru

GET /hafalan
POST /hafalan
PUT /hafalan/:id
DELETE /hafalan/:id

GET /nilai
POST /nilai
PUT /nilai/:id
DELETE /nilai/:id

---

## KEAMANAN

GET /perizinan
POST /perizinan
PUT /perizinan/:id
DELETE /perizinan/:id

PUT /perizinan/kembali/:id

GET /pelanggaran
POST /pelanggaran
PUT /pelanggaran/:id
DELETE /pelanggaran/:id

---

## KEUANGAN

### Buku Kas

GET /buku-kas
POST /buku-kas
PUT /buku-kas/:id
DELETE /buku-kas/:id

### Sahriyah

GET /sahriyah

POST /sahriyah/generate

PUT /sahriyah/bayar/:id