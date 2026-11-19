import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
    current: number;
    last: number;
    total: number;
    from?: number | null;
    to?: number | null;
    unit?: string;
};

export default function Pagination({ current, last, total, from, to, unit = 'data' }: Props) {
    // Halaman di luar jangkauan (data berkurang): pindah ke halaman terakhir yang valid.
    useEffect(() => {
        const max = Math.max(last, 1);
        if (current > max) {
            const u = new URL(window.location.href);
            u.searchParams.set('page', String(max));
            router.get(u.pathname + u.search, {}, { preserveScroll: true, preserveState: true, replace: true });
        }
    }, [current, last]);

    if (last <= 1) return null;

    // Pakai URL yang sedang dibuka dan hanya ganti `page`, jadi pencarian dan filter ikut terbawa.
    const go = (n: number) => {
        const u = new URL(window.location.href);
        u.searchParams.set('page', String(n));
        router.get(u.pathname + u.search, {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    const nums = Array.from({ length: last }, (_, i) => i + 1)
        .filter((n) => n === 1 || n === last || Math.abs(n - current) <= 1)
        .reduce<(number | '…')[]>((acc, n, i, arr) => {
            if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
            acc.push(n);
            return acc;
        }, []);

    const btn = 'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-white/10';

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-white/10">
            <span className="text-slate-500">{from && to ? `${from}–${to} dari ${total} ${unit}` : `${total} ${unit}`}</span>
            <div className="flex items-center gap-1.5">
                <button type="button" disabled={current <= 1} onClick={() => go(current - 1)} className={btn}>
                    <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </button>
                {nums.map((n, i) =>
                    n === '…' ? (
                        <span key={`e${i}`} className="px-1 text-slate-400">…</span>
                    ) : (
                        <button key={n} type="button" onClick={() => go(n)}
                            className={`h-8 min-w-8 rounded-lg px-2 font-semibold ${n === current ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-white/10'}`}>
                            {n}
                        </button>
                    ),
                )}
                <button type="button" disabled={current >= last} onClick={() => go(current + 1)} className={btn}>
                    Berikutnya <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
