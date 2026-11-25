import { FileText, Lock } from 'lucide-react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Bal = {
    id: number; title: string; subtotal: number; share: number; entitlement: number; transferred: number;
    processing: number; available: number; has_pending: boolean; held?: number; release_at?: string | null; blocked?: boolean;
};
type H = {
    id: number; event: string; amount: number; bank_name: string; account_number: string; account_name: string; status: string;
    reject_reason: string | null; proof: { url: string; is_pdf: boolean } | null; requested_at: string; transferred_at: string | null;
};

type Props = {
    summary: { available: number; processing: number; withdrawn: number; held?: number };
    totals: { sales: number; share: number; ent: number };
    balances: Bal[];
    history: H[];
    hasAccount: boolean;
    holdUntil: string | null;
    canWithdraw: boolean;
    hasPin: boolean;
    pinLockedUntil: string | null;
    min: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acc: any;
    onSubmitAcc: (e: React.FormEvent) => void;
    onStart: (b: Bal) => void;
    onPin: () => void;
    onZoom: (url: string) => void;
};

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n || 0);
const day = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const head = 'mb-2 px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300';
const lbl = 'mb-1.5 block px-1 text-[13px] font-medium ' + MUTED;
const inp = 'h-12 w-full rounded-2xl border-0 px-4 text-base outline-none disabled:opacity-60 ' + FIELD;

