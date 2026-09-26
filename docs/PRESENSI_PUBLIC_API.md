# Panduan Integrasi Frontend: API Presensi Publik (Mobile / Web)

Dokumentasi ini ditujukan untuk pengembang frontend / mobile yang mengintegrasikan alur presensi peserta mandiri atau publik berbasis titik koordinat GPS (venue).

---

## 1. Alur Kerja Presensi Publik (User Flow)

```
[Peserta Buka App]
       │
       ▼
1. Masukkan / Scan Kode Kegiatan (misal: "526581")
       │
       ▼
2. GET /api/v1/data_center/presensi/search-kegiatan?kode_kegiatan=526581
   - App menerima info kegiatan, status aktif/expired, dan koordinat fisik venue (kelompok/desa/daerah).
   - Tampilkan peta lokasi, nama acara, dan jam pelaksanaan.
       │
       ▼
3. Peserta Mengisi Identitas & Ambil Koordinat GPS
   - Mengambil GPS device peserta (latitude & longitude).
   - Identitas peserta didapat melalui Tapping RFID (`id_card`) ATAU Pencarian Kode Peserta (`id_peserta`).
       │
       ▼
4. POST /api/v1/data_center/presensi/create
   - Backend memvalidasi radius koordinat GPS terhadap venue kegiatan.
   - Backend memvalidasi eligibilitas usia dan wilayah gabungan peserta.
   - Respon status presensi (Hadir / Terlambat / Izin / Sakit).
```

---

## 2. Endpoint 1: Cari Detail Kegiatan

Digunakan untuk mencari informasi kegiatan sebelum peserta melakukan absensi. Endpoint ini bersifat **publik** (tidak memerlukan header `Authorization: Bearer <token>`).

- **URL:** `GET /api/v1/data_center/presensi/search-kegiatan`
- **Method:** `GET`
- **Query Parameters:**

| Parameter       | Tipe     | Wajib | Keterangan                                    |
| :-------------- | :------- | :---- | :-------------------------------------------- |
| `kode_kegiatan` | `string` | Ya    | 6 digit kode unik kegiatan (contoh: `526581`) |

### Panduan Frontend untuk Lokasi Venue (Titik Acara)

API sekarang **secara langsung menyediakan objek `lokasi_acara` (atau alias `venue`)** yang sudah siap pakai di dalam setiap data kegiatan. Frontend tidak perlu lagi melakukan pemilahan kondisi manual `if/else` antara `daerah`, `desa`, atau `kelompok`.

Cukup ambil langsung dari properti `kegiatan.lokasi_acara`:

```javascript
// Sangat simpel! Langsung ambil koordinat dan info venue acara
const venue = kegiatan.lokasi_acara;

console.log(venue.nama_tempat); // "Sukamulya 1"
console.log(venue.alamat); // "Jl. Ipik Gandamanah Gg. Sukamulya..."
console.log(venue.latitude); // -6.5172682171343945 (tipe number)
console.log(venue.longitude); // 107.45887945395884 (tipe number)
console.log(venue.radius_meter); // 150 (toleransi radius presensi)
console.log(venue.level); // "kelompok" | "desa" | "daerah"
console.log(venue.img_url); // URL foto tempat acara (jika ada)
```

Atribut di dalam objek `lokasi_acara` / `venue`:

- `nama_tempat`: Nama lokasi tempat acara diadakan.
- `alamat`: Alamat lengkap tempat acara.
- `latitude` & `longitude`: Titik koordinat GPS tempat acara (bertipe `float` / `number`, siap dipasang ke Google Maps / Mapbox / Leaflet).
- `radius_meter`: Toleransi radius presensi GPS default dari server (Kelompok: 150m, Desa: 500m, Daerah: 1000m) untuk menggambar lingkaran radius (circle) pada peta.
- `level`: Tingkat administrasi venue (`"kelompok"`, `"desa"`, atau `"daerah"`).

### Contoh Request

```http
GET /api/v1/data_center/presensi/search-kegiatan?kode_kegiatan=526581 HTTP/1.1
Host: your-api-domain.com
Accept: application/json
```

### Contoh Respon Sukses (200 OK)

