import { Link } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight, Download, ScanLine, Search, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type Field = { key: string; label: string; archived?: boolean };
type Sub = { id: number; title: string; ticket: boolean; fee: number; published: boolean; isTeam: boolean; quota: number | null; count: number; summary: { orders: number; sold: number; pending: number } };
type Row = {
    kind: 'form' | 'tiket'; id: number | null; sub_id: number; sub: string; reg_id: string | null; name: string; email: string; phone: string | null;
    school: string | null; category: string | null; status: string; amount: number; proof: boolean; note: string | null; at: string; followup_done: boolean;
    teams: { name: string; category: string | null }[]; answers: Record<string, unknown>;
    order: string | null; buyer: string | null; type: string | null; code: string | null; contact: string | null; support: string | null;
};

type Props = {
    mode: 'all' | 'ticket' | 'form';
    cur: Sub | null;
    subs: Sub[];
    rows: Row[];
    scoped: Row[];
    list: Row[];
    view: Row[];
    sub: string; pickSub: (v: string) => void;
    tab: 'data' | 'form'; setTab: (t: 'data' | 'form') => void;
    q: string; setQ: (v: string) => void;
    st: string; setSt: (v: string) => void;
    tp: string; setTp: (v: string) => void;
    catSel: string; setCat: (v: string) => void;
    cats: { name: string; n: number }[];
    statuses: string[];
    ticketTypes: string[];
    pg: number; pages: number; setPage: (n: number) => void;
    openAll: number; openScoped: number; menunggu: number; terdaftar: number;
    unpublished: Sub[];
    shown: Field[];
    hasAfter: boolean;
    catLabel: (r: Row) => string;
    answer: (r: Row, k: string) => ReactNode;
    review: (r: Row, s: 'terdaftar' | 'ditolak') => void;
    onDelete: (r: Row) => void;
    scanId: string;
};

