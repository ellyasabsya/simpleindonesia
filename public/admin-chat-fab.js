/*!
 * Tombol melayang "Hubungi Admin" untuk SIMPLE
 * - Bisa digeser (mouse & sentuhan), menempel ke sisi kiri/kanan layar
 * - Posisi diingat di localStorage
 * - Klik membuka panel kecil: WhatsApp & email admin
 * Tidak butuh Vue/React/build tool: cukup dimuat lewat <script defer>.
 */
(function () {
  'use strict';
  if (window.__adminFab) return;
  window.__adminFab = true;

  // ====== UBAH BAGIAN INI ======
  var CONFIG = {
    whatsapp: '6281277700335',            // nomor admin, format internasional tanpa + atau 0 di depan
    email: 'admin@gmail.com',    // email admin
    message: 'Halo Admin SIMPLE, saya butuh bantuan.',
    storageKey: 'simple-admin-fab-v2',
    size: 60,
    margin: 16
  };
  // =============================

  var css = [
    '.afab{position:fixed;z-index:2147483000;width:' + CONFIG.size + 'px;height:' + CONFIG.size + 'px;left:0;top:0;touch-action:none;-webkit-tap-highlight-color:transparent;font-family:inherit}',
    '.afab.is-snapping{transition:left .35s cubic-bezier(.34,1.56,.64,1),top .35s cubic-bezier(.34,1.56,.64,1)}',
    '.afab__btn{position:relative;display:grid;place-items:center;width:100%;height:100%;border:0;border-radius:50%;padding:0;cursor:grab;color:#fff;',
    'background:radial-gradient(circle at 30% 25%,#ffc46b 0%,#ff8a2b 45%,#e8501a 100%);',
    'box-shadow:0 0 0 4px rgba(255,255,255,.9),0 10px 24px -6px rgba(232,80,26,.55);',
    'transition:transform .18s ease,box-shadow .18s ease}',
    '.afab__btn:hover{transform:scale(1.06)}',
    '.afab__btn:active{transform:scale(.94)}',
    '.afab__btn:focus-visible{outline:3px solid #2b3a9a;outline-offset:4px}',
    '.afab.is-dragging .afab__btn{cursor:grabbing;transform:scale(1.14) rotate(-6deg);box-shadow:0 0 0 4px rgba(255,255,255,.95),0 22px 36px -8px rgba(232,80,26,.6)}',
    '.afab__btn svg{width:28px;height:28px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.2));pointer-events:none}',
    '.afab__ring{position:absolute;inset:0;border-radius:50%;border:2px solid #ff8a2b;opacity:0;pointer-events:none;animation:afab-pulse 2.6s ease-out infinite}',
    '.afab__ring--2{animation-delay:1.3s}',
    '.afab.is-dragging .afab__ring,.afab.is-open .afab__ring{animation-play-state:paused;opacity:0}',
    '@keyframes afab-pulse{0%{transform:scale(1);opacity:.65}70%,100%{transform:scale(1.7);opacity:0}}',
    '.afab__status{position:absolute;right:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#22c55e;border:2.5px solid #fff;pointer-events:none}',
    '.afab__panel{position:absolute;width:260px;padding:16px;border-radius:18px;background:#fff;color:#14172b;',
    'box-shadow:0 20px 50px -12px rgba(20,23,43,.35),0 0 0 1px rgba(20,23,43,.06);',
    'opacity:0;visibility:hidden;transform:scale(.92) translateY(6px);transition:opacity .18s ease,transform .18s ease,visibility .18s}',
    '.afab[data-side="left"] .afab__panel{left:0;transform-origin:left bottom}',
    '.afab[data-side="right"] .afab__panel{right:0;transform-origin:right bottom}',
    '.afab[data-v="up"] .afab__panel{bottom:' + (CONFIG.size + 12) + 'px}',
    '.afab[data-v="down"] .afab__panel{top:' + (CONFIG.size + 12) + 'px}',
    '.afab[data-v="down"][data-side="left"] .afab__panel{transform-origin:left top}',
    '.afab[data-v="down"][data-side="right"] .afab__panel{transform-origin:right top}',
    '.afab.is-open .afab__panel{opacity:1;visibility:visible;transform:none}',
    '.afab__title{margin:0 0 4px;font-size:16px;font-weight:700}',
    '.afab__text{margin:0 0 14px;font-size:13px;line-height:1.45;color:#5b6078}',
    '.afab__link{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-top:8px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;transition:transform .15s ease,background .15s ease}',
    '.afab__link:hover{transform:translateX(2px)}',
    '.afab__link:focus-visible{outline:3px solid #2b3a9a;outline-offset:2px}',
    '.afab__link--wa{background:#22c55e;color:#fff}',
    '.afab__link--wa:hover{background:#16a34a}',
    '.afab__link--mail{background:#eef0fb;color:#2b3a9a}',
    '.afab__link--mail:hover{background:#e0e4f8}',
    '.afab__link svg{width:18px;height:18px;flex:none}',
    'html.dark .afab__panel{background:#1b1e33;color:#eef0ff;box-shadow:0 20px 50px -12px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08)}',
    'html.dark .afab__text{color:#a4a9c6}',
    'html.dark .afab__link--mail{background:#2a2f55;color:#cfd6ff}',
    'html.dark .afab__link--mail:hover{background:#343a69}',
    'html.dark .afab__btn,html.dark .afab.is-dragging .afab__btn{box-shadow:0 0 0 4px rgba(27,30,51,.95),0 10px 24px -6px rgba(232,80,26,.55)}',
    'html.dark .afab__status{border-color:#1b1e33}',
    '@media (prefers-reduced-motion:reduce){.afab__ring{animation:none}.afab.is-snapping{transition:none}.afab__btn,.afab__panel,.afab__link{transition:none}}',
    '@media print{.afab{display:none}}'
  ].join('');

  var ICON_HEADSET =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>' +
    '<path d="M19 20c0 1.5-2 2-5 2h-1"/></svg>';
  var ICON_WA =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100a6.700 6.700 0 0 1-3.300-2.900c-.2-.4.200-.4.700-1.300.1-.2 0-.3 0-.5l-.8-1.900c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.300 3 3 0 0 0-.9 2.200 5.200 5.200 0 0 0 1.100 2.800 11.900 11.900 0 0 0 4.600 4c1.700.7 2.400.8 3.200.7a2.800 2.800 0 0 0 1.800-1.300c.2-.5.200-.9.200-1.300 0-.1-.2-.2-.4-.3z"/></svg>';
  var ICON_MAIL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';

  function init() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var waHref = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(CONFIG.message);
    var mailHref = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Bantuan SIMPLE');

    var root = document.createElement('div');
    root.className = 'afab';
    root.innerHTML =
      '<button type="button" class="afab__btn" aria-label="Hubungi admin" aria-expanded="false" aria-controls="afab-panel">' +
      '<span class="afab__ring"></span><span class="afab__ring afab__ring--2"></span>' +
      ICON_HEADSET + '<span class="afab__status" title="Admin tersedia"></span></button>' +
      '<div class="afab__panel" id="afab-panel" role="dialog" aria-label="Hubungi admin">' +
      '<p class="afab__title">Butuh bantuan?</p>' +
      '<p class="afab__text">Tanya soal event, pembayaran, atau akun Anda langsung ke admin.</p>' +
      '<a class="afab__link afab__link--wa" href="' + waHref + '" target="_blank" rel="noopener noreferrer">' + ICON_WA + 'Chat via WhatsApp</a>' +
      '<a class="afab__link afab__link--mail" href="' + mailHref + '">' + ICON_MAIL + 'Kirim email</a>' +
      '</div>';
    document.body.appendChild(root);

    var btn = root.querySelector('.afab__btn');
    var size = CONFIG.size;
    var margin = CONFIG.margin;

    // Sisakan ruang di atas bottom navigation (hanya layar HP, < 768px).
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    var phone = window.matchMedia('(max-width: 767px)');
    function reserve() { return phone.matches ? 80 + probe.offsetHeight : 0; }

    // pos: sisi (left/right) + posisi vertikal sebagai rasio, supaya tetap rapi saat layar berubah ukuran
    var pos = { side: 'right', yr: 1 };
    try {
      var saved = JSON.parse(localStorage.getItem(CONFIG.storageKey));
      if (saved && (saved.side === 'left' || saved.side === 'right') && typeof saved.yr === 'number') pos = saved;
    } catch (e) { /* abaikan */ }

    function maxY() { return Math.max(margin, window.innerHeight - size - margin - reserve()); }
    function clampY(y) { return Math.min(Math.max(y, margin), maxY()); }
    function clampX(x) { return Math.min(Math.max(x, 0), window.innerWidth - size); }

    function setXY(x, y) {
      root.style.left = x + 'px';
      root.style.top = y + 'px';
      root.setAttribute('data-side', x + size / 2 < window.innerWidth / 2 ? 'left' : 'right');
      root.setAttribute('data-v', y + size / 2 > window.innerHeight / 2 ? 'up' : 'down');
    }

    function applyPos() {
      var x = pos.side === 'left' ? margin : window.innerWidth - size - margin;
      var y = clampY(pos.yr * maxY());
      setXY(x, y);
    }

    function save() {
      try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(pos)); } catch (e) { /* abaikan */ }
    }

    function setOpen(open) {
      root.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // ----- Geser -----
    var drag = null;
    var justDragged = false;

    btn.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var rect = root.getBoundingClientRect();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - rect.left, oy: e.clientY - rect.top, moved: false };
      btn.setPointerCapture(e.pointerId);
    });

    btn.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
        drag.moved = true;
        root.classList.remove('is-snapping');
        root.classList.add('is-dragging');
        setOpen(false);
      }
      var x = clampX(e.clientX - drag.ox);
      var y = Math.min(Math.max(e.clientY - drag.oy, 0), window.innerHeight - size);
      setXY(x, y);
    });

    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var moved = drag.moved;
      drag = null;
      if (btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId);
      if (!moved) return;
      justDragged = true;
      root.classList.remove('is-dragging');
      var rect = root.getBoundingClientRect();
      pos.side = rect.left + size / 2 < window.innerWidth / 2 ? 'left' : 'right';
      pos.yr = maxY() > 0 ? clampY(rect.top) / maxY() : 0;
      root.classList.add('is-snapping');
      applyPos();
      save();
      setTimeout(function () { root.classList.remove('is-snapping'); }, 400);
    }
    btn.addEventListener('pointerup', endDrag);
    btn.addEventListener('pointercancel', endDrag);

    // ----- Klik / keyboard -----
    btn.addEventListener('click', function () {
      if (justDragged) { justDragged = false; return; }
      setOpen(!root.classList.contains('is-open'));
    });

    document.addEventListener('pointerdown', function (e) {
      if (root.classList.contains('is-open') && !root.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open')) { setOpen(false); btn.focus(); }
    });
    window.addEventListener('resize', applyPos);

    applyPos();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
