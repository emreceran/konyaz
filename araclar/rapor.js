// Ücretsiz dijitalleşme raporu formu: 5 adım, Netlify Forms (dijital-rapor) + reCAPTCHA.
// Metinler sayfadaki #metin içinde durur; çeviri betiği onları dile çevirir.
(function () {
  var fm = document.getElementById('raporForm');
  if (!fm) return;
  var dil = document.documentElement.lang || 'tr';
  function $(id) { return document.getElementById(id); }
  function T(k) { var e = document.querySelector('#metin [data-k="' + k + '"]'); return e ? e.textContent : k; }
  function olay(ad) { try { if (window.umami) umami.track(ad); } catch (e) {} }
  var adimlar = fm.querySelectorAll('.adim'), su = 0, basladi = false;
  function durum(m, s) { var d = $('drDurum'); d.textContent = m || ''; d.className = 'form-durum ' + (s || ''); }

  function goster(n) {
    su = n;
    adimlar.forEach(function (a, i) { a.hidden = i !== n; });
    $('drGeri').hidden = n === 0;
    $('drIleri').hidden = n === adimlar.length - 1;
    $('drGonder').hidden = n !== adimlar.length - 1;
    $('drCubuk').style.width = ((n + 1) / adimlar.length * 100) + '%';
    durum('');
    var ust = fm.getBoundingClientRect().top;
    if (ust < 0) fm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function gecerli(a) {
    var eksik = false;
    a.querySelectorAll('[required]').forEach(function (i) {
      var bos = i.type === 'checkbox' ? !i.checked : !i.value.trim();
      i.closest('.girdi, .onay') && i.closest('.girdi, .onay').classList.toggle('hatali', bos);
      if (bos) eksik = true;
    });
    if (eksik) { durum(T(a.querySelector('[name="izin"]') && !fm.elements.izin.checked ? 'izin' : 'eksik'), 'err'); return false; }
    var e = a.querySelector('[name="eposta"]');
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.value.trim())) { durum(T('eposta'), 'err'); return false; }
    return true;
  }

  // "en fazla 3" sorun
  fm.querySelectorAll('[data-grup="sorunlar"] input').forEach(function (k) {
    k.addEventListener('change', function () {
      if (fm.querySelectorAll('[data-grup="sorunlar"] input:checked').length > 3) { k.checked = false; durum(T('ucten'), 'err'); }
    });
  });

  fm.addEventListener('input', function () { if (!basladi) { basladi = true; olay('rapor-formu-basladi'); } });
  $('drIleri').addEventListener('click', function () {
    if (!gecerli(adimlar[su])) return;
    olay('rapor-adim-' + (su + 2));
    goster(su + 1);
  });
  $('drGeri').addEventListener('click', function () { goster(su - 1); });

  fm.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = fm.elements;
    if (el.website.value) return;
    if (!gecerli(adimlar[su])) return;
    var g = fm.querySelector('[name="g-recaptcha-response"]');
    if (g && !g.value) { durum(T('robot'), 'err'); return; }
    ['is_modeli', 'sorunlar', 'hedefler'].forEach(function (ad) {
      el[ad].value = [].map.call(fm.querySelectorAll('[data-grup="' + ad + '"] input:checked'), function (k) { return k.value; }).join(' · ');
    });
    el.dil.value = dil; el.sayfa.value = location.pathname;
    var b = $('drGonder'), eski = b.textContent;
    b.disabled = true; b.textContent = T('gonder');
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                 body: new URLSearchParams(new FormData(fm)).toString() })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        olay('lead-dijital-rapor');
        fm.hidden = true; $('raporTamam').hidden = false;
        $('raporTamam').scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function () {
        b.disabled = false; b.textContent = eski; durum(T('hata'), 'err');
        try { if (window.grecaptcha) grecaptcha.reset(); } catch (x) {}
      });
  });
  goster(0);
})();
