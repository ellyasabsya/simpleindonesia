import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Download, Plus, ScanLine, Search, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'file';
type Field = { key: string; label: string; archived?: boolean };
type Item = { key?: string; label: string; type: FieldType; required: boolean; optionsText: string; stage: 'register' | 'after' };
type Row = {
    id: number; participant_code: string | null; name: string; email: string; phone: string | null; school: string | null; category: string | null;
    status: string; amount: number; proof: boolean; note: string | null; at: string; followup_done: boolean;
    teams: { name: string; category: string | null }[]; answers: Record<string, unknown>;
};

type Props = {
    eventId: number;
    fee: number;
    isTeam: boolean;
    published: boolean;
    quota: number | null;
    used: number;
    menunggu: number;
    disetujui: number;
    total: number;
    hasAfter: boolean;
    tab: 'data' | 'form'; setTab: (t: 'data' | 'form') => void;
    q: string; setQ: (v: string) => void;
    st: string; setSt: (v: string) => void;
    statusMap: Record<string, { label: string; style: string }>;
    list: Row[];
    view: Row[];
    pg: number; pages: number; setPage: (n: number) => void;
    shown: Field[];
    answer: (r: Row, k: string) => ReactNode;
    review: (r: Row, s: 'terdaftar' | 'ditolak') => void;
    onDelete: (r: Row) => void;
    items: Item[];
    types: { value: FieldType; label: string }[];
    patch: (i: number, p: Partial<Item>) => void;
    move: (i: number, d: number) => void;
    add: () => void;
    remove: (i: number) => void;
    save: () => void;
    saving: boolean;
    saved: boolean;
    errors: string[];
};

const rupiah = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const sel = 'h-10 min-w-0 rounded-xl px-3 text-base ' + FIELD;
const tabCls = (on: boolean) =>
    'inline-flex h-10 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium ' + PRESS + ' ' +
    (on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : CARD + ' text-slate-800 dark:text-slate-100');
const mini = 'flex size-9 shrink-0 items-center justify-center rounded-full disabled:opacity-30 ' + FIELD + ' ' + PRESS;

