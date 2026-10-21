# BUM BASE — Siteyi yayınlama rehberi

Bu rehber sitenin ve sipariş panelinin internette yayınlanmasını adım adım anlatır.
Toplam süre: kurulum için yaklaşık 1 saat. iyzico canlı onayı birkaç iş günü sürebilir.

**Sonuç:**

- Müşteri sitesi: `https://bumbase.com.tr` (örnek alan adı)
- Restoran paneli: `https://bumbase.com.tr/panel/`
- Online ödeme: iyzico (önce test ortamı, onaydan sonra canlı)

**Gerekenler:** bir e-posta adresi, bir banka kartı (sunucu ve alan adı ödemesi için), işletmenin vergi levhası (iyzico başvurusu için).

---

## 0. Yayından önce doldurulacaklar (5 dk)

`js/config.js` dosyasını açın ve `legal` bölümünü doldurun. Bu bilgiler mesafeli satış sözleşmesi, iade ve KVKK sayfalarında görünür; boş alanlar sitede sarı `[ ... ]` olarak kalır. iyzico başvurusunda bu sayfalar kontrol edilir.

```js
legal: {
  company: 'Ad Soyad veya Şirket Unvanı',
  taxOffice: 'Keçiören',
  taxNumber: '1234567890',
  mersis: '',
  email: 'iletisim@bumbase.com.tr',
  ...
}
```

Yasal sayfalar şablondur; yayından önce mali müşaviriniz veya bir hukukçu tarafından gözden geçirilmesini öneririz.

---

## 1. Alan adı satın alma (10 dk, yıllık ~300–600 TL)

1. Bir alan adı firmasından (Natro, İsimtescil, Turhost, GoDaddy vb.) uygun bir ad seçin. Öneriler: `bumbase.com.tr`, `bumbasekecioren.com`, `bumandbase.com.tr`. `.com.tr` artık belge istemeden alınabiliyor.
2. Satın aldıktan sonra **DNS yönetimi** sayfasının yerini öğrenin; 4. adımda kullanacağız.
3. **Öneri:** DNS’i ücretsiz olarak **Cloudflare**’e taşıyın (cloudflare.com → Add site → alan adınız → firmada nameserver’ları Cloudflare’in verdikleriyle değiştirin). Böylece kök alan adı (`bumbase.com.tr`, başında www olmadan) sorunsuz çalışır.

---

## 2. Kodu GitHub’a yükleme (10 dk, ücretsiz)

1. github.com’da hesap açın.
2. Sağ üstte **+ → New repository** → ad: `bumbase` → **Private** seçin → **Create repository**.
3. Açılan sayfada **uploading an existing file** bağlantısına tıklayın.
4. Zip dosyasını bilgisayarınızda açın ve `bum-base` klasörünün **içindeki** tüm dosya ve klasörleri sürükleyip bırakın (`index.html`, `js`, `assets`, `panel`, `server`, `package.json`, `Dockerfile` …).
5. **Commit changes**’e basın.

Kodda daha sonra yapılan her değişiklik GitHub’a yüklendiğinde site otomatik güncellenir.

---

## 3. Sunucuya kurulum: Railway (15 dk, aylık yaklaşık 5 $)

1. railway.com → **Login → GitHub ile giriş**. Hobby planını seçin (güncel fiyatı sitesinden kontrol edin).
2. **New Project → Deploy from GitHub repo → bumbase**. Railway projeyi otomatik tanır ve kurar.
3. **Kalıcı disk (siparişlerin kaybolmaması için şart):** proje ekranında servise sağ tıklayın → **Attach volume** (veya **+ New → Volume**) → mount path: `/data`.
4. Servise tıklayın → **Variables** sekmesi → **Raw Editor**’e aşağıdakileri yapıştırıp kendi değerlerinizi yazın:

