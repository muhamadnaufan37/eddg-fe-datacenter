# ZISWAF Digital API

Dokumentasi integrasi API donasi Zakat, Infaq, Sedekah, dan Wakaf melalui QRIS
BuatQris. Semua endpoint menggunakan prefix `/api/v1`.

## Persiapan

- Endpoint donasi memerlukan JWT login. Kirim token pada header
  `Authorization: Bearer <token>`.
- Backend menghubungi BuatQris. `account_id`, `secret_token`, signing secret,
  PIN, dan rekening penarikan hanya disimpan di environment backend.
- Konfigurasi yang diperlukan: `BUATQRIS_ACCOUNT_ID`,
  `BUATQRIS_SECRET_TOKEN`, dan `BUATQRIS_SIGNING_SECRET`. Penarikan juga
  memerlukan `BUATQRIS_WITHDRAWAL_ACCOUNT_ID` dan `BUATQRIS_WITHDRAWAL_PIN`.
- Atur URL webhook BuatQris menjadi:
  `https://<domain-backend>/api/v1/ziswaf/webhook`.
- `BUATQRIS_TEST_MODE=true` mengirim transaksi ke sandbox. Jangan aktifkan
  pada produksi.

## Biaya dan nominal

`amount` adalah nominal dasar transaksi yang dikirim ke BuatQris.
Backend mengirim `fee_by=user`, yang berarti biaya layanan gateway dipotong
dari saldo merchant/organisasi dan **tidak ditambahkan ke tagihan donatur**.
Contoh pada nominal Rp10.000 dengan fee 2%: `admin_fee` Rp200 dan
`credit_amount` sekitar Rp9.800.

BuatQris juga dapat menambahkan `amount_uniq` (kode unik) ke tagihan. Kode
unik ini berbeda dari biaya layanan dan dibayar donatur. Contoh respons:
`amount` Rp10.000, `admin_fee` Rp200, `amount_uniq` Rp390, sehingga
`total_amount` yang dibayar adalah Rp10.390 dan saldo merchant menerima
sekitar Rp9.800. Frontend harus membedakan biaya layanan yang dipotong dari
merchant dengan kode unik yang ditambahkan ke tagihan.

API BuatQris yang didokumentasikan tidak menyediakan parameter untuk
meniadakan kode unik. Karena itu, `amount` dari frontend **tidak menjamin**
bahwa `total_amount` yang dibayar donatur akan sama persis; selalu tampilkan
nilai `total_amount` dari respons gateway. Untuk membuat tagihan tepat sama
dengan nominal donasi, kode unik harus dinonaktifkan/diatur oleh BuatQris
melalui konfigurasi merchant atau dukungan penyedia. Jangan mengurangi
`amount` secara perkiraan di backend: nilai kode unik ditentukan oleh gateway
dan transaksi QRIS yang telah dibuat tidak dapat diubah oleh API ini.

Minimum/maksimum default adalah Rp1.000/Rp5.000.000; sesuaikan
`BUATQRIS_MINIMUM_AMOUNT` dan `BUATQRIS_MAXIMUM_AMOUNT` dengan konfigurasi
merchant di BuatQris.

## Format umum

Respons mengikuti format:

```json
{
  "success": true,
  "message": "Pesan",
  "data": {}
}
```

Kesalahan menggunakan `success: false` dan `message`. Validasi mengembalikan
HTTP 422; transaksi milik pengguna lain tidak dapat dibaca.

## Daftar donasi pengguna

`GET /api/v1/ziswaf/donations?per_page=15`

Header: `Authorization: Bearer <token>`.

