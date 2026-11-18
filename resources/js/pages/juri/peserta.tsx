import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import JuriLayout from '@/components/juri/juri-layout';

type Crit = { id: number; name: string; description: string | null; weight: number; max_score: number; group?: string | null };
type Part = { id: number; name: string; school: string | null; code?: string; code_tail?: string };
type Props = {
    token: string;
    judge: { name: string; active: boolean };
    event: { title: string };
    enabled: boolean;
    scale: number;
    criteria: Crit[];
    participant: Part;
    position: { index: number; total: number };
    prev: number | null;
    next: number | null;
    scores: Record<string, number>;
};

const num = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);
const byLevel = (max: number) => [5, 4, 3, 2, 1].map((k) => {
    const lo = (max * (k - 1)) / 5;
    const hi = (max * k) / 5;
    const vals = Array.from(new Set([1, 2, 3].map((n) => Math.round(lo + ((hi - lo) * n) / 3))));
    return { k, vals, range: `${k === 1 ? 1 : Math.round(lo) + 1} - ${Math.round(hi)}` };
});
const codeOf = (p: Part) => p.code || `ID-${p.id}`;
const tailOf = (p: Part) => String(p.code_tail ?? (codeOf(p).match(/(\d+)\s*$/)?.[1] ?? codeOf(p)));

