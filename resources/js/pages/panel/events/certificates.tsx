import PanelLayout from '@/components/panel/panel-layout';
import { router } from '@inertiajs/react';
import { Award, CheckCircle2, Clock, Search, ShieldOff, Users } from 'lucide-react';
import { useState } from 'react';

type Stats = { recipients: number; issued: number; pending: number; revoked: number; waiting: number };
type Cat = { key: string; label: string; total: number; issued: number; revoked: number; manual: boolean };
type Row = { key: string; name: string; code: string; source: string; status: string; number: string | null; issued_at: string | null };
type Hist = { action: string; at: string | null; name: string; category: string; number: string | null };
type Props = {
    stats: Stats;
    categories: Cat[];
    active: string;
    search: string;
    recipients: Row[];
    paging: { page: number; pages: number; total: number };
    history: Hist[];
};

const card = 'rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm md:rounded-3xl md:p-6 md:backdrop-blur dark:border-white/10 dark:bg-white/5';
const input =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-base outline-none md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';

const STATUS: Record<string, { text: string; cls: string }> = {
    belum: { text: 'Belum terbit', cls: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
    pending: { text: 'Diproses', cls: 'bg-amber-100 text-amber-700' },
    issued: { text: 'Terbit', cls: 'bg-emerald-100 text-emerald-700' },
    revoked: { text: 'Tidak berlaku', cls: 'bg-red-100 text-red-700' },
    failed: { text: 'Gagal', cls: 'bg-red-100 text-red-700' },
};
const ACTION: Record<string, string> = {
    issued: 'Diterbitkan',
    notified: 'Notifikasi terkirim',
    revoked: 'Dicabut',
    reissued: 'Diterbitkan ulang',
    failed: 'Gagal',
};

const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) : '-';

