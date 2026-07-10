# API Documentation — UAJM RAG Chatbot

## Base URL

```
http://localhost:1113
```

---

## 1. Upload Dokumen

Upload dokumen (.pdf, .csv, .docx) untuk diindeks oleh chatbot.

### Endpoint

```
POST /documents
```

### Headers

| Header          | Nilai                  | Keterangan |
| --------------- | ---------------------- | ---------- |
| `Content-Type`  | `multipart/form-data`  | Wajib      |
| `Authorization` | `Bearer <accessToken>` | Wajib      |

### Request Body (multipart/form-data)

| Field                | Tipe     | Wajib | Keterangan                                                              |
| -------------------- | -------- | ----- | ----------------------------------------------------------------------- |
| `document`           | `file`   | Ya    | File dokumen. Format: `.pdf`, `.csv`, `.docx`. Maks: 10MB               |
| `desiredInformation` | `string` | Tidak | Informasi yang diinginkan untuk diekstrak dari dokumen. Format: paragraph |
| `isChunked`          | `boolean`| Ya    | Apakah dokumen akan dipecah menjadi beberapa bagian. Format: boolean     |

### Response Sukses

**Status Code:** `201 Created`

```json
{
  "status": "success",
  "message": "Dokumen berhasil diunggah",
  "data": {
    "id": 1,
    "source": "D:\\mighdad\\...\\uploads\\1678901234-123456789.pdf",
    "type": "docs", 
    "username": "full name user", 
    "status": "in progress",
    "created_at": "2026-05-17T06:00:00.000Z",
    "updated_at": "2026-05-17T06:00:00.000Z"
  }
}
```

### Response Error

**Token tidak disertakan atau tidak valid:**

```json
{ "status": "fail", "message": "Unauthorized" }
```
Status: `401 Unauthorized`

**Dokumen kosong:**

```json
{ "status": "fail", "message": "Dokumen harus dikirim" }
```
Status: `400 Bad Request`

**Format dokumen tidak diizinkan:**

```json
{ "status": "fail", "message": "Format dokumen tidak diizinkan. Format yang diizinkan: .pdf, .csv, .docx" }
```
Status: `400 Bad Request`

**Ukuran dokumen melebihi batas:**

```json
{ "status": "fail", "message": "Ukuran dokumen melebihi batas maksimum 10MB" }
```
Status: `400 Bad Request`

---

## 2. Upload URL

Kirim URL website untuk diindeks oleh chatbot.

### Endpoint

```
POST /urls
```

### Headers

| Header          | Nilai               | Keterangan |
| --------------- | ------------------- | ---------- |
| `Content-Type`  | `application/json`  | Wajib      |
| `Authorization` | `Bearer <accessToken>` | Wajib   |

### Request Body (JSON)

| Field | Tipe     | Wajib | Keterangan                                   |
| ----- | -------- | ----- | -------------------------------------------- |
| `url` | `string` | Ya    | URL website yang akan diindeks (format valid) |
| `isLongDocument` | `boolean` | Ya | Informasi yang diinginkan untuk diekstrak dari dokumen. Format: paragraph |

### Contoh Request

```json
{
  "url": "https://example.com/article",
  "desiredInformation": "Informasi yang diinginkan untuk diekstrak dari dokumen. Format: paragraph",
  "isChunked": true
}
```

### Response Sukses

**Status Code:** `201 Created`

```json
{
  "status": "success",
  "message": "URL berhasil diunggah",
  "data": {
    "id": 2,
    "source": "https://example.com/article",
    "type": "url",
    "username": "full name user",
    "status": "in progress",
    "created_at": "2026-05-17T06:05:00.000Z",
    "updated_at": "2026-05-17T06:05:00.000Z"
  }
}
```

### Response Error

**Token tidak disertakan atau tidak valid:**

```json
{ "status": "fail", "message": "Unauthorized" }
```
Status: `401 Unauthorized`

**URL kosong:**

```json
{ "status": "fail", "message": "URL harus dikirim" }
```
Status: `400 Bad Request`

**Format URL tidak valid:**

```json
{ "status": "fail", "message": "Format URL tidak valid" }
```
Status: `400 Bad Request`

---

## 3. Lihat Status Dokumen

Mengambil daftar semua dokumen/URL beserta statusnya (in progress, completed, failed) dan nama full name yang mengunggah dokumen/URL tersebut.

### Endpoint

