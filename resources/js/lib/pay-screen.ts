type Opts = {
    tokenUrl: string;
    syncUrl?: string;
    onSuccess?: () => void;
    onPending?: () => void;
    onClose?: () => void;
};

type State = 'loading' | 'paying' | 'success' | 'pending' | 'closed' | 'error';

const ID = 'simple-pay-screen';
const STYLE_ID = 'simple-pay-screen-style';
const SNAP_TAG = 'data-simple-snap';

const TEXT: Record<State, [string, string, number]> = {
    loading: ['Menyiapkan pembayaran', 'Mohon tunggu sebentar...', 1],
    paying: ['Selesaikan pembayaran', 'Ikuti petunjuk pada jendela pembayaran Midtrans.', 2],
    success: ['Pembayaran berhasil', 'Terima kasih! Mengembalikan Anda ke halaman sebelumnya...', 3],
    pending: ['Menunggu pembayaran', 'Pesanan Anda tercatat. Selesaikan pembayaran sesuai instruksi.', 3],
    closed: ['Pembayaran belum selesai', 'Jendela pembayaran ditutup. Pesanan Anda tetap tersimpan, silakan coba lagi.', 2],
    error: ['Pembayaran tidak dapat dibuka', 'Silakan coba lagi. Pesanan Anda tetap tersimpan.', 2],
};

const CSS = `
#snap-midtrans{background:transparent !important;z-index:2147483647 !important}
#${ID}{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;overflow:hidden;
 font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#fff;opacity:0;transition:opacity .3s ease;
 background:radial-gradient(1200px 700px at 15% 10%,#3b82f6 0%,transparent 55%),
  radial-gradient(1000px 700px at 90% 20%,#a855f7 0%,transparent 55%),
  radial-gradient(900px 700px at 50% 100%,#ec4899 0%,transparent 55%),
  linear-gradient(135deg,#0b1030,#1e1b4b 50%,#2e1065)}
#${ID}.on{opacity:1}
#${ID}::before{content:'';position:absolute;inset:0;
 background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
 background-size:44px 44px;mask-image:radial-gradient(circle at 50% 45%,#000 0%,transparent 75%);-webkit-mask-image:radial-gradient(circle at 50% 45%,#000 0%,transparent 75%)}
#${ID} .orb{position:absolute;border-radius:9999px;filter:blur(70px);opacity:.55;animation:ps-float 9s ease-in-out infinite}
#${ID} .o1{width:340px;height:340px;background:#6366f1;left:-80px;top:12%}
#${ID} .o2{width:300px;height:300px;background:#d946ef;right:-60px;bottom:8%;animation-delay:-3s}
#${ID} .o3{width:240px;height:240px;background:#22d3ee;left:42%;top:-90px;animation-delay:-6s}
#${ID} .card{position:relative;text-align:center;width:min(92vw,400px);padding:30px 28px 28px;border-radius:28px;
 background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
 box-shadow:0 30px 80px rgba(8,6,40,.55)}
#${ID} .steps{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px;font-size:11px;font-weight:700}
#${ID} .steps span{opacity:.4;transition:opacity .3s}
#${ID} .steps span.on{opacity:1}
#${ID} .steps i{width:22px;height:2px;background:rgba(255,255,255,.3)}
#${ID} .ic{display:none;width:76px;height:76px;margin:0 auto 18px;align-items:center;justify-content:center;position:relative}
#${ID}[data-state=loading] .i-load,#${ID}[data-state=paying] .i-load{display:flex}
#${ID}[data-state=success] .i-ok,#${ID}[data-state=pending] .i-ok{display:flex}
#${ID}[data-state=closed] .i-warn,#${ID}[data-state=error] .i-warn{display:flex}
#${ID} .i-load{font-weight:900;font-size:30px;border-radius:24px;background:linear-gradient(135deg,#4f46e5,#9333ea);box-shadow:0 10px 30px rgba(99,102,241,.6)}
#${ID} .i-load::after{content:'';position:absolute;inset:-9px;border-radius:32px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;animation:ps-spin .9s linear infinite}
#${ID} .i-ok{border-radius:9999px;background:linear-gradient(135deg,#10b981,#34d399);box-shadow:0 10px 40px rgba(16,185,129,.55);animation:ps-pop .5s cubic-bezier(.2,1.4,.4,1)}
#${ID} .i-warn{border-radius:9999px;background:linear-gradient(135deg,#f59e0b,#f97316);box-shadow:0 10px 40px rgba(245,158,11,.5);animation:ps-pop .5s cubic-bezier(.2,1.4,.4,1)}
#${ID} .brand{font-weight:800;letter-spacing:.38em;font-size:12px;opacity:.8}
#${ID} .title{margin-top:10px;font-size:18px;font-weight:800}
#${ID} .sub{margin-top:8px;font-size:13px;opacity:.75;line-height:1.55}
#${ID} .detail{margin-top:10px;font-size:11px;opacity:.6;font-family:ui-monospace,monospace}
#${ID} .detail:empty{display:none}
#${ID} .actions{display:none;gap:10px;margin-top:22px;justify-content:center}
#${ID}[data-state=closed] .actions,#${ID}[data-state=error] .actions{display:flex}
#${ID} .btn{border:0;cursor:pointer;border-radius:14px;padding:12px 18px;font-weight:800;font-size:13px;color:#fff;font-family:inherit}
#${ID} .btn.p{background:linear-gradient(135deg,#6366f1,#a855f7);box-shadow:0 8px 24px rgba(99,102,241,.45)}
#${ID} .btn.g{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22)}
#${ID} .foot{position:absolute;bottom:18px;left:0;right:0;text-align:center;font-size:11px;letter-spacing:.12em;opacity:.55}
@keyframes ps-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-28px) scale(1.08)}}
@keyframes ps-spin{to{transform:rotate(360deg)}}
@keyframes ps-pop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
`;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function xsrf(): string {
    return decodeURIComponent(document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '');
}

