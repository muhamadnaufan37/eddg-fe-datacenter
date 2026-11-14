# Autentikasi Otomatis ZISWAF — Panduan Backend

Dokumen ini menjelaskan rancangan backend agar halaman ZISWAF dapat berjalan
tanpa form login, tanpa mengirim username/password atau JWT ke browser. Ini
adalah kontrak implementasi yang disarankan; endpoint sesi/BFF di bawah belum
tersedia hanya karena didokumentasikan.

## Mengapa kredensial harus berada di backend

Aplikasi frontend Vite berjalan di browser. Nilai `.env` yang memakai prefix
`VITE_`, ditanam ke bundle, atau dikirim oleh frontend dapat dibaca pengguna.
Karena itu:

- Jangan menaruh username/password, JWT, `BUATQRIS_SECRET_TOKEN`, atau signing
  secret pada environment frontend.
- Jangan mengirim JWT upstream ke browser atau menyimpannya di
  `localStorage`/`sessionStorage`.
- Backend menyimpan kredensial pada environment server dan bertindak sebagai
  Backend-for-Frontend (BFF) untuk API ZISWAF.
- Gunakan HTTPS untuk seluruh komunikasi produksi.

## Kontrak login upstream yang sudah diketahui

Backend melakukan request server-to-server:

```http
POST /api/v1/auth/login
Content-Type: application/json
Accept: application/json
```

```json
{
  "username": "<nilai dari environment backend>",
  "password": "<nilai dari environment backend>"
}
```

Respons login yang diberikan:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "<user-id>",
      "nama_lengkap": "<nama>",
      "role_id": "<role-id>",
      "nm_role": "<nama-role>",
      "status_nda": 0
    },
    "token": "<JWT — rahasia, hanya untuk backend>",
    "expires_at": "<waktu kedaluwarsa>"
  }
}
```

Backend harus memeriksa `success`, keberadaan `data.token`, dan waktu
kedaluwarsa. Jangan mencatat password atau JWT ke log. Detail format tanggal
`expires_at` dan endpoint refresh token tidak ditentukan di kontrak yang
tersedia; jangan mengasumsikan adanya endpoint refresh.

## Konfigurasi environment backend

Contoh nama variabel (sesuaikan dengan deployment):

```dotenv
SIPANDA_AUTH_BASE_URL=https://<domain-api>
ZISWAF_SERVICE_USERNAME=<username-layanan>
ZISWAF_SERVICE_PASSWORD=<password-layanan>
ZISWAF_SESSION_SECRET=<random-secret-minimal-32-byte>
ZISWAF_SESSION_TTL_SECONDS=3600
ZISWAF_ALLOWED_ORIGINS=https://<domain-frontend>