const ST: Record<string, { label: string; cls: string }> = {
    menunggu: { label: 'Menunggu', cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-200' },
    disetujui: { label: 'Disetujui', cls: 'bg-sky-500/10 text-sky-800 dark:text-sky-200' },
    ditransfer: { label: 'Ditransfer', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
    ditolak: { label: 'Ditolak', cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
};

/** Pendapatan panel HP: ringkasan, saldo per event, rekening, riwayat. Modal PIN dan tarik dana dipakai dari halaman. */
export default function PanelPendapatanMobile(p: Props) {
    const { summary: s, totals: t, acc } = p;
    const small: [string, string][] = [
        ['Total penjualan', rp(t.sales)],
        ['Bagi hasil platform', rp(t.share)],
        ['Hak lembaga', rp(t.ent)],
        ['Sudah ditarik', rp(s.withdrawn)],
    ];

    const hint = (b: Bal) =>
        !p.canWithdraw ? 'Tidak punya izin penarikan'
        : !p.hasAccount ? 'Atur rekening pencairan dulu'
        : p.holdUntil ? 'Ditahan sampai ' + p.holdUntil
        : b.blocked ? 'Event ditolak, saldo diblokir'
        : b.held ? 'Dana ditahan' + (b.release_at ? ' sampai ' + day(b.release_at) : '')
        : b.has_pending ? 'Masih ada permintaan menunggu'
        : b.available < p.min ? 'Minimal ' + rp(p.min)
        : '';

    return (
        <div className="space-y-3 pb-24">
            <section className="space-y-3">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-500 p-3 text-white">
                    <p className="text-[13px] text-white/80">Saldo tersedia</p>
                    <p className="mt-1 text-[22px] leading-tight font-semibold">{rp(s.available)}</p>
                    <p className="text-xs text-white/70">Dalam proses {rp(s.processing)}{s.held ? ' · Ditahan ' + rp(s.held) : ''}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {small.map(([k, v]) => (
                        <div key={k} className={'rounded-2xl p-3 ' + CARD}>
                            <p className={'text-[11px] ' + MUTED}>{k}</p>
                            <p className="mt-1 text-sm font-semibold">{v}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className={head}>Saldo per event</h2>
                {p.holdUntil && <p className="mb-3 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">Rekening baru diganti. Penarikan baru bisa diajukan setelah {p.holdUntil}.</p>}
                {p.balances.length === 0 ? (
                    <div className={'rounded-2xl px-4 py-12 text-center text-sm ' + FIELD + ' ' + MUTED}>Belum ada penjualan yang lunas.</div>
                ) : (
                    <div className="space-y-3">
                        {p.balances.map((b) => {
                            const h = hint(b);
                            const blocked = !p.canWithdraw || !p.hasAccount || !!p.holdUntil || b.has_pending || b.available < p.min;
                            return (
                                <div key={b.id} className={'space-y-3 rounded-2xl p-3 ' + CARD}>
                                    <p className="text-sm font-semibold">{b.title}</p>
                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div><dt className={MUTED}>Penjualan</dt><dd className="font-semibold">{rp(b.subtotal)}</dd></div>
                                        <div><dt className={MUTED}>Bagi hasil</dt><dd className="font-semibold">{rp(b.share)}</dd></div>
                                        <div><dt className={MUTED}>Hak lembaga</dt><dd className="font-semibold text-emerald-700 dark:text-emerald-300">{rp(b.entitlement)}</dd></div>
                                        <div><dt className={MUTED}>Saldo</dt><dd className="font-semibold text-indigo-700 dark:text-indigo-300">{rp(b.available)}</dd></div>
                                        <div><dt className={MUTED}>Proses</dt><dd className="font-semibold">{rp(b.processing)}</dd></div>
                                        <div><dt className={MUTED}>Ditarik</dt><dd className="font-semibold">{rp(b.transferred)}</dd></div>
                                    </dl>
                                    {!!b.held && <p className="text-[11px] text-orange-700 dark:text-orange-300">Ditahan {rp(b.held)}{b.release_at ? ' · bisa ditarik ' + day(b.release_at) : ''}</p>}
                                    <button type="button" disabled={blocked} onClick={() => p.onStart(b)} className={'h-11 w-full rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-40 dark:bg-indigo-500 ' + PRESS}>Tarik dana</button>
                                    {blocked && h && <p className={'text-center text-[11px] ' + MUTED}>{h}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section>
                <h2 className={head}>Rekening pencairan</h2>
                <form onSubmit={p.onSubmitAcc} className={'space-y-3 rounded-2xl p-3 ' + CARD}>
                    <p className={'text-xs leading-relaxed ' + MUTED}>Dana ditransfer ke rekening ini. Nama harus sama dengan pemilik rekening lembaga.</p>
                    <label className="block"><span className={lbl}>Nama bank</span>
                        <input value={acc.data.bank_name} disabled={!p.canWithdraw} onChange={(e) => acc.setData('bank_name', e.target.value)} className={inp} />
                        {acc.errors.bank_name && <span className="mt-1 block px-1 text-xs text-rose-600">{acc.errors.bank_name}</span>}
                    </label>
                    <label className="block"><span className={lbl}>Nomor rekening</span>
                        <input inputMode="numeric" value={acc.data.account_number} disabled={!p.canWithdraw} onChange={(e) => acc.setData('account_number', e.target.value)} className={inp} />
                        {acc.errors.account_number && <span className="mt-1 block px-1 text-xs text-rose-600">{acc.errors.account_number}</span>}
                    </label>
                    <label className="block"><span className={lbl}>Atas nama</span>
                        <input value={acc.data.account_name} disabled={!p.canWithdraw} onChange={(e) => acc.setData('account_name', e.target.value)} className={inp} />
                        {acc.errors.account_name && <span className="mt-1 block px-1 text-xs text-rose-600">{acc.errors.account_name}</span>}
                    </label>
                    {p.hasPin && p.canWithdraw && (
                        <label className="block"><span className={lbl}>PIN penarikan</span>
                            <input type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={acc.data.pin} onChange={(e) => acc.setData('pin', e.target.value.replace(/\D/g, ''))} className={inp} />
                            {acc.errors.pin && <span className="mt-1 block px-1 text-xs text-rose-600">{acc.errors.pin}</span>}
                        </label>
                    )}
                    {p.canWithdraw && (
                        <button type="submit" disabled={acc.processing} className={'h-12 w-full rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}>
                            {acc.processing ? 'Menyimpan…' : 'Simpan rekening'}
                        </button>
                    )}
                    {p.canWithdraw && (
                        <div className={'flex items-center justify-between rounded-2xl px-4 py-3 text-xs ' + FIELD}>
                            <span className="inline-flex items-center gap-1.5 font-medium"><Lock className="size-3.5" /> {p.hasPin ? 'PIN penarikan aktif' : 'PIN belum dibuat'}</span>
                            <button type="button" onClick={p.onPin} className="font-semibold text-indigo-700 underline dark:text-indigo-300">{p.hasPin ? 'Ubah PIN' : 'Buat PIN'}</button>
                        </div>
                    )}
                    {p.pinLockedUntil && <p className="rounded-2xl bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">PIN terkunci sampai pukul {p.pinLockedUntil}.</p>}
                </form>
            </section>

            <section>
                <h2 className={head}>Riwayat penarikan</h2>
                {p.history.length === 0 ? (
                    <div className={'rounded-2xl px-4 py-12 text-center text-sm ' + FIELD + ' ' + MUTED}>Belum ada penarikan yang diajukan.</div>
                ) : (
                    <div className="space-y-3">
                        {p.history.map((h) => {
                            const st = ST[h.status] ?? ST.menunggu;
                            return (
                                <div key={h.id} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">{h.event}</p>
                                            <p className={'text-xs ' + MUTED}>{h.requested_at}</p>
                                        </div>
                                        <span className={'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ' + st.cls}>{st.label}</span>
                                    </div>
                                    <p className="text-[17px] font-semibold">{rp(h.amount)}</p>
                                    <p className={'text-xs ' + MUTED}>{h.bank_name} · {h.account_number} · a.n. {h.account_name}</p>
                                    {h.status === 'ditolak' && h.reject_reason && <p className="text-xs text-rose-600 dark:text-rose-400">{h.reject_reason}</p>}
                                    {h.status === 'ditransfer' && h.transferred_at && <p className={'text-xs ' + MUTED}>Ditransfer {h.transferred_at}</p>}
                                    {h.proof && (
                                        h.proof.is_pdf ? (
                                            <a href={h.proof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 underline dark:text-indigo-300"><FileText className="size-4" /> Bukti (PDF)</a>
                                        ) : (
                                            <button type="button" onClick={() => p.onZoom(h.proof!.url)} className="text-xs font-medium text-indigo-700 underline dark:text-indigo-300">Lihat bukti</button>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
