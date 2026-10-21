/* Yasal sayfalar: ön bilgilendirme + mesafeli satış sözleşmesi, iptal ve iade, KVKK aydınlatma ve gizlilik
 * Satıcı bilgileri js/config.js → legal alanından gelir. Boş alanlar sarı [ ... ] olarak görünür.
 * Bu metinler şablondur; yayından önce bir hukukçu / mali müşavir tarafından gözden geçirilmelidir. */
(function (App) {
  var U = App.utils, esc = U.esc, cfg = App.config, R = cfg.restaurant;

  function v(val, label) { return val ? esc(val) : '<span class="ph">[' + esc(label) + ']</span>'; }
  function L() { return cfg.legal || {}; }
  function seller() {
    var l = L();
    return '<ul>' +
      '<li><b>Unvan / Ad Soyad:</b> ' + v(l.company, 'Şirket unvanı veya işletme sahibinin adı soyadı') + ' (“' + esc(R.name) + '”)</li>' +
      '<li><b>Adres:</b> ' + esc(R.address) + '</li>' +
      '<li><b>Telefon:</b> ' + esc(R.phone) + '</li>' +
      '<li><b>E-posta:</b> ' + v(l.email, 'E-posta adresi') + (l.kep ? ' · <b>KEP:</b> ' + esc(l.kep) : '') + '</li>' +
      '<li><b>Vergi dairesi / no:</b> ' + v(l.taxOffice, 'Vergi dairesi') + ' / ' + v(l.taxNumber, 'Vergi no') + '</li>' +
      (l.mersis ? '<li><b>MERSİS no:</b> ' + esc(l.mersis) + '</li>' : '') +
      '</ul>';
  }
  function shell(title, body) {
    return '<section class="page-hero page-hero--slim"><div class="container"><p class="eyebrow">Yasal bilgiler</p><h1 class="display-md">' + title + '</h1>' +
      '<nav class="legal-nav" aria-label="Yasal sayfalar"><a class="cat-chip" href="#sozlesme">Mesafeli satış</a><a class="cat-chip" href="#iade">İptal ve iade</a><a class="cat-chip" href="#gizlilik">KVKK ve gizlilik</a></nav></div></section>' +
      '<div class="container page-body"><article class="legal">' + body + '<p class="muted text-sm">Son güncelleme: ' + esc(L().updated || '') + '</p></article></div>';
  }

  function sozlesme() {
    var d = cfg.delivery;
    return shell('Ön bilgilendirme formu ve mesafeli satış sözleşmesi', '' +
      '<p>Bu metin, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, internet sitemiz üzerinden verilen paket servis siparişlerine ilişkin ön bilgilendirme ve sözleşme hükümlerini içerir. Siparişi onaylayan alıcı bu metni okuduğunu ve kabul ettiğini beyan eder.</p>' +
      '<h2>1. Satıcı</h2>' + seller() +
      '<h2>2. Alıcı</h2><p>Sipariş formunda adı, telefonu ve teslimat adresi belirtilen kişidir.</p>' +
      '<h2>3. Sözleşmenin konusu ve ürünler</h2><p>Alıcının internet sitesi üzerinden seçtiği yiyecek ve içeceklerin, sipariş özetinde belirtilen nitelik, adet ve fiyatlarla hazırlanarak teslimat adresine getirilmesidir. Ürünlerin temel nitelikleri (içerik, boy, porsiyon) menüde ve sipariş özetinde yer alır.</p>' +
      '<h2>4. Fiyat, teslimat ve ödeme</h2><ul>' +
      '<li>Tüm fiyatlar Türk lirasıdır ve KDV dahildir. Ödenecek toplam tutar, teslimat ücreti dahil olarak sipariş onayından önce gösterilir.</li>' +
      '<li>Minimum sipariş tutarı ' + U.money(d.minOrder, true) + '’dir. ' + (d.fee ? 'Teslimat ücreti ' + U.money(d.fee) + (d.freeOver > 0 ? '’dir; ' + U.money(d.freeOver, true) + ' ve üzeri siparişlerde teslimat ücretsizdir.' : '’dir.') : 'Teslimat ücretsizdir.') + '</li>' +
      '<li>Siparişler yalnızca çalışma saatlerinde (' + esc(U.hoursSummary(cfg.hours) || 'sitede belirtilen saatlerde') + ') alınır. İleri saatli siparişler, yalnızca o anki çalışma saatleri içinde kalan bir teslimat saati için verilebilir.</li>' +
      '<li>Teslimat yalnızca sipariş formunda listelenen ' + esc(R.district) + ' mahallelerine yapılır. Tahmini teslimat süresi ' + d.etaMinutes[0] + '–' + d.etaMinutes[1] + ' dakikadır; yoğunluk ve hava koşullarına göre değişebilir.</li>' +
      '<li>Ödeme; online kredi / banka kartı (iyzico güvenli ödeme altyapısı ile), kapıda nakit veya kapıda kredi kartı ile yapılabilir. Kart bilgileri satıcıya iletilmez ve satıcı tarafından saklanmaz.</li>' +
      '<li>Sipariş, satıcının onayı ile kesinleşir. Ürünün tükenmesi veya teslimat bölgesi dışında kalınması gibi durumlarda satıcı siparişi iptal edebilir; bu durumda online ödenen tutar iade edilir.</li></ul>' +
      '<h2>5. Cayma hakkı</h2><p>Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesinin (c) bendi uyarınca, <b>çabuk bozulabilen veya son kullanma tarihi geçebilecek malların</b> teslimine ilişkin sözleşmelerde cayma hakkı kullanılamaz. Siparişleriniz taze hazırlandığından cayma hakkı bulunmamaktadır. Hatalı, eksik veya ayıplı teslimat durumunda <a href="#iade">İptal ve iade</a> koşulları geçerlidir.</p>' +
      '<h2>6. Şikâyet ve itiraz</h2><p>Talep ve şikâyetlerinizi ' + esc(R.phone) + ' numaralı telefondan veya ' + v(L().email, 'E-posta adresi') + ' adresinden iletebilirsiniz. Uyuşmazlıklarda, Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dahilinde alıcının veya satıcının yerleşim yerindeki <b>Tüketici Hakem Heyetleri</b>, bu sınırların üzerindeki uyuşmazlıklarda <b>Tüketici Mahkemeleri</b> yetkilidir. Başvurular e-Devlet üzerinden TÜBİS ile de yapılabilir.</p>' +
      '<h2>7. Yürürlük</h2><p>Alıcı, siparişi onaylamadan önce bu ön bilgilendirme formunu ve sözleşmeyi okuduğunu, siparişin ödeme yükümlülüğü doğurduğunu bildiğini kabul eder. Sözleşme, siparişin onaylandığı anda yürürlüğe girer.</p>');
  }

  function iade() {
    return shell('İptal ve iade koşulları', '' +
      '<h2>Siparişi iptal etme</h2><p>Siparişiniz “Sipariş alındı” aşamasındayken, yani hazırlanmaya başlanmadan önce ' + esc(R.phone) + ' numarasını arayarak iptal edebilirsiniz. Hazırlanmaya başlanan siparişler, ürünler taze hazırlandığı için iptal edilemez.</p>' +
      '<h2>Hatalı, eksik veya ayıplı ürün</h2><p>Teslim aldığınız siparişte eksik, yanlış veya kusurlu bir ürün varsa lütfen teslimattan sonraki <b>2 saat içinde</b> bizi arayın. Sipariş numaranızı ve mümkünse ürünün fotoğrafını paylaşmanız süreci hızlandırır. Durumun teyidi hâlinde ürün yeniden gönderilir veya bedeli iade edilir.</p>' +
      '<h2>İade süreci</h2><ul>' +
      '<li><b>Online kartla ödenen siparişler:</b> İade, ödemenin yapıldığı karta yapılır. Tutarın kartınıza yansıma süresi bankanıza bağlı olarak genellikle 2–10 iş günüdür.</li>' +
      '<li><b>Kapıda ödenen siparişler:</b> İade, nakit veya sizinle kararlaştırılan yöntemle yapılır.</li></ul>' +
      '<h2>Satıcı tarafından iptal</h2><p>Ürünün tükenmesi, teslimat adresinin hizmet bölgesi dışında olması veya ulaşılamama gibi durumlarda siparişiniz tarafımızca iptal edilebilir; online ödenen tutar eksiksiz iade edilir.</p>' +
      '<h2>Satıcı bilgileri</h2>' + seller());
  }

  function gizlilik() {
    return shell('KVKK aydınlatma metni ve gizlilik', '' +
      '<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla ' + v(L().company, 'Şirket unvanı / işletme sahibi') + ' (“' + esc(R.name) + '”) olarak kişisel verilerinizi aşağıda açıklanan kapsamda işliyoruz.</p>' +
      '<h2>İşlenen kişisel veriler</h2><ul><li><b>Kimlik ve iletişim:</b> ad soyad, cep telefonu</li><li><b>Teslimat:</b> mahalle, adres, kat/daire, adres tarifi</li><li><b>Sipariş ve işlem:</b> sipariş içeriği, notlar, tutar, ödeme yöntemi, sipariş zamanı</li><li><b>Ödeme:</b> online ödemelerde yalnızca ödeme kuruluşunun ilettiği işlem numarası ve kartın son 4 hanesi (kart numarası tarafımızca görülmez ve saklanmaz)</li><li><b>İşlem güvenliği:</b> IP adresi ve sunucu kayıtları</li></ul>' +
      '<h2>İşleme amaçları ve hukuki sebepler</h2><ul>' +
      '<li>Siparişinizin alınması, hazırlanması, teslim edilmesi ve ödemenin alınması: sözleşmenin kurulması ve ifası (KVKK m.5/2-c)</li>' +
      '<li>Fatura, muhasebe ve yasal saklama yükümlülükleri: hukuki yükümlülüğün yerine getirilmesi (m.5/2-ç)</li>' +
      '<li>Dolandırıcılığın önlenmesi, site güvenliği, talep ve şikâyetlerin yönetimi: meşru menfaat (m.5/2-f)</li></ul>' +
      '<h2>Aktarım</h2><p>Kişisel verileriniz yalnızca yukarıdaki amaçlarla sınırlı olarak; online ödemeler için ödeme kuruluşu <b>iyzico (iyzi Ödeme ve Elektronik Para Hizmetleri A.Ş.)</b> ile, teslimatı yapan kurye personelimizle, mali müşavirimizle ve talep hâlinde yetkili kamu kurum ve kuruluşlarıyla paylaşılır. İnternet sitemizin ve sipariş kayıtlarının barındırıldığı sunucu hizmet sağlayıcısının sunucuları yurt dışında bulunabilir; bu aktarım KVKK’nın 9. maddesindeki usullere uygun olarak yapılır.</p>' +
      '<h2>Saklama süresi</h2><p>Sipariş kayıtları ilgili mevzuatta öngörülen süreler (vergi mevzuatı kapsamında genellikle 10 yıl) boyunca saklanır; süre sonunda silinir veya anonim hâle getirilir.</p>' +
      '<h2>Haklarınız</h2><p>KVKK’nın 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri öğrenme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı ' + v(L().email, 'E-posta adresi') + ' adresine veya ' + esc(R.address) + ' adresine yazılı olarak iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.</p>' +
      '<h2>Çerezler ve tarayıcı depolama</h2><p>Sitemizde reklam veya takip çerezi kullanılmaz. Sepetiniz, kayıtlı adresiniz ve son siparişiniz, siteyi kullanabilmeniz için yalnızca kendi tarayıcınızda (yerel depolama) tutulur ve sunucumuza gönderilmez. Bu bilgileri tarayıcınızın site verilerini temizleyerek silebilirsiniz.</p>');
  }

  [['sozlesme', 'Mesafeli satış sözleşmesi', sozlesme], ['iade', 'İptal ve iade', iade], ['gizlilik', 'KVKK ve gizlilik', gizlilik]].forEach(function (p) {
    App.router.register(p[0], { title: p[1], render: p[2] });
  });
})(window.App = window.App || {});