BUATQRIS_ACCOUNT_ID=<account-id>
BUATQRIS_SECRET_TOKEN=<secret-token>
BUATQRIS_SIGNING_SECRET=<signing-secret>
BUATQRIS_TEST_MODE=false
```

Variabel `BUATQRIS_*` digunakan oleh backend untuk integrasi gateway; frontend
tidak memerlukannya. Penarikan hanya untuk admin dan memerlukan
`BUATQRIS_WITHDRAWAL_ACCOUNT_ID` serta `BUATQRIS_WITHDRAWAL_PIN` di backend
apabila fitur tersebut diaktifkan.

Ketentuan penyimpanan:

- Simpan nilai produksi di secret manager/platform deployment, bukan di Git.
- Tambahkan `.env` dan file rahasia lokal ke `.gitignore`.
- Boleh menyediakan `.env.example` berisi nama variabel dan placeholder saja.
- Batasi akses environment/secret hanya ke service backend yang memerlukannya.
- Jika kredensial pernah masuk ke Git atau chat, rotasi kredensial terkait.

## Mode akun layanan bersama dan batas akses

Login otomatis menggunakan satu akun layanan berarti transaksi upstream akan
terkait ke akun tersebut, bukan identitas pribadi pengunjung. Endpoint daftar
donasi pengguna pada API upstream mengembalikan donasi milik pengguna login.
Jika token layanan dipakai bersama, daftar tersebut dapat mencakup transaksi
semua pengunjung yang memakai akun yang sama.

Oleh sebab itu:

- Jangan meneruskan `GET /api/v1/ziswaf/donations` ke pengunjung anonim tanpa
  pembatasan. Jangan pernah mengekspos endpoint admin donasi atau penarikan
  melalui sesi anonim.
- Untuk menerima donasi tanpa login pengguna, backend harus memisahkan akses
  publik dari akses akun layanan. Minimal, batasi detail/riwayat ke UUID yang
  dibuat pada sesi browser itu sendiri, dengan pemetaan sesi-ke-donasi di
  penyimpanan server.
- Jangan menganggap UUID yang sulit ditebak sebagai pengganti otorisasi.
- Jika backend tidak dapat membatasi riwayat per sesi, nonaktifkan riwayat
  anonim dan hanya sediakan pembuatan QRIS + respons pembayaran untuk sesi
  tersebut.
- Role `role_id` 1/3 dan hak penarikan harus tetap diverifikasi server pada
  setiap request, bukan hanya disembunyikan oleh UI.

## Kontrak BFF yang disarankan untuk frontend

Path berikut merupakan rancangan backend. Implementasikan dengan prefix
terpisah/proxy yang konsisten dengan konfigurasi reverse proxy deployment.

### Membuat sesi otomatis

```http
POST /api/v1/ziswaf/session
Origin: https://<domain-frontend>
```

Backend memvalidasi `Origin` terhadap allowlist, kemudian membuat session
browser yang acak dan menyimpan referensi token upstream serta batas akses di
penyimpanan server. Token upstream tidak dikirim pada respons.

```http
HTTP/1.1 200 OK
Set-Cookie: ziswaf_session=<opaque-random-id>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/ziswaf
Cache-Control: no-store
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "<user-id>",
      "nama_lengkap": "<nama>",
      "role_id": "<role-id>",
      "nm_role": "<nama-role>"
    },
    "expires_at": "<waktu-kedaluwarsa-sesi>"
  }
}
```

Jangan menerima username/password dari browser pada endpoint ini. Endpoint
sesi otomatis memanfaatkan kredensial server. Karena siapa pun yang dapat
mengakses endpoint dapat menggunakan identitas akun layanan, endpoint ini
harus memiliki kebijakan akses yang disetujui pemilik sistem. Jika akses
publik memang diperlukan, terapkan pembatasan sesi/riwayat di atas, rate limit,
monitoring, dan jangan berikan akses admin.

### Mengakhiri sesi

```http
DELETE /api/v1/ziswaf/session
Cookie: ziswaf_session=<opaque-random-id>
```

Hapus sesi server dan kirim cookie dengan nilai kosong serta atribut yang
sama, ditambah `Max-Age=0`. Respons tidak boleh memuat token upstream.

### Endpoint donasi melalui BFF

Frontend mengirim cookie sesi otomatis (`credentials: "include"`). BFF
memvalidasi sesi, memastikan akses transaksi masih berlaku, lalu meneruskan
request ke API ZISWAF dengan `Authorization: Bearer <JWT>` yang disimpan di
server. Jangan meneruskan header authorization dari browser.

| Method | Path | Catatan |
|---|---|---|
| `GET` | `/api/v1/ziswaf/donations?per_page=15` | Hanya daftar yang diizinkan untuk sesi tersebut; filter memakai pemetaan sesi-ke-donasi jika akun layanan bersama. |
| `POST` | `/api/v1/ziswaf/donations` | Teruskan `request_id`, `donation_type`, `amount`; catat UUID lokal pada sesi pembuatnya. |
| `GET` | `/api/v1/ziswaf/donations/{uuid}` | Pastikan UUID milik sesi saat ini sebelum memanggil upstream. |
| `GET` | `/api/v1/ziswaf/admin/donations` | Khusus sesi admin yang terautentikasi dan berizin. Jangan aktifkan untuk akses anonim/akun layanan publik. |
| `GET` | `/api/v1/ziswaf/admin/withdrawals` | Admin saja; otorisasi server wajib. |
| `POST` | `/api/v1/ziswaf/admin/withdrawals` | Admin saja; browser hanya boleh mengirim `{ "amount": 100000 }`. |
| `GET` | `/api/v1/ziswaf/admin/withdrawals/{uuid}` | Admin saja; otorisasi server wajib. |

Saat meneruskan request ke upstream:

- Gunakan bearer token upstream di server saja.
- Validasi `request_id` sebagai UUID, `donation_type` terhadap enum
  `zakat|infaq|sedekah|wakaf`, dan nominal sebagai integer yang berada dalam
  batas konfigurasi.
- Gunakan idempotensi `request_id` yang sama untuk retry atas request yang
  hasilnya belum diketahui. Jangan membuat UUID baru untuk retry transaksi yang
  sama.
- Pertahankan status/HTTP upstream yang relevan, termasuk `202`, `422`, dan
  `429`; jangan ubah respons gagal menjadi sukses.
- Jika token upstream kedaluwarsa atau upstream mengembalikan 401, lakukan
  login server-to-server kembali sekali, perbarui token server-side, lalu
  ulangi request yang aman. Jangan melakukan retry ganda untuk operasi POST
  tanpa mempertahankan idempotency key.
- Batasi `per_page` ke 1–100 dan terapkan paginasi sesuai kontrak API.
- Gunakan `Cache-Control: no-store` untuk respons sesi, login, dan data
  transaksi yang berisi informasi personal.

## Cookie, CSRF, CORS, dan session storage

- Session ID harus acak secara kriptografis dan tidak memuat JWT/kredensial.
- Cookie produksi wajib `HttpOnly`, `Secure`, dan `SameSite=Lax` atau `Strict`.
- Jika frontend dan backend berbeda site dan cookie harus dikirim lintas site,
  perlu `SameSite=None; Secure`, CORS dengan origin spesifik (bukan `*`), dan
  proteksi CSRF eksplisit.
- Untuk endpoint state-changing (`POST`, `PUT`, `PATCH`, `DELETE`), verifikasi
  `Origin`/`Referer` terhadap allowlist dan gunakan token CSRF yang sesuai
  dengan strategi cookie. `SameSite` saja bukan pengganti seluruh kontrol CSRF.
- Terapkan rate limit pada pembuatan sesi, login upstream, pembuatan donasi,
  cek status, dan penarikan.
- Simpan sesi/token server-side pada session store/Redis atau penyimpanan
  terenkripsi yang sesuai. Jangan menggunakan satu token bearer yang tertanam
  di bundle.

## Variabel konfigurasi frontend

Frontend hanya memerlukan URL API yang boleh diketahui publik, misalnya:

```dotenv
VITE_PUBLIC_REACT_APP_BASE_URL_API=https://<domain-backend>
```

Nilai tersebut bukan rahasia. Frontend perlu mengirim cookie sesi dengan
`withCredentials: true` pada Axios. Jangan membuat variabel `VITE_*` untuk
username, password, JWT, atau rahasia gateway. Perubahan ini juga memerlukan
penyesuaian frontend agar memakai cookie BFF, bukan bearer token dari
`AuthContext` saat ini.

## Webhook pembayaran

Webhook BuatQris tetap diterima oleh backend, bukan browser:

```http
POST /api/v1/ziswaf/webhook
```

Verifikasi `X-BuatQris-Signature` menggunakan HMAC-SHA256 atas body mentah dan
`BUATQRIS_SIGNING_SECRET`. Proses event secara idempoten. Balas 2xx hanya
setelah event valid diproses; untuk signature tidak valid balas 401.

Gunakan `total_amount` sebagai nilai pembayaran donatur. `admin_fee` adalah
biaya layanan yang dipotong dari saldo organisasi, sedangkan `amount_uniq`
adalah kode unik yang ditambahkan ke tagihan. Jangan mencoba menghitung atau
mengubah nilai QR dari frontend.

## Checklist sebelum mengaktifkan fitur

- [ ] Kredensial upstream hanya berada pada secret store backend.
- [ ] Endpoint sesi tidak mengirim JWT/token upstream ke browser.
- [ ] Identitas akun layanan bersama dan implikasi riwayatnya sudah disetujui.
- [ ] Riwayat dan detail transaksi dibatasi ke sesi pemilik transaksi.
- [ ] Endpoint admin/penarikan ditutup untuk akses anonim dan memeriksa role di server.
- [ ] Cookie, CSRF, CORS, rate limit, dan HTTPS sudah diuji.
- [ ] Retry POST mempertahankan `request_id` yang sama.
- [ ] Webhook memverifikasi signature dari body mentah dan idempoten.
- [ ] Pengujian end-to-end dilakukan di sandbox sebelum produksi.
