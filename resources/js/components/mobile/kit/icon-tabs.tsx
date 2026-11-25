import { CalendarDays, Newspaper, Package, Ticket, Vote } from 'lucide-react';
import type { ComponentType } from 'react';

export type IconTabKey = 'event' | 'voting' | 'tiket' | 'paket' | 'berita';

const ITEMS: { key: IconTabKey; label: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { key: 'event', label: 'Event', Icon: CalendarDays },
    { key: 'voting', label: 'Voting', Icon: Vote },
    { key: 'tiket', label: 'Tiket', Icon: Ticket },
    { key: 'paket', label: 'Paket', Icon: Package },
    { key: 'berita', label: 'Berita', Icon: Newspaper },
];

type Props = {
    value: IconTabKey;
    onChange: (k: IconTabKey) => void;
    dots?: Partial<Record<IconTabKey, boolean>>;
};

export default function IconTabs({ value, onChange, dots = {} }: Props) {
    return (
        <div role="tablist" className="mx-5 grid grid-cols-5 gap-2">
            {ITEMS.map(({ key, label, Icon }) => {
                const active = value === key;
                return (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(key)}
                        className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
                    >
                        <span
                            className={
                                'relative flex size-14 items-center justify-center rounded-2xl ring-1 transition-all duration-300 ' +
                                (active
                                    ? 'bg-gradient-to-b from-indigo-400 to-indigo-600 text-white shadow-[0_10px_24px_-8px_rgba(99,102,241,0.9)] ring-indigo-300/40'
                                    : 'bg-white text-slate-500 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-400 dark:ring-white/10')
                            }
                        >
                            {active && <span aria-hidden className="absolute inset-x-3 top-0 h-px rounded-full bg-white/60" />}
                            <Icon className="size-6" strokeWidth={active ? 2 : 1.7} />
                            {dots[key] && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-sky-400 ring-2 ring-white dark:ring-[#0a0c1a]" />}
                        </span>
                        <span className={'text-[11px] font-medium transition-colors ' + (active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400')}>
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
