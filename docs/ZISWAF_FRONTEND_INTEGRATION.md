# Integrasi frontend ZISWAF

Panduan ini memakai sesi otomatis berbasis cookie HttpOnly. Frontend tidak
memanggil login pengguna biasa dan tidak menyimpan atau mengirim JWT untuk
endpoint ZISWAF. Backend menjalankan akun layanan; sesi browser hanya dapat
mengakses donasi yang dibuat oleh sesi itu.

Aktifkan dan konfigurasi fitur di backend terlebih dahulu sesuai
[panduan konfigurasi backend](./ZISWAF_BACKEND_AUTO_LOGIN.md). Kontrak respons
QRIS lengkap ada di [ZISWAF Digital API](./ZISWAF_DIGITAL_API.md).

## Konfigurasi HTTP client

Variabel publik frontend hanya berisi URL API, bukan kredensial:

```dotenv
VITE_PUBLIC_REACT_APP_BASE_URL_API=https://<domain-backend>/api/v1
```

Contoh Axios:

```js
import axios from "axios";

export const ziswafApi = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_REACT_APP_BASE_URL_API,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
```

Pastikan interceptor autentikasi aplikasi tidak menambahkan bearer JWT ke
request ZISWAF. Browser mengelola cookie `ziswaf_session`; JavaScript tidak
dapat membaca nilainya karena cookie `HttpOnly`.

Frontend dan backend harus menggunakan HTTPS di produksi. Jika keduanya
berbeda site, backend perlu `SameSite=None; Secure` dan konfigurasi CORS
berkredensial untuk origin frontend yang persis.

## Memulai dan mengakhiri sesi

Panggil `POST /ziswaf/session` saat halaman ZISWAF dimulai. Endpoint ini
membuat sesi otomatis atau mengembalikan sesi yang masih berlaku:

```js
export async function startZiswafSession() {
  const { data } = await ziswafApi.post("/ziswaf/session");
  return data.data; // { user, expires_at }
}
```

Jangan mengirim username/password di body. Respons sesi tidak berisi JWT.
Simpan data profil untuk kebutuhan tampilan saja; sesi sebenarnya tetap di
cookie browser.

Untuk logout:

```js
export async function endZiswafSession() {
  await ziswafApi.delete("/ziswaf/session");
}
```

Jika sesi kedaluwarsa, panggil kembali `startZiswafSession()`. Untuk operasi
GET yang gagal dengan `401`, sesi boleh dibuat ulang lalu GET diulang satu
kali. Jangan mengulang POST pembayaran dengan UUID baru.

## Membuat donasi QRIS

Buat satu `request_id` UUID untuk setiap percobaan pembayaran. Jika hasil
request tidak diketahui karena timeout/jaringan putus, ulangi request dengan
payload dan `request_id` yang sama. Gunakan UUID baru hanya untuk pembayaran
baru.

```js
export async function createDonation({ donation_type, amount, request_id }) {
  const { data } = await ziswafApi.post("/ziswaf/donations", {
    request_id,
    donation_type,
    amount,
  });

  return data.data;
}

// Buat UUID satu kali saat pengguna memulai percobaan pembayaran.
const paymentAttempt = {
  request_id: crypto.randomUUID(),
  donation_type: "infaq",
  amount: 10000,
};

const donation = await createDonation(paymentAttempt);
```

`donation_type` harus `zakat`, `infaq`, `sedekah`, atau `wakaf`. `amount`
adalah integer rupiah sesuai batas minimum/maksimum backend.

Tampilkan QR dari `qris_image` bila tersedia, atau gunakan `qr_url`.
Tampilkan jumlah yang harus dibayar dari `total_amount`, bukan hanya
`amount`. `amount_uniq` adalah kode unik yang ditambahkan ke tagihan,
sedangkan `admin_fee` adalah biaya gateway yang dipotong dari merchant.

HTTP `201` menandakan QR berhasil dibuat, bukan pembayaran sudah lunas.
Tunggu sampai `status` menjadi `success`.

## Daftar dan status donasi

```js
export async function listDonations(page = 1, per_page = 15) {
  const { data } = await ziswafApi.get("/ziswaf/donations", {
    params: { page, per_page },
  });
  return data.data; // { items, pagination }
}

export async function getDonation(uuid) {
  const { data } = await ziswafApi.get(`/ziswaf/donations/${uuid}`);
  return data.data;
}
```

`per_page` dibatasi 1–100. Endpoint detail memperbarui transaksi berstatus
`pending`; pengecekan dibatasi satu kali per 20 detik untuk setiap transaksi.
Jika mendapat HTTP `429`, hormati header `Retry-After`, jangan polling terus
menerus. Status yang mungkin: `processing`, `pending`, `success`, `expired`,
dan `failed`.

Riwayat dan detail otomatis dibatasi ke sesi browser yang membuat donasi.
UUID transaksi bukan otorisasi. Jika pengguna memulai sesi baru setelah sesi
lama berakhir, riwayat sesi lama tidak ikut ditampilkan.

## Error yang perlu ditangani

| HTTP | Penanganan frontend |
|---|---|
| `401` | Sesi tidak valid/kedaluwarsa; buat sesi baru. |
| `403` | Origin tidak diizinkan atau akses admin ditolak; jangan mengulang otomatis. |
| `409` | `request_id` bentrok dengan sesi lain; mulai percobaan baru hanya setelah memastikan transaksi sebelumnya tidak sedang dibuat. |
| `422` | Tampilkan error validasi nominal/jenis donasi. |
| `429` | Hormati `Retry-After` sebelum mengulang. |
| `502`, `503` | Tampilkan kegagalan layanan; jangan menganggap transaksi berhasil. Untuk POST yang hasilnya tidak diketahui, retry dengan `request_id` sama. |

Endpoint admin donasi dan penarikan tidak tersedia untuk sesi otomatis. Jangan
menampilkan menu admin atau mengirim request penarikan dari frontend publik.
Webhook BuatQris juga hanya dikirim ke backend, bukan dipanggil browser.