/** Registrasi lewat formulir dan bukti transfer, HP (ringkas). */
export default function RegistrasiFormMobile(p: Props) {
    const paid = p.fee > 0;
    const who = p.isTeam ? 'Tim' : 'Peserta';
    const title = paid ? 'Pendaftaran formulir dan bukti transfer' : 'Pendaftaran lewat formulir';
    const desc = paid
        ? who + ' mengisi formulir dan mengunggah bukti transfer ' + rupiah(p.fee) + (p.isTeam ? ' per tim' : '') + '. Anda yang memverifikasinya.'
        : who + ' cukup mengisi formulir, tanpa biaya.';
    const stats: [string, string][] = [
        [p.isTeam ? 'Tim' : 'Pendaftar', String(p.used) + (p.quota ? '/' + p.quota : '')],
        ['Menunggu', String(p.menunggu)],
        ['Disetujui', String(p.disetujui)],
    ];

    return (
        <div className="space-y-3 pb-24">
            <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                <h2 className="text-sm leading-tight font-semibold">{title}</h2>
                <details>
                    <summary className="cursor-pointer text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Keterangan</summary>
                    <p className={'mt-1 text-xs leading-snug ' + MUTED}>{desc}</p>
                </details>
                {!p.published && <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Event belum terbit, jadi form publik belum bisa dibuka.</p>}

                <div className="grid grid-cols-3 divide-x divide-slate-900/[0.07] dark:divide-white/10">
                    {stats.map(([l, n]) => (
                        <div key={l} className="text-center">
                            <p className="text-base leading-tight font-semibold">{n}</p>
                            <p className={'text-[11px] ' + MUTED}>{l}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-1.5">
                    <button type="button" onClick={() => p.setTab('data')} className={tabCls(p.tab === 'data')}>Pendaftar ({p.total})</button>
                    <button type="button" onClick={() => p.setTab('form')} className={tabCls(p.tab === 'form')}>Susun form</button>
                </div>

                {p.tab === 'data' && (
                    <>
                        <label className={'flex h-10 items-center gap-2 rounded-xl px-3 ' + FIELD}>
                            <Search className="size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                            <input type="search" value={p.q} onChange={(e) => p.setQ(e.target.value)} placeholder="Cari nama, email, sekolah, atau tim" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <select value={p.st} onChange={(e) => p.setSt(e.target.value)} className={sel}>
                                <option value="">Semua status</option>
                                {Object.entries(p.statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <a href={'/panel/event/' + p.eventId + '/registrasi/export'} className={'flex h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-sm font-medium text-white dark:bg-indigo-500 ' + PRESS}><Download className="size-4" /> Ekspor CSV</a>
                            <a href={'/panel/event/' + p.eventId + '/checkin'} className={'col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-medium ' + FIELD + ' ' + PRESS}><ScanLine className="size-4" /> Buka scanner</a>
                        </div>
                    </>
                )}
            </section>

            {p.tab === 'data' && (
                <section>
                    <p className={'mb-1 px-1 text-[11px] ' + MUTED}>Daftar pendaftar ({p.list.length})</p>
                    {p.view.length === 0 ? (
                        <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>{p.total === 0 ? 'Belum ada pendaftar.' : 'Tidak ada data yang cocok.'}</div>
                    ) : (
                        <div className={GROUP}>
                            {p.view.map((r) => {
                                const s = p.statusMap[r.status] ?? { label: r.status, style: '' };
                                const cls = r.status === 'terdaftar' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : r.status === 'menunggu' ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200'
                                    : r.status === 'ditolak' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-300';
                                const teams = r.teams.map((t) => t.name + (t.category ? ' (' + t.category + ')' : '')).join(', ');
                                const answers = p.shown.filter((x) => r.answers[x.key] != null && r.answers[x.key] !== '');
                                return (
                                    <div key={r.id} className="space-y-0.5 px-3 py-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm leading-tight font-semibold">{r.name}</span>
                                                <span className={'block truncate text-[11px] leading-snug ' + MUTED}>{[r.email, r.phone].filter(Boolean).join(' · ')}</span>
                                            </span>
                                            <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ' + cls}>{s.label}</span>
                                        </div>
                                        <p className={'truncate text-[11px] leading-snug ' + MUTED}>
                                            {[r.participant_code, r.school, p.isTeam ? teams : r.category].filter(Boolean).join(' · ')}
                                        </p>
                                        <p className={'flex flex-wrap items-center gap-x-2 text-[11px] leading-snug ' + MUTED}>
                                            {paid && <span>{rupiah(r.amount)}</span>}
                                            {paid && (r.proof
                                                ? <a href={'/panel/event/' + p.eventId + '/registrasi/bukti/' + r.id} target="_blank" rel="noreferrer" className="font-medium text-indigo-700 underline dark:text-indigo-300">Bukti</a>
                                                : <span>Tanpa bukti</span>)}
                                            <span>{r.at}</span>
                                        </p>
                                        {r.status === 'ditolak' && r.note && <p className={'text-[11px] ' + MUTED}>Alasan: {r.note}</p>}
                                        {r.status === 'terdaftar' && !p.isTeam && p.hasAfter && <p className={'text-[11px] ' + MUTED}>{r.followup_done ? 'Data lengkap' : 'Menunggu data lanjutan'}</p>}
                                        {answers.length > 0 && (
                                            <details>
                                                <summary className="cursor-pointer text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Data formulir ({answers.length})</summary>
                                                <dl className="mt-1 space-y-0.5 text-[11px]">
                                                    {answers.map((x) => (
                                                        <div key={x.key} className="flex gap-1.5"><dt className={'shrink-0 ' + MUTED}>{x.label}{x.archived ? ' (arsip)' : ''}:</dt><dd className="min-w-0 break-words">{p.answer(r, x.key)}</dd></div>
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

            {p.tab === 'form' && (
                <section className="space-y-2">
                    {p.items.map((f, i) => (
                        <div key={f.key ?? 'new-' + i} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                            <input value={f.label} onChange={(e) => p.patch(i, { label: e.target.value })} placeholder="Label kolom, misalnya Nama sekolah" maxLength={120} className={'h-10 w-full rounded-xl px-3 text-base outline-none ' + FIELD} />
                            <div className={'grid gap-2 ' + (p.isTeam ? 'grid-cols-1' : 'grid-cols-2')}>
                                <select value={f.type} onChange={(e) => p.patch(i, { type: e.target.value as FieldType })} className={sel}>
                                    {p.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {!p.isTeam && (
                                    <select value={f.stage} onChange={(e) => p.patch(i, { stage: e.target.value as 'register' | 'after' })} className={sel}>
                                        <option value="register">Saat daftar</option>
                                        <option value="after">Setelah disetujui</option>
                                    </select>
                                )}
                            </div>
                            {(f.type === 'select' || f.type === 'checkbox') && (
                                <textarea value={f.optionsText} onChange={(e) => p.patch(i, { optionsText: e.target.value })} rows={3} placeholder={'Satu pilihan per baris\nContoh:\nSD\nSMP\nSMA'} className={'w-full rounded-xl px-3 py-2 text-base outline-none ' + FIELD} />
                            )}
                            {f.type === 'file' && <p className={'text-[11px] leading-snug ' + MUTED}>JPG, PNG, WEBP, atau PDF, maksimal 5 MB. Berkas privat, hanya bisa dibuka dari tab Pendaftar.</p>}
                            <div className="flex items-center gap-2">
                                <label className="mr-auto flex items-center gap-2 text-[13px] font-medium">
                                    <input type="checkbox" checked={f.required} onChange={(e) => p.patch(i, { required: e.target.checked })} className="size-4" /> Wajib
                                </label>
                                <button type="button" className={mini} disabled={i === 0} onClick={() => p.move(i, -1)} aria-label="Naik"><ArrowUp className="size-4" /></button>
                                <button type="button" className={mini} disabled={i === p.items.length - 1} onClick={() => p.move(i, 1)} aria-label="Turun"><ArrowDown className="size-4" /></button>
                                <button type="button" className={'flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 ' + PRESS} onClick={() => p.remove(i)} aria-label="Hapus"><Trash2 className="size-4" /></button>
                            </div>
                        </div>
                    ))}

                    <button type="button" onClick={p.add} className={'flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-indigo-300 text-[13px] font-medium text-indigo-700 dark:border-indigo-400/40 dark:text-indigo-300 ' + PRESS}>
                        <Plus className="size-4" /> Tambah kolom
                    </button>

                    {p.errors.length > 0 && (
                        <div className="space-y-0.5 rounded-2xl bg-rose-500/10 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                            {p.errors.map((e, i) => <div key={i}>{e}</div>)}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button type="button" onClick={p.save} disabled={p.saving} className={'h-10 flex-1 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}>{p.saving ? 'Menyimpan...' : 'Simpan form'}</button>
                        {p.saved && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"><Check className="size-4" /> Tersimpan</span>}
                    </div>
                </section>
            )}
        </div>
    );
}