```
NODE_ENV=production
ADMIN_PIN=buraya-en-az-6-karakterli-zor-bir-sifre
DATA_DIR=/data
PUBLIC_URL=https://bumbase.com.tr
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
IYZICO_BUYER_EMAIL=iletisim@bumbase.com.tr
```

   - `ADMIN_PIN` panel giriş şifresidir; boş, kısa veya `1234` olursa sunucu güvenlik için açılmaz.
   - iyzico anahtarları boşken site çalışır, yalnızca kapıda ödeme görünür.
5. **Settings → Networking → Generate Domain**: `bumbase-production.up.railway.app` gibi geçici bir adres verilir. Bu adresi açıp siteyi ve `/panel/` adresini deneyin.
6. **Deploy Logs**’ta şu satırları görmelisiniz:

```
BUM BASE çalışıyor (yayın modu)
Veri  : /data
Ödeme : ...
```

> Not: Siparişler `/data/orders.json` dosyasında tutulur. Bu yüzden servis **tek kopya** (1 replica) çalışmalıdır; Railway’de varsayılan budur.

---

## 4. Alan adını bağlama (10 dk + DNS yayılması 5 dk – birkaç saat)

1. Railway → servis → **Settings → Networking → Custom Domain** → `bumbase.com.tr` yazın. Aynısını `www.bumbase.com.tr` için de yapın.
2. Railway her biri için bir **CNAME** kaydı gösterir (ör. `xxxx.up.railway.app`) ve bazen bir doğrulama (TXT) kaydı ister.
3. DNS yönetiminize (Cloudflare veya alan adı firması) bu kayıtları ekleyin:
   - `@` (kök) → CNAME → Railway’in verdiği adres. Cloudflare’de bulut simgesini **gri (DNS only)** yapın.
   - `www` → CNAME → Railway’in verdiği adres.
   - Railway TXT kaydı istediyse onu da ekleyin.
4. Railway ekranında alan adının yanında yeşil onay çıkınca SSL sertifikası otomatik kurulur ve site `https://bumbase.com.tr` adresinde açılır.
5. `PUBLIC_URL` değişkeninin bu adres olduğundan emin olun.

---

## 5. iyzico

### 5a. Test ortamı (hemen, ücretsiz)

