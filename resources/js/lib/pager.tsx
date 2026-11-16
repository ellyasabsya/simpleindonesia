import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';

export function usePaged<T>(items: T[], size: number) {
    const [page, setPage] = useState(1);
    const pages = Math.max(1, Math.ceil(items.length / size));
    const cur = Math.min(page, pages);
    useEffect(() => { setPage(1); }, [items.length]);
    return { rows: items.slice((cur - 1) * size, cur * size), page: cur, pages, setPage, total: items.length, size };
}

const nav = 'flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-bold transition disabled:opacity-40';

export function Pager({ page, pages, total, size, setPage }: { page: number; pages: number; total: number; size: number; setPage: (n: number) => void }) {
    if (pages <= 1) return null;
    const from = (page - 1) * size + 1;
    const to = Math.min(page * size, total);
    const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
    return (
        <nav className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{from}–{to} dari {total}</p>
            <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className={`${nav} bg-slate-100 hover:bg-slate-200 dark:bg-white/10`}><ChevronLeft className="h-4 w-4" /></button>
                {nums.map((n, i) => (
                    <Fragment key={n}>
                        {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                        <button onClick={() => setPage(n)} className={`${nav} ${n === page ? 'bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10'}`}>{n}</button>
                    </Fragment>
                ))}
                <button disabled={page === pages} onClick={() => setPage(page + 1)} className={`${nav} bg-slate-100 hover:bg-slate-200 dark:bg-white/10`}><ChevronRight className="h-4 w-4" /></button>
            </div>
        </nav>
    );
}
