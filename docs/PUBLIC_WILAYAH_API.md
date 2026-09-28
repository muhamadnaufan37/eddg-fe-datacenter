# Dokumentasi API Publik: Data Wilayah (Daerah, Desa, Kelompok)

Dokumentasi ini menjelaskan endpoint publik untuk mengambil data wilayah secara minimalis. Tersedia dua endpoint utama:
1. **Tree/Pohon Hierarki**: Untuk menampilkan struktur lengkap Daerah -> Desa -> Kelompok.
2. **Detail**: Untuk mengambil detail informasi dari suatu wilayah berdasarkan tipe dan ID.

Endpoint ini bersifat **publik** (tidak memerlukan autentikasi Bearer token).

---

## 1. Daftar Endpoint

| Fungsi | Endpoint Publik | Method | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Pohon Wilayah** | `/api/v1/public/wilayah/tree` | `GET` | Mengambil seluruh data wilayah dalam bentuk tree/pohon. |
| **Detail Wilayah** | `/api/v1/public/wilayah/detail` | `GET` | Mengambil detail spesifik dari daerah/desa/kelompok. |

---

## 2. Detail Endpoint

### 2.1. GET Pohon Wilayah Lengkap (Tree Hierarki)

Digunakan jika frontend ingin mengambil seluruh struktur Daerah -> Desa -> Kelompok sekaligus untuk dropdown bertingkat instan atau caching lokal.

- **URL:** `/api/v1/public/wilayah/tree`
- **Method:** `GET`
- **Query Parameter (Opsional):**
  - `daerah_id`: Filter untuk daerah tertentu saja.

#### Contoh Respon (200 OK):
```json
{
  "success": true,
  "message": "Hierarki wilayah berhasil diambil",
  "data": [
    {
      "id": 1,
      "nama_daerah": "Cikampek",
      "desa": [
        {
          "id": 4,
          "daerah_id": 1,
          "nama_desa": "Cikampek Barat",
          "kelompok": [
            {
              "id": 16,
              "desa_id": 4,
              "nama_kelompok": "Babakan Bogor 1"
            },
            {
              "id": 17,
              "desa_id": 4,
              "nama_kelompok": "Babakan Bogor 2"
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 2.2. GET Detail Wilayah

Digunakan untuk melihat rincian informasi seperti titik koordinat (latitude, longitude), gambar (img), status aktif, atau identitas dari sebuah wilayah (Daerah, Desa, Kelompok) tertentu.

- **URL:** `/api/v1/public/wilayah/detail`
- **Method:** `GET`
- **Query Parameter (Wajib):**
  - `type`: Tipe dari wilayah. (Pilihan: `daerah`, `desa`, `kelompok`)
  - `id`: ID dari wilayah tersebut.

#### Contoh Request:
`GET /api/v1/public/wilayah/detail?type=kelompok&id=16`

#### Contoh Respon untuk Kelompok (200 OK):
```json
{
  "success": true,
  "message": "Detail wilayah berhasil diambil",
  "data": {
    "id": 16,
    "uuid": "b539a25b-0bc6-46b0-bb55-b77823e595a8",
    "latitude": -6.393168571404719,
    "longitude": 107.42239836931809,
    "alamat": "Babakan Bogor, Desa Cikampek Barat",
    "is_active": true,
    "img": "kelompok/b48a0329-87c2-48a1-b856-bf5f088198f3.png",
    "img_url": "https://your-domain.com/storage/kelompok/b48a0329-87c2-48a1-b856-bf5f088198f3.png",
    "nama_kelompok": "Babakan Bogor 1",
    "desa_id": 4,
    "nama_desa": "Cikampek Barat",
    "daerah_id": 1,
    "nama_daerah": "Cikampek"
  }
}
```

#### Respon Jika Tipe atau ID Tidak Lengkap (422 Unprocessable Entity):
```json
{
  "success": false,
  "message": "Parameter type dan id wajib diisi.",
  "errors": {
    "type": ["Tipe wilayah (daerah, desa, kelompok)"],
    "id": ["ID wilayah"]
  },
  "data": null
}
```
