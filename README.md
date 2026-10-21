# BUM BASE: Restoran Web Sitesi + Sipariş Paneli

Paket servis siparişi alan, mobil uyumlu restoran sitesi. Build adımı ve bağımlılık gerektirmez.

- **Müşteri tarafı:** Ana sayfa, menü, sepet, ödeme ve teslimat, sipariş takibi, hakkımızda ve iletişim
- **Restoran tarafı:** Gelen siparişleri anlık gösteren, PIN korumalı yönetim paneli. Müşteri sitesinden ayrı bir adreste (`/panel/`) çalışır ve bilgisayara/telefona uygulama olarak kurulabilir
- **Ödeme:** iyzico / Stripe akışını taklit eden mock sanal POS (3D Secure dahil)

> Güncel bilgiler: **BUM BASE**, Şenlik Mah. Fatih Caddesi 194/A, Keçiören / Ankara, her gün 12:00 – 05:00.
> Telefon, e-posta, menü, fiyatlar, teslimat bölgeleri, yorumlar ve Hakkımızda metni hâlâ **örnek**tir; aşağıdaki "Özelleştirme" bölümüne bakın.

---

## Hızlı başlangıç

> **Yayınlamak için:** [YAYINLAMA.md](YAYINLAMA.md) (alan adı, Railway, iyzico, kasadaki bilgisayar).

### 1) Tam sürüm (önerilen): Node.js sunucusu ile

```bash
node server/server.js
# veya: npm start
```

- Site: http://localhost:3000
- Panel: http://localhost:3000/panel/ (demo PIN: `1234`)

Bu modda siparişler `server/data/orders.json` dosyasına yazılır. Admin paneli siparişleri **Server-Sent Events** ile anlık alır, yani farklı cihazlardan gelen siparişler de panelde belirir. Node.js 18 veya üstü yeterlidir; `npm install` gerekmez.

```bash
PORT=8080 ADMIN_PIN=4821 node server/server.js
```

### 2) Statik demo: sunucusuz

`index.html` dosyasını tarayıcıda açın ya da klasörü herhangi bir statik hostinge (Netlify, Vercel, GitHub Pages, cPanel) yükleyin.

Bu modda siparişler tarayıcıda (`localStorage`) tutulur. Panel ile müşteri sayfası **aynı tarayıcının farklı sekmelerinde** anlık eşitlenir (`BroadcastChannel`). Tanıtım ve tasarım onayı için uygundur. Gerçek sipariş almak için 1. yöntemi kullanın.

Mod seçimi otomatiktir (`js/config.js → api.mode: 'auto'`): `/api/health` cevap verirse sunucu modu, vermezse demo modu açılır.

---

## Özellikler

| Bölüm | İçerik |
|---|---|
| Ana sayfa | Kor animasyonlu hero, açık/kapalı durumu (saatlere göre otomatik), öne çıkanlar, hızlı sipariş (hazır menüler, en çok satanlar, "son siparişi tekrarla"), yorumlar, çalışma saatleri ve iletişim özeti |
| Menü | Kategori şeridi (kaydırdıkça aktif kategori değişir), arama, Acılı / Vejetaryen / Şefin Önerisi filtreleri, porsiyon seçimi ve ürün notu |
| Sepet | Sayfa yenilenmeden güncellenen sepet çekmecesi ve sepet sayfası, porsiyon/adet değişikliği, ücretsiz teslimat, minimum sipariş ilerleme çubuğu ve kontrolü, "yanına iyi gider" önerileri |
| Sipariş alımı | Kapalı saatlerde (Türkiye saatiyle) ne anında ne ileri saatli sipariş alınır; ileri saat yalnızca o anki çalışma vardiyasının içinden seçilebilir. Panelden **Siparişleri durdur** ve ürün bazında **Tükendi**; değişiklik tüm müşterilere anında yansır. Kurallar sunucuda da uygulanır (`js/shared/availability.js`) |
| Ödeme & teslimat | Adres formu (cihazda hatırlama), ileri saate planlama, teslimat notu, online kart / kapıda nakit / kapıda kart, alan bazlı doğrulama, 3D Secure ekranı |
| Sipariş takibi | Canlı durum adımları (Alındı → Hazırlanıyor → Yolda → Teslim), tahmini teslimat saati, adisyon, tekrar sipariş |
| Admin paneli | Siparişleri durdur / aç, Ürünler (tükendi) ekranı; günlük sipariş, ciro, aktif sipariş ve ortalama sepet; Kanban (Yeni / Hazırlanıyor / Yolda); tek tıkla durum ilerletme; iki adımlı iptal; bekleyen siparişlerde renkli uyarı; sesli bildirim; arama; demo sipariş üretici |