const ST: Record<string, { label: string; cls: string }> = {
    menunggu: { label: 'Menunggu verifikasi', cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-200' },
    terdaftar: { label: 'Terdaftar', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
    ditolak: { label: 'Ditolak', cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
    batal: { label: 'Dibatalkan', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
};
const rupiah = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const sel = 'h-10 min-w-0 rounded-xl px-3 text-base ' + FIELD;
const tabCls = (on: boolean) =>
    'inline-flex h-10 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium ' + PRESS + ' ' +
    (on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : CARD + ' text-slate-800 dark:text-slate-100');

/** Registrasi semua sub-event HP (ringkas): satu kartu header + ringkasan + filter, daftar rapat. */
export default function RegistrasiIndukMobile(p: Props) {
    const { mode, cur } = p;
    const title = mode === 'all' ? 'Registrasi semua sub-event' : mode === 'ticket' ? 'Tiket · ' + cur?.title : 'Transfer manual · ' + cur?.title;
    const desc =
        mode === 'all' ? 'Pendaftar dari seluruh sub-event. Pilih satu sub-event untuk mengelolanya sesuai metode pendaftarannya: tiket atau transfer manual.'
        : mode === 'ticket' ? 'Pada sub-event ini peserta tidak mengisi formulir. Mereka terdaftar saat membeli tiket, dan setiap pemegang tiket di bawah adalah peserta.'
        : cur && cur.fee > 0 ? 'Biaya pendaftaran ' + rupiah(cur.fee) + '. Peserta mengisi formulir dan mengunggah bukti transfer, lalu panitia memverifikasi.'
        : 'Peserta mengisi formulir pendaftaran, lalu panitia memverifikasi.';

    const stats: [string, number][] =
        mode === 'all' ? [['Pendaftar', p.openScoped], ['Menunggu', p.menunggu], ['Terdaftar', p.terdaftar]]
        : mode === 'ticket' && cur ? [['Pesanan', cur.summary.orders], ['Terjual', cur.summary.sold], ['Menunggu', cur.summary.pending]]
        : cur ? [[cur.isTeam ? 'Tim' : 'Pendaftar', cur.count], ['Menunggu', p.menunggu], ['Disetujui', p.terdaftar]] : [];

    const showList = mode !== 'form' || p.tab === 'data';

    return (
        <div className="space-y-3 pb-24">
            <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-base font-semibold">{title}</h2>
                    {mode === 'ticket' && cur && (
                        <Link href={'/panel/event/' + cur.id + '/tiket'} className={'flex h-10 shrink-0 items-center rounded-full bg-indigo-600 px-3 text-xs font-medium text-white dark:bg-indigo-500 ' + PRESS}>Atur tiket</Link>
                    )}
                </div>
                <details>
                    <summary className="cursor-pointer text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Keterangan</summary>
                    <p className={'mt-1 text-xs leading-snug ' + MUTED}>{desc}</p>
                </details>
                {mode === 'form' && cur && !cur.published && <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Sub-event belum terbit, jadi form publik belum bisa dibuka.</p>}
                {mode === 'all' && p.unpublished.length > 0 && <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Belum terbit: {p.unpublished.map((s) => s.title).join(', ')}.</p>}

                <div className="grid grid-cols-3 divide-x divide-slate-900/[0.07] dark:divide-white/10">
                    {stats.map(([l, n]) => (
                        <div key={l} className="text-center">
                            <p className="text-base leading-tight font-semibold">{n}</p>
                            <p className={'text-[11px] ' + MUTED}>{l}</p>
                        </div>
                    ))}
                </div>

                {mode === 'form' && (
                    <div className="flex gap-1.5">
                        <button type="button" onClick={() => p.setTab('data')} className={tabCls(p.tab === 'data')}>Pendaftar ({p.scoped.length})</button>
                        <button type="button" onClick={() => p.setTab('form')} className={tabCls(p.tab === 'form')}>Susun form</button>
                    </div>
                )}

                {showList && (
                    <>
                        <label className={'flex h-10 items-center gap-2 rounded-xl px-3 ' + FIELD}>
                            <Search className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                            <input type="search" value={p.q} onChange={(e) => p.setQ(e.target.value)} placeholder={mode === 'ticket' ? 'Cari ID, nama, pembeli, kode' : 'Cari ID, nama, sekolah, sub-event'} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <select value={p.sub} onChange={(e) => p.pickSub(e.target.value)} className={sel}>
                                <option value="">Semua sub-event · {p.openAll}</option>
                                {p.subs.map((c) => <option key={c.id} value={String(c.id)}>{c.title} · {c.count}</option>)}
                            </select>
                            <select value={p.st} onChange={(e) => p.setSt(e.target.value)} className={sel}>
                                <option value="">Semua status</option>
                                {p.statuses.map((s) => <option key={s} value={s}>{ST[s]?.label ?? s}</option>)}
                            </select>
                            {mode === 'ticket' && (
                                <select value={p.tp} onChange={(e) => p.setTp(e.target.value)} className={sel}>
                                    <option value="">Semua jenis tiket</option>
                                    {p.ticketTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}
                            {p.cats.length > 1 && (
                                <select value={p.catSel} onChange={(e) => p.setCat(e.target.value)} className={sel}>
                                    <option value="">Semua kategori · {p.scoped.length}</option>
                                    {p.cats.map((c) => <option key={c.name} value={c.name}>{c.name} · {c.n}</option>)}
                                </select>
                            )}
                            {mode === 'form' && cur && (
                                <a href={'/panel/event/' + cur.id + '/registrasi/export'} className={'flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-sm font-medium text-white dark:bg-indigo-500 ' + PRESS}><Download className="size-4" /> Ekspor CSV</a>
                            )}
                            <a href={'/panel/event/' + p.scanId + '/checkin'} className={'col-span-full flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-medium ' + FIELD + ' ' + PRESS}><ScanLine className="size-4" /> Buka scanner</a>
                        </div>
                    </>
                )}
            </section>

            {showList && (
                <section>
                    <p className={'mb-1 px-1 text-[11px] ' + MUTED}>Daftar peserta ({p.list.length})</p>
                    {p.view.length === 0 ? (
                        <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>
                            {p.rows.length === 0 ? 'Belum ada pendaftar di sub-event mana pun.' : p.scoped.length === 0 ? (mode === 'ticket' ? 'Belum ada pembelian tiket.' : 'Belum ada pendaftar.') : 'Tidak ada data yang cocok.'}
                        </div>
                    ) : (
                        <div className={GROUP}>
                            {p.view.map((r, i) => {
                                const s = ST[r.status] ?? { label: r.status || '-', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' };
                                const badge = <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ' + s.cls}>{s.label}</span>;

                                if (mode === 'all') {
                                    return (
                                        <div key={r.sub_id + '-' + r.kind + '-' + (r.id ?? r.reg_id ?? i) + '-' + i} className="flex items-center justify-between gap-2 px-3 py-2">
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm leading-tight font-semibold">{r.name}</span>
                                                <span className={'block truncate text-[11px] leading-snug ' + MUTED}>
                                                    {[r.reg_id, r.sub, r.category ? p.catLabel(r) : r.teams.length > 0 ? r.teams.length + ' tim' : null].filter(Boolean).join(' · ')}
                                                </span>
                                            </span>
                                            {badge}
                                        </div>
                                    );
                                }

                                if (mode === 'ticket') {
                                    const extra = [r.contact, r.support ? 'Mendukung: ' + r.support : null].filter(Boolean).join(' · ');
                                    return (
                                        <div key={r.order + '-' + i} className="px-3 py-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm leading-tight font-semibold">{r.name}</span>
                                                    <span className={'block truncate text-[11px] leading-snug ' + MUTED}>{[r.reg_id, r.code ?? 'Pesanan ' + r.order, r.type].filter(Boolean).join(' · ')}</span>
                                                </span>
                                                {badge}
                                            </div>
                                            <p className={'truncate text-[11px] leading-snug ' + MUTED}>{r.buyer} · {r.email}</p>
                                            {extra && <p className="truncate text-[11px] leading-snug text-indigo-700 dark:text-indigo-300">{extra}</p>}
                                        </div>
                                    );
                                }

                                const f = cur!;
                                const who = f.isTeam ? r.teams.map((t) => t.name + (t.category ? ' (' + t.category + ')' : '')).join(', ') : r.category ?? '';
                                const answers = p.shown.filter((x) => r.answers[x.key] != null && r.answers[x.key] !== '');
                                return (
                                    <div key={r.id} className="space-y-0.5 px-3 py-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm leading-tight font-semibold">{r.name}</span>
                                                <span className={'block truncate text-[11px] leading-snug ' + MUTED}>{[r.email, r.phone].filter(Boolean).join(' · ')}</span>
                                            </span>
                                            {badge}
                                        </div>
                                        <p className={'truncate text-[11px] leading-snug ' + MUTED}>{[r.school, who].filter(Boolean).join(' · ')}</p>
                                        <p className={'flex flex-wrap items-center gap-x-2 text-[11px] leading-snug ' + MUTED}>
                                            {f.fee > 0 && <span>{rupiah(r.amount)}</span>}
                                            {f.fee > 0 && (r.proof
                                                ? <a href={'/panel/event/' + r.sub_id + '/registrasi/bukti/' + r.id} target="_blank" rel="noreferrer" className="font-medium text-indigo-700 underline dark:text-indigo-300">Bukti</a>
                                                : <span>Tanpa bukti</span>)}
                                            <span>{r.at}</span>
                                        </p>
                                        {r.status === 'ditolak' && r.note && <p className={'text-[11px] ' + MUTED}>Alasan: {r.note}</p>}
                                        {r.status === 'terdaftar' && !f.isTeam && p.hasAfter && <p className={'text-[11px] ' + MUTED}>{r.followup_done ? 'Data lengkap' : 'Menunggu data lanjutan'}</p>}
                                        {answers.length > 0 && (
                                            <details>
                                                <summary className="cursor-pointer text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Data formulir ({answers.length})</summary>
                                                <dl className="mt-1 space-y-0.5 text-[11px]">
                                                    {answers.map((x) => (
                                                        <div key={x.key} className="flex gap-1.5"><dt className={'shrink-0 ' + MUTED}>{x.label}:</dt><dd className="min-w-0 break-words">{p.answer(r, x.key)}</dd></div>
                                                    ))}
                                                </dl>
                                            </details>
                                        )}
                                        <div className="flex justify-end gap-1 pt-0.5">
                                            {r.status !== 'terdaftar' && <button type="button" aria-label="Setujui" onClick={() => p.review(r, 'terdaftar')} className={'flex h-10 items-center gap-1 rounded-full bg-emerald-500/10 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 ' + PRESS}><Check className="size-4" /> Setujui</button>}
                                            {r.status !== 'ditolak' && <button type="button" aria-label="Tolak" onClick={() => p.review(r, 'ditolak')} className={'flex h-10 items-center gap-1 rounded-full bg-amber-500/10 px-3 text-xs font-medium text-amber-800 dark:text-amber-200 ' + PRESS}><X className="size-4" /> Tolak</button>}
                                            <button type="button" aria-label="Hapus pendaftar" onClick={() => p.onDelete(r)} className={'flex size-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 ' + PRESS}><Trash2 className="size-4" /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {p.pages > 1 && (
                        <nav className="mt-2 flex items-center justify-between gap-3">
                            <button type="button" disabled={p.pg <= 1} onClick={() => p.setPage(p.pg - 1)} aria-label="Sebelumnya" className={'flex size-9 items-center justify-center rounded-full disabled:opacity-40 ' + CARD}><ChevronLeft className="size-4" /></button>
                            <span className={'text-xs ' + MUTED}>{p.pg} / {p.pages}</span>
                            <button type="button" disabled={p.pg >= p.pages} onClick={() => p.setPage(p.pg + 1)} aria-label="Berikutnya" className={'flex size-9 items-center justify-center rounded-full disabled:opacity-40 ' + CARD}><ChevronRight className="size-4" /></button>
                        </nav>
                    )}
                </section>
            )}
        </div>
    );
}
