import { Link } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Crit = { id: number; name: string; description: string | null; weight: number; max_score: number; group?: string | null };
type Level = { k: number; vals: number[]; range: string };

type Props = {
    token: string;
    event: string;
    code: string;
    tail: string;
    name: string;
    school: string | null;
    position: { index: number; total: number };
    prev: number | null;
    next: number | null;
    criteria: Crit[];
    vals: Record<number, number | null>;
    setVal: (id: number, v: number) => void;
    levels: (max: number) => Level[];
    tone: Record<number, { on: string; off: string }>;
    num: (n: number) => string;
    filled: number;
    complete: boolean;
    total: number;
    scale: number;
    alreadyDone: boolean;
    blocked: string | null;
    error?: string;
    confirmOpen: boolean;
    codeIn: string;
    setCodeIn: (v: string) => void;
    saving: boolean;
    onOpen: () => void;
    onClose: () => void;
    onSend: () => void;
};

export default function JuriPesertaMobile(p: Props) {
    const q = (id: number) => p.vals[id];
    const canSend = p.codeIn.trim().toUpperCase() === p.tail.toUpperCase() && !p.saving;
    const [title, ...rest] = p.event.split(' - ');
    const category = rest.join(' - ');
    const pct = p.criteria.length ? Math.round((p.filled / p.criteria.length) * 100) : 0;
    const ringPct = p.alreadyDone && p.filled === 0 ? 100 : pct;
    const sub = [p.name !== p.code ? p.name : null, p.school].filter(Boolean).join(' · ');
    const progress = p.position.total ? Math.round((p.position.index / p.position.total) * 100) : 0;
    const url = (id: number) => '/juri/' + p.token + '?peserta=' + id;

    return (
        <div className="space-y-4 pb-28">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Link href={'/juri/' + p.token} className={'flex h-11 flex-1 items-center justify-center rounded-full text-sm font-medium ' + CARD + ' ' + PRESS}>Daftar</Link>
                    {p.prev ? (
                        <Link href={url(p.prev)} aria-label="Sebelumnya" className={'flex size-11 items-center justify-center rounded-full ' + CARD + ' ' + PRESS}><ChevronLeft className="size-5" /></Link>
                    ) : <span className="size-11" />}
                    <span className={'min-w-8 text-center text-xs font-medium ' + MUTED}>{p.position.index}/{p.position.total}</span>
                    {p.next ? (
                        <Link href={url(p.next)} aria-label="Berikutnya" className={'flex size-11 items-center justify-center rounded-full ' + CARD + ' ' + PRESS}><ChevronRight className="size-5" /></Link>
                    ) : <span className="size-11" />}
                </div>
                <div className="mx-1 h-1 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10">
                    <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: progress + '%' }} />
                </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 text-white dark:to-violet-600">
                <div className="flex items-center gap-4">
                    <span className="grid size-[68px] shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#fff ' + ringPct * 3.6 + 'deg, rgba(255,255,255,.25) 0deg)' }}>
                        <span className="grid size-[52px] place-items-center rounded-full bg-indigo-600 text-sm font-semibold">{ringPct}%</span>
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-white/70">{[category ? 'Kategori ' + category : null, title].filter(Boolean).join(' · ')}</p>
                        <div className="truncate text-[22px] leading-tight font-semibold tracking-tight">{p.code}</div>
                        {sub && <div className="truncate text-xs text-white/80">{sub}</div>}
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                        {p.alreadyDone && <Check className="size-3" />}
                        {p.alreadyDone ? 'Sudah dinilai' : 'Belum dinilai'}
                    </span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1">{p.filled}/{p.criteria.length} kriteria terisi</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1">Nilai maks. {p.num(p.scale)}</span>
                </div>
            </div>

            {p.blocked && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-[13px] leading-snug font-medium text-amber-800 dark:text-amber-200">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    <span>{p.blocked}</span>
                </div>
            )}
            {p.error && !p.confirmOpen && <p className="rounded-2xl bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-700 dark:text-rose-300">{p.error}</p>}

            {!p.blocked && p.criteria.map((c, i) => {
                const v = q(c.id);
                const filled = v != null;
                return (
                    <div key={c.id}>
                        {c.group && c.group !== p.criteria[i - 1]?.group && <div className={'mb-2 px-1 text-[11px] font-semibold tracking-wider uppercase ' + MUTED}>{c.group}</div>}
                        <div className={'rounded-3xl p-4 ' + CARD}>
                            <div className="flex items-start gap-3">
                                <span className={'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ' + (filled ? 'bg-emerald-500 text-white' : FIELD + ' text-indigo-700 dark:text-indigo-300')}>
                                    {filled ? <Check className="size-4" /> : i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[15px] leading-tight font-semibold">{c.name}</div>
                                    <div className={'mt-0.5 text-[11px] ' + MUTED}>Bobot {c.weight}% · Skala 0 - {p.num(c.max_score)}</div>
                                </div>
                                <span className={'shrink-0 rounded-xl px-3 py-1 text-base font-semibold ' + (filled ? 'bg-indigo-600 text-white dark:bg-indigo-500' : FIELD + ' ' + MUTED)}>{filled ? p.num(v as number) : '-'}</span>
                            </div>
                            {c.description && <p className={'mt-2 text-xs leading-snug ' + MUTED}>{c.description}</p>}
                            <div className="mt-3 flex flex-wrap gap-2">
                                {p.levels(c.max_score).slice().reverse().flatMap((lv) => lv.vals.map((n) => (
                                    <button key={lv.k + '-' + n} type="button" onClick={() => p.setVal(c.id, n)}
                                        className={'h-11 min-w-[3rem] flex-1 rounded-xl border-2 px-2 text-base font-semibold ' + PRESS + ' ' + (v === n ? p.tone[lv.k].on : p.tone[lv.k].off)}>
                                        {p.num(n)}
                                    </button>
                                )))}
                            </div>
                        </div>
                    </div>
                );
            })}

            {!p.blocked && p.criteria.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-900/10 bg-white/95 px-4 pt-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/95" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
                    <div className="leading-tight">
                        <div className={'text-[11px] font-medium ' + MUTED}>Total · {p.filled}/{p.criteria.length} terisi</div>
                        <div className="text-xl font-semibold">{p.num(p.total)} <span className={'text-xs font-medium ' + MUTED}>/ {p.num(p.scale)}</span></div>
                    </div>
                    <button type="button" disabled={!p.complete || p.saving} onClick={p.onOpen} className={'h-12 rounded-full bg-indigo-600 px-7 text-sm font-semibold text-white disabled:opacity-40 dark:bg-indigo-500 ' + PRESS}>
                        {p.saving ? 'Mengirim...' : p.alreadyDone ? 'Kirim ulang' : 'Kirim nilai'}
                    </button>
                </div>
            )}

            {p.confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60" onClick={p.onClose}>
                    <div className="w-full space-y-3 rounded-t-3xl bg-white p-4 text-slate-900 dark:bg-slate-900 dark:text-white" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }} onClick={(e) => e.stopPropagation()}>
                        <div className="mx-auto h-1 w-10 rounded-full bg-slate-300 dark:bg-white/20" />
                        <div className="text-center">
                            <div className={'text-[11px] font-semibold tracking-wider uppercase ' + MUTED}>Konfirmasi nilai</div>
                            <div className="text-xl font-semibold">{p.code}</div>
                            {p.name !== p.code && <div className={'text-sm ' + MUTED}>{p.name}</div>}
                        </div>
                        <div className={'space-y-1 rounded-2xl p-3 text-sm ' + FIELD}>
                            {p.criteria.map((c) => (<div key={c.id} className="flex justify-between gap-2"><span className="truncate">{c.name}</span><span className="font-semibold">{p.num(q(c.id) ?? 0)}</span></div>))}
                            <div className="flex justify-between border-t border-slate-900/10 pt-1.5 font-semibold dark:border-white/10"><span>Total</span><span>{p.num(p.total)} / {p.num(p.scale)}</span></div>
                        </div>
                        <label className="block text-xs font-medium">
                            Ketik angka terakhir kode registrasi untuk mengirim
                            <input autoFocus inputMode="numeric" value={p.codeIn} onChange={(e) => p.setCodeIn(e.target.value)} placeholder="Angka terakhir kode" className={'mt-1.5 h-12 w-full rounded-xl px-3 text-center text-xl font-semibold tracking-widest outline-none ' + FIELD} />
                        </label>
                        {p.error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">{p.error}</p>}
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={p.onClose} className={'h-12 rounded-full text-sm font-medium ' + FIELD + ' ' + PRESS}>Periksa lagi</button>
                            <button type="button" disabled={!canSend} onClick={p.onSend} className={'h-12 rounded-full bg-emerald-600 text-sm font-semibold text-white disabled:opacity-40 ' + PRESS}>{p.saving ? 'Mengirim...' : 'Kirim final'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