```
GET /documents
```

### Headers

| Header          | Nilai                  | Keterangan |
| --------------- | ---------------------- | ---------- |
| `Authorization` | `Bearer <accessToken>` | Wajib      |

### Response Sukses

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "Berhasil mengambil data dokumen",
  "data": [
    {
      "id": 1,
      "source": "D:\\mighdad\\...\\uploads\\1678901234-123456789.pdf",
      "username": "full name user",
      "type": "docs",
      "error_message": null,
      "status": "completed",
      "content": "ini adalah isi dari dokumen yang sudah berhasil di index",
      "created_at": "2026-05-17T06:00:00.000Z",
      "updated_at": "2026-05-17T06:01:00.000Z"
    },
    {
      "id": 3,
      "source": "D:\\mighdad\\...\\uploads\\1678901234-123456789.pdf",
      "username": "full name user",
      "type": "docs",
      "error_message": "error message",
      "status": "failed",
      "content": null,
      "created_at": "2026-05-17T06:00:00.000Z",
      "updated_at": "2026-05-17T06:01:00.000Z"
    },
    {
      "id": 2,
      "source": "https://example.com/article",
      "username": "full name user",
      "type": "url",
      "error_message": null,
      "status": "in progress",
      "content": "ini adalah isi dari dokumen yang sudah berhasil di index",
      "created_at": "2026-05-17T06:05:00.000Z",
      "updated_at": "2026-05-17T06:05:00.000Z"
    }
  ]
}
```

### Response Error

**Token tidak disertakan atau tidak valid:**

```json
{ "status": "fail", "message": "Unauthorized" }
```
Status: `401 Unauthorized`

---

## 4. Hapus Dokumen

Menghapus dokumen dari database status dokumen dan menghapus seluruh embedding/vektor dokumen tersebut dari knowledge base (`langchain_pg_embedding`) berdasarkan nama `source`.

### Endpoint

```
DELETE /documents
```

### Headers

| Header          | Nilai               | Keterangan |
| --------------- | ------------------- | ---------- |
| `Content-Type`  | `application/json`  | Wajib      |
| `Authorization` | `Bearer <accessToken>` | Wajib   |

### Request Body (JSON)

| Field    | Tipe     | Wajib | Keterangan                                             |
| -------- | -------- | ----- | ------------------------------------------------------ |
| `source` | `string` | Ya    | Path dokumen lokal atau URL website yang ingin dihapus |

### Contoh Request

```json
{
  "source": "https://example.com/article"
}
```

### Response Sukses

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "Dokumen berhasil dihapus",
  "data": {
    "deletedEmbeddings": 12,
    "deletedDocuments": 1
  }
}
```

### Response Error

**Token tidak disertakan atau tidak valid:**

```json
{ "status": "fail", "message": "Unauthorized" }
```
Status: `401 Unauthorized`

**Source kosong:**

```json
{ "status": "fail", "message": "Source harus dikirim" }
```
Status: `400 Bad Request`

**Dokumen tidak ditemukan:**

```json
{
  "status": "fail",
  "message": "Dokumen dengan source 'https://example.com/article' tidak ditemukan"
}
```
Status: `404 Not Found`

---

## Status Dokumen

| Status        | Keterangan                                         |
| ------------- | -------------------------------------------------- |
| `in progress` | Dokumen sedang diproses (indexing)                  |
| `completed`   | Dokumen berhasil diindeks dan siap digunakan        |
| `failed`      | Proses indexing gagal                               |

---

## 5. Login (Authentications)

Melakukan autentikasi pengguna menggunakan username dan password. Mengembalikan `accessToken` dan `refreshToken` jika kredensial valid.

### Endpoint

```
POST /authentications
```

### Headers

| Header         | Nilai               | Keterangan |
| -------------- | ------------------- | ---------- |
| `Content-Type` | `application/json`  | Wajib      |

### Request Body (JSON)

| Field      | Tipe     | Wajib | Keterangan              |
| ---------- | -------- | ----- | ----------------------- |
| `username` | `string` | Ya    | Username pengguna       |
| `password` | `string` | Ya    | Password pengguna       |

### Contoh Request

