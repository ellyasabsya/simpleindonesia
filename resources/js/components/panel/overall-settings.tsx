import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Lock, Minus, Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

type Crit = 'medals' | 'score' | 'wins';
const ALL: Crit[] = ['medals', 'score', 'wins'];
const CRIT: Record<Crit, { title: string; short: string; desc: string }> = {
    medals: { title: 'Jumlah Juara 1, 2, 3, dan seterusnya', short: 'Jumlah juara 1, 2, 3, …', desc: 'Banyaknya juara 1, lalu juara 2, lalu juara 3, dan seterusnya.' },
    score: { title: 'Total poin prestasi', short: 'Total poin prestasi', desc: 'Jumlah nilai akhir dari semua kategori.' },
    wins: { title: 'Jumlah kemenangan', short: 'Jumlah kemenangan', desc: 'Banyaknya kategori yang dimenangkan (juara 1).' },
};
const medal = (i: number) => (i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-indigo-400');

type Item = { k: Crit; on: boolean };
const build = (order: string[]): Item[] => {
    const on = Array.from(new Set(order.filter((k): k is Crit => (ALL as string[]).includes(k))));
    return [...on.map((k) => ({ k, on: true })), ...ALL.filter((k) => !on.includes(k)).map((k) => ({ k, on: false }))];
};

type Props = {
    points: number[];
    winnerCount: number;
    tiebreak: string[];
    tieShared: boolean;
    locked: boolean;
    finalizedAt: string | null;
    note?: string | null;
    base: string;
    onDirty?: (dirty: boolean) => void;
};

const lab = 'text-xs font-bold uppercase tracking-wide text-slate-400';
const sq = 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10';
const sqs = 'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5';

export default function OverallSettings({ points, winnerCount, tiebreak, tieShared, locked, finalizedAt, note, base, onDirty }: Props) {
    const key = points.join(',') + '|' + winnerCount + '|' + tiebreak.join(',') + '|' + tieShared;
    const [pts, setPts] = useState<string[]>(points.map(String));
    const [wc, setWc] = useState<string>(String(winnerCount));
    const [items, setItems] = useState<Item[]>(build(tiebreak));
    const [shared, setShared] = useState<boolean>(tieShared);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPts(points.map(String));
        setWc(String(winnerCount));
        setItems(build(tiebreak));
        setShared(tieShared);
    }, [key]);

    const order = items.filter((i) => i.on).map((i) => i.k);
    const nums = pts.map((p) => (p.trim() === '' ? NaN : Number(p)));
    const wcn = Number(wc);
    const pointsOk = nums.length >= 1 && nums.length <= 10 && nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 1000);
    const wcOk = Number.isInteger(wcn) && wcn >= 1 && wcn <= nums.length;
    const valid = pointsOk && wcOk;
    const dirty = pts.join(',') !== points.join(',') || wcn !== winnerCount || order.join(',') !== tiebreak.join(',') || shared !== tieShared;
    const descending = nums.every((n, i) => i === 0 || !(n > nums[i - 1]));

    useEffect(() => {
        onDirty?.(dirty);
    }, [dirty]);

    const setAt = (i: number, v: string) => setPts(pts.map((p, j) => (j === i ? v.replace(/[^0-9]/g, '') : p)));
    const add = () => pts.length < 10 && setPts([...pts, '0']);
    const remove = () => {
        if (pts.length <= 1) return;
        setPts(pts.slice(0, -1));
        if (wcn > pts.length - 1) setWc(String(pts.length - 1));
    };
    const step = (d: number) => setWc(String(Math.min(Math.max((Number.isInteger(wcn) ? wcn : 1) + d, 1), pts.length)));
    const toggle = (i: number) => setItems(items.map((it, j) => (j === i ? { ...it, on: !it.on } : it)));
    const move = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= items.length) return;
        const next = [...items];
        [next[i], next[j]] = [next[j], next[i]];
        setItems(next);
    };

    const save = () => {
        if (!valid || locked) return;
        setError(null);
        router.put(`${base}/juara-umum`, { points: nums, winner_count: wcn, tiebreak: order, tie_shared: shared }, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onError: (e) => setError(String(Object.values(e)[0] ?? 'Gagal menyimpan pengaturan.')),
        });
    };

    const flow = ['Total poin peringkat', ...order.map((k) => CRIT[k].short), shared ? 'Juara bersama' : 'Harus diselesaikan panitia'];

    return (
        <section className="rounded-3xl bg-white/80 p-6 shadow-sm dark:bg-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold">Pengaturan juara umum</h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
                        Poin diberikan per peringkat di setiap kategori, lalu dijumlahkan per peserta dari semua sub-event.
                    </p>
                </div>
                {locked && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Lock className="h-3.5 w-3.5" /> Terkunci{finalizedAt ? ` · ${finalizedAt}` : ''}
                    </span>
                )}
            </div>

            {note && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">{note}</p>}

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="space-y-7">
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <p className={lab}>Poin per peringkat</p>
                            <div className="flex gap-1.5">
                                <button type="button" className={sqs} onClick={remove} disabled={locked || pts.length <= 1} aria-label="Kurangi peringkat"><Minus className="h-3.5 w-3.5" /></button>
                                <button type="button" className={sqs} onClick={add} disabled={locked || pts.length >= 10} aria-label="Tambah peringkat"><Plus className="h-3.5 w-3.5" /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                            {pts.map((p, i) => (
                                <label key={i} className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/5">
                                    <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white ${medal(i)}`}>{i + 1}</span>
                                    <span className="mt-1.5 block text-[11px] font-bold uppercase text-slate-400">Juara {i + 1}</span>
                                    <input
                                        inputMode="numeric"
                                        value={p}
                                        disabled={locked}
                                        onChange={(e) => setAt(i, e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-lg font-extrabold outline-none focus:border-indigo-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
                                    />
                                    <span className="mt-1 block text-[11px] text-slate-400">poin</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={`${lab} mb-3`}>Jumlah juara umum dicantumkan</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-1.5 dark:border-white/10 dark:bg-white/5">
                                <button type="button" className={sq} onClick={() => step(-1)} disabled={locked || !(wcn > 1)} aria-label="Kurangi"><Minus className="h-4 w-4" /></button>
                                <span className="min-w-12 text-center text-2xl font-extrabold">{Number.isInteger(wcn) ? wcn : '–'}</span>
                                <button type="button" className={sq} onClick={() => step(1)} disabled={locked || !(wcn < pts.length)} aria-label="Tambah"><Plus className="h-4 w-4" /></button>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-300">dari maksimal {pts.length} peringkat berpoin</span>
                        </div>
                    </div>
                </div>

                <div>
                    <p className={lab}>Pemecah seri</p>
                    <p className="mb-3 mt-1 text-xs text-slate-500 dark:text-slate-300">Dipakai berurutan dari atas kalau total poin sama. Yang tidak dicentang diabaikan.</p>
                    <div className="space-y-2">
                        {items.map((it, i) => {
                            const pos = it.on ? order.indexOf(it.k) + 1 : 0;
                            return (
                                <div key={it.k} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${it.on ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-400/30 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10'}`}>
                                    <input type="checkbox" className="h-4 w-4 shrink-0 accent-indigo-600" checked={it.on} disabled={locked} onChange={() => toggle(i)} />
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${pos > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400 dark:bg-white/10'}`}>{pos > 0 ? pos : '–'}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-extrabold leading-tight">{CRIT[it.k].title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-300">{CRIT[it.k].desc}</p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button type="button" className={sqs} disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label="Naikkan"><ArrowUp className="h-3.5 w-3.5" /></button>
                                        <button type="button" className={sqs} disabled={locked || i === items.length - 1} onClick={() => move(i, 1)} aria-label="Turunkan"><ArrowDown className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={shared}
                            disabled={locked}
                            onClick={() => setShared(!shared)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${shared ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/20'}`}
                        >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${shared ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                        <div className="min-w-0">
                            <p className="text-sm font-extrabold leading-tight">Juara bersama jika seluruh kriteria sama</p>
                            <p className="text-xs text-slate-500 dark:text-slate-300">Kalau dimatikan, seri di batas juara umum harus diselesaikan dulu sebelum SK bisa ditetapkan.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className={lab}>Urutan penentuan</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {flow.map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-2">
                            {i > 0 && <span className="text-slate-300">→</span>}
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${i === 0 ? 'bg-indigo-600 text-white' : i === flow.length - 1 ? 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200' : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10'}`}>{f}</span>
                        </span>
                    ))}
                </div>
            </div>

            {!descending && pointsOk && (
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                    Poin peringkat bawah lebih besar dari peringkat di atasnya. Pastikan ini memang disengaja.
                </p>
            )}
            {!valid && <p className="mt-3 text-xs font-semibold text-rose-600">Isi poin dengan bilangan bulat 0 sampai 1000, dan jumlah juara antara 1 dan {pts.length}.</p>}
            {error && <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}

            {!locked && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={save}
                        disabled={!valid || !dirty || busy}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" /> {busy ? 'Menyimpan…' : 'Simpan pengaturan'}
                    </button>
                    {dirty && <span className="text-xs font-semibold text-amber-600">Ada perubahan yang belum disimpan. Klasemen dihitung ulang setelah disimpan.</span>}
                </div>
            )}
        </section>
    );
}
