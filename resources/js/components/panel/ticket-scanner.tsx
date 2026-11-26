import { AlertTriangle, CheckCircle2, Keyboard, ScanLine, UserCheck, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Result = {
    status: 'ok' | 'duplikat' | 'tidak_ditemukan' | 'belum_lunas' | 'salah_tanggal' | 'belum_disetujui' | 'bukan_peserta' | 'konfirmasi' | 'error';
    kind?: 'peserta' | 'pengunjung';
    also_participant?: boolean;
    code?: string; reg_id?: string | null; name?: string; type?: string | null; buyer?: string | null; school?: string | null; at?: string; order_status?: string | null;
};
type Props = { eventId: number; inline?: boolean; onClose?: () => void; onCheckedIn: (r: Result) => void };

const VIEW: Record<Result['status'], { title: string; box: string; Icon: typeof CheckCircle2 }> = {
    ok: { title: 'Check-in berhasil', box: 'border-emerald-400 bg-emerald-50 text-emerald-900', Icon: CheckCircle2 },
    duplikat: { title: 'Sudah pernah check-in', box: 'border-amber-400 bg-amber-50 text-amber-900', Icon: AlertTriangle },
    tidak_ditemukan: { title: 'Kode, ID, atau akun tidak ditemukan', box: 'border-rose-400 bg-rose-50 text-rose-900', Icon: XCircle },
    belum_lunas: { title: 'Pesanan belum lunas', box: 'border-rose-400 bg-rose-50 text-rose-900', Icon: XCircle },
    salah_tanggal: { title: 'Tiket tidak berlaku hari ini', box: 'border-amber-400 bg-amber-50 text-amber-900', Icon: XCircle },
    belum_disetujui: { title: 'Pendaftaran belum disetujui', box: 'border-rose-400 bg-rose-50 text-rose-900', Icon: XCircle },
    bukan_peserta: { title: 'Akun ini tidak terdaftar di event ini', box: 'border-rose-400 bg-rose-50 text-rose-900', Icon: XCircle },
    konfirmasi: { title: 'Cocokkan data, lalu tandai hadir', box: 'border-sky-400 bg-sky-50 text-sky-900', Icon: UserCheck },
    error: { title: 'Terjadi kesalahan, coba lagi', box: 'border-rose-400 bg-rose-50 text-rose-900', Icon: XCircle },
};

const KIND = {
    peserta: { label: 'PESERTA', cls: 'bg-indigo-600 text-white' },
    pengunjung: { label: 'PENGUNJUNG', cls: 'bg-teal-600 text-white' },
};

function xsrf() {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function ResultBox({ r, count, busy, onConfirm }: { r: Result; count: number; busy: boolean; onConfirm: () => void }) {
    const v = VIEW[r.status];
    const k = r.kind ? KIND[r.kind] : null;
    const lbl = 'font-semibold opacity-70';
    return (
        <div className={`mt-3 rounded-2xl border-2 px-4 py-3 ${v.box}`}>
            <div className="flex flex-wrap items-center gap-2">
                <v.Icon className="h-5 w-5 shrink-0" />
                <span className="font-extrabold">{v.title}</span>
                {k && <span className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-wider ${k.cls}`}>{k.label}</span>}
                {r.also_participant && <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800">Juga peserta</span>}
                <span className="ml-auto text-xs font-semibold opacity-70">{count} check-in sesi ini</span>
            </div>
            {r.name && (
                <dl className="mt-2 space-y-0.5 text-sm">
                    <div><span className="font-extrabold">{r.name}</span>{r.type ? ` · ${r.type}` : ''}</div>
                    {r.school && <div><span className={lbl}>Sekolah / instansi: </span>{r.school}</div>}
                    {r.buyer && <div><span className={lbl}>Pembeli: </span>{r.buyer}</div>}
                    {r.at && <div><span className={lbl}>{r.status === 'ok' ? 'Waktu check-in: ' : 'Check-in sebelumnya: '}</span>{r.at}</div>}
                    {r.order_status && (r.status === 'belum_lunas' || r.status === 'belum_disetujui') && <div><span className={lbl}>Status: </span>{r.order_status}</div>}
                    {r.reg_id && <div className="text-xs"><span className={lbl}>{r.kind === 'pengunjung' ? 'ID pengunjung: ' : 'ID peserta: '}</span><span className="font-mono font-bold">{r.reg_id}</span></div>}
                </dl>
            )}
            {r.status === 'salah_tanggal' && (r as { visit_date?: string }).visit_date && <div className="mt-1 text-sm font-semibold">{(() => { const x = r as { visit_date?: string; valid_to?: string }; const f = (v?: string) => new Date(v + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); return x.valid_to && x.valid_to !== x.visit_date ? 'Tiket ini berlaku ' + f(x.visit_date) + ' sampai ' + f(x.valid_to) + '.' : 'Tiket ini hanya berlaku untuk tanggal ' + f(x.visit_date) + '.'; })()}</div>}
            {r.status === 'tidak_ditemukan' && r.code && <div className="mt-1 font-mono text-xs opacity-70">{r.code}</div>}
            {r.status === 'konfirmasi' && (
                <button type="button" disabled={busy} onClick={onConfirm} className="mt-3 w-full rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-sky-800 disabled:opacity-60">
                    {busy ? '...' : 'Tandai hadir'}
                </button>
            )}
        </div>
    );
}

export default function TicketScanner({ eventId, inline = false, onClose, onCheckedIn }: Props) {
    const [result, setResult] = useState<Result | null>(null);
    const [manual, setManual] = useState('');
    const [camOn, setCamOn] = useState(false);
    const [camErr, setCamErr] = useState('');
    const [busy, setBusy] = useState(false);
    const [count, setCount] = useState(0);
    const scanner = useRef<any>(null);
    const last = useRef<{ code: string; t: number }>({ code: '', t: 0 });
    const input = useRef<HTMLInputElement>(null);

    const submit = useCallback(async (raw: string, fromCam = false, confirm = false) => {
        const code = raw.trim();
        if (!code) return;
        const now = Date.now();
        if (fromCam && last.current.code === code && now - last.current.t < 3000) return;
        last.current = { code, t: now };
        setBusy(true);
        try {
            const res = await fetch(`/panel/event/${eventId}/registrasi/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf(), 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ code, confirm }),
            });
            if (!res.ok) throw new Error(String(res.status));
            const data: Result = await res.json();
            setResult(data);
            if (data.status === 'ok') { setCount((c) => c + 1); onCheckedIn(data); }
        } catch {
            setResult({ status: 'error' });
        } finally {
            setBusy(false);
            setManual('');
            input.current?.focus();
        }
    }, [eventId, onCheckedIn]);

    const confirmNow = () => submit(last.current.code, false, true);

    const stopCam = useCallback(async () => {
        const s = scanner.current;
        scanner.current = null;
        if (s) { try { await s.stop(); s.clear(); } catch { /* sudah berhenti */ } }
        setCamOn(false);
    }, []);

    const startCam = async () => {
        setCamErr('');
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const s = new Html5Qrcode('qr-reader');
            scanner.current = s;
            await s.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text: string) => submit(text, true), () => {});
            setCamOn(true);
        } catch {
            scanner.current = null;
            setCamErr('Kamera tidak bisa dibuka. Izinkan akses kamera di browser (butuh HTTPS atau localhost), atau pakai input kode.');
        }
    };

    useEffect(() => { input.current?.focus(); return () => { stopCam(); }; }, [stopCam]);

    const inputCls = 'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';
    const placeholder = 'Kode tiket, ID peserta, username, atau alat scan USB';

    if (inline) {
        return (
            <div>
                <form onSubmit={(e) => { e.preventDefault(); submit(manual); }} className="flex gap-2 sm:flex-wrap">
                    <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
                        <Keyboard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input ref={input} value={manual} onChange={(e) => setManual(e.target.value)} placeholder={placeholder} autoComplete="off" className={inputCls} />
                    </div>
                    <button type="button" onClick={camOn ? stopCam : startCam} aria-label={camOn ? 'Matikan kamera' : 'Buka kamera'} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 sm:px-4 text-sm font-bold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                        <ScanLine className="h-4 w-4" /><span className="hidden sm:inline">{camOn ? 'Matikan kamera' : 'Kamera'}</span>
                    </button>
                    <button type="submit" disabled={busy} className="shrink-0 rounded-xl bg-indigo-900 px-4 py-2.5 sm:px-5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-60">{busy ? '...' : 'Check-in'}</button>
                </form>
                {camErr && <p className="mt-2 text-xs font-semibold text-rose-600">{camErr}</p>}
                <div id="qr-reader" className={camOn ? 'mx-auto mt-3 w-full max-w-sm overflow-hidden rounded-2xl bg-slate-900' : 'hidden'} />
                {result && <ResultBox r={result} count={count} busy={busy} onConfirm={confirmNow} />}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
            <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><ScanLine className="h-5 w-5" /></span>
                    <div className="mr-auto">
                        <h3 className="text-lg font-extrabold">Scan check-in</h3>
                        <p className="text-xs text-slate-500">{count} check-in pada sesi ini</p>
                    </div>
                    {onClose && <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>}
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl bg-slate-900">
                    <div id="qr-reader" className={camOn ? 'w-full' : 'hidden'} />
                    {!camOn && (
                        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-slate-300">
                            <ScanLine className="h-10 w-10 opacity-60" />
                            <p className="text-sm">Arahkan kamera ke QR tiket atau QR akun peserta.</p>
                            <button type="button" onClick={startCam} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100">Buka kamera</button>
                        </div>
                    )}
                </div>
                {camOn && <button type="button" onClick={stopCam} className="mt-2 w-full rounded-xl border border-slate-200 py-2 text-sm font-bold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">Matikan kamera</button>}
                {camErr && <p className="mt-2 text-xs font-semibold text-rose-600">{camErr}</p>}
                <form onSubmit={(e) => { e.preventDefault(); submit(manual); }} className="mt-4 flex gap-2">
                    <div className="relative flex-1">
                        <Keyboard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input ref={input} value={manual} onChange={(e) => setManual(e.target.value)} placeholder={placeholder} autoComplete="off" className={inputCls} />
                    </div>
                    <button type="submit" disabled={busy} className="rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-60">{busy ? '...' : 'Check-in'}</button>
                </form>
                {result && <ResultBox r={result} count={count} busy={busy} onConfirm={confirmNow} />}
            </div>
        </div>
    );
}
