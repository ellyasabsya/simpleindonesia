import PanelLayout from '@/components/panel/panel-layout';
import RegistrasiMobile from '@/components/mobile/pages/registrasi-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Receipt, Search, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';

type Row = { order: string; type: string; buyer: string; email: string; status: string; name: string; code: string | null; reg_id: string | null; contact?: string | null; support?: string | null };
type Props = {
    eventId: number;
    summary: { orders: number; sold: number; pending: number };
    types: string[];
    rows: Row[];
};

const STATUS: Record<string, { label: string; style: string }> = {
    lunas: { label: 'Terdaftar', style: 'bg-emerald-100 text-emerald-800' },
    menunggu: { label: 'Menunggu verifikasi', style: 'bg-amber-100 text-amber-800' },
    menunggu_verifikasi: { label: 'Menunggu verifikasi', style: 'bg-amber-100 text-amber-800' },
    batal: { label: 'Dibatalkan', style: 'bg-slate-200 text-slate-700' },
    dibatalkan: { label: 'Dibatalkan', style: 'bg-slate-200 text-slate-700' },
    kedaluwarsa: { label: 'Kedaluwarsa', style: 'bg-slate-200 text-slate-700' },
    ditolak: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800' },
};
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';

const th = 'border-b border-r border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700 last:border-r-0 dark:border-white/10 dark:text-slate-200';
const td = 'border-b border-r border-slate-100 px-3 py-2.5 align-middle last:border-r-0 dark:border-white/10';

const pgIcon = 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10';
const pgNum = (on: boolean) => `inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-extrabold ${on ? 'bg-indigo-700 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'}`;
const PER_PAGE = [10, 15, 25, 50];

