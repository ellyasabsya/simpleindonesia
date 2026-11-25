import { usePlatform } from '../use-platform';

type Option<T extends string> = { value: T; label: string; badge?: number };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (v: T) => void };

const ACTIVE = 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 dark:bg-indigo-500';

/** Pemilih tab: segmented control iOS, atau segmented button Material; tab aktif memakai warna merek. */
export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
    const ios = usePlatform() === 'ios';

    return (
        <div className={ios ? 'flex rounded-[10px] bg-slate-200/80 p-0.5 dark:bg-white/10' : 'flex overflow-hidden rounded-full border border-slate-300 bg-white dark:border-white/20 dark:bg-slate-900'}>
            {options.map((o, i) => {
                const on = o.value === value;
                const cls = ios
                    ? `flex flex-1 items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-semibold ${on ? ACTIVE : 'text-slate-700 dark:text-slate-200'}`
                    : `flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-semibold ${i > 0 && !on ? 'border-l border-slate-200 dark:border-white/10' : ''} ${on ? ACTIVE : 'text-slate-700 dark:text-slate-200'}`;
                return (
                    <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cls}>
                        {o.label}
                        {o.badge !== undefined && o.badge > 0 && <span className={`rounded-full px-1.5 text-[11px] font-bold text-white ${on ? 'bg-white/30' : 'bg-rose-600'}`}>{o.badge}</span>}
                    </button>
                );
            })}
        </div>
    );
}