export default function Certificates({ stats, categories, active, search, recipients, paging, history }: Props) {
    const [q, setQ] = useState(search);

    const go = (params: Record<string, string | number>) =>
        router.get(window.location.pathname, params, { preserveState: true, preserveScroll: true, replace: true });

    const cards = [
        { label: 'Penerima', value: stats.recipients, icon: Users, cls: 'text-indigo-600' },
        { label: 'Sudah terbit', value: stats.issued, icon: CheckCircle2, cls: 'text-emerald-600' },
        { label: 'Belum terbit', value: stats.waiting + stats.pending, icon: Clock, cls: 'text-amber-600' },
        { label: 'Dicabut', value: stats.revoked, icon: ShieldOff, cls: 'text-red-600' },
    ];

    return (
        <PanelLayout title="Sertifikat Digital">
            <div className="space-y-3 pb-24 md:space-y-6 md:pb-0">
                {/* sertifikat-tahap5-tombol */}
                <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
                    {[['desain', 'Desainer'], ['terbitkan', 'Terbitkan sertifikat']].map(([path, label]) => (
                        <a
                            key={path}
                            href={`${window.location.pathname}/${path}`}
                            onClick={(e) => { e.preventDefault(); router.visit(`${window.location.pathname}/${path}`); }}
                            className="flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 md:h-auto md:rounded-xl md:py-2 dark:border-white/10 dark:bg-white/5"
                        >
                            {label}
                        </a>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
                    {cards.map((c) => (
                        <div key={c.label} className={card}>
                            <c.icon size={20} className={c.cls} />
                            <p className="mt-2 text-xl font-semibold tabular-nums md:mt-3 md:text-3xl md:font-extrabold">{c.value}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{c.label}</p>
                        </div>
                    ))}
                </div>

                <section className={card}>
                    <div className="flex items-center gap-2">
                        <Award size={18} className="text-violet-600" />
                        <h2 className="text-[17px] font-semibold md:text-lg md:font-bold">Penerima</h2>
                    </div>

                    <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:mx-0 md:mt-4 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
                        {categories.map((c) => (
                            <button
                                key={c.key}
                                type="button"
                                onClick={() => go({ kategori: c.key })}
                                className={`h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition md:h-auto md:py-1.5 ${
                                    active === c.key
                                        ? 'border-transparent bg-indigo-600 text-white md:bg-gradient-to-r md:from-blue-600 md:to-violet-600'
                                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5'
                                }`}
                            >
                                {c.label} <span className="opacity-70">· {c.issued}/{c.total}</span>
                            </button>
                        ))}
                    </div>

                    <form
                        className="relative mt-4 max-w-sm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            go({ kategori: active, cari: q });
                        }}
                    >
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau kode…" />
                    </form>

                    {recipients.length === 0 ? (
                        <p className="mt-6 text-sm text-slate-500">
                            {categories.find((c) => c.key === active)?.manual
                                ? 'Kategori ini diisi manual oleh penyelenggara. Belum ada penerima.'
                                : 'Belum ada penerima di kategori ini.'}
                        </p>
                    ) : (
                        <>
                        <>
                        <div className="mt-3 space-y-2 md:hidden">
                            {recipients.map((r) => {
                                const st = STATUS[r.status] ?? STATUS.belum;
                                return (
                                    <div key={'m-' + r.key} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold">{r.name}</div>
                                                <div className="truncate text-[11px] text-slate-600 dark:text-slate-300">{r.code} · {r.source}</div>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.text}</span>
                                        </div>
                                        <p className="mt-1.5 truncate text-[11px] text-slate-600 dark:text-slate-300">Nomor sertifikat: {r.number ?? '-'}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="py-2 pr-3">Nama</th>
                                        <th className="py-2 pr-3">Kode</th>
                                        <th className="py-2 pr-3">Sumber</th>
                                        <th className="py-2 pr-3">Nomor sertifikat</th>
                                        <th className="py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {recipients.map((r) => {
                                        const s = STATUS[r.status] ?? STATUS.belum;
                                        return (
                                            <tr key={r.key}>
                                                <td className="py-2.5 pr-3 font-semibold">{r.name}</td>
                                                <td className="py-2.5 pr-3 text-slate-500">{r.code}</td>
                                                <td className="py-2.5 pr-3 text-slate-500">{r.source}</td>
                                                <td className="py-2.5 pr-3 text-slate-500">{r.number ?? '-'}</td>
                                                <td className="py-2.5">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.text}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </>
                        </>
                    )}

                    {paging.pages > 1 && (
                        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                            <span>
                                Halaman {paging.page} dari {paging.pages} · {paging.total} penerima
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={paging.page <= 1}
                                    onClick={() => go({ kategori: active, cari: search, halaman: paging.page - 1 })}
                                    className="h-10 flex-1 rounded-full border border-slate-200 px-4 font-semibold disabled:opacity-40 md:h-auto md:flex-none md:py-1.5 dark:border-white/10"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    type="button"
                                    disabled={paging.page >= paging.pages}
                                    onClick={() => go({ kategori: active, cari: search, halaman: paging.page + 1 })}
                                    className="h-10 flex-1 rounded-full border border-slate-200 px-4 font-semibold disabled:opacity-40 md:h-auto md:flex-none md:py-1.5 dark:border-white/10"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section className={card}>
                    <h2 className="text-[17px] font-semibold md:text-lg md:font-bold">Riwayat</h2>
                    {history.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500">Belum ada aktivitas penerbitan.</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-white/10">
                            {history.map((h, i) => (
                                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                                    <span>
                                        <b>{ACTION[h.action] ?? h.action}</b> · {h.name} <span className="text-slate-400">({h.category})</span>
                                        {h.number && <span className="text-slate-400"> · {h.number}</span>}
                                    </span>
                                    <span className="text-xs text-slate-500">{fmt(h.at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <p className="text-sm text-slate-500">
                    Tahap berikutnya menambahkan desain sertifikat dan tombol penerbitan. Halaman ini baru menampilkan data.
                </p>
            </div>
        </PanelLayout>
    );
}
