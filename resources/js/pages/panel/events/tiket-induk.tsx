import PanelLayout from '@/components/panel/panel-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { Banknote, ChevronRight, Layers, Ticket, TicketCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Sub = { id: number; title: string; method: string | null };
type Row = { sub_id: number; sub: string; name: string; price: number; quota: number; sold: number; revenue: number; from: string | null; until: string | null; status: string };

const box = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const STATUS: Record<string, { label: string; style: string }> = {
    dibuka: { label: 'Dibuka', style: 'bg-emerald-100 text-emerald-800' },
    belum: { label: 'Belum dibuka', style: 'bg-amber-100 text-amber-800' },
    tutup: { label: 'Ditutup', style: 'bg-slate-200 text-slate-700' },
    habis: { label: 'Habis', style: 'bg-rose-100 text-rose-800' },
};

export default function TiketInduk({ subs, rows }: { subs: Sub[]; rows: Row[] }) {
    const [sub, setSub] = useState('');
    const parentId = usePage().url.match(/\/event\/(\d+)\//)?.[1];
    const [sale, setSale] = useState<{ count: number; open: boolean; some_open: boolean } | null>(null);
    const [busy, setBusy] = useState(false);
    const loadSale = () => {
        if (!parentId) return;
        fetch(`/panel/event/${parentId}/tiket/rangkaian`, { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(setSale)
            .catch(() => setSale(null));
    };
    useEffect(loadSale, [parentId]);
    const flip = (open: boolean) => {
        if (!parentId || busy) return;
        setBusy(true);
        router.post(`/panel/event/${parentId}/tiket/rangkaian`, { open }, { preserveScroll: true, onFinish: () => { setBusy(false); loadSale(); router.reload(); } });
    };
    const list = useMemo(() => rows.filter((r) => !sub || String(r.sub_id) === sub), [rows, sub]);
    const countBy = (id: number) => rows.filter((r) => r.sub_id === id).length;

    const stats = [
        { label: 'Jenis tiket', value: String(list.length), Icon: Ticket, tone: 'bg-indigo-100 text-indigo-600' },
        { label: 'Total kuota', value: String(list.reduce((a, r) => a + r.quota, 0)), Icon: Users, tone: 'bg-violet-100 text-violet-600' },
        { label: 'Terjual', value: String(list.reduce((a, r) => a + r.sold, 0)), Icon: TicketCheck, tone: 'bg-emerald-100 text-emerald-600' },
        { label: 'Pendapatan', value: rp(list.reduce((a, r) => a + r.revenue, 0)), Icon: Banknote, tone: 'bg-amber-100 text-amber-600' },
    ];
    const chip = (on: boolean) =>
        `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`;

    return (
        <PanelLayout title="Tiket">
            <div className="space-y-5">
                <div className={`${box} flex items-start gap-5 p-6`}>
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                        <Layers className="size-6" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold">Tiket gabungan</h2>
                        <p className="mt-1 text-sm text-slate-500">Ringkasan tiket dari semua sub-event. Halaman ini hanya untuk melihat; harga, kuota, dan masa jual diatur lewat tombol Kelola di tiap sub-event.</p>
                    </div>
                </div>

                {sale && sale.count > 0 && (
                    <div className={`${box} flex flex-wrap items-center justify-between gap-4 p-5`}>
                        <div>
                            <h3 className="text-base font-extrabold">Penjualan seluruh rangkaian</h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {sale.open ? 'Semua kegiatan sedang dijual.' : sale.some_open ? 'Sebagian kegiatan sedang dijual.' : 'Penjualan ditutup.'} Berlaku untuk {sale.count} kegiatan yang memakai tiket.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" disabled={busy || sale.open} onClick={() => flip(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Buka semua</button>
                            <button type="button" disabled={busy || (!sale.open && !sale.some_open)} onClick={() => flip(false)} className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Tutup semua</button>
                        </div>
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map(({ label, value, Icon, tone }) => (
                        <div key={label} className={`${box} flex items-center gap-4 p-4`}>
                            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></div>
                            <div className="min-w-0">
                                <div className="truncate text-2xl font-extrabold leading-none">{value}</div>
                                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`${box} overflow-hidden`}>
                    <div className="space-y-4 p-5">
                        <h3 className="text-lg font-extrabold">Daftar tiket <span className="text-sm font-semibold text-slate-500">({list.length})</span></h3>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setSub('')} className={chip(sub === '')}>Semua sub-event · {rows.length}</button>
                            {subs.map((c) => (
                                <button key={c.id} type="button" onClick={() => setSub(String(c.id))} className={chip(sub === String(c.id))}>
                                    {c.title} · {countBy(c.id)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {list.length === 0 ? (
                        <p className="border-t border-slate-200 px-5 py-12 text-center text-sm font-semibold text-slate-500 dark:border-white/10">
                            {sub && subs.find((c) => String(c.id) === sub)?.method !== 'ticket' ? 'Sub-event ini memakai formulir, bukan tiket.' : 'Belum ada tiket.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="px-5 py-3">Sub-event</th>
                                        <th className="px-3 py-3">Tiket</th>
                                        <th className="px-3 py-3">Harga</th>
                                        <th className="px-3 py-3">Masa jual</th>
                                        <th className="px-3 py-3">Terjual / kuota</th>
                                        <th className="px-3 py-3">Pendapatan</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {list.map((r, i) => {
                                        const st = STATUS[r.status] ?? STATUS.dibuka;
                                        const pct = r.quota > 0 ? Math.min(100, Math.round((r.sold / r.quota) * 100)) : 0;
                                        return (
                                            <tr key={`${r.sub_id}-${r.name}-${i}`} className="align-middle">
                                                <td className="px-5 py-3 font-semibold">{r.sub}</td>
                                                <td className="px-3 py-3"><span className="whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{r.name}</span></td>
                                                <td className="px-3 py-3 font-extrabold">{r.price > 0 ? rp(r.price) : 'Gratis'}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{r.from ?? '-'} s/d {r.until ?? '-'}</td>
                                                <td className="px-3 py-3">
                                                    <div className="text-xs font-bold">{r.sold} / {r.quota}</div>
                                                    <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" style={{ width: `${pct}%` }} /></div>
                                                </td>
                                                <td className="px-3 py-3 font-semibold">{rp(r.revenue)}</td>
                                                <td className="px-3 py-3"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${st.style}`}>{st.label}</span></td>
                                                <td className="px-5 py-3 text-right">
                                                    <Link href={`/panel/event/${r.sub_id}/tiket`} className="inline-flex items-center gap-1 rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-800">Kelola<ChevronRight className="size-3.5" /></Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </PanelLayout>
    );
}

// patch-248
