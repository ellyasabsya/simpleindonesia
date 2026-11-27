import { GraduationCap, Landmark, LayoutGrid, Medal, Music, Palette, PartyPopper, Search, Sparkles, Trophy, Users, type LucideIcon } from 'lucide-react';
import { LUX_CSS, PRESS } from '../kit/soft';

type Category = { key: string; label: string; count: number };
type Query = { q?: string; kategori?: string; page?: number };

type Props = {
    q: string;
    setQ: (v: string) => void;
    onVisit: (p: Query) => void;
    categories: Category[];
    kategori: string;
};

const ICONS: [RegExp, LucideIcon][] = [
    [/festival|hibur/, PartyPopper],
    [/lomba|kompetisi|juara/, Trophy],
    [/seminar|workshop|pelatihan|edukasi/, GraduationCap],
    [/olahraga|sport/, Medal],
    [/seni|budaya/, Palette],
    [/musik|konser/, Music],
    [/pameran|expo/, Landmark],
    [/komunitas|sosial/, Users],
];

const iconFor = (label: string): LucideIcon => ICONS.find(([re]) => re.test(label.toLowerCase()))?.[1] ?? Sparkles;

function Chip({ active, label, Icon, onClick }: { active: boolean; label: string; Icon: LucideIcon; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={
                'relative inline-flex h-10 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold ' +
                PRESS +
                ' ' +
                (active
                    ? 'bg-gradient-to-b from-indigo-400 to-indigo-600 text-white shadow-[0_8px_20px_-8px_rgba(99,102,241,0.8)]'
                    : 'bg-white text-slate-600 ring-1 ring-indigo-100 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10')
            }
        >
            {active && <span aria-hidden className="lux-sheen" />}
            <Icon className={'size-4 ' + (active ? 'text-white' : 'text-indigo-500 dark:text-indigo-300')} strokeWidth={1.75} />
            {label}
        </button>
    );
}

/** Pengganti app bar di halaman Semua Event: pencarian + chip kategori, menempel di atas saat digulir. */
export default function EventsBar({ q, setQ, onVisit, categories, kategori }: Props) {
    return (
        <header
            data-mobile-appbar="events"
            className="sticky top-0 z-30 space-y-3 bg-[#f4f6fc] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-[#0a0c1a]"
        >
            <style>{LUX_CSS}</style>
            <form
                onSubmit={(ev) => {
                    ev.preventDefault();
                    onVisit({ q, kategori });
                }}
                className="flex h-12 items-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-indigo-100 dark:bg-white/10 dark:ring-white/10"
            >
                <label className="flex min-w-0 flex-1 items-center gap-3 pl-3">
                    <Search className="size-5 shrink-0 text-indigo-500 dark:text-indigo-300" strokeWidth={1.75} />
                    <input
                        type="search"
                        value={q}
                        onChange={(ev) => setQ(ev.target.value)}
                        placeholder="Cari event atau lokasi"
                        className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400"
                    />
                </label>
                <button
                    type="submit"
                    className={'relative h-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-600 px-5 text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(99,102,241,0.8)] ' + PRESS}
                >
                    <span aria-hidden className="lux-sheen" />
                    Cari
                </button>
            </form>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                <Chip active={!kategori} label="Semua" Icon={LayoutGrid} onClick={() => onVisit({ q })} />
                {categories.map((c) => (
                    <Chip key={c.key} active={kategori === c.key} label={c.label} Icon={iconFor(c.label)} onClick={() => onVisit({ q, kategori: c.key })} />
                ))}
            </div>
        </header>
    );
}
