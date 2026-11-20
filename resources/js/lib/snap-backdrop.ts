type SnapCb = {
    onSuccess?: (r: unknown) => void;
    onPending?: (r: unknown) => void;
    onError?: (r: unknown) => void;
    onClose?: () => void;
};

const ID = 'simple-snap-backdrop';
const STYLE_ID = 'simple-snap-backdrop-style';

const CSS = `
#snap-midtrans{background:transparent !important;z-index:2147483647 !important}
#${ID}{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;overflow:hidden;
 font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#fff;opacity:0;transition:opacity .35s ease;
 background:radial-gradient(1200px 700px at 15% 10%,#3b82f6 0%,transparent 55%),
  radial-gradient(1000px 700px at 90% 20%,#a855f7 0%,transparent 55%),
  radial-gradient(900px 700px at 50% 100%,#ec4899 0%,transparent 55%),
  linear-gradient(135deg,#0b1030,#1e1b4b 50%,#2e1065)}
#${ID}.on{opacity:1}
#${ID}::before{content:'';position:absolute;inset:0;
 background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
 background-size:44px 44px;mask-image:radial-gradient(circle at 50% 45%,#000 0%,transparent 75%);-webkit-mask-image:radial-gradient(circle at 50% 45%,#000 0%,transparent 75%)}
#${ID} .orb{position:absolute;border-radius:9999px;filter:blur(70px);opacity:.55;animation:ssb-float 9s ease-in-out infinite}
#${ID} .o1{width:340px;height:340px;background:#6366f1;left:-80px;top:12%}
#${ID} .o2{width:300px;height:300px;background:#d946ef;right:-60px;bottom:8%;animation-delay:-3s}
#${ID} .o3{width:240px;height:240px;background:#22d3ee;left:42%;top:-90px;animation-delay:-6s}
#${ID} .card{position:relative;text-align:center;padding:28px 34px;border-radius:28px;background:rgba(255,255,255,.08);
 border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
 box-shadow:0 30px 80px rgba(8,6,40,.55);max-width:min(86vw,360px)}
#${ID} .logo{width:64px;height:64px;margin:0 auto 14px;border-radius:20px;display:flex;align-items:center;justify-content:center;
 font-weight:900;font-size:30px;background:linear-gradient(135deg,#4f46e5,#9333ea);box-shadow:0 10px 30px rgba(99,102,241,.6)}
#${ID} .brand{font-weight:800;letter-spacing:.38em;font-size:13px;opacity:.9}
#${ID} .msg{margin-top:10px;font-size:15px;font-weight:700}
#${ID} .sub{margin-top:6px;font-size:12px;opacity:.7;line-height:1.5}
#${ID} .spin{width:26px;height:26px;margin:16px auto 0;border-radius:9999px;border:3px solid rgba(255,255,255,.25);border-top-color:#fff;animation:ssb-spin .8s linear infinite}
#${ID} .ok{width:72px;height:72px;margin:0 auto 14px;border-radius:9999px;display:none;align-items:center;justify-content:center;
 background:linear-gradient(135deg,#10b981,#34d399);box-shadow:0 10px 40px rgba(16,185,129,.55);animation:ssb-pop .5s cubic-bezier(.2,1.4,.4,1)}
#${ID}.done .ok{display:flex}
#${ID}.done .logo,#${ID}.done .spin{display:none}
#${ID} .foot{position:absolute;bottom:18px;left:0;right:0;text-align:center;font-size:11px;letter-spacing:.12em;opacity:.6}
@keyframes ssb-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-28px) scale(1.08)}}
@keyframes ssb-spin{to{transform:rotate(360deg)}}
@keyframes ssb-pop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
`;

function show() {
    if (document.getElementById(ID)) return;
    if (!document.getElementById(STYLE_ID)) {
        const st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = CSS;
        document.head.appendChild(st);
    }
    const el = document.createElement('div');
    el.id = ID;
    el.innerHTML = `
        <span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>
        <div class="card">
            <div class="logo">S</div>
            <div class="ok"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
            <div class="brand">SIMPLE</div>
            <div class="msg">Pembayaran Aman</div>
            <div class="sub">Selesaikan pembayaran di jendela yang terbuka.<br/>Jangan tutup halaman ini.</div>
            <div class="spin"></div>
        </div>
        <div class="foot">DIPROSES AMAN OLEH MIDTRANS</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
}

function hide() {
    const el = document.getElementById(ID);
    if (!el) return;
    el.classList.remove('on');
    setTimeout(() => el.remove(), 380);
}

function success() {
    const el = document.getElementById(ID);
    if (!el) return;
    el.classList.add('done');
    const m = el.querySelector('.msg');
    const s = el.querySelector('.sub');
    if (m) m.textContent = 'Pembayaran Berhasil';
    if (s) s.innerHTML = 'Terima kasih. Mengembalikan Anda<br/>ke halaman sebelumnya...';
}

/** Pengganti window.snap.pay: menampilkan latar SIMPLE di belakang popup Midtrans. */
export function snapPay(token: string, cb: SnapCb = {}) {
    show();
    (window as any).snap.pay(token, {
        onSuccess: (r: unknown) => {
            success();
            cb.onSuccess?.(r);
            setTimeout(hide, 1800);
        },
        onPending: (r: unknown) => { hide(); cb.onPending?.(r); },
        onError: (r: unknown) => { cb.onError?.(r); },
        onClose: () => { hide(); cb.onClose?.(); },
    });
}