```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

### Response Sukses

**Status Code:** `201 Created`

```json
{
  "status": "success",
  "message": null,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "admin || super admin"
  }
}
```

### Response Error

**Username atau password salah:**

```json
{ "status": "fail", "message": "Username atau password salah!" }
```
Status: `401 Unauthorized`

**Validasi field gagal (username/password kosong):**

```json
{ "status": "fail", "message": "\"username\" is required" }
```
Status: `400 Bad Request`

---

## 6. Refresh Access Token

Memperbarui `accessToken` yang sudah kedaluwarsa menggunakan `refreshToken` yang masih valid.

### Endpoint

```
PUT /authentications
```

### Headers

| Header         | Nilai               | Keterangan |
| -------------- | ------------------- | ---------- |
| `Content-Type` | `application/json`  | Wajib      |

### Request Body (JSON)

| Field          | Tipe     | Wajib | Keterangan                                  |
| -------------- | -------- | ----- | ------------------------------------------- |
| `refreshToken` | `string` | Ya    | Refresh token yang diperoleh saat login      |

### Contoh Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Sukses

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": null,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Response Error

**Refresh token tidak valid atau tidak ditemukan:**

```json
{ "status": "fail", "message": "Refresh token tidak valid" }
```
Status: `400 Bad Request`

**Validasi field gagal (refreshToken kosong):**

```json
{ "status": "fail", "message": "\"refreshToken\" is required" }
```
Status: `400 Bad Request`

---

## 7. Logout (Hapus Refresh Token)

Menghapus `refreshToken` dari database untuk mengakhiri sesi pengguna (logout).

### Endpoint

```
DELETE /authentications
```

### Headers

| Header         | Nilai               | Keterangan |
| -------------- | ------------------- | ---------- |
| `Content-Type` | `application/json`  | Wajib      |

### Request Body (JSON)

| Field          | Tipe     | Wajib | Keterangan                                  |
| -------------- | -------- | ----- | ------------------------------------------- |
| `refreshToken` | `string` | Ya    | Refresh token yang ingin dihapus (logout)    |

### Contoh Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Sukses

**Status Code:** `200 OK`

```json
{
  "status": "success",
  "message": "Refresh token berhasil dihapus!",
  "data": null
}
```

### Response Error

**Refresh token tidak valid atau tidak ditemukan:**

```json
{ "status": "fail", "message": "Refresh token tidak valid" }
```
Status: `400 Bad Request`

**Validasi field gagal (refreshToken kosong):**

```json
{ "status": "fail", "message": "\"refreshToken\" is required" }
```
Status: `400 Bad Request`

---

## 8. Register User

Membuat akun pengguna baru. Endpoint ini digunakan untuk mendaftarkan admin baru ke sistem.

> **Akses:** Hanya dapat diakses oleh pengguna dengan role `super admin`.

### Endpoint

```
POST /users
```

### Headers

| Header          | Nilai               | Keterangan                           |
| --------------- | ------------------- | ------------------------------------ |
| `Content-Type`  | `application/json`  | Wajib                                |
| `Authorization` | `Bearer <accessToken>` | Wajib — token dengan role `super admin` |

### Request Body (JSON)

| Field      | Tipe     | Wajib | Keterangan                     |
| ---------- | -------- | ----- | ------------------------------ |
| `username` | `string` | Ya    | Username unik untuk login      |
| `password` | `string` | Ya    | Password pengguna              |
| `fullname` | `string` | Ya    | Nama lengkap pengguna          |

### Contoh Request

```json
{
  "username": "admin_baru",
  "password": "password123",
  "fullname": "Admin Baru"
}
```

### Response Sukses

**Status Code:** `201 Created`

```json
{
  "status": "success",
  "message": null,
  "data": {
    "userId": "xK9mP2nQwRtYuVzA3bC"
  }
}
```

### Response Error

**Token tidak disertakan atau tidak valid:**

```json
{ "status": "fail", "message": "Unauthorized" }
```
Status: `401 Unauthorized`

**Role bukan `super admin`:**

```json
{ "status": "fail", "message": "Akses ditolak. Anda tidak memiliki hak akses sebagai admin" }
```
Status: `403 Forbidden`

**Username sudah digunakan:**

```json
{ "status": "fail", "message": "Gagal menambahkan user. Username sudah di gunakan!" }
```
Status: `400 Bad Request`

**Validasi field gagal (salah satu field kosong):**

```json
{ "status": "fail", "message": "\"username\" is required" }
```
```json
{ "status": "fail", "message": "\"password\" is required" }
```
```json
{ "status": "fail", "message": "\"fullname\" is required" }
```
Status: `400 Bad Request`

