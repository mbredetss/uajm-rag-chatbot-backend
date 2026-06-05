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

| Header         | Nilai                  | Keterangan |
| -------------- | ---------------------- | ---------- |
| `Content-Type` | `multipart/form-data`  | Wajib      |

### Request Body (multipart/form-data)

| Field        | Tipe     | Wajib | Keterangan                                                      |
| ------------ | -------- | ----- | --------------------------------------------------------------- |
| `secretCode` | `string` | Ya    | Kode rahasia untuk otentikasi                                   |
| `document`   | `file`   | Ya    | File dokumen. Format: `.pdf`, `.csv`, `.docx`. Maks: 10MB       |
| `desiredInformation` | `string` | Tidak   | Informasi yang diinginkan untuk diekstrak dari dokumen. Format: paragraph |

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
    "status": "in progress",
    "created_at": "2026-05-17T06:00:00.000Z",
    "updated_at": "2026-05-17T06:00:00.000Z"
  }
}
```

### Response Error

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

**Kode rahasia tidak valid:**

```json
{ "status": "fail", "message": "Kode rahasia tidak valid" }
```
Status: `401 Unauthorized`

---

## 2. Upload URL

Kirim URL website untuk diindeks oleh chatbot.

### Endpoint

```
POST /urls
```

### Headers

| Header         | Nilai               | Keterangan |
| -------------- | ------------------- | ---------- |
| `Content-Type` | `application/json`  | Wajib      |

### Request Body (JSON)

| Field        | Tipe     | Wajib | Keterangan                                    |
| ------------ | -------- | ----- | --------------------------------------------- |
| `secretCode` | `string` | Ya    | Kode rahasia untuk otentikasi                 |
| `url`        | `string` | Ya    | URL website yang akan diindeks (format valid)  |

### Contoh Request

```json
{
  "secretCode": "your_secret_code",
  "url": "https://example.com/article"
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
    "status": "in progress",
    "created_at": "2026-05-17T06:05:00.000Z",
    "updated_at": "2026-05-17T06:05:00.000Z"
  }
}
```

### Response Error

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

**Kode rahasia tidak valid:**

```json
{ "status": "fail", "message": "Kode rahasia tidak valid" }
```
Status: `401 Unauthorized`

---

## 3. Lihat Status Dokumen

Mengambil daftar semua dokumen/URL beserta statusnya (in progress, completed, failed).

### Endpoint

```
GET /documents
```

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
      "type": "docs",
      "error_message": null,
      "status": "completed",
      "created_at": "2026-05-17T06:00:00.000Z",
      "updated_at": "2026-05-17T06:01:00.000Z"
    },
    {
      "id": 3,
      "source": "D:\\mighdad\\...\\uploads\\1678901234-123456789.pdf",
      "type": "docs",
      "error_message": "error message",
      "status": "failed",
      "created_at": "2026-05-17T06:00:00.000Z",
      "updated_at": "2026-05-17T06:01:00.000Z"
    },
    {
      "id": 2,
      "source": "https://example.com/article",
      "type": "url",
      "error_message": null,
      "status": "in progress",
      "created_at": "2026-05-17T06:05:00.000Z",
      "updated_at": "2026-05-17T06:05:00.000Z"
    }
  ]
}
```


---

## 4. Hapus Dokumen

Menghapus dokumen dari database status dokumen dan menghapus seluruh embedding/vektor dokumen tersebut dari knowledge base (`langchain_pg_embedding`) berdasarkan nama `source`.

### Endpoint

```
DELETE /documents
```

### Headers

| Header         | Nilai               | Keterangan |
| -------------- | ------------------- | ---------- |
| `Content-Type` | `application/json`  | Wajib      |

### Request Body (JSON)

| Field        | Tipe     | Wajib | Keterangan                                                 |
| ------------ | -------- | ----- | ---------------------------------------------------------- |
| `secretCode` | `string` | Ya    | Kode rahasia untuk otentikasi                              |
| `source`     | `string` | Ya    | Path dokumen lokal atau URL website yang ingin dihapus     |

### Contoh Request

```json
{
  "secretCode": "your_secret_code",
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

**Source atau secretCode kosong:**

```json
{
  "status": "fail",
  "message": "Source harus dikirim"
}
```
atau
```json
{
  "status": "fail",
  "message": "\"secretCode\" is required"
}
```
Status: `400 Bad Request`

**Kode rahasia tidak valid:**

```json
{
  "status": "fail",
  "message": "Kode rahasia tidak valid"
}
```
Status: `401 Unauthorized`

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