1. **sandbox-merchant.iyzipay.com** adresinden test hesabı açın.
2. Panelde **Ayarlar → Firma Ayarları**’ndan **API Anahtarı** ve **Güvenlik Anahtarı**’nı kopyalayın.
3. Railway → Variables: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` alanlarına yazın; `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com` kalsın. Servis kendiliğinden yeniden başlar.
4. Sitede bir sipariş verin → **Online Kredi / Banka Kartı** → **iyzico ile öde**. Test kartı:
   - Kart no: `5528 7900 0000 0008`, son kullanma `12/30`, CVC `123`. 3D doğrulama ekranı çıkarsa ekrandaki test yönergesini izleyin.
5. Ödemeden sonra sipariş takip sayfasına dönmeli, sipariş panelde **Ödendi · MASTERCARD •••• 0008** olarak görünmelidir. Ödeme sayfasında “iptal”e basarsanız siteye “Ödeme tamamlanamadı” uyarısıyla dönülür ve sipariş oluşmaz.

### 5b. Canlıya geçiş (başvuru + birkaç iş günü)

1. iyzico.com → **Üye İşyeri Ol** başvurusunu yapın. Genellikle istenenler: vergi levhası, kimlik, IBAN, (şirketse) imza sirküleri.
2. Başvuruda sitenizin yayında olması ve şu sayfaların bulunması beklenir: **İletişim, Hakkımızda, Mesafeli Satış Sözleşmesi, İptal/İade, KVKK/Gizlilik** ve fiyatlı ürünler. Bunların hepsi sitede hazır (alt bilgide bağlantılar var). iyzico, alt bilgiye kendi logo bandını eklemenizi isterse panelinizdeki görseli `assets/img/` klasörüne koyup bana iletin, yerleştireyim.
3. Onay gelince canlı API anahtarlarını alın ve Railway’de değiştirin:

```
IYZICO_API_KEY=canlı-anahtar
IYZICO_SECRET_KEY=canlı-güvenlik-anahtarı
IYZICO_BASE_URL=https://api.iyzipay.com
```

4. Küçük tutarlı gerçek bir siparişle deneyin; iyzico panelinden iade ederek kontrol edin.

---

## 6. Kasadaki bilgisayar (10 dk)

1. Chrome’da `https://bumbase.com.tr/panel/` adresini açın, PIN ile giriş yapın.
2. Üst çubuktaki **Uygulamayı yükle**’ye basın (veya adres çubuğundaki kurulum simgesi).
3. **Bildirimleri aç** ve **Sesi aç** düğmelerine basın. Üst çubuktaki **Siparişleri durdur** (yoğunlukta sipariş alımını geçici kapatır) ve **Ürünler** (tükenen ürünü işaretler) düğmelerinin yerini personele gösterin.
4. **Yazıcı** → **Bilgisayara kurulu yazıcı** → kağıt genişliği → **Test fişi yazdır**. “Yeni sipariş gelince otomatik yazdır”ı açın.
5. Fişlerin pencere çıkmadan basılması ve bilgisayar açılınca panelin kendiliğinden açılması için: `Win + R` → `shell:startup` → bu klasöre yeni kısayol, hedef:

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://bumbase.com.tr/panel/
```

> Bulut sunucuda “Ağ yazıcısı (IP)” seçeneği kullanılmaz: sunucu restoranın yerel ağındaki yazıcıya ulaşamaz. Yazdırmayı kasadaki bilgisayar yapar.

---

## 7. Yayın kontrol listesi

- [ ] `js/config.js → legal` bilgileri dolduruldu; yasal sayfalarda sarı alan kalmadı (`npm run check` ile de kontrol edilebilir)
- [ ] `ADMIN_PIN` güçlü bir şifre; personel dışında kimseyle paylaşılmadı
- [ ] Railway’de `/data` kalıcı diski bağlı; Deploy Logs’ta `Veri  : /data` görünüyor
- [ ] Alan adı https ile açılıyor; `PUBLIC_URL` bu adres
- [ ] Kapıda ödemeli bir deneme siparişi panele düştü ve fişi basıldı
- [ ] iyzico test kartıyla ödeme yapıldı, sipariş “Ödendi” olarak geldi
- [ ] Panel kasadaki bilgisayara kuruldu, bildirim ve yazıcı açık
- [ ] Deneme siparişleri panelden “İptal” edildi
- [ ] (Canlı iyzico onayından sonra) canlı anahtarlar girildi, küçük bir gerçek ödeme denendi

---

## Sık sorulanlar

**Siparişler nerede saklanıyor?** Railway’deki kalıcı diskte (`/data/orders.json`). Disk silinmediği sürece yeniden başlatma ve güncellemelerde kaybolmaz. Yedek almak için Railway’de volume yedeklemesini açabilirsiniz.

**Menüde fiyat değiştirmek istersem?** `js/data/menu.js` dosyasını GitHub’da düzenleyip kaydedin (kalem simgesi → Commit). Site 1–2 dakikada güncellenir. Fiyatlar sunucuda da bu dosyadan hesaplandığı için müşteri tarafında değiştirilemez.

**Dükkân kapalıyken sipariş gelir mi?** Hayır. Çalışma saatleri (`js/config.js → hours`) dışında site anında veya ileri saatli sipariş almaz; sunucu da reddeder. Saatler Türkiye saatine göre hesaplanır. Bayram vb. özel günlerde kapalı kalacaksanız panelden **Siparişleri durdur**’u kullanın.

**Tükendi ve durdurma bilgisi nerede tutulur?** `/data/store-status.json` dosyasında; yeniden başlatmada korunur.

**Site çökerse ne olur?** Railway servisi otomatik yeniden başlatır. Railway’in durumu: status.railway.com.

**Aylık maliyet:** Railway yaklaşık 5 $ + alan adı yıllık birkaç yüz TL + iyzico işlem komisyonu (iyzico sözleşmenize göre).