```json
{
  "success": true,
  "message": "Data kegiatan ditemukan",
  "data": [
    {
      "id": 44,
      "kode_kegiatan": "526581",
      "nama_kegiatan": "Pengajian Gabungan 3 Desa (Usia 19 Tahun Ke Atas)",
      "tmpt_kegiatan": "Kelompok Sukamulya 1",
      "type_kegiatan": "KELOMPOK",
      "category": "sensus",
      "usia_mode": "single",
      "usia_min": 19,
      "usia_max": 100,
      "metode_presensi": "both",
      "daerah_ids": [],
      "desa_ids": [6, 7],
      "kelompok_ids": [],
      "tgl_kegiatan": "2026-09-27 00:00:00",
      "jam_kegiatan": "2026-09-27 09:30:00",
      "expired_date_time": "2026-09-27 11:30:00",
      "is_expired": false,
      "status_kegiatan": "aktif",
      "expired_message": "Kegiatan masih aktif",
      "lokasi_acara": {
        "level": "kelompok",
        "id": 2,
        "nama_tempat": "Sukamulya 1",
        "alamat": "Jl. Ipik Gandamanah Gg. Sukamulya, Ciseureuh, Kec. Purwakarta, Kabupaten Purwakarta, Jawa Barat 41118",
        "latitude": -6.5172682171343945,
        "longitude": 107.45887945395884,
        "radius_meter": 150,
        "img_url": "https://your-api-domain.com/storage/kelompok/7dc4afc4-133a-4d72-bb2d-6a7bf034fe0a.png"
      },
      "venue": {
        "level": "kelompok",
        "id": 2,
        "nama_tempat": "Sukamulya 1",
        "alamat": "Jl. Ipik Gandamanah Gg. Sukamulya, Ciseureuh, Kec. Purwakarta, Kabupaten Purwakarta, Jawa Barat 41118",
        "latitude": -6.5172682171343945,
        "longitude": 107.45887945395884,
        "radius_meter": 150,
        "img_url": "https://your-api-domain.com/storage/kelompok/7dc4afc4-133a-4d72-bb2d-6a7bf034fe0a.png"
      },
      "daerah": {
        "id": 1,
        "nama_daerah": "Cikampek",
        "latitude": "-6.4248824",
        "longitude": "107.4751268",
        "alamat": "Jomin Bar., Kec. Kota Baru, Karawang, Jawa Barat 41374",
        "is_active": true,
        "img": "daerah/1a8d3868-7269-44db-a01e-6871f6df38df.png",
        "img_url": "https://your-api-domain.com/storage/daerah/1a8d3868-7269-44db-a01e-6871f6df38df.png"
      },
      "desa": {
        "id": 1,
        "nama_desa": "Purwakarta 1",
        "latitude": null,
        "longitude": null,
        "alamat": null,
        "is_active": true,
        "img": null,
        "img_url": null
      },
      "kelompok": {
        "id": 2,
        "nama_kelompok": "Sukamulya 1",
        "latitude": "-6.5172682171343945",
        "longitude": "107.45887945395884",
        "alamat": "Jl. Ipik Gandamanah Gg. Sukamulya, Ciseureuh, Kec. Purwakarta, Kabupaten Purwakarta, Jawa Barat 41118",
        "is_active": true,
        "img": "kelompok/7dc4afc4-133a-4d72-bb2d-6a7bf034fe0a.png",
        "img_url": "https://your-api-domain.com/storage/kelompok/7dc4afc4-133a-4d72-bb2d-6a7bf034fe0a.png"
      }
    }
  ]
}
```

---

## 3. Endpoint 2: Submit Presensi Berbasis Koordinat

Digunakan untuk mencatat kehadiran peserta di lokasi acara dengan validasi radius GPS. Endpoint ini juga bersifat **publik**.

- **URL:** `POST /api/v1/data_center/presensi/create`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `Accept: application/json`

### Parameter Request (JSON Body)

| Field             | Tipe      | Wajib                | Keterangan & Aturan                                                                                                                                                                                  |
| :---------------- | :-------- | :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kode_kegiatan`   | `string`  | Ya                   | 6 digit kode kegiatan (contoh: `"526581"`).                                                                                                                                                          |
| `metode_presensi` | `string`  | Ya                   | `"tapping"` atau `"manual"`. Harus didukung oleh kegiatan (`allowsMetodePresensi`).                                                                                                                  |
| `id_peserta`      | `string`  | Wajib jika `manual`  | Kode cari data peserta (contoh: `"KD-00123"`) atau ID numerik peserta.                                                                                                                               |
| `id_card`         | `string`  | Wajib jika `tapping` | Nomor identitas RFID kartu fisik peserta (maks. 100 karakter).                                                                                                                                       |
| `category`        | `string`  | Ya                   | Kategori basis data peserta: `"sensus"`, `"cai"`, `"mumi"`, `"remaja"`, `"praremaja"`, atau `"caberawit"`.                                                                                           |
| `latitude`        | `numeric` | Ya                   | Titik latitude GPS peserta saat absensi (contoh: `-6.517260`).                                                                                                                                       |
| `longitude`       | `numeric` | Ya                   | Titik longitude GPS peserta saat absensi (contoh: `107.458880`).                                                                                                                                     |
| `radius_meter`    | `numeric` | Opsional             | Nilai toleransi jarak kustom dalam meter (min: 10, max: 50000). Jika tidak dikirim, otomatis memakai default server (Kelompok: **150m**, Desa: **500m**, Daerah: **1000m**).                         |
| `status_presensi` | `string`  | Opsional             | Status kehadiran: `"hadir"`, `"terlambat"`, `"izin"`, atau `"sakit"`. Default otomatis dihitung berdasarkan waktu acara (jika > 30 menit lewat dari `jam_kegiatan`, otomatis menjadi `"terlambat"`). |
| `keterangan`      | `string`  | Opsional             | Catatan tambahan (maks. 500 karakter). Sangat disarankan jika status adalah `"izin"` atau `"sakit"`.                                                                                                 |
| `add_by_petugas`  | `string`  | Ya                   | UUID user/petugas penanggung jawab (contoh UUID akun petugas: `"124fe53d-64da-4647-8c30-87aea6ac23bd"`).                                                                                             |

---

### Contoh Request: Metode Manual (Cari Data)

```http
POST /api/v1/data_center/presensi/create HTTP/1.1
Host: your-api-domain.com
Content-Type: application/json
Accept: application/json

