import { usePlatform } from '../use-platform';

type Option<T extends string> = { value: T; label: string; badge?: number };
type Props<T extends string> = { options: Option<T>[]; value: T; onChange: (v: T) => void };

/** Pemilih tab: segmented control iOS, atau segmented button Material 3. */
export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
    const ios = usePlatform() === 'ios';

    return (
        <div
            className={
                ios
                    ? 'flex rounded-[9px] bg-black/[0.06] p-0.5 dark:bg-white/10'
                    : 'flex overflow-hidden rounded-full border border-[#79747e] dark:border-[#938f99]'
            }
        >
            {options.map((o, i) => {
                const on = o.value === value;
                const cls = ios
                    ? `flex flex-1 items-center justify-center gap-1.5 rounded-[7px] py-1.5 text-[13px] font-medium ${on ? 'bg-white text-black shadow-sm dark:bg-[#636366] dark:text-white' : 'text-black/80 dark:text-white/80'}`
                    : `flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-medium ${i > 0 ? 'border-l border-[#79747e] dark:border-[#938f99]' : ''} ${on ? 'bg-[#e8def8] text-[#1d192b] dark:bg-[#4a4458] dark:text-[#e8def8]' : 'text-[#1d1b20] dark:text-[#e6e0e9]'}`;
                return (
                    <button key={o.value} type="button" onClick={() => onChange(o.value)} className={cls}>
                        {o.label}
                        {o.badge !== undefined && o.badge > 0 && (
                            <span className={`rounded-full px-1.5 text-[11px] font-bold text-white ${ios ? 'bg-[#FF3B30]' : 'bg-[#b3261e]'}`}>{o.badge}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
