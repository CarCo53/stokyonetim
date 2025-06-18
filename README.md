# Stok & Müşteri Yönetimi Backend

## Kurulum

```sh
git clone <repo-url>
cd backend
npm install
```

`.env` dosyasını doldurun (örnek için `.env`ye bakın).

## Çalıştırma

```sh
node app.js
```

## API Endpointleri

### Auth

- `POST /api/auth/register`
  - `{ "username": "...", "password": "...", "role": "admin|patron|calisan" }`
- `POST /api/auth/login`
  - `{ "username": "...", "password": "..." }`

### Müşteri

- `POST /api/customers` (JWT zorunlu)
  - `{ "name": "Ali", "surname": "Veli", "birthdate": "2000-01-01", "tckn": "12345678901", "consent_personal_data": true }`
  - Doğum tarihi ve TCKN sadece rıza ile!
- Her müşteri kaydında consent otomatik loglanır.

### Kategori

- `POST /api/categories` (admin/patron)
  - `{ "name": "Telefon", "requires_imei": 1, "store_id": 1 }`
- `PUT /api/categories/:id` (admin/patron)
- `GET /api/categories`

### Ürün

- `POST /api/products` (JWT zorunlu)
  - `{ "name": "Samsung A30", "barcode": "...", "category_id": 1, ... }`
- IMEI kontrolleri kategoriye göre otomatik yapılır.

### Rıza Kayıtları

- `GET /api/consents` (admin/patron)

---

## Notlar

- Her endpoint JWT ile korunur.
- Boolean/int alanlar daima 0/1 veya true/false olarak tutulur.
- TCKN ve IMEI doğrulama backendde garanti edilir.
- Rate limit, helmet, cors, error handler default gelir.
- Tüm kritik işlemler loglanabilir.

---

Test paneli ve frontend için ayrıca bilgi verilecektir.