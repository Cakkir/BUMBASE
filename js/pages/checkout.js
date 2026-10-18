/* Ödeme & Teslimat Sayfası */
(function (App) {
  var U = App.utils, esc = U.esc, money = U.money, cfg = App.config, I = App.ui.I;
  var ADDR_KEY = 'koz.address.v1';

  /** İleri saat seçenekleri: açık olunan vardiyanın sonuna kadar 30 dk aralıklarla (gece yarısını geçen vardiyalar dahil) */
  function scheduleSlots() {
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var day = now.getDay();
    var today = cfg.hours[day], yest = cfg.hours[(day + 6) % 7];
    var from, to;
    if (yest && yest.open && U.toMin(yest.close) < U.toMin(yest.open) && nowMin < U.toMin(yest.close)) {
      from = nowMin + 60; to = U.toMin(yest.close); // dünün gece vardiyası sürüyor
    } else if (today && today.open) {
      var o = U.toMin(today.open), c = U.toMin(today.close);
      if (c < o) c += 1440;
      from = Math.max(nowMin + 60, o + 30); to = c;
    } else return [];
    var out = [];
    for (var m = Math.ceil(from / 30) * 30; m <= to - 15 && out.length < 24; m += 30) {
      var mm = m % 1440;
      out.push(U.pad(Math.floor(mm / 60)) + ':' + U.pad(mm % 60));
    }
    return out;
  }

  function field(id, label, input, opts) {
    opts = opts || {};
    return '<div class="field' + (opts.cls ? ' ' + opts.cls : '') + '"><label class="field-label" for="' + id + '">' + label + (opts.optional ? ' <em>(isteğe bağlı)</em>' : '') + '</label>' + input +
      '<p class="field-error" data-error-for="' + (opts.errKey || id) + '" hidden></p></div>';
  }

  function cardBrandBadge(brand) {
    var map = { visa: 'VISA', mastercard: 'Mastercard', troy: 'TROY', amex: 'AMEX' };
    return map[brand] ? '<span class="brand-chip brand-' + brand + '">' + map[brand] + '</span>' : '';
  }

  function render() {
    var lines = App.store.getState().cart;
    var head = '<section class="page-hero page-hero--slim"><div class="container">' + App.cartPage.steps(1) + '<h1 class="display-md">Teslimat & Ödeme</h1></div></section>';
    if (!lines.length) return head + '<div class="container page-body"><div class="card-pad">' + App.ui.emptyCart() + '</div></div>';
    var s = App.cart.summary();
    if (!s.meetsMinimum) return head + '<div class="container page-body"><div class="card-pad empty"><h3>Minimum sipariş tutarına ulaşılmadı</h3><p class="muted">Sepete <b class="num">' + money(s.minOrderLeft) + '</b> daha eklemeniz gerekiyor.</p><a class="btn btn-primary" href="#menu">Menüye dön</a></div></div>';

    var a = U.storage.get(ADDR_KEY, {});
    var zone = App.store.getState().ui.zone;
    var zones = cfg.delivery.zones.map(function (z) { return '<option value="' + z.id + '"' + (z.id === zone ? ' selected' : '') + '>' + esc(z.label) + (z.extraFee ? ' (+' + money(z.extraFee, true) + ')' : '') + '</option>'; }).join('');
    var slots = scheduleSlots();
    var st = U.openState(cfg.hours);
    var methods = cfg.payment.methods.map(function (m, i) {
      return '<label class="pay-opt"><input type="radio" name="paymentMethod" value="' + m.id + '"' + (i === 0 ? ' checked' : '') + '><span class="pay-opt-body"><b>' + esc(m.label) + '</b><span class="muted">' + esc(m.hint) + '</span></span><span class="pay-opt-radio"></span></label>';
    }).join('');
    var testCards = App.payments.testCards.map(function (t) {
      return '<li><code class="num">' + t.number + '</code><span>' + esc(t.result) + '</span><button type="button" class="link-btn" data-fill-card="' + t.number + '">Doldur</button></li>';
    }).join('');

    return head +
      '<div class="container page-body">' +
      (!st.open ? '<div class="notice notice--warn">' + I.clock + '<span><b>Şu an kapalıyız.</b> ' + esc(st.detail) + '. Siparişinizi şimdi verebilirsiniz; açılışta ilk olarak hazırlanır.</span></div>' : '') +
      '<form class="checkout-grid" id="checkout-form" novalidate>' +
      '  <div class="form-col">' +
      '    <div class="notice notice--error" id="form-error" hidden role="alert"></div>' +

      '    <fieldset class="panel"><legend class="panel-legend"><span class="step-dot num">1</span>İletişim bilgileri</legend>' +
      '      <div class="form-grid">' +
      field('name', 'Ad soyad', '<input class="input" id="name" name="name" autocomplete="name" value="' + esc(a.name || '') + '" required>') +
      field('phone', 'Cep telefonu', '<input class="input num" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="05XX XXX XX XX" value="' + esc(a.phone || '') + '" required>') +
      '      </div>' +
      '    </fieldset>' +

      '    <fieldset class="panel"><legend class="panel-legend"><span class="step-dot num">2</span>Teslimat adresi</legend>' +
      '      <div class="form-grid">' +
      field('zone', 'İlçe / bölge', '<select class="select" id="zone" name="zone">' + zones + '</select>') +
      field('neighborhood', 'Mahalle', '<select class="select" id="neighborhood" name="neighborhood"><option value="">Mahalle seçin</option>' + (cfg.delivery.neighborhoods || []).map(function (n) { return '<option' + (n === a.neighborhood ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>') +
      field('street', 'Cadde / sokak ve bina no', '<input class="input" id="street" name="street" autocomplete="address-line1" value="' + esc(a.street || '') + '" placeholder="Örn: Fatih Cad. No: 12">', { cls: 'span-2' }) +
      field('apartment', 'Kat / daire', '<input class="input" id="apartment" name="apartment" autocomplete="address-line2" value="' + esc(a.apartment || '') + '" placeholder="Örn: Kat 3, Daire 7">') +
      field('directions', 'Adres tarifi', '<input class="input" id="directions" name="directions" value="' + esc(a.directions || '') + '" placeholder="Örn: Eczanenin üstü, mavi kapı">', { optional: true }) +
      '      </div>' +
      '      <label class="check"><input type="checkbox" id="remember" checked><span>Bu adresi sonraki siparişlerim için bu cihazda hatırla</span></label>' +
      '    </fieldset>' +

      '    <fieldset class="panel"><legend class="panel-legend"><span class="step-dot num">3</span>Teslimat zamanı ve not</legend>' +
      '      <div class="seg">' +
      '        <label class="seg-opt"><input type="radio" name="when" value="asap" checked><span>' + I.scooter + ' En kısa sürede <em class="num">' + cfg.delivery.etaMinutes[0] + '–' + cfg.delivery.etaMinutes[1] + ' dk</em></span></label>' +
      '        <label class="seg-opt' + (slots.length ? '' : ' is-disabled') + '"><input type="radio" name="when" value="later"' + (slots.length ? '' : ' disabled') + '><span>' + I.clock + ' İleri saate planla' + (slots.length ? '' : ' <em>(bugün uygun saat yok)</em>') + '</span></label>' +
      '      </div>' +
      '      <div id="later-wrap" hidden>' + field('scheduleTime', 'Teslimat saati', '<select class="select num" id="scheduleTime" name="scheduleTime">' + slots.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>') + '</div>' +
      field('note', 'Teslimat notu', '<textarea class="input" id="note" name="note" rows="3" maxlength="300" placeholder="Örn: Zili çalmayın, bebek uyuyor. Kapıya bırakabilirsiniz."></textarea>', { optional: true }) +
      '      <label class="check"><input type="checkbox" id="cutlery"><span>Plastik çatal-bıçak ve peçete gönderilsin</span></label>' +
      '    </fieldset>' +

      '    <fieldset class="panel"><legend class="panel-legend"><span class="step-dot num">4</span>Ödeme yöntemi</legend>' +
      '      <div class="pay-opts">' + methods + '</div>' +
      '      <p class="field-error" data-error-for="paymentMethod" hidden></p>' +
      '      <div id="card-box" class="card-box">' +
      '        <div class="card-box-head"><span>' + I.lock + ' Kart bilgileriniz şifrelenerek ödeme kuruluşuna iletilir, restoranda saklanmaz.</span></div>' +
      '        <div class="form-grid">' +
      field('cardNumber', 'Kart numarası', '<div class="input-wrap"><input class="input num" id="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19"><span id="card-brand"></span></div>', { cls: 'span-2', errKey: 'number' }) +
      field('cardName', 'Kart üzerindeki ad', '<input class="input" id="cardName" autocomplete="cc-name" placeholder="AD SOYAD">', { cls: 'span-2', errKey: 'name-card' }) +
      field('cardExp', 'Son kullanma', '<input class="input num" id="cardExp" inputmode="numeric" autocomplete="cc-exp" placeholder="AA/YY" maxlength="5">', { errKey: 'exp' }) +
      field('cardCvc', 'CVC', '<input class="input num" id="cardCvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4">', { errKey: 'cvc' }) +
      '        </div>' +
      '        <details class="test-cards"><summary>Demo test kartları</summary><p class="muted text-sm">Bu bir simülasyondur, gerçek çekim yapılmaz. Son kullanma için gelecekte bir tarih ve herhangi bir CVC girin.</p><ul>' + testCards + '</ul></details>' +
      '      </div>' +
      '      <div id="door-box" class="notice notice--info" hidden>' + I.scooter + '<span id="door-text"></span></div>' +
      '    </fieldset>' +

      '    <label class="check check--terms"><input type="checkbox" id="acceptTerms"><span><b>Mesafeli satış sözleşmesi</b>ni ve <b>KVKK aydınlatma metni</b>ni okudum, onaylıyorum.</span></label>' +
      '    <p class="field-error" data-error-for="acceptTerms" hidden></p>' +
      '  </div>' +

      '  <aside class="side-col side-col--sticky">' +
      '    <div id="co-summary">' + App.cartPage.summaryCard(s, { lines: true }) + '</div>' +
      '    <p class="field-error" data-error-for="cart" hidden></p>' +
      '    <button type="submit" class="btn btn-primary btn-lg btn-block" id="submit-btn"></button>' +
      '    <a href="#sepet" class="link-arrow center">Sepeti düzenle</a>' +
      '  </aside>' +
      '</form></div>';
  }

  function mount(root) {
    var form = U.$('#checkout-form', root);
    if (!form) return;
    var busy = false;
    var lastLabel = null;
    var errBox = U.$('#form-error', root);

    function method() { var r = form.querySelector('[name=paymentMethod]:checked'); return r ? r.value : null; }

    function syncUi() {
      var m = method();
      var s = App.cart.summary();
      U.$('#card-box', root).hidden = m !== 'card_online';
      var door = U.$('#door-box', root);
      door.hidden = m === 'card_online';
      if (m === 'cash_door') U.$('#door-text', root).innerHTML = 'Kuryeye <b class="num">' + money(s.total) + '</b> nakit ödeyeceksiniz. Para üstü gerekiyorsa teslimat notuna yazın.';
      if (m === 'card_door') U.$('#door-text', root).innerHTML = 'Kurye temassız POS cihazı getirir. Tüm kredi ve banka kartları geçerlidir.';
      U.$('#later-wrap', root).hidden = (form.querySelector('[name=when]:checked') || {}).value !== 'later';
      if (!busy) {
        // Etiketi yalnızca değiştiğinde yaz: tıklama sırasında butonun içini yenilemek click olayını yutar
        var label = m === 'card_online' ? I.lock + ' <span class="num">' + money(s.total) + '</span> öde' : 'Siparişi onayla · <span class="num">' + money(s.total) + '</span>';
        if (label !== lastLabel) { U.$('#submit-btn', root).innerHTML = label; lastLabel = label; }
      }
    }

    function refreshSummary() {
      var s = App.cart.summary();
      U.$('#co-summary', root).innerHTML = App.cartPage.summaryCard(s, { lines: true });
      syncUi();
    }

    // --- giriş biçimlendirme ---
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'cardNumber') {
        var d = t.value.replace(/\D/g, '').slice(0, 16);
        t.value = d.replace(/(\d{4})(?=\d)/g, '$1 ');
        U.$('#card-brand', root).innerHTML = cardBrandBadge(App.payments.detectBrand(d));
      }
      if (t.id === 'cardExp') {
        var x = t.value.replace(/\D/g, '').slice(0, 4);
        t.value = x.length > 2 ? x.slice(0, 2) + '/' + x.slice(2) : x;
      }
      if (t.id === 'cardCvc') t.value = t.value.replace(/\D/g, '').slice(0, 4);
      if (t.id === 'cardName') t.value = t.value.toLocaleUpperCase('tr');
      clearError(t.id);
    });

    form.addEventListener('change', function (e) {
      if (e.target.id === 'zone') App.store.dispatch({ type: 'UI_SET', patch: { zone: e.target.value } });
      if (e.target.name === 'paymentMethod') clearError('paymentMethod');
      if (e.target.id === 'acceptTerms') clearError('acceptTerms');
      syncUi();
    });

    form.addEventListener('click', function (e) {
      var f = e.target.closest('[data-fill-card]');
      if (!f) return;
      var y = new Date().getFullYear() % 100 + 2;
      U.$('#cardNumber', root).value = f.getAttribute('data-fill-card');
      U.$('#cardName', root).value = (U.$('#name', root).value || 'DEMO KULLANICI').toLocaleUpperCase('tr');
      U.$('#cardExp', root).value = '12/' + y;
      U.$('#cardCvc', root).value = '123';
      U.$('#card-brand', root).innerHTML = cardBrandBadge(App.payments.detectBrand(f.getAttribute('data-fill-card')));
      ['number', 'name-card', 'exp', 'cvc'].forEach(clearError);
    });

    var idMap = { number: 'cardNumber', 'name-card': 'cardName', exp: 'cardExp', cvc: 'cardCvc', scheduleTime: 'scheduleTime' };
    function showErrors(errs) {
      var first = null;
      Object.keys(errs).forEach(function (k) {
        var p = form.querySelector('[data-error-for="' + k + '"]');
        if (p) { p.textContent = errs[k]; p.hidden = false; }
        var inp = U.$('#' + (idMap[k] || k), root);
        if (inp) { inp.setAttribute('aria-invalid', 'true'); if (!first) first = inp; }
        else if (p && !first) first = p;
      });
      if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) first.focus({ preventScroll: true }); }
    }
    function clearError(k) {
      var rev = { cardNumber: 'number', cardName: 'name-card', cardExp: 'exp', cardCvc: 'cvc' };
      var key = rev[k] || k;
      if (!key) return;
      var p = form.querySelector('[data-error-for="' + key + '"]');
      if (p) p.hidden = true;
      var inp = U.$('#' + (idMap[key] || key), root);
      if (inp) inp.removeAttribute('aria-invalid');
    }
    function clearAll() { U.$$('.field-error', form).forEach(function (p) { p.hidden = true; }); U.$$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); }); errBox.hidden = true; }
    function formError(msg) { errBox.innerHTML = '<b>Sipariş tamamlanamadı.</b> ' + esc(msg); errBox.hidden = false; errBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

    function setBusy(on, label) {
      busy = on;
      var b = U.$('#submit-btn', root);
      b.disabled = on;
      b.classList.toggle('is-loading', on);
      if (on) { b.innerHTML = '<span class="spinner"></span>' + label; lastLabel = null; } else syncUi();
    }

    function payload() {
      var v = function (id) { var el = U.$('#' + id, root); return el ? el.value.trim() : ''; };
      var when = (form.querySelector('[name=when]:checked') || {}).value;
      return {
        customer: { name: v('name'), phone: v('phone') },
        address: { zone: v('zone'), neighborhood: v('neighborhood'), street: v('street'), apartment: v('apartment'), directions: v('directions') },
        note: v('note'),
        schedule: when === 'later' ? { type: 'later', time: v('scheduleTime') } : { type: 'asap' },
        cutlery: U.$('#cutlery', root).checked,
        paymentMethod: method(),
        acceptTerms: U.$('#acceptTerms', root).checked,
        lines: App.store.getState().cart.map(function (l) { return { id: l.id, portion: l.portion, qty: l.qty, note: l.note }; }),
      };
    }

    function cardData() {
      var exp = U.$('#cardExp', root).value.split('/');
      return { number: U.$('#cardNumber', root).value, name: U.$('#cardName', root).value, expMonth: exp[0], expYear: exp[1], cvc: U.$('#cardCvc', root).value };
    }

    function threeDS(intent, total) {
      return new Promise(function (resolve) {
        var m = App.ui.openModal('' +
          '<div class="tds">' +
          '  <div class="tds-head"><span class="tds-bank">' + I.lock + ' 3D Secure</span><span class="muted">Mock Bank · Simülasyon</span></div>' +
          '  <dl class="tds-info"><div><dt>İşyeri</dt><dd>' + esc(cfg.restaurant.name) + '</dd></div><div><dt>Tutar</dt><dd class="num">' + money(total) + '</dd></div><div><dt>Kart</dt><dd class="num">•••• ' + esc(intent.last4 || '') + '</dd></div></dl>' +
          '  <p>' + esc((intent.threeDS && intent.threeDS.phoneHint) || '') + ' numaralı telefonunuza gönderilen 6 haneli doğrulama kodunu girin.</p>' +
          '  <label class="field"><span class="field-label">Doğrulama kodu</span><input class="input input--code num" id="tds-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" autofocus></label>' +
          '  <p class="field-error" id="tds-err" hidden></p>' +
          '  <p class="muted text-sm">Demo kodu: <code class="num">' + App.paymentMock.THREE_DS_CODE + '</code></p>' +
          '  <div class="tds-actions"><button class="btn btn-ghost" data-t="cancel">İptal</button><button class="btn btn-primary" data-t="ok">Onayla</button></div>' +
          '</div>', { locked: true, cls: 'modal--tds', label: '3D Secure doğrulama' });
        var input = U.$('#tds-code', m), err = U.$('#tds-err', m), ok = m.querySelector('[data-t=ok]');
        function submit() {
          if (input.value.replace(/\D/g, '').length !== 6) { err.textContent = '6 haneli kodu girin.'; err.hidden = false; return; }
          ok.disabled = true; ok.innerHTML = '<span class="spinner"></span>Doğrulanıyor';
          App.payments.complete3DS(intent.id, input.value).then(function (r) {
            if (r.status === 'requires_action') { err.textContent = r.error; err.hidden = false; ok.disabled = false; ok.textContent = 'Onayla'; input.select(); return; }
            App.ui.closeModal(true); resolve(r);
          }).catch(function (e) { App.ui.closeModal(true); resolve({ status: 'failed', error: e.message }); });
        }
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
        m.addEventListener('click', function (e) {
          var t = e.target.closest('[data-t]'); if (!t) return;
          if (t.getAttribute('data-t') === 'ok') submit();
          else { App.ui.closeModal(true); resolve({ status: 'failed', error: '3D Secure doğrulaması iptal edildi.' }); }
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      clearAll();
      var p = payload();
      var errs = App.ordersCore.validateCheckout(p);
      if (p.paymentMethod === 'card_online') {
        var cerr = App.payments.validateCard(cardData());
        if (cerr.name) { cerr['name-card'] = cerr.name; delete cerr.name; }
        Object.assign(errs, cerr);
      }
      if (Object.keys(errs).length) { showErrors(errs); return; }

      if (U.$('#remember', root).checked) U.storage.set(ADDR_KEY, Object.assign({ name: p.customer.name, phone: p.customer.phone }, p.address));
      else U.storage.remove(ADDR_KEY);

      var total = App.cart.summary(p.address.zone).total;
      var chain = Promise.resolve(null);

      if (p.paymentMethod === 'card_online') {
        setBusy(true, 'Ödeme başlatılıyor');
        chain = App.payments.createIntent({ lines: p.lines, zone: p.address.zone })
          .then(function (intent) { setBusy(true, 'Bankaya bağlanılıyor'); return App.payments.confirm(intent.id, cardData()).then(function (r) { r.id = r.id || intent.id; return r; }); })
          .then(function (r) {
            if (r.status === 'invalid') { var e = new Error('Kart bilgilerini kontrol edin.'); e.fieldErrors = r.fieldErrors; throw e; }
            if (r.status === 'requires_action') { setBusy(true, '3D Secure bekleniyor'); return threeDS(r, total).then(function (x) { x.id = x.id || r.id; return x; }); }
            return r;
          })
          .then(function (r) {
            if (r.status !== 'succeeded') throw new Error(r.error || 'Ödeme onaylanmadı.');
            return r.id;
          });
      }

      chain.then(function (intentId) {
        setBusy(true, 'Sipariş iletiliyor');
        if (intentId) p.payment = { intentId: intentId };
        return App.orders.create(p);
      }).then(function (order) {
        App.cart.clear();
        App.router.go('siparis-' + order.id);
        App.ui.toast('Siparişiniz alındı! Numaranız: <b>' + esc(order.id) + '</b>', { ms: 4000 });
      }).catch(function (err) {
        setBusy(false);
        if (err.fieldErrors) {
          var fe = err.fieldErrors;
          if (fe.name && p.paymentMethod === 'card_online' && !p.customer.name) { /* ad alanı */ }
          showErrors(fe);
          if (err.message && !Object.keys(fe).length) formError(err.message);
        } else formError(err.message || 'Beklenmeyen bir hata oluştu.');
      });
    });

    syncUi();
    var unsub = App.store.subscribe(function (s, a, prev) {
      if (s.cart !== prev.cart || s.ui.zone !== prev.ui.zone) {
        if (!s.cart.length && !busy) { App.router.go('odeme'); return; }
        refreshSummary();
      }
    });
    return unsub;
  }

  App.router.register('odeme', { title: 'Ödeme', render: render, mount: mount });
})(window.App = window.App || {});