const LV: Record<number, { chip: string; on: string; off: string }> = {
    5: { chip: 'bg-emerald-500', on: 'border-emerald-600 bg-emerald-500 text-white shadow-md', off: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400' },
    4: { chip: 'bg-sky-500', on: 'border-sky-600 bg-sky-500 text-white shadow-md', off: 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400' },
    3: { chip: 'bg-amber-500', on: 'border-amber-600 bg-amber-500 text-white shadow-md', off: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400' },
    2: { chip: 'bg-orange-500', on: 'border-orange-600 bg-orange-500 text-white shadow-md', off: 'border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-400' },
    1: { chip: 'bg-rose-500', on: 'border-rose-600 bg-rose-500 text-white shadow-md', off: 'border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400' },
};

export default function JuriPeserta({ token, judge, event, enabled, scale, criteria, participant: p, position, prev, next, scores }: Props) {
    const page = usePage().props as any;
    const errors = (page.errors ?? {}) as Record<string, string>;
    const key = 'juri-draft-' + token;
    const alreadyDone = criteria.length > 0 && Object.keys(scores ?? {}).length >= criteria.length;

    const [vals, setVals] = useState<Record<number, number | null>>(() => {
        const o: Record<number, number | null> = {};
        criteria.forEach((c) => { const v = scores?.[c.id]; o[c.id] = v === undefined ? null : v; });
        if (!alreadyDone) {
            try {
                const d = JSON.parse(window.localStorage.getItem(key) ?? 'null');
                criteria.forEach((c) => { const v = d?.[p.id]?.[c.id]; if (typeof v === 'number') o[c.id] = v; });
            } catch { /* draf rusak diabaikan */ }
        }
        return o;
    });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [codeIn, setCodeIn] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        try {
            const d = JSON.parse(window.localStorage.getItem(key) ?? 'null') ?? {};
            d[p.id] = vals;
            window.localStorage.setItem(key, JSON.stringify(d));
        } catch { /* abaikan */ }
    }, [vals, key, p.id]);

    const filled = criteria.filter((c) => vals[c.id] !== null && vals[c.id] !== undefined).length;
    const complete = criteria.length > 0 && filled === criteria.length;
    const total = criteria.reduce((a, c) => a + (vals[c.id] ?? 0), 0);
    const blocked = !judge.active ? 'Akses Anda sebagai juri sedang dinonaktifkan oleh panitia.' : !enabled ? 'Penilaian belum dibuka atau sudah ditutup oleh panitia.' : null;

    const send = () => {
        setSaving(true);
        router.post(`/juri/${token}`, { registration_id: p.id, scores: vals, confirm_code: codeIn } as any, { onFinish: () => setSaving(false) });
    };
    const open = () => { setCodeIn(''); setConfirmOpen(true); };

    const navBtn = 'rounded-xl bg-white/80 px-3.5 py-2 text-xs font-bold text-indigo-900 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20';
    const card = 'rounded-3xl bg-white/85 shadow-md ring-1 ring-white/70 backdrop-blur dark:bg-white/10 dark:ring-white/10';

    return (
        <JuriLayout title={`${codeOf(p)} - ${event.title}`} judgeName={judge.name}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/juri/${token}`} className={navBtn}>← Daftar peserta</Link>
                <div className="flex flex-wrap items-center gap-2">
                    {prev && <Link href={`/juri/${token}?peserta=${prev}`} className={navBtn}>← Sebelumnya</Link>}
                    <span className="rounded-xl bg-indigo-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm">Peserta {position.index} dari {position.total}</span>
                    {next && <Link href={`/juri/${token}?peserta=${next}`} className={navBtn}>Berikutnya →</Link>}
                </div>
            </div>

            <section className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-5 text-white shadow-xl sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-sky-100">Anda sedang menilai</div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${alreadyDone ? 'bg-emerald-400 text-emerald-950' : 'bg-amber-300 text-amber-950'}`}>{alreadyDone ? 'Sudah dinilai' : 'Belum dinilai'}</span>
                </div>
                <div className="mt-1.5 break-words text-2xl font-extrabold tracking-wider sm:text-4xl">{codeOf(p)}</div>
                <div className="mt-1 text-lg font-bold sm:text-xl">{p.name}</div>
                <div className="text-sm text-sky-100">{[p.school, event.title].filter(Boolean).join(' · ')}</div>
            </section>

            {blocked && <p className="rounded-2xl bg-amber-100 p-3.5 text-sm font-semibold text-amber-900 ring-1 ring-amber-300">{blocked}</p>}
            {errors.scores && !confirmOpen && <p className="rounded-2xl bg-rose-100 p-3.5 text-sm font-semibold text-rose-800 ring-1 ring-rose-300">{errors.scores}</p>}

            {!blocked && criteria.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-3 lg:col-span-2">
                        {criteria.map((c, idx) => {
                            const cur = vals[c.id];
                            return (
                                <div key={c.id}>
                                    {c.group && c.group !== criteria[idx - 1]?.group && <div className="mb-2 rounded-xl bg-indigo-900 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">{c.group}</div>}
                                    <div className={`${card} p-4`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-base font-extrabold">{c.name}</div>
                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">Bobot {c.weight}%</span>
                                                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">Skala 0 - {num(c.max_score)}</span>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 rounded-xl px-3 py-1.5 text-lg font-extrabold ${cur === null || cur === undefined ? 'bg-slate-100 text-slate-400 dark:bg-white/10' : 'bg-emerald-500 text-white'}`}>{cur === null || cur === undefined ? '-' : num(cur)}</span>
                                        </div>
                                        {c.description && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300">{c.description}</p>}
                                        <div className="mt-3 space-y-2">
                                            {byLevel(c.max_score).map((lv) => (
                                                <div key={lv.k} className="flex items-stretch gap-2">
                                                    <div className={`flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-lg px-1 py-1 text-center text-[10px] font-bold leading-tight text-white sm:w-20 ${LV[lv.k].chip}`}>Level {lv.k}<span className="font-medium opacity-90">{lv.range}</span></div>
                                                    <div className="grid flex-1 grid-cols-3 gap-2">
                                                        {lv.vals.map((v) => (
                                                            <button key={v} type="button" onClick={() => setVals({ ...vals, [c.id]: v })} className={`rounded-lg border-2 py-2.5 text-base font-extrabold transition active:scale-95 ${cur === v ? LV[lv.k].on : LV[lv.k].off}`}>{num(v)}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <aside className="hidden self-start lg:sticky lg:top-28 lg:block">
                        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-5 text-white shadow-xl">
                            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-sky-300">Ringkasan nilai</div>
                            <div className="mt-2 flex items-end gap-1.5"><span className="text-4xl font-extrabold">{num(total)}</span><span className="pb-1 text-sm text-blue-200">/ {num(scale)}</span></div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${criteria.length ? (filled / criteria.length) * 100 : 0}%` }} /></div>
                            <div className="mt-1.5 text-[11px] font-medium text-blue-200">{filled} dari {criteria.length} kriteria terisi</div>
                            <div className="mt-3 space-y-1.5 rounded-2xl bg-white/10 p-3 text-xs">
                                {criteria.map((c) => (
                                    <div key={c.id} className="flex justify-between gap-2"><span className="truncate font-medium">{c.name}</span><span className="font-bold">{vals[c.id] === null || vals[c.id] === undefined ? '-' : num(vals[c.id] as number)}</span></div>
                                ))}
                            </div>
                            <button type="button" disabled={!complete || saving} onClick={open} className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-extrabold text-indigo-950 shadow-lg transition hover:bg-emerald-300 disabled:opacity-40">{saving ? 'Mengirim...' : alreadyDone ? 'Kirim ulang nilai' : 'Kirim nilai'}</button>
                            <p className="mt-2.5 text-center text-[11px] text-blue-200">Draf tersimpan otomatis di perangkat ini.</p>
                        </div>
                    </aside>
                </div>
            )}

            {!blocked && criteria.length > 0 && (
                <>
                    <div className="h-12 lg:hidden" />
                    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-950 to-indigo-900 px-4 py-2.5 text-white shadow-2xl lg:hidden">
                        <div className="leading-tight">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-sky-300">Total · {filled}/{criteria.length} terisi</div>
                            <div className="text-xl font-extrabold">{num(total)} <span className="text-xs font-medium text-blue-200">/ {num(scale)}</span></div>
                        </div>
                        <button type="button" disabled={!complete || saving} onClick={open} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-indigo-950 shadow-lg disabled:opacity-40">{saving ? 'Mengirim...' : alreadyDone ? 'Kirim ulang' : 'Kirim nilai'}</button>
                    </div>
                </>
            )}

            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
                    <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-white">
                        <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-4 text-center text-white">
                            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-100">Konfirmasi pengiriman nilai</div>
                            <div className="mt-1 break-words text-2xl font-extrabold tracking-wider">{codeOf(p)}</div>
                            <div className="text-sm font-bold">{p.name}</div>
                            {p.school && <div className="text-xs text-sky-100">{p.school}</div>}
                        </div>
                        <div className="space-y-3 p-4">
                            <div className="space-y-1 rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                                {criteria.map((c) => (
                                    <div key={c.id} className="flex justify-between"><span className="font-medium">{c.name}</span><span className="font-bold">{num(vals[c.id] ?? 0)}</span></div>
                                ))}
                                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-extrabold text-indigo-900 dark:border-white/10 dark:text-indigo-200"><span>Total</span><span>{num(total)} / {num(scale)}</span></div>
                            </div>
                            <label className="block text-xs font-bold">
                                Ketik angka terakhir dari kode registrasi di atas untuk mengirim nilai
                                <input autoFocus inputMode="numeric" value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder="Angka terakhir kode" className="mt-1.5 w-full rounded-xl border-2 border-indigo-300 bg-white px-3 py-2.5 text-center text-xl font-extrabold tracking-widest text-slate-900 focus:border-indigo-600 focus:outline-none dark:bg-slate-800 dark:text-white" />
                            </label>
                            {errors.scores && <p className="rounded-xl bg-rose-100 p-2.5 text-xs font-semibold text-rose-800">{errors.scores}</p>}
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => { setConfirmOpen(false); setCodeIn(''); }} className="rounded-xl border-2 border-slate-300 px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-white/20 dark:text-slate-200">Batal, periksa lagi</button>
                                <button type="button" disabled={codeIn.trim().toUpperCase() !== tailOf(p).toUpperCase() || saving} onClick={send} className="rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-extrabold text-white shadow-lg disabled:opacity-40">{saving ? 'Mengirim...' : 'Kirim final'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </JuriLayout>
    );
}
