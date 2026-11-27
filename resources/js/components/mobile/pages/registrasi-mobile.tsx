import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

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

const ST: Record<string, { label: string; dot: string; text: string }> = {
    lunas: { label: 'Terdaftar', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
    menunggu: { label: 'Menunggu verifikasi', dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-200' },
    menunggu_verifikasi: { label: 'Menunggu verifikasi', dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-200' },
    batal: { label: 'Dibatalkan', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300' },
    dibatalkan: { label: 'Dibatalkan', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300' },
    kedaluwarsa: { label: 'Kedaluwarsa', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300' },
    ditolak: { label: 'Ditolak', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
};

const PILL: Record<string, string> = {
    'bg-emerald-500': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    'bg-amber-500': 'bg-amber-500/10 text-amber-800 dark:text-amber-200',
    'bg-rose-500': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    'bg-slate-400': 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

const PER = 10;
const sel = 'h-10 min-w-0 rounded-xl px-3 text-base ' + FIELD;
const pgBtn = 'inline-flex size-8 items-center justify-center rounded-lg text-slate-600 disabled:opacity-30 dark:text-slate-300';
const pgNum = (on: boolean) => 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold ' + (on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'text-slate-700 dark:text-slate-200');

/** Registrasi HP: kartu ringkasan + cari + filter, daftar minimalis dengan rincian yang bisa dibuka. */
export default function RegistrasiMobile(p: Props) {
    const stats: [string, number][] = [['Pesanan', p.summary.orders], ['Terjual', p.summary.sold], ['Menunggu', p.summary.pending]];
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState<string | null>(null);

    useEffect(() => { setPage(1); setOpen(null); }, [p.q, p.type, p.status]);

    const pages = Math.max(1, Math.ceil(p.list.length / PER));
    const cur = Math.min(page, pages);
    const base = (cur - 1) * PER;
    const view = p.list.slice(base, base + PER);
    const nums = Array.from({ length: Math.min(3, pages) }, (_, k) => Math.max(1, Math.min(cur - 1, pages - 2)) + k);

    return (
        <div className="space-y-3 pb-28">
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
                    <>
                        <div className="space-y-3">
                            {view.map((r, i) => {
                                const key = r.order + '-' + (base + i);
                                const st = ST[r.status] ?? { label: r.status, dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300' };
                                const isOpen = open === key;
                                const detail: [string, string | null | undefined][] = [
                                    ['Kode peserta', r.code ?? 'Pesanan ' + r.order],
                                    ['Email', r.email],
                                    ['Kontak', r.contact],
                                    ['Mendukung', r.support],
                                ];
                                return (
                                    <div key={key} className={'rounded-2xl p-3.5 ' + CARD}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm leading-tight font-semibold">{r.name}</p>
                                                <p className="mt-0.5 truncate font-mono text-[11px] text-indigo-600 dark:text-indigo-300">{r.reg_id ?? '-'}</p>
                                            </div>
                                            <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ' + (PILL[st.dot] ?? PILL['bg-slate-400'])}>{st.label}</span>
                                        </div>
                                        <p className={'mt-1.5 truncate text-xs ' + MUTED}>{r.type} · {r.buyer}</p>
                                        <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)} className="mt-2 flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                                            Rincian
                                            <ChevronDown className={'size-3.5 transition-transform ' + (isOpen ? 'rotate-180' : '')} />
                                        </button>
                                        {isOpen && (
                                            <dl className="mt-2 space-y-1.5 border-t border-slate-900/[0.07] pt-2 text-xs dark:border-white/10">
                                                {detail.filter(([, v]) => v).map(([l, v]) => (
                                                    <div key={l} className="grid grid-cols-[88px_1fr] gap-2">
                                                        <dt className={MUTED}>{l}</dt>
                                                        <dd className={'min-w-0 break-all ' + (l === 'Kode peserta' ? 'font-mono text-[11px]' : '')}>{v}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-3 flex items-center justify-between px-1">
                            <span className={'text-[11px] ' + MUTED}>{p.list.length} total</span>
                            <div className="flex items-center gap-0.5">
                                <button type="button" aria-label="Sebelumnya" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className={pgBtn}><ChevronLeft className="size-4" /></button>
                                {nums.map((n) => <button key={n} type="button" onClick={() => setPage(n)} aria-current={n === cur ? 'page' : undefined} className={pgNum(n === cur)}>{n}</button>)}
                                <button type="button" aria-label="Berikutnya" disabled={cur >= pages} onClick={() => setPage(cur + 1)} className={pgBtn}><ChevronRight className="size-4" /></button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