---

## Mimari

```
index.html                 Uygulama kabuğu
assets/css/app.css         Tasarım sistemi (CSS değişkenleri / token'lar)
js/
  config.js                ★ Restoran bilgileri, saatler, teslimat kuralları, ödeme yöntemleri
  data/menu.js             ★ Menü (kategoriler, ürünler, porsiyonlar, fiyatlar)
  shared/                  Tarayıcı + sunucu ORTAK kod
    pricing.js             Sepet / teslimat ücreti hesaplama
    orders-core.js         Sipariş doğrulama, durumlar, sipariş nesnesi
    availability.js        Çalışma saatleri, ileri saat, durdurma ve tükendi kuralları
    payment-mock.js        Mock sanal POS (intent → confirm → 3DS)
    receipt.js             Adisyon fişi: ESC/POS (CP857) ve HTML çıktısı
  lib/
    store.js               State management (Redux benzeri store + seçiciler)
    router.js              Hash tabanlı yönlendirici (#menu, #sepet, #odeme…)
    illustrations.js       Yerleşik SVG yemek illüstrasyonları
    utils.js
  services/
    api.js                 Mod seçimi (local / remote) ve HTTP yardımcıları
    orders.js              Sipariş servisi (local ve remote adaptörleri)
    payments.js            Ödeme servisi (sağlayıcıdan bağımsız arayüz)
    printer.js             Yazıcı sürücüleri: tarayıcı, USB, seri port, ağ
  components/ui.js         Başlık, sepet çekmecesi, modal, toast, ürün kartı
  pages/                   home, menu, cart, checkout, order, contact (müşteri) · admin (panel)
panel/                     Restoran paneli: ayrı giriş sayfası, uygulama simgeleri, manifest, service worker
server/server.js           Bağımlılıksız Node.js API + SSE + statik sunucu
server/printer.js          Ağ yazıcısına (IP:9100) ESC/POS gönderimi
```

**Neden bu yapı?**

- **Build yok:** Dosyalar her hostingte doğrudan çalışır; `file://` ile açıldığında da çalışır.
- **Tek doğruluk kaynağı:** Fiyat ve sipariş kuralları `js/shared/` içinde. Sunucu, istemciden gelen fiyatlara güvenmez; sepeti aynı kodla yeniden hesaplar.
- **Değiştirilebilir adaptörler:** `orders.js` ve `payments.js` aynı arayüzü korur. Kendi backend'inize (Laravel, Django, Supabase, Firebase…) geçerken yalnızca `remote` adaptörünü uyarlamanız yeterli.
- **Tailwind yerine CSS token'ları:** Tailwind'in CDN sürümü üretim için önerilmiyor; build adımı eklememek için tasarım sistemi `app.css` içinde CSS değişkenleriyle yazıldı. İsterseniz token'lar `tailwind.config.js` içine birebir taşınabilir.

### State yönetimi

```js
App.store.dispatch({ type: 'CART_ADD', id: 'o-adana', portion: 'bucuk', qty: 2 });
App.cart.summary();   // { lines, subtotal, deliveryFee, total, meetsMinimum, freeDeliveryLeft … }
App.store.subscribe((state, action, prev) => { /* arayüz güncellenir */ });
```

Sepet `localStorage`'a yazılır ve açık sekmeler arasında eşitlenir.

---

## Özelleştirme