export default function Registrasi({ eventId, summary, types, rows }: Props) {
    const [q, setQ] = useState('');
    const [type, setType] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [status, setStatus] = useState('');
    const phone = usePhone();

    const list = useMemo(() => {
        const k = q.trim().toLowerCase();
        return rows.filter((r) =>
            (!type || r.type === type) &&
            (!status || r.status === status) &&
            (!k || [r.reg_id ?? '', r.name, r.buyer, r.email, r.order, r.code ?? ''].some((v) => v.toLowerCase().includes(k))),
        );
    }, [rows, q, type, status]);

    const statuses = Array.from(new Set(rows.map((r) => r.status)));

    const pages = Math.max(1, Math.ceil(list.length / perPage));
    const cur = Math.min(page, pages);
    const view = list.slice((cur - 1) * perPage, cur * perPage);

    return (
        <PanelLayout title="Registrasi">
            {phone && (
                <RegistrasiMobile
                    eventId={eventId} summary={summary} types={types} statuses={statuses} rows={rows} list={list}
                    q={q} setQ={setQ} type={type} setType={setType} status={status} setStatus={setStatus}
                />
            )}
            <div className={phone ? 'hidden' : 'space-y-5'}>
                <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white"><Ticket className="h-6 w-6" /></span>
                        <div>
                            <h2 className="text-xl font-bold">Pendaftaran lewat pembelian tiket</h2>
                            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Pada paket ini peserta tidak mengisi formulir. Mereka terdaftar saat membeli tiket. Setiap pemegang tiket di bawah adalah peserta event.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/panel/event/${eventId}/tiket`} className="rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">Atur jenis & harga tiket</Link>
                    </div>
                    <div className="mt-6 grid w-full basis-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                        {[
                            { l: 'Pesanan', v: summary.orders, sub: 'Total pesanan tiket', Icon: Receipt, soft: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
                            { l: 'Tiket terjual', v: summary.sold, sub: 'Pembayaran lunas', Icon: Ticket, soft: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
                            { l: 'Menunggu verifikasi', v: summary.pending, sub: 'Belum disetujui admin', Icon: Clock, soft: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-300' },
                        ].map((x) => (
                            <div key={x.l} title={x.sub} className={`group relative min-w-0 overflow-hidden rounded-2xl px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${x.soft}`}>
                                <x.Icon className={`absolute -bottom-4 -right-3 h-24 w-24 opacity-10 transition group-hover:scale-110 ${x.text}`} />
                                <div className="relative">
                                    <div className={`break-words text-2xl font-extrabold sm:text-3xl ${x.text}`}>{x.v}</div>
                                    <div className={`mt-1.5 text-sm font-bold ${x.text}`}>{x.l}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                
                <div className={`${card} p-4 sm:p-6`}>
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <h3 className="mr-auto text-lg font-bold">Daftar peserta <span className="text-sm font-semibold text-slate-500">({list.length})</span></h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari ID, nama, pembeli, kode" className={`${field} w-64 pl-9`} />
                        </div>
                        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={field}>
                            <option value="">Semua jenis tiket</option>
                            {types.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={field}>
                            <option value="">Semua status</option>
                            {statuses.map((s) => <option key={s} value={s}>{STATUS[s]?.label ?? s}</option>)}
                        </select>
                    </div>
                    {list.length === 0 ? (
                        <p className="border-t border-slate-200 px-5 py-12 text-center text-sm font-semibold text-slate-500 dark:border-white/10">{rows.length === 0 ? 'Belum ada pembelian tiket.' : 'Tidak ada data yang cocok.'}</p>
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        <th className={`${th} w-[210px]`}>ID registrasi</th>
                                        <th className={th}>Peserta</th>
                                        <th className={th}>Jenis</th>
                                        <th className={th}>Pembeli</th>
                                        <th className={th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {view.map((r, i) => {
                                        const st = STATUS[r.status] ?? { label: r.status, style: 'bg-slate-200 text-slate-700' };
                                        return (
                                            <tr key={`${r.order}-${i}`} className="align-middle transition-colors hover:bg-indigo-50/60 dark:hover:bg-white/5">
                                                <td className={`${td} font-mono text-[13px] font-bold text-indigo-700 dark:text-indigo-300`}>{r.reg_id ?? <span className="font-sans font-semibold text-slate-400">-</span>}</td>
                                                <td className={`${td}`}>
                                                    <div className="font-extrabold">{r.name}</div>
                                                    <div className="text-xs text-slate-500">{r.code ?? `Pesanan ${r.order}`}</div>
                                                    {r.contact && <div className="text-xs text-slate-500">{r.contact}</div>}
                                                    {r.support && <div className="text-xs font-semibold text-indigo-700">Mendukung: {r.support}</div>}
                                                </td>
                                                <td className={`${td}`}><span className="whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{r.type}</span></td>
                                                <td className={`${td}`}><div className="font-semibold">{r.buyer}</div><div className="text-xs text-slate-500">{r.email}</div></td>
                                                <td className={`${td}`}><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${st.style}`}>{st.label}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {list.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-white/10">
                            <span className="text-xs font-bold text-slate-500">{list.length} total</span>
                            <div className="flex flex-wrap items-center gap-1">
                                <button type="button" className={pgIcon} disabled={cur <= 1} onClick={() => setPage(1)} aria-label="Halaman pertama"><ChevronsLeft className="h-4 w-4" /></button>
                                <button type="button" className={pgIcon} disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
                                {Array.from({ length: Math.min(5, pages) }, (_, k) => Math.max(1, Math.min(cur - 2, pages - 4)) + k).map((n) => (
                                    <button key={n} type="button" onClick={() => setPage(n)} className={pgNum(n === cur)} aria-current={n === cur ? 'page' : undefined}>{n}</button>
                                ))}
                                <button type="button" className={pgIcon} disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></button>
                                <button type="button" className={pgIcon} disabled={cur >= pages} onClick={() => setPage(pages)} aria-label="Halaman terakhir"><ChevronsRight className="h-4 w-4" /></button>
                                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className={`${field} ml-2 py-1.5`} aria-label="Baris per halaman">
                                    {PER_PAGE.map((n) => <option key={n} value={n}>{n} per halaman</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </PanelLayout>
    );
}
