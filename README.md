# Stok ve Müşteri Yönetimi Sistemi (KVKK/GDPR Uyumlu)

## Kurulum
1. Depoyu klonlayın ve dizine girin.
2. Gerekli bağımlılıkları yükleyin:
   ```
   npm install
   ```
3. Migration ve seed işlemlerini uygulayın:
   ```
   npm run migrate
   npm run seed
   ```
4. .env dosyasını oluşturun ve örnekteki gibi doldurun.
5. Sunucuyu başlatın:
   ```
   npm start
   ```

## Giriş Bilgileri (Test Kullanıcıları)
- admin / admin123
- patron / patron123
- calisan / calisan123

## Test Paneli
Sunucu çalışırken [http://localhost:3000/test-panel](http://localhost:3000/test-panel) adresinden erişebilirsiniz.

## API Dökümantasyonu
Tüm endpointler ve istek örnekleri için test-panel ve kod üzerinden faydalanabilirsiniz. Ek Swagger/OpenAPI dokümantasyonu isterseniz ayrıca ekleyebilirim.

## KVKK/GDPR ve Güvenlik
- TCKN, IMEI ve benzeri alanlar algoritmik olarak doğrulanır.
- Kişisel veriler sadece açık rıza ile saklanır.
- Tüm kritik işlemler loglanır.
- JWT tabanlı kimlik doğrulama ve rol bazlı yetkilendirme vardır.
- API rate limit ve input validation uygulanmaktadır.