1. **Restoran bilgileri:** `js/config.js → restaurant` (ad, telefon, adres, Google Maps linki, kuruluş yılı `founded`, Hakkımızda metni `about`)
2. **Harita:** Google Maps'te "Paylaş → Harita yerleştir" ile aldığınız `src` adresini `mapEmbedUrl` alanına yazın.
3. **Saatler:** `hours` (gece yarısını geçen kapanışlar desteklenir, örn. `12:00–05:00`; tüm günler aynıysa sitede tek satır "Her gün" olarak gösterilir)
4. **Teslimat:** `delivery` (minimum tutar `minOrder`; `fee: 0` teslimatı her zaman ücretsiz yapar. İleride ücret alınacaksa `fee` ve isteğe bağlı ücretsiz teslimat eşiği `freeOver` yazılır; bölgeler ve bölge farkı)
5. **Menü ve fotoğraflar:** `js/data/menu.js`. Ürün fotoğrafları `assets/img/menu/<ürün-id>.webp` olarak durur ve `menu.js` sonundaki `photos` listesiyle eşleşir; içeceklerde 1 L şişe için `<ürün-id>-1l.webp` kullanılır. Fotoğrafı olmayan ürünlerde (burgerler, sufle, bazı soslar) illüstrasyon gösterilir.
6. **Yorumlar:** `js/pages/home.js → reviews`. Yorumlar şu an **örnektir**; gerçek yorumlarınızla değiştirince `config.showSampleBadges = false` yapın.
7. **Renkler ve yazı tipleri:** `assets/css/app.css` başındaki `:root` token'ları

---

## Ödeme entegrasyonu (iyzico)

Online kart ödemesi **iyzico Ödeme Formu** ile yapılır (`server/iyzico.js`, bağımlılıksız, IYZWSv2 imzası):

1. Müşteri “iyzico ile öde”ye basar → sunucu sepeti yeniden hesaplar, siparişi *ödeme bekliyor* olarak ayırır ve iyzico’dan ödeme sayfası adresi alır.
2. Müşteri kart bilgilerini iyzico’nun sayfasında girer; kart verisi bu sunucuya hiç gelmez.
3. iyzico müşteriyi `/api/payments/iyzico/callback`’e döndürür → sunucu sonucu iyzico’dan doğrular (durum, sepet numarası, tutar, tekrar kullanım) ve ancak o zaman siparişi panele düşürür.
4. Başarısız veya iptal edilen ödemede sipariş oluşmaz, müşteri ödeme sayfasına uyarıyla döner, sepeti korunur.

Ödeme sağlayıcısı ortam değişkenlerine göre seçilir: iyzico anahtarı varsa **iyzico**; yayında anahtar yoksa online kart **kapalı** (yalnızca kapıda ödeme); geliştirmede **mock** sanal POS (test kartları: 4242 4242 4242 4242 başarılı, 4000 0000 0000 3220 3D Secure / kod 123456, 4000 0000 0000 0002 red).

Kurulum ve canlıya geçiş adımları: **[YAYINLAMA.md](YAYINLAMA.md)**.

---

## Restoran paneli (ayrı site, uygulama olarak kurulabilir)

Panel müşteri sitesinden ayrıdır: `index.html` panel, yazıcı ve fiş kodlarını **yüklemez**; panel yalnızca `panel/index.html` adresinden açılır. Eski `#admin` adresi otomatik olarak panele yönlendirir.