async function postJson(url: string, ms: number, label: string) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
        const r = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() },
            signal: ctl.signal,
        });
        if (!r.ok) throw new Error(`${label} gagal (HTTP ${r.status})`);
        return await r.json();
    } catch (e) {
        if ((e as Error).name === 'AbortError') throw new Error(`${label} tidak merespons`);
        throw e;
    } finally {
        clearTimeout(t);
    }
}

function loadSnap(clientKey: string, sandbox: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).snap) return resolve();
        document.querySelectorAll(`script[${SNAP_TAG}]`).forEach((n) => n.remove());
        const sc = document.createElement('script');
        sc.src = sandbox ? 'https://app.sandbox.midtrans.com/snap/snap.js' : 'https://app.midtrans.com/snap/snap.js';
        sc.setAttribute('data-client-key', clientKey);
        sc.setAttribute(SNAP_TAG, '1');
        const t = setTimeout(() => reject(new Error('Memuat Midtrans (snap.js) terlalu lama')), 20000);
        sc.onload = () => { clearTimeout(t); resolve(); };
        sc.onerror = () => { clearTimeout(t); reject(new Error('Gagal memuat Midtrans (snap.js)')); };
        document.body.appendChild(sc);
    });
}

/** Layar pembayaran penuh bermerek SIMPLE: ambil token, buka Snap, tangani sukses/tutup/error. */
export function openPayScreen(opts: Opts) {
    document.getElementById(ID)?.remove();
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
            <div class="steps"><span data-s="1">Pesanan</span><i></i><span data-s="2">Bayar</span><i></i><span data-s="3">Selesai</span></div>
            <div class="ic i-load">S</div>
            <div class="ic i-ok"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
            <div class="ic i-warn"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v8M12 18h.01"/></svg></div>
            <div class="brand">SIMPLE</div>
            <div class="title"></div>
            <div class="sub"></div>
            <div class="detail"></div>
            <div class="actions">
                <button type="button" class="btn p" data-a="retry">Coba bayar lagi</button>
                <button type="button" class="btn g" data-a="back">Kembali</button>
            </div>
        </div>
        <div class="foot">DIPROSES AMAN OLEH MIDTRANS</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));

    const q = (sel: string) => el.querySelector(sel) as HTMLElement;
    let cur: State = 'loading';
    let finished = false;

    const set = (state: State, detail = '') => {
        cur = state;
        el.dataset.state = state;
        const [title, sub, step] = TEXT[state];
        q('.title').textContent = title;
        q('.sub').textContent = sub;
        q('.detail').textContent = detail;
        el.querySelectorAll('.steps span').forEach((n) => n.classList.toggle('on', Number((n as HTMLElement).dataset.s) <= step));
    };

    const close = (cb?: () => void) => {
        el.classList.remove('on');
        setTimeout(() => el.remove(), 320);
        cb?.();
    };

    const finish = async (kind: 'success' | 'pending') => {
        finished = true;
        set(kind);
        const sync =
            kind === 'success' && opts.syncUrl
                ? Promise.race([postJson(opts.syncUrl, 6000, 'Sinkronisasi').catch(() => undefined), sleep(4000)])
                : Promise.resolve();
        await Promise.all([sleep(kind === 'success' ? 1500 : 1800), sync]);
        close(kind === 'success' ? opts.onSuccess : opts.onPending);
    };

    const run = async () => {
        set('loading');
        let d: { token: string; client_key: string; sandbox: boolean };
        try {
            d = await postJson(opts.tokenUrl, 25000, 'Token pembayaran');
            await loadSnap(d.client_key, d.sandbox);
        } catch (e) {
            set('error', (e as Error).message);
            return;
        }
        set('paying');
        try {
            (window as any).snap.pay(d.token, {
                onSuccess: () => void finish('success'),
                onPending: () => void finish('pending'),
                onError: () => set('error', 'Midtrans melaporkan pembayaran gagal.'),
                onClose: () => { if (!finished && cur === 'paying') set('closed'); },
            });
        } catch {
            set('error', 'Jendela pembayaran gagal dibuka.');
        }
    };

    q('[data-a=retry]').addEventListener('click', () => { finished = false; void run(); });
    q('[data-a=back]').addEventListener('click', () => close(opts.onClose));

    void run();
}
