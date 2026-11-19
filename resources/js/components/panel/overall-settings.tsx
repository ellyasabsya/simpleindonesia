import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Lock, Minus, Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

type Crit = 'medals' | 'score' | 'wins';
const ALL: Crit[] = ['medals', 'score', 'wins'];
const CRIT: Record<Crit, { title: string; short: string; desc: string }> = {
    medals: { title: 'Jumlah Juara 1, 2, 3, dan seterusnya', short: 'jumlah juara 1, 2, 3, …', desc: 'Bandingkan jumlah juara 1, lalu juara 2, lalu juara 3, dan seterusnya sampai peringkat terakhir yang diberi poin.' },
    score: { title: 'Total poin prestasi', short: 'total poin prestasi', desc: 'Bandingkan jumlah nilai akhir dari semua kategori yang diikuti.' },
    wins: { title: 'Jumlah kemenangan', short: 'jumlah kemenangan', desc: 'Bandingkan jumlah kategori yang dimenangkan (juara 1).' },
};

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
    base: string;
    onDirty?: (dirty: boolean) => void;
};

const field = 'w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold outline-none focus:border-indigo-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/5';
const sq = 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5';
const sqs = 'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5';

export default function OverallSettings({ points, winnerCount, tiebreak, tieShared, locked, finalizedAt, base, onDirty }: Props) {
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

    const flow = ['total poin peringkat', ...order.map((k) => CRIT[k].short), shared ? 'juara bersama' : 'harus diselesaikan panitia'];

    return (
        <section className="rounded-3xl bg-white/80 p-5 shadow-sm dark:bg-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-extrabold">Pengaturan juara umum</h3>
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

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase text-slate-400">Poin per peringkat</p>
                    <div className="space-y-2">
                        {pts.map((p, i) => (
                            <label key={i} className="flex items-center gap-3 text-sm font-semibold">
                                <span className="w-20 text-slate-600 dark:text-slate-300">Juara {i + 1}</span>
                                <input inputMode="numeric" className={field} value={p} disabled={locked} onChange={(e) => setAt(i, e.target.value)} />
                                <span className="text-xs text-slate-400">poin</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button type="button" className={sq} onClick={remove} disabled={locked || pts.length <= 1} aria-label="Kurangi peringkat"><Minus className="h-4 w-4" /></button>
                        <button type="button" className={sq} onClick={add} disabled={locked || pts.length >= 10} aria-label="Tambah peringkat"><Plus className="h-4 w-4" /></button>
                    </div>

                    <p className="mb-2 mt-5 text-xs font-bold uppercase text-slate-400">Jumlah juara umum dicantumkan</p>
                    <input inputMode="numeric" className={field} value={wc} disabled={locked} onChange={(e) => setWc(e.target.value.replace(/[^0-9]/g, ''))} />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Maksimal sebanyak peringkat yang diberi poin ({pts.length}).</p>
                </div>

                <div>
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400">Pemecah seri</p>
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-300">Dipakai berurutan dari atas kalau total poin sama. Kriteria yang tidak dicentang diabaikan.</p>
                    <div className="space-y-2">
                        {items.map((it, i) => {
                            const pos = it.on ? order.indexOf(it.k) + 1 : 0;
                            return (
                                <div key={it.k} className={`flex items-start gap-3 rounded-2xl border p-3 ${it.on ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-400/30 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10'}`}>
                                    <input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" checked={it.on} disabled={locked} onChange={() => toggle(i)} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-extrabold">
                                            {pos > 0 && <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] text-white">{pos}</span>}
                                            {CRIT[it.k].title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">{CRIT[it.k].desc}</p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button type="button" className={sqs} disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label="Naikkan"><ArrowUp className="h-3.5 w-3.5" /></button>
                                        <button type="button" className={sqs} disabled={locked || i === items.length - 1} onClick={() => move(i, 1)} aria-label="Turunkan"><ArrowDown className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                        <input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" checked={shared} disabled={locked} onChange={(e) => setShared(e.target.checked)} />
                        <span>
                            <span className="block text-sm font-extrabold">Juara bersama jika seluruh kriteria sama</span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-300">
                                Kalau dimatikan, seri di batas juara umum harus diselesaikan dulu sebelum SK bisa ditetapkan.
                            </span>
                        </span>
                    </label>
                </div>
            </div>

            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                Urutan penentuan: {flow.join(' → ')}
            </p>

            {!descending && pointsOk && (
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                    Poin peringkat bawah lebih besar dari peringkat di atasnya. Pastikan ini memang disengaja.
                </p>
            )}
            {!valid && <p className="mt-3 text-xs font-semibold text-rose-600">Isi poin dengan bilangan bulat 0 sampai 1000, dan jumlah juara antara 1 dan {pts.length}.</p>}
            {error && <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>}

            {!locked && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
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