Hasil berisi donasi milik pengguna yang sedang login, terbaru lebih dahulu.
`per_page` opsional, rentang 1–100.

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "uuid": "fba0b28f-37f4-4ba3-b3f6-f43507634f15",
        "donation_type": "infaq",
        "description": "Donasi Infaq",
        "amount": 10000,
        "total_amount": 10037,
        "amount_uniq": 37,
        "admin_fee": 200,
        "admin_fee_pct": 2,
        "credit_amount": 9800,
        "fee_by": "user",
        "qris_method": "qris_two",
        "qr_url": "https://app.buatqris.site/poto/qris/100043729581.png",
        "payment_url": "https://app.buatqris.site/trx/100043729581",
        "status": "pending",
        "is_test": false,
        "expired_at": "2026-11-14T12:15:00+07:00",
        "paid_at": null,
        "created_at": "2026-11-14T12:00:00+07:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
}
```

## Membuat QRIS donasi

`POST /api/v1/ziswaf/donations`

Header:

```text
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "request_id": "d4d7e6f4-4d6e-4e88-9a61-d21e6a51aebd",
  "donation_type": "infaq",
  "amount": 10000
}
```

- `request_id`: UUID unik per percobaan pembayaran. Kirim nilai yang sama
  saat mengulang request yang hasilnya belum diketahui untuk mencegah QRIS
  ganda. Gunakan UUID baru untuk membuat pembayaran baru.
- `donation_type`: `zakat`, `infaq`, `sedekah`, atau `wakaf`.
- `amount`: integer rupiah, batas default Rp1.000–Rp5.000.000.

Sukses: HTTP 201. Data berisi UUID lokal donasi, nominal, status, dan URL QR.
Jika tersedia pada respons BuatQris, `qris_image` juga disertakan hanya pada
respons pembuatan. Jangan mencari atau mengirim `qris_string`, `qris_url`, atau
`direct_url`; data tersebut tidak diteruskan ke frontend.

Jika `request_id` yang sama sudah pernah dipakai, API mengembalikan transaksi
yang tersimpan tanpa membuat QRIS baru. Permintaan yang masih diproses
mengembalikan HTTP 202.

## Detail dan cek status donasi

`GET /api/v1/ziswaf/donations/{uuid}`

Header: `Authorization: Bearer <token>`.

Hanya pemilik transaksi yang dapat mengaksesnya. Untuk status `pending`, API
memeriksa status ke BuatQris. Pengecekan dibatasi satu kali per 20 detik untuk
setiap transaksi; jika terlalu cepat, API mengembalikan HTTP 429 dan header
`Retry-After`. Gunakan webhook sebagai sumber pembaruan utama dan endpoint ini
untuk menampilkan status terbaru.

Status donasi: `processing`, `pending`, `success`, `expired`, `failed`.

## Daftar semua donasi (admin)

`GET /api/v1/ziswaf/admin/donations?status=success&donation_type=infaq&per_page=15`

Hanya `role_id` 1 (Superadmin) dan 3 (Bendahara/KU) yang diizinkan. Filter
opsional: `status`, `donation_type`, `per_page`.

## Webhook BuatQris

`POST /api/v1/ziswaf/webhook` — endpoint publik untuk gateway, bukan untuk
dipanggil frontend.

Backend memeriksa header `X-BuatQris-Signature` terhadap HMAC-SHA256 dari body
mentah, menggunakan `BUATQRIS_SIGNING_SECRET`. Event berulang diproses
idempoten. Balas HTTP 2xx hanya setelah event valid diproses.

Event yang diterima: `payment.success`, `payment.expired`, `payment.failed`,
`withdrawal.pending`, `withdrawal.approved`, dan `withdrawal.rejected`.

Contoh body pembayaran:

```json
{
  "event": "payment.success",
  "transaction_id": "100043729581",
  "status": "success",
  "amount": 10000,
  "total_amount": 10037,
  "credit_amount": 9800,
  "admin_fee": 200,
  "fee_by": "user",
  "is_test": false,
  "paid_at": "2026-11-14T12:03:00+07:00"
}
```

Webhook dengan tanda tangan salah mendapat HTTP 401. Jika event valid tiba
sebelum response pembuatan transaksi tersimpan, backend menyimpan event dan
mencocokkannya saat transaksi tersimpan; responsnya HTTP 202.

## Penarikan saldo (admin)

Fitur ini hanya untuk Superadmin (role 1) dan Bendahara/KU (role 3). Rekening
dan PIN tujuan diambil dari environment server; frontend **tidak** mengirim
`wd_pin`, `wd_account_id`, nomor rekening, atau kredensial BuatQris.

Daftar penarikan:

`GET /api/v1/ziswaf/admin/withdrawals?per_page=15`

Ajukan penarikan:

`POST /api/v1/ziswaf/admin/withdrawals`

```json
{
  "amount": 100000
}
```

Detail/status penarikan:

`GET /api/v1/ziswaf/admin/withdrawals/{uuid}`

Jika penarikan masih `pending`, endpoint detail mengecek status ke BuatQris.
Biaya akhir dikembalikan oleh gateway sebagai `fee` dan `net_amount`; jangan
menghitungnya di frontend.

## Catatan frontend

- Jangan menandai pembayaran lunas hanya karena request berhasil dibuat atau
  status HTTP adalah 200. Tunggu `data.status === "success"`.
- Tampilkan nominal bayar dari `total_amount`. Bedakan `amount_uniq` sebagai
  kode unik yang ditambahkan ke tagihan dan `admin_fee` sebagai biaya layanan
  yang dipotong dari merchant.
- QR dapat ditampilkan menggunakan `qr_url` atau `qris_image`.
- Status final dari webhook: `success`, `expired`, atau `failed`.
