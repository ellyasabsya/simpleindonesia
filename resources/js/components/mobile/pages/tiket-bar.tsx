import { Link, usePage } from '@inertiajs/react';
import { Ticket as TicketIcon } from 'lucide-react';
import { GraduationCap, Landmark, LayoutGrid, Medal, Music, Palette, PartyPopper, Search, Sparkles, Trophy, Users, type LucideIcon } from 'lucide-react';
import { LUX_CSS, PRESS } from '../kit/soft';

type Props = {
    q: string;
    setQ: (v: string) => void;
    cats: [string, number][];
    cat: string;
    setCat: (v: string) => void;
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

/** Pengganti app bar di halaman Semua Tiket: pencarian + chip kategori, menempel di atas saat digulir. */
export default function TiketBar({ q, setQ, cats, cat, setCat }: Props) {
    const { auth } = usePage<{ auth?: { user?: unknown } }>().props;
    return (
        <header
            data-mobile-appbar="tickets"
            className="sticky top-0 z-30 space-y-3 bg-[#f4f6fc] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-[#0a0c1a]"
        >
            <style>{LUX_CSS}</style>
            <form
                onSubmit={(ev) => ev.preventDefault()}
                className="flex h-12 items-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-indigo-100 dark:bg-white/10 dark:ring-white/10"
            >
                <label className="flex min-w-0 flex-1 items-center gap-3 pl-3">
                    <Search className="size-5 shrink-0 text-indigo-500 dark:text-indigo-300" strokeWidth={1.75} />
                    <input
                        type="search"
                        value={q}
                        onChange={(ev) => setQ(ev.target.value)}
                        placeholder="Cari tiket atau lokasi"
                        className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400"
                    />
                </label>
                <button
                    type="submit"
                    className={'relative h-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-600 px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(99,102,241,0.8)] ' + PRESS}
                >
                    <span aria-hidden className="lux-sheen" />
                    Cari
                </button>
            </form>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                {auth?.user && (
                    <Link
                        href="/tiket"
                        className={'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-3.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-white/10 dark:text-indigo-200 dark:ring-white/15 ' + PRESS}
                    >
                        <TicketIcon className="size-4" strokeWidth={1.75} />
                        Tiket saya
                    </Link>
                )}
                <Chip active={!cat} label="Semua" Icon={LayoutGrid} onClick={() => setCat('')} />
                {cats.map(([c]) => (
                    <Chip key={c} active={cat === c} label={c} Icon={iconFor(c)} onClick={() => setCat(c)} />
                ))}
            </div>
        </header>
    );
}