- **Adres:** `https://alanadiniz.com/panel/`. İsterseniz ayrı bir alt alan adına (ör. `panel.bumbase.com.tr`) yönlendirebilirsiniz; bu durumda `js/config.js → panelUrl` değerini tam adresle değiştirin. Müşteri sitesi ve panel aynı sunucuyu (`server/server.js`) kullanır.
- **Uygulama olarak kurma:** Paneli Chrome veya Edge’de açın; üst çubukta **Uygulamayı yükle** düğmesi (veya adres çubuğundaki kurulum simgesi) çıkar. Kurulunca masaüstünde ve Başlat menüsünde “BUM BASE Panel” simgesiyle, adres çubuğu olmadan açılır. Android’de Chrome menüsünden “Ana ekrana ekle”, iPhone’da Safari’de “Paylaş → Ana Ekrana Ekle”. Kurulum için site **https** üzerinden yayınlanmalıdır (yerel denemede `localhost` da olur).
- **Bildirimler:** **Bildirimleri aç** düğmesine basıp izin verin. Panel arka planda veya simge durumundayken her yeni sipariş “Yeni sipariş #BB12345 · müşteri · mahalle · tutar · ödeme yöntemi” bildirimi olarak gelir; tıklayınca panel öne gelir. Panel tamamen kapalıyken bildirim gelmez; bunun için Web Push (VAPID anahtarı) eklenmesi gerekir.
- **Siparişleri durdur:** Yoğunlukta üst çubuktaki **Siparişleri durdur**’a basın. Sitede “Şu an sipariş alamıyoruz” uyarısı çıkar, sepete ekleme ve ödeme kapanır; gelen siparişler etkilenmez. **Siparişleri aç** ile geri açılır.
- **Tükendi:** **Ürünler** ekranında ürünün düğmesini kapatın. Ürün sitede gri ve “Tükendi” olarak görünür, sepete eklenemez; sepetinde bu ürün olan müşteri çıkarmadan ödeme yapamaz. Durum `DATA_DIR/store-status.json` dosyasında saklanır, sunucu yeniden başlasa da korunur.
- **Kapalı saatler:** Çalışma saatleri dışında site otomatik olarak sipariş almaz (ileri saatli dahil); panelde de bilgi şeridi görünür.
- **Bilgisayar açılınca otomatik başlatma (Windows):** `Win + R` → `shell:startup` klasörüne şu hedefle bir kısayol koyun:

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://alanadiniz.com/panel/
```

  `--kiosk-printing` fişlerin yazdırma penceresi çıkmadan basılmasını, `--app` panelin uygulama penceresinde açılmasını sağlar.

---

## Adisyon yazıcısı (termal fiş)

Sipariş panelinde (`/panel/`) sağ üstteki **Yazıcı** düğmesinden ayarlanır. Her sipariş kartında **Fiş** (önizleme) ve **Yazdır / Tekrar yazdır** düğmeleri vardır; basılan siparişlerde “Yazdırıldı 14:33” etiketi görünür.

Fişte yazanlar: sipariş numarası ve saati, teslimat zamanı (planlıysa vurgulu), müşteri adı ve telefonu, mahalle / adres / adres tarifi, ürünler (adet, boy, ürün notu, tutar), ara toplam, teslimat, **toplam**, **ödeme yöntemi** (online ödendiyse “TAHSİLAT YOK”, kapıda ise “TAHSİL: … TL”), **sipariş notu** (ters renkli kutuda) ve çatal-bıçak tercihi. 58 mm ve 80 mm kağıt desteklenir; 2–3 nüsha seçilirse fişler “MUTFAK / KURYE / KASA NÜSHASI” diye ayrılır.

| Yöntem | Ne zaman | Notlar |
|---|---|---|
| **Bilgisayara kurulu yazıcı** (önerilen) | Yazıcının Windows sürücüsü kurulu | Her marka çalışır. Yazdırma penceresi çıkmadan basması için aşağıdaki “sessiz yazdırma” ayarını yapın. |
| **USB yazıcı (doğrudan)** | Sürücüsüz ESC/POS yazıcı | Chrome / Edge. Windows sürücüsü kuruluysa tarayıcı yazıcıya erişemez; ya sürücüyü kaldırın ya da Zadig ile WinUSB sürücüsü atayın. |
| **Seri port / COM** | USB-seri veya RS232 yazıcı | Chrome / Edge. Baud hızı ayarlardan seçilir (çoğunlukla 9600 veya 115200). |
| **Ağ yazıcısı (IP)** | Ethernet / Wi-Fi yazıcı | Sunucu fişi doğrudan `IP:9100` adresine gönderir; panel kapalıyken bile basabilir. |

**Ağ yazıcısı ile sunucuyu başlatma** (sunucu yazıcıyla aynı yerel ağda olmalı):

```bash
PRINTER_HOST=192.168.1.50 PRINTER_AUTO=1 PRINTER_COPIES=2 node server/server.js
```

`PRINTER_PORT` (9100), `PRINTER_PAPER` (80 / 58), `PRINTER_CHARSET` (cp857 / ascii) ve `PRINTER_CODEPAGE` (13) da ayarlanabilir. `PRINTER_AUTO=1` iken her yeni sipariş gelir gelmez basılır; aynı sipariş otomatik olarak ikinci kez basılmaz.

**Sessiz yazdırma (Windows + Chrome):** Termal yazıcıyı Windows’ta *varsayılan yazıcı* yapın, kağıt boyutunu 80 mm (veya 58 mm) seçin ve Chrome’u şu kısayolla açın:

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=http://localhost:3000/panel/
```

