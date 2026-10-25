/**
 * RESTORAN AYARLARI
 * -----------------------------------------------------------------
 * Restoranla ilgili bütün metin ve kurallar bu dosyada durur.
 * Bilgileri değiştirmek için yalnızca bu dosyayı düzenlemeniz yeterli.
 * (Tarayıcıda ve Node.js sunucusunda ortak kullanılır.)
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.App = root.App || {}; root.App.config = mod; }
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    restaurant: {
      name: 'BUM BASE',
      shortName: 'BUM BASE',
      brandSub: 'Keçiören', // logonun altındaki küçük yazı
      tagline: 'Hızlı, sıcak, lezzetli',
      seoTitle: 'Keçiören Pizza & Burger Paket Servis', // tarayıcı sekmesi ve Google başlığı
      phone: '0312 364 44 06',
      phoneHref: '+903123644406',
      whatsapp: '+905000000000',
      email: '', // Boş bırakılırsa sitede e-posta gösterilmez
      address: 'Şenlik Mah. Fatih Caddesi 194/A, Keçiören / Ankara',
      district: 'Keçiören',
      city: 'Ankara',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Şenlik Mah. Fatih Caddesi 194/A Keçiören Ankara'),
      // Kendi sitenizde Google Maps "Haritayı yerleştir" (embed) linkini buraya koyarsanız harita iframe olarak gösterilir.
      mapEmbedUrl: '',
      founded: null, // Kuruluş yılı (ör. 2018). Verilirse sitede "… yılından beri" olarak gösterilir.
      instagram: 'https://instagram.com/',
      // Hakkımızda sayfası metni — ÖRNEK, kendi hikâyenizle değiştirin
      about: {
        title: 'Keçiören’in gece mutfağı.',
        paragraphs: [
          'Her gün öğlen 12:00’den sabaha karşı 05:00’e kadar açığız. Öğle yemeğinden gece yarısı açlığına kadar, mutfağımız sipariş almaya devam ediyor.',
          'Pizzalarımız orta ve dev boy seçeneğiyle, burgerlerimiz 120 gramdan 240 grama kadar köfte seçenekleriyle hazırlanır.',
        ],
      },
    },

    // Saatler Türkiye saatine göre hesaplanır (sunucu yurt dışında olsa bile). UTC+3 = 180 dk
    utcOffsetMinutes: 180,

    // 0 = Pazar, 1 = Pazartesi ... 6 = Cumartesi. "kapalı" için null verin.
    hours: [
      { day: 0, label: 'Pazar', open: '12:00', close: '05:00' },
      { day: 1, label: 'Pazartesi', open: '12:00', close: '05:00' },
      { day: 2, label: 'Salı', open: '12:00', close: '05:00' },
      { day: 3, label: 'Çarşamba', open: '12:00', close: '05:00' },
      { day: 4, label: 'Perşembe', open: '12:00', close: '05:00' },
      { day: 5, label: 'Cuma', open: '12:00', close: '05:00' },
      { day: 6, label: 'Cumartesi', open: '12:00', close: '05:00' },
    ],

    delivery: {
      currency: 'TRY',
      minOrder: 250, // TL — minimum sepet tutarı
      fee: 0, // TL — teslimat ücreti. 0 = teslimat her zaman ücretsiz
      freeOver: 0, // TL — ücret varsa, bu tutarın üzerinde teslimat ücretsiz olur (0 = kullanılmıyor)
      etaMinutes: [35, 50],
      // Servis verilen ilçe(ler). Şu an yalnızca Keçiören'e teslimat yapılıyor.
      zones: [
        { id: 'kecioren', label: 'Keçiören', extraFee: 0 },
      ],
      // Teslimat yapılan mahalleler (ödeme sayfasında seçilebilir liste olarak gösterilir)
      neighborhoods: [
        '19 Mayıs', '23 Nisan', 'Adnan Menderes', 'Aktepe', 'Atapark', 'Bademlik', 'Bağlarbaşı', 'Basınevleri',
        'Çaldıran', 'Çiçekli', 'Esertepe', 'Güçlükaya', 'Güzelyurt', 'İncirli', 'Kalaba', 'Kamil Ocak',
        'Karargahtepe', 'Kavacık Subayevleri', 'Köşk', 'Kuşcağız', 'Osmangazi', 'Pınarbaşı', 'Şefkat', 'Şenlik',
        'Tepebaşı', 'Ufuktepe', 'Uyanış', 'Yakacık', 'Yeşiltepe',
      ],
    },

    payment: {
      // 'mock' → simüle edilmiş sanal POS. Gerçek entegrasyonda 'iyzico' veya 'stripe'.
      provider: 'mock',
      methods: [
        { id: 'card_online', label: 'Online Kredi / Banka Kartı', hint: '3D Secure ile güvenli ödeme' },
        { id: 'cash_door', label: 'Kapıda Nakit', hint: 'Kuryeye nakit ödeyin' },
        { id: 'card_door', label: 'Kapıda Kredi Kartı', hint: 'Kurye POS cihazı getirir' },
      ],
    },

    api: {
      // 'auto'  → server/server.js çalışıyorsa onu kullanır, yoksa tarayıcı içi (localStorage) moda düşer
      // 'local' → her zaman tarayıcı içi demo modu
      // 'remote'→ her zaman sunucu
      mode: 'auto',
      baseUrl: '',
    },

    admin: {
      // DEMO PIN — canlıya almadan önce sunucu tarafında ADMIN_PIN ortam değişkeni ile değiştirin.
      pin: '1234',
    },

    // Müşteri yorumları bölümü. Gerçek yorumlarınızı js/pages/home.js → reviews listesine ekleyince true yapın.
    // (Uydurma yorumları yayında göstermek hem yanıltıcıdır hem de Tüketici Kanunu'na aykırıdır.)
    showReviews: false,
    showSampleBadges: true,

    // Yasal sayfalarda (mesafeli satış, KVKK, iade) görünen satıcı bilgileri — YAYINDAN ÖNCE DOLDURUN
    legal: {
      company: 'BUM BASE GIDA LOJİSTİK E-TİCARET SANAYİ VE TİCARET LİMİTED ŞİRKETİ',  
      taxOffice: 'Keçiören', 
      taxNumber: '19001622859',
      mersis: '',       // MERSİS no (şirketse)
      email: 'bummbase@gmail.com',
      kep: '',          // KEP adresi (varsa)
      updated: '17.10.2026',
    },

    // Site ilk açıldığında gösterilecek sayfa: 'menu' veya 'home' (ana sayfaya #anasayfa ile gidilir)
    startPage: 'menu',

    // Raporlarda gün bu saatte başlar: gece 00:00–05:59 arası siparişler bir önceki güne sayılır
    reportDayStart: '06:00',

    // Sipariş kaynakları. QR kodlar siteye ?k=<anahtar> ile gelir (ör. https://bumbase.com.tr/?k=masa)
    sources: {
      masa: 'Masa kartı QR',
      brosur: 'Broşür QR',
      google: 'Google',
      instagram: 'Instagram',
      facebook: 'Facebook',
      whatsapp: 'WhatsApp',
      direkt: 'Doğrudan / diğer',
    },

    // Restoran sipariş paneli ayrı sayfadadır (müşteri sitesinde panel kodu bulunmaz).
    // Kendi alan adınızda ayrı bir alt alan adı kullanacaksanız tam adresi yazın, ör. 'https://panel.bumbase.com.tr/'
    panelUrl: 'panel/index.html',
  };
});
