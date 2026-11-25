import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type Row = { order: string; type: string; buyer: string; email: string; status: string; name: string; code: string | null; reg_id: string | null; contact?: string | null; support?: string | null };

type Props = {
    eventId: number;
    summary: { orders: number; sold: number; pending: number };
    types: string[];
    statuses: string[];
    rows: Row[];
    list: Row[];
    q: string; setQ: (v: string) => void;
    type: string; setType: (v: string) => void;
    status: string; setStatus: (v: string) => void;
};

const ST: Record<string, { label: string; cls: string }> = {
    lunas: { label: 'Terdaftar', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
    menunggu: { label: 'Menunggu verifikasi', cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-200' },
    menunggu_verifikasi: { label: 'Menunggu verifikasi', cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-200' },
    batal: { label: 'Dibatalkan', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
    dibatalkan: { label: 'Dibatalkan', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
    kedaluwarsa: { label: 'Kedaluwarsa', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
    ditolak: { label: 'Ditolak', cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
};

const sel = 'h-10 min-w-0 rounded-xl px-3 text-base ' + FIELD;

/** Registrasi HP (ringkas): satu kartu ringkasan + cari + filter, daftar rapat. */
export default function RegistrasiMobile(p: Props) {
    const stats: [string, number][] = [['Pesanan', p.summary.orders], ['Terjual', p.summary.sold], ['Menunggu', p.summary.pending]];

    return (
        <div className="space-y-3 pb-24">
            <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                <div className="flex items-center gap-3">
                    <div className="grid flex-1 grid-cols-3 divide-x divide-slate-900/[0.07] dark:divide-white/10">
                        {stats.map(([l, n]) => (
                            <div key={l} className="text-center">
                                <p className="text-base leading-tight font-semibold">{n}</p>
                                <p className={'text-[11px] ' + MUTED}>{l}</p>
                            </div>
                        ))}
                    </div>
                    <Link href={'/panel/event/' + p.eventId + '/tiket'} className={'flex h-10 shrink-0 items-center rounded-full bg-indigo-600 px-3.5 text-xs font-medium text-white dark:bg-indigo-500 ' + PRESS}>Atur tiket</Link>
                </div>

                <label className={'flex h-10 items-center gap-2 rounded-xl px-3 ' + FIELD}>
                    <Search className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                    <input type="search" value={p.q} onChange={(e) => p.setQ(e.target.value)} placeholder="Cari ID, nama, pembeli, kode" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" />
                </label>

                <div className="grid grid-cols-2 gap-2">
                    <select value={p.type} onChange={(e) => p.setType(e.target.value)} className={sel}>
                        <option value="">Semua jenis</option>
                        {p.types.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={p.status} onChange={(e) => p.setStatus(e.target.value)} className={sel}>
                        <option value="">Semua status</option>
                        {p.statuses.map((s) => <option key={s} value={s}>{ST[s]?.label ?? s}</option>)}
                    </select>
                </div>
            </section>

            <section>
                <p className={'mb-1 px-1 text-[11px] ' + MUTED}>Daftar peserta ({p.list.length})</p>
                {p.list.length === 0 ? (
                    <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>{p.rows.length === 0 ? 'Belum ada pembelian tiket.' : 'Tidak ada data yang cocok.'}</div>
                ) : (
                    <div className={GROUP}>
                        {p.list.map((r, i) => {
                            const st = ST[r.status] ?? { label: r.status, cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' };
                            const extra = [r.contact, r.support ? 'Mendukung: ' + r.support : null].filter(Boolean).join(' · ');
                            return (
                                <div key={r.order + '-' + i} className="px-3 py-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm leading-tight font-semibold">{r.name}</span>
                                            <span className={'block truncate text-[11px] leading-snug ' + MUTED}>{[r.reg_id, r.code ?? 'Pesanan ' + r.order, r.type].filter(Boolean).join(' · ')}</span>
                                        </span>
                                        <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ' + st.cls}>{st.label}</span>
                                    </div>
                                    <p className={'truncate text-[11px] leading-snug ' + MUTED}>{r.buyer} · {r.email}</p>
                                    {extra && <p className="truncate text-[11px] leading-snug text-indigo-700 dark:text-indigo-300">{extra}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