{
  "kode_kegiatan": "526581",
  "metode_presensi": "manual",
  "id_peserta": "1284",
  "category": "sensus",
  "latitude": -6.517265,
  "longitude": 107.458875,
  "add_by_petugas": "124fe53d-64da-4647-8c30-87aea6ac23bd",
  "status_presensi": "hadir"
}
```

### Contoh Request: Metode Tapping (RFID)

```http
POST /api/v1/data_center/presensi/create HTTP/1.1
Host: your-api-domain.com
Content-Type: application/json
Accept: application/json

{
  "kode_kegiatan": "526581",
  "metode_presensi": "tapping",
  "id_card": "RFID-883920194",
  "category": "sensus",
  "latitude": -6.517265,
  "longitude": 107.458875,
  "add_by_petugas": "124fe53d-64da-4647-8c30-87aea6ac23bd"
}
```

---

### Contoh Respon Sukses (201 Created)

```json
{
  "success": true,
  "message": "Presensi berhasil dicatat",
  "data": {
    "id": 182,
    "kd_kegiatan": 44,
    "nm_kegiatan": "Pengajian Gabungan 3 Desa (Usia 19 Tahun Ke Atas)",
    "tgl_kegiatan": "2026-09-27T00:00:00.000000Z",
    "id_peserta": 1284,
    "kode_peserta": "KD-PWK1-002",
    "sumber_peserta": "data_peserta",
    "metode_presensi": "manual",
    "kd_peserta": "KD-PWK1-002",
    "nm_peserta": "Idris Dinu Salam",
    "kd_petugas_input": 40,
    "nm_petugas_input": "Petugas Operator Data Center",
    "waktu_presensi": "2026-09-27 09:35:12",
    "status_presensi": "hadir",
    "keterangan": null,
    "created_at": "2026-09-27T02:35:12.000000Z",
    "updated_at": "2026-09-27T02:35:12.000000Z"
  }
}
```

---

### Contoh Respon Error & Cara Penanganan di Frontend

#### 1. Peserta di Luar Radius Lokasi (400 Bad Request)

Muncul jika GPS device peserta berada lebih jauh dari radius venue yang ditentukan:

```json
{
  "success": false,
  "message": "Anda berada di luar radius lokasi kegiatan (Jarak: 320 meter, batas maksimal: 150 meter)"
}
```

> **Catatan:** Peserta yang berstatus `"izin"` atau `"sakit"` diperbolehkan submit di luar radius (tidak terkena penolakan ini).

#### 2. Wilayah Peserta Tidak Sesuai (400 Bad Request)

Muncul jika peserta berasal dari desa/daerah yang tidak masuk dalam daftar gabungan acara:

```json
{
  "success": false,
  "message": "Desa peserta tidak sesuai dengan lokasi kegiatan (harus berada di desa ID 6, 7, 1 sedangkan peserta berada di desa ID 2)"
}
```

#### 3. Usia Peserta Tidak Memenuhi Syarat (400 Bad Request)

Muncul jika umur peserta tidak sesuai aturan kegiatan (misal: acara untuk usia 19+, tetapi peserta berusia 16 tahun):

```json
{
  "success": false,
  "message": "Usia peserta (16 tahun) tidak memenuhi syarat: Presensi hanya untuk peserta berusia 19 tahun ke atas"
}
```

#### 4. Kegiatan Sudah Berakhir (400 Bad Request)

Muncul jika waktu sekarang melebihi `expired_date_time` kegiatan:

```json
{
  "success": false,
  "message": "Kegiatan sudah berakhir"
}
```

#### 5. Peserta Sudah Melakukan Presensi (400 Bad Request)

Muncul jika peserta tersebut sudah pernah tercatat presensi di kegiatan yang sama:

```json
{
  "success": false,
  "message": "Peserta sudah melakukan presensi sebelumnya"
}
```

---

## 4. Tips & Rekomendasi untuk Pengembang Frontend

1. **Pengambilan GPS Berpresisi Tinggi:**
   Gunakan opsi `enableHighAccuracy: true` pada library geolocation (misal `navigator.geolocation` pada Web atau `geolocator` pada Flutter) sebelum mengirim `latitude` dan `longitude`.
2. **Keterangan Wajib Saat Izin/Sakit:**
   Jika peserta memilih status presensi `izin` atau `sakit`, sediakan formulir input `keterangan` (misal: _"Demam dan istirahat di rumah"_) agar memudahkan rekapitulasi data.
3. **Penyimpanan UUID Petugas:**
   Parameter `add_by_petugas` membutuhkan UUID user (contoh default petugas data center: `124fe53d-64da-4647-8c30-87aea6ac23bd`). Simpan UUID petugas ini di environment config frontend atau ambil dari user session jika sedang login sebagai operator.
