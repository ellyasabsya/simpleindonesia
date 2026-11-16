import { usePage } from '@inertiajs/react';
import { AlertCircle, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Toast() {
    const pg = usePage().props as any;
    const [item, setItem] = useState<{ text: string; ok: boolean } | null>(null);

    useEffect(() => {
        const ok = pg.flash?.success as string | undefined;
        const bad = (pg.errors?.code ?? pg.flash?.error) as string | undefined;
        const next = ok ? { text: ok, ok: true } : bad ? { text: bad, ok: false } : null;
        setItem(next);
        if (!next) return;
        const t = setTimeout(() => setItem(null), 4000);
        return () => clearTimeout(t);
    }, [pg.flash, pg.errors]);

    if (!item) return null;
    return (
        <div className="fixed right-4 top-24 z-[60] flex max-w-sm items-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${item.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {item.ok ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </span>
            <p className="text-sm font-semibold">{item.text}</p>
            <button onClick={() => setItem(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
    );
}
