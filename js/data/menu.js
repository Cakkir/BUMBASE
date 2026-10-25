/**
 * BUM BASE MENÜSÜ
 * -----------------------------------------------------------------
 * - price: tek fiyatlı ürünler için TL
 * - portions: seçenekli ürünler için [{ id, label, price }] (pizzada boy, içecekte hacim)
 * - optionLabel: seçenek grubunun adı (ör. 'Boy')
 * - choices: menülerde müşterinin seçtiği ürünler [{ id, label, options: [ürün id] }] (fiyata dahildir)
 * - art: yerleşik illüstrasyon tanımı (js/lib/illustrations.js)
 * - image: gerçek ürün fotoğrafı URL'si (verilirse illüstrasyonun yerine geçer)
 * - tags: 'acili' | 'vejetaryen' | 'sef' | 'yeni'
 * - featured: ana sayfada "öne çıkanlar", highlight: hızlı sipariş kartları, popular: en çok sipariş edilenler
 * Tarayıcıda ve sunucuda ortak kullanılır; sunucu fiyatları buradan yeniden hesaplar.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.App = root.App || {}; root.App.menu = mod; }
})(typeof self !== 'undefined' ? self : this, function () {
  // Pizza boyları
  var PZ = function (orta, dev) {
    return [{ id: 'orta', label: 'Orta Boy', price: orta }, { id: 'dev', label: 'Dev Boy', price: dev }];
  };
  // İçecek hacimleri
  var SZ = function (kutu, litre) {
    return [{ id: '330', label: '330 ml kutu', price: kutu }, { id: '1l', label: '1 L şişe', price: litre }];
  };
  var pizza = function (t) { return { type: 'pizza', t: t }; };
  var drink = function (color, icon, both) { return { type: 'drink', color: color, icon: icon, both: both !== false }; };

  // Menülerde seçilebilecek ürünler
  var KLASIK = ['p-margarita', 'p-sebzesever', 'p-sucukmisir', 'p-lezzet3', 'p-dortmevsim', 'p-akdeniz', 'p-potato'];
  var SARIYER = ['i-sariyer-kola', 'i-sariyer-portakal', 'i-sariyer-gazoz'];
  var drinkChoice = function (label) { return { id: 'icecek', label: label, options: SARIYER }; };

  var categories = [
    { id: 'menuler', label: 'Menüler', blurb: 'Avantajlı paketler, içecek dahil', cover: 'm-biondan' },
    { id: 'klasik', label: 'Klasik Pizzalar', blurb: 'Orta ve dev boy', cover: 'p-margarita' },
    { id: 'super', label: 'Süper Pizzalar', blurb: 'Bol malzemeli', cover: 'p-karisik' },
    { id: 'efsane', label: 'Efsane Pizzalar', blurb: 'Tavuklu ve ton balıklı', cover: 'p-bbq' },
    { id: 'premium', label: 'Premium Pizzalar', blurb: 'Kavurma, pastırma, füme kaburga', cover: 'p-kavurma' },
    { id: 'burger', label: 'Burgerler', blurb: '120–240 gr köfte ve tavuk burgerler', cover: 'b-cheese' },
    { id: 'citir', label: 'Çıtır Lezzetler', blurb: 'Sarımsaklı ekmek, patates ve cajun tavuk', cover: 'x-patates' },
    { id: 'tatli', label: 'Tatlılar', blurb: 'Fırından sıcak', cover: 'd-sufle' },
    { id: 'icecek', label: 'İçecekler', blurb: 'Kutu ve 1 litre seçenekleri', cover: 'i-kola' },
    { id: 'sos', label: 'Soslar', blurb: 'Her biri 15 TL', cover: 's-ketcap' },
  ];

  var items = [
    // ---------- MENÜLER ----------
    { id: 'm-cheeseburger', cat: 'menuler', name: 'Cheeseburger Menü', price: 460,
      desc: 'Base Burger, parmak patates ve 330 ml Sarıyer.', tags: [],
      choices: [drinkChoice('İçecek (330 ml Sarıyer)')] },
    { id: 'm-2pizza', cat: 'menuler', name: '2’li Orta Boy Pizza Menü', price: 590, highlight: true,
      desc: 'Seçeceğiniz 2 orta boy klasik pizza ve 1 L Sarıyer.', tags: [],
      choices: [{ id: 'pizza1', label: '1. pizza (orta boy)', options: KLASIK }, { id: 'pizza2', label: '2. pizza (orta boy)', options: KLASIK }, drinkChoice('İçecek (1 L Sarıyer)')] },
    { id: 'm-2cajun', cat: 'menuler', name: 'İkili Cajun Burger Menü', price: 650,
      desc: '2 Cajun Burger, 2 parmak patates ve 1 L Sarıyer.', tags: [],
      choices: [drinkChoice('İçecek (1 L Sarıyer)')] },
    { id: 'm-2base', cat: 'menuler', name: 'İkili Base Burger Menü', price: 790,
      desc: '2 Base Burger, 2 parmak patates ve 1 L Sarıyer.', tags: [],
      choices: [drinkChoice('İçecek (1 L Sarıyer)')] },
    { id: 'm-tika', cat: 'menuler', name: 'Tıka Base Menü', price: 840, highlight: true,
      desc: 'Seçeceğiniz dev boy klasik pizza, kemiksiz Cajun sepeti ve 1 L Sarıyer.', tags: [],
      choices: [{ id: 'pizza', label: 'Pizza (dev boy)', options: KLASIK }, drinkChoice('İçecek (1 L Sarıyer)')] },
    { id: 'm-biondan', cat: 'menuler', name: 'Bi Ondan Bi Bundan Menü', price: 720, highlight: true, featured: true,
      desc: 'Seçeceğiniz orta boy klasik pizza, Base Burger, parmak patates ve 1 L Sarıyer.', tags: ['sef'],
      choices: [{ id: 'pizza', label: 'Pizza (orta boy)', options: KLASIK }, drinkChoice('İçecek (1 L Sarıyer)')] },

    // ---------- KLASİK PİZZALAR ----------
    { id: 'p-margarita', cat: 'klasik', name: 'Margarita', portions: PZ(285, 520), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, ekstra mozarella, fesleğen, cherry domates.', tags: ['vejetaryen'], popular: true,
      art: pizza([['extramoz', 7], ['cherry', 8], ['feslegen', 9]]) },
    { id: 'p-sebzesever', cat: 'klasik', name: 'Sebze Sever', portions: PZ(285, 520), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, mantar, mısır, yeşil biber, kırmızı biber, mor soğan, domates, zeytin.', tags: ['vejetaryen'],
      art: pizza([['mantar', 7], ['domates', 5], ['yesilbiber', 7], ['kirmizibiber', 7], ['morsogan', 7], ['zeytin', 9], ['misir', 22]]) },
    { id: 'p-sucukmisir', cat: 'klasik', name: 'Sucuk Mısır', portions: PZ(285, 520), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, sucuk, mısır.', tags: [],
      art: pizza([['sucuk', 16], ['misir', 30]]) },
    { id: 'p-lezzet3', cat: 'klasik', name: 'Lezzet 3’lüsü', portions: PZ(285, 520), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, sosis, mısır, mantar.', tags: [],
      art: pizza([['sosis', 16], ['mantar', 8], ['misir', 26]]) },
    { id: 'p-dortmevsim', cat: 'klasik', name: 'Dört Mevsim', portions: PZ(285, 520), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, sucuk, mantar, zeytin.', tags: [],
      art: pizza([['sucuk', 10], ['mantar', 9], ['zeytin', 12]]) },
    { id: 'p-akdeniz', cat: 'klasik', name: 'Akdeniz Pizza', portions: PZ(285, 520), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, domates, zeytin, beyaz peynir, kekik.', tags: ['vejetaryen'],
      art: pizza([['domates', 6], ['zeytin', 12], ['beyazpeynir', 12], ['kekik', 40]]) },
    { id: 'p-potato', cat: 'klasik', name: 'Potato Pizza', portions: PZ(285, 520), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, sosis, patates, çedar peyniri, ketçap, mayonez.', tags: [],
      art: pizza([['cheddar', 7], ['patates', 16], ['sosis', 12], ['ketcap', 1], ['mayo', 1]]) },

    // ---------- SÜPER PİZZALAR ----------
    { id: 'p-karisik', cat: 'super', name: 'Karışık Pizza', portions: PZ(335, 590), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, sucuk, salam, sosis, mantar, mısır, kırmızı biber, yeşil biber.', tags: [], popular: true,
      art: pizza([['salam', 6], ['sucuk', 8], ['sosis', 8], ['mantar', 6], ['kirmizibiber', 6], ['yesilbiber', 6], ['misir', 20]]) },
    { id: 'p-cheezza', cat: 'super', name: 'Cheezza', portions: PZ(335, 590), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, ekstra mozarella, çedar peyniri, beyaz peynir, top mozarella.', tags: ['vejetaryen'],
      art: pizza([['cheddar', 8], ['extramoz', 6], ['topmoz', 7], ['beyazpeynir', 8], ['feslegen', 5]]) },
    { id: 'p-acilarin', cat: 'super', name: 'Acıların Çocuğu', portions: PZ(335, 590), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, Meksika sos, çedar peyniri, sucuk, mantar, jalapeno, kırmızı biber.', tags: ['acili'],
      art: pizza([['cheddar', 5], ['sucuk', 9], ['mantar', 6], ['jalapeno', 12], ['kirmizibiber', 8]]) },
    { id: 'p-bumbase', cat: 'super', name: 'Bum Base Pizza', portions: PZ(335, 590), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, sucuk, salam, sosis, mantar, mısır, kırmızı biber, yeşil biber, mor soğan.', tags: ['sef'], featured: true,
      art: pizza([['salam', 6], ['sucuk', 8], ['sosis', 7], ['mantar', 6], ['kirmizibiber', 6], ['yesilbiber', 6], ['morsogan', 7], ['misir', 18]]) },

    // ---------- EFSANE PİZZALAR ----------
    { id: 'p-bbq', cat: 'efsane', name: 'BBQ Tavuklu Pizza', portions: PZ(375, 635), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, marine tavuk, mantar, mısır, kırmızı biber, barbekü sos.', tags: [], featured: true,
      art: pizza([['tavuk', 12], ['mantar', 6], ['kirmizibiber', 6], ['misir', 20], ['bbq', 1]]) },
    { id: 'p-meksika', cat: 'efsane', name: 'Meksika Tavuklu Pizza', portions: PZ(375, 635), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, Meksika sos, marine tavuk, mantar, mısır, kırmızı biber, jalapeno.', tags: ['acili'],
      art: pizza([['tavuk', 12], ['mantar', 5], ['kirmizibiber', 6], ['jalapeno', 9], ['misir', 18]]) },
    { id: 'p-tavuksever', cat: 'efsane', name: 'Tavuksever Pizza', portions: PZ(375, 635), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, marine tavuk, mantar, mısır, kırmızı biber, jalapeno.', tags: ['acili'],
      art: pizza([['tavuk', 15], ['mantar', 6], ['kirmizibiber', 5], ['jalapeno', 6], ['misir', 18]]) },
    { id: 'p-tonton', cat: 'efsane', name: 'Ton Ton Pizza', portions: PZ(375, 635), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, ton balığı, mısır, soğan.', tags: [],
      art: pizza([['ton', 18], ['morsogan', 8], ['misir', 24]]) },

    // ---------- PREMIUM PİZZALAR ----------
    { id: 'p-kavurma', cat: 'premium', name: 'Kavurma Rüyası', portions: PZ(445, 720), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, çedar peyniri, mor soğan, köz biber, kavurma. Dev boyda ekstra mozarella.', tags: ['sef'], featured: true,
      art: pizza([['cheddar', 5], ['kavurma', 18], ['morsogan', 9], ['kozbiber', 7]]) },
    { id: 'p-kayseri', cat: 'premium', name: 'Kayseri Pizza', portions: PZ(445, 720), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, ekstra mozarella, çedar peyniri, mor soğan, pastırma.', tags: [],
      art: pizza([['extramoz', 4], ['cheddar', 4], ['pastirma', 10], ['morsogan', 10]]) },
    { id: 'p-sucukruyasi', cat: 'premium', name: 'Sucuk Rüyası', portions: PZ(445, 720), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, ekstra mozarella, çedar peyniri, dev sucuk.', tags: [],
      art: pizza([['extramoz', 5], ['cheddar', 5], ['devsucuk', 9]]) },
    { id: 'p-premiumspecial', cat: 'premium', name: 'Premium Special Pizza', portions: PZ(445, 720), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, ekstra mozarella, çedar peyniri, mor soğan, kasap sucuk.', tags: [],
      art: pizza([['extramoz', 4], ['cheddar', 4], ['kasapsucuk', 12], ['morsogan', 8], ['kirmizibiber', 6], ['yesilbiber', 6]]) },
    { id: 'p-fumekaburga', cat: 'premium', name: 'Füme Kaburga Pizza', portions: PZ(445, 720), optionLabel: 'Boy',
      desc: 'Pizza sosu, mozarella peyniri, ekstra mozarella, çedar peyniri, mor soğan, füme kaburga.', tags: [],
      art: pizza([['extramoz', 4], ['cheddar', 4], ['kaburga', 11], ['morsogan', 9]]) },

    // ---------- BURGERLER ----------
    { id: 'b-base', cat: 'burger', name: 'Base Burger (120 gr)', price: 420, popular: true,
      desc: '120 gr hamburger köftesi, burger sos, marul.', tags: [],
      art: { type: 'burger', patties: 1 } },
    { id: 'b-cheese', cat: 'burger', name: 'Cheeseburger (120 gr)', price: 440,
      desc: '120 gr hamburger köftesi, burger sos, cheddar peyniri, cheddar sos, marul, domates, turşu.', tags: [],
      art: { type: 'burger', patties: 1, cheese: true } },
    { id: 'b-double', cat: 'burger', name: 'Double Cheeseburger (240 gr)', price: 650, highlight: true,
      desc: '240 gr hamburger köftesi, burger sos, cheddar peyniri, marul, domates, turşu. Patates kızartması ile.', tags: [],
      art: { type: 'burger', patties: 2, cheese: true } },
    { id: 'b-bumbase', cat: 'burger', name: 'Bum Base Burger (240 gr)', price: 690, featured: true,
      desc: '240 gr hamburger köftesi, dana füme kaburga, karamelize soğan, cheddar peyniri, marul.', tags: ['sef'],
      art: { type: 'burger', patties: 1, cheese: true, thick: true, kaburga: true, onion: true } },
    { id: 'b-cajun', cat: 'burger', name: 'Cajun Burger', price: 340, popular: true,
      desc: 'Cajun tavuk, mayonez, marul, domates, turşu.', tags: [],
      art: { type: 'burger', chicken: 'crispy', sauce: '#F5EEDC' } },
    { id: 'b-izgaratavuk', cat: 'burger', name: 'Izgara Tavuk Burger', price: 340,
      desc: 'Izgara tavuk, mayonez, marul, domates, turşu. Patates kızartması ile.', tags: [],
      art: { type: 'burger', chicken: 'grill', sauce: '#F5EEDC' } },
    { id: 'b-acilicajun', cat: 'burger', name: 'Acılı Cajun Burger', price: 360,
      desc: 'Acılı cajun tavuk, mayonez, acı sos, marul, domates, turşu, jalapeno. Patates kızartması ile.', tags: ['acili'],
      art: { type: 'burger', chicken: 'crispy', jalapeno: true, sauce: '#C8361E' } },

    // ---------- ÇITIR LEZZETLER ----------
    { id: 'x-sarimsakli', cat: 'citir', name: 'Sarımsaklı Ekmek', price: 120,
      desc: 'Sarımsak sos.', tags: ['vejetaryen'], art: { type: 'garlic' } },
    { id: 'x-peynirli', cat: 'citir', name: 'Bol Peynirli Sarımsaklı Ekmek', price: 150,
      desc: 'Sarımsak sos, mozarella peyniri, cheddar peyniri.', tags: ['vejetaryen'], art: { type: 'garlic', cheese: true } },
    { id: 'x-sucuklu', cat: 'citir', name: 'Sucuklu Sarımsaklı Ekmek', price: 150,
      desc: 'Sarımsak sos, mozarella peyniri, sucuk.', tags: [], art: { type: 'garlic', cheese: true, sucuk: true } },
    { id: 'x-elmadilim', cat: 'citir', name: 'Fırında Tereyağlı Elma Dilim Patates', price: 130,
      desc: 'Fırında tereyağı ile.', tags: ['vejetaryen'], art: { type: 'fries', wedge: true } },
    { id: 'x-patates', cat: 'citir', name: 'Patates Kızartması', price: 100, popular: true,
      desc: 'Parmak dilim.', tags: ['vejetaryen'], art: { type: 'fries' } },
    { id: 'x-cajunsepet', cat: 'citir', name: 'Cajun Tavuk Sepeti', price: 320, popular: true, highlight: true,
      desc: 'Cajun tavuk, patates kızartması, soğan halkası ve seçeceğiniz 2 adet sos ile.', tags: [], art: { type: 'basket' } },

    // ---------- TATLILAR ----------
    { id: 'd-sufle', cat: 'tatli', name: 'Güveçte Çikolatalı Sufle', price: 190,
      desc: 'Adet olarak servis edilir.', tags: ['vejetaryen'], art: { type: 'sufle' } },

    // ---------- İÇECEKLER ----------
    { id: 'i-sariyer-kola', cat: 'icecek', name: 'Sarıyer Cola', portions: SZ(70, 100), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#4A1A14', 'cola') },
    { id: 'i-sariyer-portakal', cat: 'icecek', name: 'Sarıyer Portakal Aromalı Gazoz', portions: SZ(70, 100), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#F08A1C', 'orange') },
    { id: 'i-sariyer-gazoz', cat: 'icecek', name: 'Sarıyer Gazoz', portions: SZ(70, 100), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#E9EEF0', 'soda') },
    { id: 'i-kola', cat: 'icecek', name: 'Coca-Cola', portions: SZ(100, 130), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], popular: true, art: drink('#B3221C', 'cola') },
    { id: 'i-kola-zero', cat: 'icecek', name: 'Coca-Cola Zero', portions: SZ(100, 130), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#1E1E1E', 'cola') },
    { id: 'i-fanta', cat: 'icecek', name: 'Fanta', portions: SZ(100, 130), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#F27A12', 'orange') },
    { id: 'i-sprite', cat: 'icecek', name: 'Sprite', portions: SZ(100, 130), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#2E9E4F', 'lemon') },
    { id: 'i-fuse-seftali', cat: 'icecek', name: 'Fuse Tea Şeftali', portions: SZ(100, 130), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#E8823A', 'peach') },
    { id: 'i-fuse-limon', cat: 'icecek', name: 'Fuse Tea Limon', portions: SZ(100, 130), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#E2C21C', 'lemon') },
    { id: 'i-fuse-mango', cat: 'icecek', name: 'Fuse Tea Mango Ananas', portions: SZ(100, 130), optionLabel: 'Hacim', desc: 'Soğuk servis edilir.', tags: [], art: drink('#9CC43A', 'mango') },
    { id: 'i-cappy-seftali', cat: 'icecek', name: 'Cappy Şeftali', price: 100, grams: '330 ml', desc: 'Soğuk servis edilir.', tags: [], art: drink('#F4A6A0', 'peach', false) },
    { id: 'i-cappy-visne', cat: 'icecek', name: 'Cappy Vişne', price: 100, grams: '330 ml', desc: 'Soğuk servis edilir.', tags: [], art: drink('#F3EEE8', 'cherry', false) },
    { id: 'i-ayran', cat: 'icecek', name: 'Sütaş Ayran', optionLabel: 'Hacim',
      portions: [{ id: '330', label: 'Tombul 330 ml', price: 60 }, { id: '1l', label: '1 L şişe', price: 120 }],
      desc: 'Soğuk servis edilir.', tags: [], art: { type: 'ayran' } },

    // ---------- SOSLAR ----------
    { id: 's-ketcap', cat: 'sos', name: 'Ketçap', price: 15, desc: 'Porsiyon sos.', tags: [], art: { type: 'sauce', color: '#C8261A' } },
    { id: 's-mayonez', cat: 'sos', name: 'Mayonez', price: 15, desc: 'Porsiyon sos.', tags: [], art: { type: 'sauce', color: '#F6EED8' } },
    { id: 's-bbq', cat: 'sos', name: 'Barbekü Sos', price: 15, desc: 'Porsiyon sos.', tags: [], art: { type: 'sauce', color: '#5A2412' } },
    { id: 's-hardal', cat: 'sos', name: 'Hardal', price: 15, desc: 'Porsiyon sos.', tags: [], art: { type: 'sauce', color: '#E0B12A' } },
    { id: 's-sarimsakli', cat: 'sos', name: 'Sarımsaklı Mayonez', price: 15, desc: 'Porsiyon sos.', tags: [], art: { type: 'sauce', color: '#F3EBD3', herbs: true } },
    { id: 's-ranch', cat: 'sos', name: 'Ranch Sos', price: 15, desc: 'Porsiyon sos.', tags: [], art: { type: 'sauce', color: '#F7F4EC', herbs: true } },
    { id: 's-aci', cat: 'sos', name: 'Acı Sos', price: 15, desc: 'Porsiyon sos.', tags: ['acili'], art: { type: 'sauce', color: '#D8401E', flakes: true } },
  ];

  // ---------- ÜRÜN FOTOĞRAFLARI ----------
  // Dosyalar assets/img/menu/ klasöründe. Fotoğrafı olmayan ürünlerde illüstrasyon gösterilir.
  // İçeceklerde 1 L şişenin fotoğrafı ayrıca verilir; boy seçilince görsel değişir.
  var IMG = 'assets/img/menu/';
  var photos = [
    'p-margarita', 'p-sebzesever', 'p-sucukmisir', 'p-lezzet3', 'p-dortmevsim', 'p-akdeniz', 'p-potato',
    'p-karisik', 'p-cheezza', 'p-acilarin', 'p-bumbase', 'p-bbq', 'p-meksika', 'p-tavuksever', 'p-tonton',
    'p-kavurma', 'p-kayseri', 'p-sucukruyasi', 'p-premiumspecial', 'p-fumekaburga',
    'x-sarimsakli', 'x-peynirli', 'x-sucuklu', 'x-elmadilim', 'x-patates', 'x-cajunsepet',
    'i-sariyer-kola', 'i-sariyer-portakal', 'i-sariyer-gazoz', 'i-kola', 'i-kola-zero', 'i-fanta', 'i-sprite',
    'i-fuse-seftali', 'i-fuse-limon', 'i-fuse-mango', 'i-cappy-seftali', 'i-cappy-visne', 'i-ayran',
    's-ketcap', 's-mayonez', 's-bbq', 's-hardal', 's-sarimsakli', 's-ranch', 's-aci',
    'b-base', 'b-cheese', 'b-double', 'b-bumbase', 'b-cajun', 'b-izgaratavuk', 'b-acilicajun',
    'd-sufle',
    'm-cheeseburger', 'm-2pizza', 'm-2cajun', 'm-2base', 'm-tika', 'm-biondan',
  ];
  var bottlePhotos = ['i-sariyer-kola', 'i-sariyer-portakal', 'i-sariyer-gazoz', 'i-kola', 'i-fanta', 'i-sprite',
    'i-fuse-seftali', 'i-fuse-limon', 'i-fuse-mango', 'i-ayran'];
  var byId = {};
  items.forEach(function (it) { byId[it.id] = it; });
  photos.forEach(function (id) {
    var it = byId[id]; if (!it) return;
    it.image = IMG + id + '.webp';
    it.imageKind = it.cat === 'icecek' || it.cat === 'burger' || it.cat === 'tatli' ? 'product' : 'food';
  });
  bottlePhotos.forEach(function (id) {
    var it = byId[id]; if (!it || !it.portions) return;
    it.portions.forEach(function (p) { p.image = p.id === '1l' ? IMG + id + '-1l.webp' : it.image; });
  });

  var tags = {
    acili: { label: 'Acılı' },
    vejetaryen: { label: 'Vejetaryen' },
    sef: { label: 'İmza Lezzet' },
    yeni: { label: 'Yeni' },
  };

  return { categories: categories, items: items, tags: tags };
});
