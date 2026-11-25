import { router } from '@inertiajs/react';
import { CheckCircle2, Clock, FileText, Inbox, Search, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import Pagination from '@/components/admin/pagination';

type Order = {
    id: number; title: string; institution: string; institution_email: string; package: string; detail: string;
    total: number; status: string; note: string | null; proof: { url: string; is_pdf: boolean } | null; created_at: string;
};
type Counts = { menunggu_verifikasi: number; lunas: number; ditolak: number; dikembalikan?: number };
type Pg = { current: number; last: number; total: number; from: number | null; to: number | null };

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;

const STATUS: Record<string, { label: string; style: string }> = {
    menunggu_verifikasi: { label: 'Perlu verifikasi', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    lunas: { label: 'Lunas', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    ditolak: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' },
    dikembalikan: { label: 'Dikembalikan', style: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200' },
};

export default function VerifikasiPaket({ orders, status, q, counts, pg, manual_on }: { orders: Order[]; status: string; q: string; counts: Counts; pg: Pg; manual_on: boolean }) {
    const [search, setSearch] = useState(q);
    const [busy, setBusy] = useState<number | null>(null);
    const [zoom, setZoom] = useState<string | null>(null);

    const totalAll = counts.menunggu_verifikasi + counts.lunas + counts.ditolak + (counts.dikembalikan ?? 0);
    const tabs = [
        { key: 'menunggu_verifikasi', label: 'Perlu verifikasi', n: counts.menunggu_verifikasi },
        { key: 'lunas', label: 'Lunas', n: counts.lunas },
        { key: 'ditolak', label: 'Ditolak', n: counts.ditolak },
        { key: 'dikembalikan', label: 'Dikembalikan', n: counts.dikembalikan ?? 0 },
        { key: 'all', label: 'Semua', n: totalAll },
    ];
    const activeLabel = tabs.find((t) => t.key === status)?.label ?? 'Semua';

    const cards = [
        { key: 'menunggu_verifikasi', label: 'Perlu verifikasi', n: counts.menunggu_verifikasi, color: 'text-amber-600', icon: Clock },
        { key: 'lunas', label: 'Lunas', n: counts.lunas, color: 'text-emerald-600', icon: CheckCircle2 },
        { key: 'ditolak', label: 'Ditolak', n: counts.ditolak, color: 'text-rose-600', icon: XCircle },
        { key: 'dikembalikan', label: 'Dikembalikan', n: counts.dikembalikan ?? 0, color: 'text-slate-600', icon: FileText },
    ] as const;

    const go = (params: Record<string, string>) =>
        router.get('/admin/verifikasi-paket', { status, q: search, ...params }, { preserveState: true, replace: true });

    const act = (o: Order, a: 'setujui' | 'tolak' | 'kembalikan') => {
        let data: Record<string, string> = {};
        if (a === 'kembalikan') {
            const reason = window.prompt(`Alasan refund paket "${o.title}" (${rp(o.total)}):`);
            if (!reason || !reason.trim()) return;
            if (!window.confirm(`Tandai paket "${o.title}" sebagai dikembalikan? Nominal ${rp(o.total)} keluar dari pendapatan platform. Transfer uangnya ke lembaga tetap manual.`)) return;
            data = { reason: reason.trim().slice(0, 300) };
        }
        if (a === 'tolak') {
            const reason = window.prompt(`Alasan menolak pembayaran "${o.title}":`);
            if (!reason || !reason.trim()) return;
            data = { reason: reason.trim().slice(0, 300) };
        }
        router.patch(`/admin/verifikasi-paket/${o.id}/${a}`, data, {
            preserveScroll: true,
            onStart: () => setBusy(o.id),
            onFinish: () => setBusy(null),
        });
    };

    const th = 'px-4 py-3 text-left text-xs font-semibold text-slate-500';
    const td = 'px-4 py-3.5 align-middle';

    return (
        <AdminLayout title="Verifikasi Paket">
            <div className="w-full space-y-3 pb-24 md:space-y-5 md:pb-0">
                <div className="relative overflow-hidden rounded-2xl bg-indigo-600 px-4 py-3 text-white shadow-sm md:rounded-3xl md:bg-gradient-to-br md:from-indigo-700 md:via-blue-600 md:to-violet-600 md:px-7 md:py-6 md:shadow-lg md:shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 max-md:hidden" />
                    <div className="relative max-md:min-w-0 max-md:flex-1">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] max-md:hidden">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Admin Workspace
                        </span>
                        <h2 className="text-base font-semibold md:mt-3 md:text-2xl md:font-extrabold">Verifikasi Paket</h2>
                        <p className="mt-0.5 max-w-2xl line-clamp-2 text-xs leading-snug text-white/80 md:mt-1 md:line-clamp-none md:text-sm">
                            Cek bukti transfer pembayaran paket dari lembaga. Begitu disetujui, event langsung tayang. Kalau ditolak, event ikut ditolak.
                        </p>
                    </div>
                </div>

                {!manual_on && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-900 md:px-5 md:py-3 md:text-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        Pembayaran transfer manual sedang nonaktif di Pengaturan, jadi tidak ada pengajuan baru di halaman ini. Pembayaran yang sudah masuk sebelumnya tetap bisa diverifikasi. Pembayaran lewat Midtrans tidak perlu diverifikasi di sini.
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
                    {cards.map(({ key, label, n, color, icon: Icon }) => (
                        <button key={key} type="button" onClick={() => go({ status: key })}
                            className={`rounded-2xl border bg-white px-3 py-2 text-left shadow-none transition md:bg-white/80 md:p-5 md:shadow-sm md:hover:-translate-y-0.5 dark:bg-white/5 ${status === key ? 'border-indigo-400 ring-2 ring-indigo-400/30' : 'border-slate-200 dark:border-white/10'}`}>
                            <div className="flex items-center justify-between text-[13px] font-medium text-slate-600 md:text-xs md:font-semibold md:uppercase md:tracking-wider md:text-slate-500">
                                {label} <Icon className={`h-4 w-4 ${color}`} />
                            </div>
                            <div className={`text-lg font-semibold tabular-nums md:mt-2 md:text-3xl md:font-extrabold ${color}`}>{n}</div>
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-2.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3 md:px-4 md:py-3 dark:border-white/10">
                        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] md:flex-wrap">
                            {tabs.map((t) => {
                                const active = status === t.key;
                                const alert = t.key === 'menunggu_verifikasi' && t.n > 0;
                                return (
                                    <button key={t.key} type="button" onClick={() => go({ status: t.key })}
                                        className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition max-md:h-10 max-md:rounded-full max-md:py-0 max-md:text-[13px] ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}>
                                        {t.label}
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/25 text-white' : alert ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                                            {t.n}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); go({ q: search }); }} className="flex items-center gap-2 max-md:w-full">
                            <div className="relative max-md:min-w-0 max-md:flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari event atau lembaga"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none max-md:h-10 max-md:rounded-full max-md:py-0 max-md:text-base md:w-64 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5" />
                            </div>
                            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 max-md:h-10 max-md:rounded-full max-md:py-0 dark:bg-white dark:text-slate-900">
                                Cari
                            </button>
                        </form>
                    </div>

                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center px-4 py-8 text-center md:py-16">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                                <Inbox className="h-7 w-7" />
                            </div>
                            <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
                                {status === 'all' ? 'Belum ada pembayaran paket.' : `Tidak ada pembayaran dengan status "${activeLabel}".`}
                            </p>
                            {status !== 'all' && totalAll > 0 && (
                                <>
                                    <p className="mt-1 text-sm text-slate-500">Ada {totalAll} pembayaran di status lain.</p>
                                    <button type="button" onClick={() => go({ status: 'all' })}
                                        className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                                        Tampilkan semua
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="md:overflow-x-auto">
<div className="md:hidden">
                            <div className="divide-y divide-slate-100 dark:divide-white/10">
                                {orders.map((o) => {
                                    const st = STATUS[o.status] ?? STATUS.menunggu_verifikasi;
                                    return (
                                        <div key={`m${o.id}`} className="space-y-2 px-3 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="text-[15px] leading-snug font-semibold break-words">{o.title}</div>
                                                    <div className="text-xs text-slate-500">Diajukan {o.created_at}</div>
                                                </div>
                                                <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.style}`}>{st.label}</span>
                                            </div>
                                            <div className="text-[13px] leading-snug">
                                                <div className="font-medium">{o.institution} · {o.package}</div>
                                                <div className="break-all text-xs text-slate-500">{o.institution_email}</div>
                                                {o.detail && <div className="text-xs text-slate-500">{o.detail}</div>}
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-[15px] font-semibold text-indigo-700 dark:text-indigo-300">{rp(o.total)}</div>
                                                {o.proof ? (
                                                    o.proof.is_pdf ? (
                                                        <a href={o.proof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline">
                                                            <FileText className="h-4 w-4" /> Bukti PDF
                                                        </a>
                                                    ) : (
                                                        <button type="button" onClick={() => setZoom(o.proof!.url)} className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                                                            Lihat bukti
                                                            <span className="block h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800">
                                                                <img loading="lazy" decoding="async" src={o.proof.url} alt="Bukti transfer" className="h-full w-full object-cover" />
                                                            </span>
                                                        </button>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-slate-400">Tanpa bukti</span>
                                                )}
                                            </div>
                                            {o.status === 'ditolak' && o.note && <div className="text-xs text-rose-600">{o.note}</div>}
                                            {o.status === 'dikembalikan' && o.note && <div className="whitespace-pre-line text-xs text-slate-500">{o.note}</div>}
                                            {o.status === 'menunggu_verifikasi' ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button type="button" disabled={busy === o.id} onClick={() => act(o, 'setujui')} className="h-10 rounded-full bg-emerald-600 text-sm font-semibold text-white disabled:opacity-60">
                                                        {busy === o.id ? '...' : 'Setujui'}
                                                    </button>
                                                    <button type="button" disabled={busy === o.id} onClick={() => act(o, 'tolak')} className="h-10 rounded-full border border-rose-300 text-sm font-semibold text-rose-600 disabled:opacity-60">
                                                        Tolak
                                                    </button>
                                                </div>
                                            ) : o.status === 'lunas' ? (
                                                <button type="button" disabled={busy === o.id} onClick={() => act(o, 'kembalikan')} className="h-10 w-full rounded-full border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-white/10 dark:text-slate-200">
                                                    {busy === o.id ? '...' : 'Tandai dikembalikan'}
                                                </button>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                            <table className="hidden w-full min-w-[900px] text-sm md:table">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        <th className={th}>Event</th>
                                        <th className={th}>Lembaga</th>
                                        <th className={th}>Paket</th>
                                        <th className={`${th} text-right`}>Total bayar</th>
                                        <th className={`${th} text-center`}>Bukti</th>
                                        <th className={th}>Status</th>
                                        <th className={`${th} text-right`}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {orders.map((o) => {
                                        const st = STATUS[o.status] ?? STATUS.menunggu_verifikasi;
                                        return (
                                            <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                                                <td className={td}>
                                                    <div className="font-semibold">{o.title}</div>
                                                    <div className="text-xs text-slate-500">Diajukan {o.created_at}</div>
                                                </td>
                                                <td className={td}>
                                                    <div className="font-semibold">{o.institution}</div>
                                                    <div className="break-all text-xs text-slate-500">{o.institution_email}</div>
                                                </td>
                                                <td className={td}>
                                                    <div className="font-semibold">{o.package}</div>
                                                    {o.detail && <div className="text-xs text-slate-500">{o.detail}</div>}
                                                </td>
                                                <td className={`${td} text-right`}>
                                                    <div className="font-bold text-indigo-700 dark:text-indigo-300">{rp(o.total)}</div>
                                                </td>
                                                <td className={`${td} text-center`}>
                                                    {o.proof ? (
                                                        o.proof.is_pdf ? (
                                                            <a href={o.proof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline">
                                                                <FileText className="h-4 w-4" /> PDF
                                                            </a>
                                                        ) : (
                                                            <button type="button" onClick={() => setZoom(o.proof!.url)} title="Klik untuk memperbesar"
                                                                className="mx-auto block h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-indigo-400 dark:border-white/10 dark:bg-slate-800">
                                                                <img loading="lazy" decoding="async" src={o.proof.url} alt="Bukti transfer" className="h-full w-full object-cover" />
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Tanpa bukti</span>
                                                    )}
                                                </td>
                                                <td className={td}>
                                                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${st.style}`}>{st.label}</span>
                                                    {o.status === 'ditolak' && o.note && <div className="mt-1 max-w-[200px] text-xs text-rose-600">{o.note}</div>}
                                                    {o.status === 'dikembalikan' && o.note && <div className="mt-1 max-w-[220px] whitespace-pre-line text-xs text-slate-500">{o.note}</div>}
                                                </td>
                                                <td className={`${td} text-right`}>
                                                    {o.status === 'menunggu_verifikasi' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button type="button" disabled={busy === o.id} onClick={() => act(o, 'setujui')}
                                                                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                                                                {busy === o.id ? '...' : 'Setujui'}
                                                            </button>
                                                            <button type="button" disabled={busy === o.id} onClick={() => act(o, 'tolak')}
                                                                className="rounded-lg border border-rose-300 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                                                                Tolak
                                                            </button>
                                                        </div>
                                                    ) : o.status === 'lunas' ? (
                                                        <button type="button" disabled={busy === o.id} onClick={() => act(o, 'kembalikan')}
                                                            className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
                                                            {busy === o.id ? '...' : 'Tandai dikembalikan'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination current={pg.current} last={pg.last} total={pg.total} from={pg.from} to={pg.to} unit="pembayaran" />
                </div>
            </div>

            {zoom && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setZoom(null)}>
                    <button type="button" aria-label="Tutup" className="absolute right-5 top-5 rounded-full bg-white/90 p-2 text-slate-700"><X className="h-5 w-5" /></button>
                    <img src={zoom} alt="Bukti transfer" className="max-h-[90vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </AdminLayout>
    );
}