Böylece panelde “Yeni sipariş gelince otomatik yazdır” açıkken fişler pencere çıkmadan basılır.

**Türkçe karakterler:** Doğrudan yazdırmada (USB / seri / ağ) CP857 kod sayfası kullanılır. Yazıcınız Türkçe harfleri bozuk basarsa ayarlardan “Türkçe karaktersiz” seçeneğine geçin ya da `PRINTER_CODEPAGE` değerini yazıcının kılavuzundaki PC857 numarasıyla değiştirin. Önce **Test fişi yazdır** ile deneyin.

---

## Canlıya almadan önce kontrol listesi

- [ ] `ADMIN_PIN`'i değiştirin. Birden fazla personel varsa PIN yerine kullanıcı adı/şifre + oturum (JWT/cookie) kullanın.
- [ ] HTTPS arkasında çalıştırın (Nginx / Caddy / Cloudflare).
- [ ] Sipariş takip linkleri tahmin edilebilir numara içeriyor; müşteri takibi için sipariş nesnesine rastgele bir `trackingToken` ekleyip linke koyun.
- [ ] `orders.json` küçük işletme için yeterli. Yoğun kullanımda SQLite / PostgreSQL'e geçin (`orders` dizisi okuma/yazma noktaları tek dosyada).
- [ ] Mesafeli satış sözleşmesi ve KVKK aydınlatma metinlerini ekleyin (şu an yalnızca onay kutusu var).
- [ ] Gerçek ürün fotoğraflarını WebP formatında `assets/img/` klasörüne ekleyin.
- [ ] İletişim formunu bir e-posta servisine veya `/api/contact` ucuna bağlayın (şu an yalnızca arayüzde onay gösteriyor).

---

## API özeti

| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/api/health` | Sunucu durumu |
| POST | `/api/payments/intent` | Ödeme oturumu (tutar sunucuda hesaplanır) |
| POST | `/api/payments/:id/confirm` | Kartla onay |
| POST | `/api/payments/:id/3ds` | 3D Secure kodu |
| POST | `/api/orders` | Sipariş oluştur (kapıda ödeme) |
| POST | `/api/checkout/iyzico` | Online kart: iyzico ödeme sayfası adresi |
| POST | `/api/payments/iyzico/callback` | iyzico dönüşü (doğrulama + siparişi onaylama) |
| GET | `/api/orders/:id` | Müşteri sipariş takibi |
| GET | `/api/orders` | Tüm siparişler (`x-admin-pin`) |
| PATCH | `/api/orders/:id` | Durum güncelle (`x-admin-pin`) |
| GET | `/api/printer` | Sunucu yazıcı ayarları (`x-admin-pin`) |
| POST | `/api/print/:id` | Siparişi ağ yazıcısına bas (`x-admin-pin`) |
| POST | `/api/print-test` | Test fişi (`x-admin-pin`) |
| GET | `/api/stream?pin=` | SSE canlı akış (PIN'li: tam sipariş, PIN'siz: yalnızca durum) |
| GET | `/api/store-status` | Sipariş alımı durumu ve tükenen ürünler |
| PATCH | `/api/store-status` | `{ paused, soldOut }` güncelle (`x-admin-pin`) |
