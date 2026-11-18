import { router } from '@inertiajs/react';
import { FileText, Inbox, X } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import Pagination from '@/components/admin/pagination';

type W = {
    id: number; institution: string; event: string; amount: number; bank_name: string; account_number: string; account_name: string;
    status: string; reject_reason: string | null; proof: { url: string; is_pdf: boolean } | null; requested_at: string; transferred_at: string | null;
};
type Bal = {
    id: number; title: string; institution: string; package: string; share_percent: number; subtotal: number; share: number;
    entitlement: number; transferred: number; processing: number; available: number;
};
type Summary = {
    total_paid: number; fee: number; share: number; package: number; package_count: number; platform: number;
    entitlement: number; transferred: number; processing: number; pending: number; available: number;
};
type Counts = { all: number; menunggu: number; disetujui: number; ditransfer: number; ditolak: number };
type Pg = { current: number; last: number; total: number; from: number | null; to: number | null };

const rp = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

const STATUS: Record<string, { label: string; style: string }> = {
    menunggu: { label: 'Menunggu', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    disetujui: { label: 'Disetujui', style: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200' },
    ditransfer: { label: 'Ditransfer', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    ditolak: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' },
};

export default function Pendapatan({ tab, status, q, withdrawals, counts, summary, balances, pg }: {
    tab: string; status: string; q: string; withdrawals: W[]; counts: Counts; summary: Summary; balances: Bal[]; pg: Pg;
}) {
    const [search, setSearch] = useState(q);
    const [busy, setBusy] = useState<number | null>(null);
    const [zoom, setZoom] = useState<string | null>(null);
    const [tf, setTf] = useState<W | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState('');

    const go = (params: Record<string, string>) =>
        router.get('/admin/pendapatan', { tab, status, q: search, ...params }, { preserveState: true, replace: true });

    const patch = (w: W, a: 'setujui' | 'tolak') => {
        let data: Record<string, string> = {};
        if (a === 'tolak') {
            const reason = window.prompt(`Alasan menolak penarikan ${rp(w.amount)} dari ${w.institution}:`);
            if (!reason || !reason.trim()) return;
            data = { reason: reason.trim().slice(0, 300) };
        }
        router.patch(`/admin/penarikan/${w.id}/${a}`, data, {
            preserveScroll: true,
            onStart: () => setBusy(w.id),
            onFinish: () => setBusy(null),
        });
    };

    const submitTransfer = () => {
        if (!tf) return;
        if (!file) { setErr('Pilih file bukti transfer.'); return; }
        router.post(`/admin/penarikan/${tf.id}/transfer`, { proof: file }, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setBusy(tf.id),
            onFinish: () => setBusy(null),
            onSuccess: () => { setTf(null); setFile(null); setErr(''); },
            onError: (e) => setErr(String(e.proof ?? Object.values(e)[0] ?? 'Gagal mengunggah bukti.')),
        });
    };

    const cards = [
        { label: 'Total dibayar pembeli', value: summary.total_paid, note: 'Tiket lunas (vote belum tersedia)', color: 'text-blue-700' },
        { label: 'Biaya layanan', value: summary.fee, note: 'Dibayar pembeli, di atas harga', color: 'text-violet-700' },
        { label: 'Bagi hasil paket', value: summary.share, note: 'Dipotong dari harga (persen paket)', color: 'text-fuchsia-700' },
        { label: 'Pembayaran paket', value: summary.package, note: `${summary.package_count} paket bayar di muka lunas`, color: 'text-indigo-700' },
        { label: 'Total pendapatan platform', value: summary.platform, note: 'Biaya layanan + bagi hasil + paket', color: 'text-rose-700' },
        { label: 'Hak penyelenggara', value: summary.entitlement, note: 'Harga dikurangi bagi hasil paket', color: 'text-emerald-700' },
        { label: 'Sudah ditarik', value: summary.transferred, note: 'Sudah ditransfer', color: 'text-slate-800 dark:text-slate-100' },
        { label: 'Dalam proses', value: summary.processing, note: 'Disetujui, menunggu ditransfer', color: 'text-amber-700' },
        { label: 'Saldo tersedia', value: summary.available, note: 'Belum ditarik, sudah dikurangi permintaan', color: 'text-cyan-700' },
    ];

    const chips = [
        { key: 'all', label: 'Semua', n: counts.all },
        { key: 'menunggu', label: 'Menunggu', n: counts.menunggu },
        { key: 'disetujui', label: 'Disetujui', n: counts.disetujui },
        { key: 'ditransfer', label: 'Ditransfer', n: counts.ditransfer },
        { key: 'ditolak', label: 'Ditolak', n: counts.ditolak },
    ];


    const th = 'px-4 py-3 text-left text-xs font-semibold text-slate-500';
    const td = 'px-4 py-3.5 align-middle';

    return (
        <AdminLayout title="Pendapatan">
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Pendapatan Platform
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold">Pendapatan &amp; Penarikan</h2>
                        <p className="mt-1 max-w-2xl text-sm text-white/80">
                            Pantau pembayaran tiket, lihat biaya layanan dan hak penyelenggara, dan proses permintaan penarikan dana mereka.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map((c) => (
                        <div key={c.label} className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</div>
                            <div className={`mt-2 text-3xl font-extrabold tabular-nums ${c.color}`}>{rp(c.value)}</div>
                            <div className="mt-1 text-xs text-slate-500">{c.note}</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-1 gap-1.5 rounded-2xl border border-slate-200 bg-white/80 p-1.5 dark:border-white/10 dark:bg-white/5">
                        {[{ k: 'penarikan', l: 'Permintaan Penarikan' }, { k: 'saldo', l: 'Saldo per Event' }].map((t) => (
                            <button key={t.k} type="button" onClick={() => go({ tab: t.k })}
                                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === t.k ? 'bg-indigo-700 text-white shadow' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'}`}>
                                {t.l}
                            </button>
                        ))}
                    </div>
                    <a href={`/admin/pendapatan/csv?status=${status}&q=${encodeURIComponent(q)}`}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:border-white/10 dark:bg-white/5">
                        Unduh CSV
                    </a>
                    <a href="/admin/pendapatan/cetak" target="_blank" rel="noreferrer"
                        className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">
                        Cetak Laporan
                    </a>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="space-y-3 p-5">
                        <form onSubmit={(e) => { e.preventDefault(); go({ q: search }); }}>
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder={tab === 'saldo' ? 'Cari lembaga atau event...' : 'Cari lembaga, event, bank, atau nomor rekening...'}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5" />
                        </form>
                        {tab === 'penarikan' && (
                            <div className="flex flex-wrap gap-2">
                                {chips.map((c) => (
                                    <button key={c.key} type="button" onClick={() => go({ status: c.key })}
                                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold transition ${status === c.key ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200'}`}>
                                        {c.label} <span>{c.n}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {tab === 'saldo' ? (
                        balances.length === 0 ? (
                            <Empty text="Belum ada penjualan tiket yang lunas." />
                        ) : (
                            <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                                <table className="w-full min-w-[980px] text-sm">
                                    <thead className="bg-slate-50 dark:bg-white/5">
                                        <tr>
                                            <th className={th}>Event</th>
                                            <th className={th}>Lembaga</th>
                                            <th className={`${th} text-right`}>Penjualan tiket</th>
                                            <th className={`${th} text-right`}>Bagi hasil</th>
                                            <th className={`${th} text-right`}>Hak penyelenggara</th>
                                            <th className={`${th} text-right`}>Sudah ditarik</th>
                                            <th className={`${th} text-right`}>Dalam proses</th>
                                            <th className={`${th} text-right`}>Saldo tersedia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                        {balances.map((b) => (
                                            <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                                                <td className={td}>
                                                    <div className="font-semibold">{b.title}</div>
                                                    <div className="text-xs text-slate-500">Paket {b.package}</div>
                                                </td>
                                                <td className={td}>{b.institution}</td>
                                                <td className={`${td} text-right`}>{rp(b.subtotal)}</td>
                                                <td className={`${td} text-right`}>
                                                    {rp(b.share)}
                                                    {b.share_percent > 0 && <div className="text-[11px] text-slate-500">{b.share_percent}%</div>}
                                                </td>
                                                <td className={`${td} text-right font-semibold`}>{rp(b.entitlement)}</td>
                                                <td className={`${td} text-right`}>{rp(b.transferred)}</td>
                                                <td className={`${td} text-right text-amber-700`}>{rp(b.processing)}</td>
                                                <td className={`${td} text-right font-bold text-cyan-700`}>{rp(b.available)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : withdrawals.length === 0 ? (
                        <Empty text={status === 'all' ? 'Belum ada permintaan penarikan.' : 'Tidak ada permintaan penarikan pada filter ini.'} />
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[980px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        <th className={th}>Diajukan</th>
                                        <th className={th}>Lembaga & event</th>
                                        <th className={th}>Rekening tujuan</th>
                                        <th className={`${th} text-right`}>Nominal</th>
                                        <th className={th}>Status</th>
                                        <th className={`${th} text-right`}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {withdrawals.map((w) => {
                                        const st = STATUS[w.status] ?? STATUS.menunggu;
                                        return (
                                            <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                                                <td className={`${td} whitespace-nowrap text-xs text-slate-500`}>{w.requested_at}</td>
                                                <td className={td}>
                                                    <div className="font-semibold">{w.institution}</div>
                                                    <div className="text-xs text-slate-500">{w.event}</div>
                                                </td>
                                                <td className={td}>
                                                    <div className="font-semibold">{w.bank_name} · {w.account_number}</div>
                                                    <div className="text-xs text-slate-500">a.n. {w.account_name}</div>
                                                </td>
                                                <td className={`${td} text-right font-bold text-indigo-700 dark:text-indigo-300`}>{rp(w.amount)}</td>
                                                <td className={td}>
                                                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${st.style}`}>{st.label}</span>
                                                    {w.status === 'ditolak' && w.reject_reason && <div className="mt-1 max-w-[220px] text-xs text-rose-600">{w.reject_reason}</div>}
                                                    {w.status === 'ditransfer' && w.transferred_at && <div className="mt-1 text-xs text-slate-500">{w.transferred_at}</div>}
                                                </td>
                                                <td className={`${td} text-right`}>
                                                    {w.status === 'menunggu' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button type="button" disabled={busy === w.id} onClick={() => patch(w, 'setujui')}
                                                                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                                                                {busy === w.id ? '...' : 'Setujui'}
                                                            </button>
                                                            <button type="button" disabled={busy === w.id} onClick={() => patch(w, 'tolak')}
                                                                className="rounded-lg border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                                                                Tolak
                                                            </button>
                                                        </div>
                                                    )}
                                                    {w.status === 'disetujui' && (
                                                        <button type="button" onClick={() => { setTf(w); setFile(null); setErr(''); }}
                                                            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                                                            Tandai ditransfer
                                                        </button>
                                                    )}
                                                    {w.status === 'ditransfer' && w.proof && (
                                                        w.proof.is_pdf ? (
                                                            <a href={w.proof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline">
                                                                <FileText className="h-4 w-4" /> Bukti PDF
                                                            </a>
                                                        ) : (
                                                            <button type="button" onClick={() => setZoom(w.proof!.url)} className="text-xs font-bold text-indigo-600 underline">Lihat bukti</button>
                                                        )
                                                    )}
                                                    {w.status === 'ditolak' && <span className="text-xs text-slate-400">-</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {tab === 'penarikan' && <Pagination current={pg.current} last={pg.last} total={pg.total} from={pg.from} to={pg.to} unit="permintaan" />}
                </div>
            </div>

            {tf && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 p-4" onClick={() => setTf(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-extrabold">Tandai sudah ditransfer</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {rp(tf.amount)} ke {tf.bank_name} {tf.account_number} a.n. {tf.account_name}
                        </p>
                        <label className="mt-4 block text-sm font-semibold">Bukti transfer (JPG, PNG, WebP, atau PDF)</label>
                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(''); }}
                            className="mt-2 block w-full text-sm" />
                        {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setTf(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold dark:border-white/10">Batal</button>
                            <button type="button" disabled={busy === tf.id} onClick={submitTransfer}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                                {busy === tf.id ? 'Mengunggah...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {zoom && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setZoom(null)}>
                    <button type="button" aria-label="Tutup" className="absolute right-5 top-5 rounded-full bg-white/90 p-2 text-slate-700"><X className="h-5 w-5" /></button>
                    <img src={zoom} alt="Bukti transfer" className="max-h-[90vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </AdminLayout>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center border-t border-slate-200 px-4 py-14 text-center dark:border-white/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                <Inbox className="h-7 w-7" />
            </div>
            <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">{text}</p>
        </div>
    );
}
