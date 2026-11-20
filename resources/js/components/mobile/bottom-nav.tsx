import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    Building2,
    CalendarDays,
    Menu,
    Newspaper,
    Ticket,
    Vote,
    Wallet,
} from 'lucide-react';
import {
    useEffect,
    useState,
    type ComponentType,
    type ReactNode,
} from 'react';

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

type Item = {
    label: string;
    href: string;
    icon: IconType;
    exact?: boolean;
    reload?: boolean;
    need?: string[];
};

function HomeIcon({
    className,
    strokeWidth = 2,
}: {
    className?: string;
    strokeWidth?: number;
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5.5 10v9.5h13V10" />
            <path d="M10 19.5v-5h4v5" />
        </svg>
    );
}

const PUBLIC_HOME: Item = {
    label: 'Beranda',
    href: '/',
    icon: HomeIcon,
    exact: true,
};
const PUBLIC_LEFT: Item[] = [
    { label: 'Event', href: '/events', icon: CalendarDays },
    { label: 'Tiket', href: '/tickets', icon: Ticket },
];
const PUBLIC_RIGHT: Item[] = [
    { label: 'Voting', href: '/voting', icon: Vote },
    { label: 'Berita', href: '/berita', icon: Newspaper },
];

const USER_HOME: Item = { label: 'Dashboard', href: '/dashboard', icon: HomeIcon };
const USER_LEFT: Item[] = [
    { label: 'Event', href: '/events', icon: CalendarDays },
    { label: 'Tiket', href: '/tiket', icon: Ticket },
];
const USER_RIGHT: Item[] = [
    { label: 'Sertifikat', href: '/sertifikat-saya', icon: Award, reload: true },
];

const PANEL_HOME: Item = {
    label: 'Ringkasan',
    href: '/panel',
    icon: HomeIcon,
    exact: true,
};
const PANEL_LEFT: Item[] = [
    {
        label: 'Event',
        href: '/panel/event',
        icon: CalendarDays,
        need: ['events', 'checkin'],
    },
    {
        label: 'Pendapatan',
        href: '/panel/pendapatan',
        icon: Wallet,
        need: ['finance', 'withdraw'],
    },
];

const FIELD =
    'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="file"]):not([type="range"]), textarea, select, [contenteditable="true"]';

// Lubang setengah lingkaran di tengah bar tempat tombol Beranda "duduk".
const NOTCH =
    'radial-gradient(circle 38px at 50% 4px, transparent 37px, #000 38.5px)';

// Sembunyikan bar saat keyboard layar terbuka agar tidak melayang di atas keyboard.
function useTyping() {
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const onIn = (e: FocusEvent) => {
            clearTimeout(timer);
            if (e.target instanceof Element && e.target.matches(FIELD)) {
                setTyping(true);
            }
        };
        const onOut = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const el = document.activeElement;
                setTyping(el instanceof Element && el.matches(FIELD));
            }, 80);
        };
        document.addEventListener('focusin', onIn);
        document.addEventListener('focusout', onOut);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('focusin', onIn);
            document.removeEventListener('focusout', onOut);
        };
    }, []);

    return typing;
}

const isActive = (path: string, item: Item) =>
    item.exact
        ? path === item.href
        : path === item.href || path.startsWith(`${item.href}/`);

const ROW =
    'flex h-16 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 transition-colors';

const tone = (active: boolean) =>
    active
        ? 'text-blue-600 dark:text-cyan-300'
        : 'text-slate-500 dark:text-slate-400';

function Label({ active, children }: { active: boolean; children: ReactNode }) {
    return (
        <>
            <span
                className={`text-[11px] leading-none ${
                    active ? 'font-bold' : 'font-medium'
                }`}
            >
                {children}
            </span>
            <span
                aria-hidden="true"
                className={`h-1 w-7 rounded-full transition-colors ${
                    active ? 'bg-current' : 'bg-transparent'
                }`}
            />
        </>
    );
}

function Tab({ item, path }: { item: Item; path: string }) {
    const active = isActive(path, item);
    const Icon = item.icon;
    const cls = `${ROW} ${tone(active)}`;
    const inner = (
        <>
            <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={active ? 2.4 : 1.8}
            />
            <Label active={active}>{item.label}</Label>
        </>
    );

    return item.reload ? (
        <a
            href={item.href}
            className={cls}
            aria-current={active ? 'page' : undefined}
        >
            {inner}
        </a>
    ) : (
        <Link
            href={item.href}
            className={cls}
            aria-current={active ? 'page' : undefined}
        >
            {inner}
        </Link>
    );
}

function Shell({
    home,
    left,
    right,
    onMenu,
}: {
    home: Item;
    left: Item[];
    right: Item[];
    onMenu?: () => void;
}) {
    const { url } = usePage();
    const path = url.split('?')[0].split('#')[0];
    const typing = useTyping();
    const homeActive = isActive(path, home);
    const HomeI = home.icon;

    return (
        <nav
            aria-label="Navigasi utama"
            data-mobile-nav
            className={`fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 transition-transform duration-200 [filter:drop-shadow(0_10px_22px_rgba(49,46,129,0.22))] motion-reduce:transition-none md:hidden dark:[filter:drop-shadow(0_10px_22px_rgba(0,0,0,0.6))] print:hidden ${
                typing ? 'translate-y-[calc(100%+4rem)]' : ''
            }`}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 rounded-[28px] border border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/95"
                style={{ WebkitMaskImage: NOTCH, maskImage: NOTCH }}
            />

            <div className="relative grid grid-cols-[1fr_4.75rem_1fr]">
                <div className="flex min-w-0">
                    {left.map((item) => (
                        <Tab key={item.href} item={item} path={path} />
                    ))}
                </div>

                <Link
                    href={home.href}
                    aria-label={home.label}
                    aria-current={homeActive ? 'page' : undefined}
                    className="group relative block h-16 touch-manipulation"
                >
                    <span
                        className="absolute -top-[26px] left-1/2 flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-full text-white ring-[3px] ring-white/90 transition-transform group-active:scale-95 dark:ring-slate-900"
                        style={{
                            backgroundImage:
                                'linear-gradient(135deg, #22d3ee 0%, #3b82f6 48%, #4f46e5 100%)',
                            boxShadow: homeActive
                                ? '0 10px 24px -4px rgba(79,70,229,0.6), 0 0 0 7px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.5)'
                                : '0 10px 24px -4px rgba(79,70,229,0.55), inset 0 1px 0 rgba(255,255,255,0.5)',
                        }}
                    >
                        <HomeI className="h-7 w-7" strokeWidth={2.2} />
                    </span>
                    <span
                        className={`absolute inset-x-0 bottom-2 text-center text-[11px] leading-none ${
                            homeActive
                                ? 'font-bold text-blue-600 dark:text-cyan-300'
                                : 'font-medium text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        {home.label}
                    </span>
                </Link>

                <div className="flex min-w-0">
                    {right.map((item) => (
                        <Tab key={item.href} item={item} path={path} />
                    ))}
                    {onMenu && (
                        <button
                            type="button"
                            onClick={onMenu}
                            className={`${ROW} ${tone(false)}`}
                        >
                            <Menu
                                className="h-[22px] w-[22px]"
                                strokeWidth={1.8}
                            />
                            <Label active={false}>Menu</Label>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

type Props = {
    variant: 'public' | 'user' | 'panel';
    hasPanel?: boolean;
    onMenu?: () => void;
};

export default function MobileBottomNav({ variant, hasPanel, onMenu }: Props) {
    const shared = usePage<{
        panelPerms?: string[] | null;
        panelOwner?: boolean;
    }>().props;

    if (variant === 'public') {
        return (
            <Shell
                home={PUBLIC_HOME}
                left={PUBLIC_LEFT}
                right={PUBLIC_RIGHT}
            />
        );
    }

    if (variant === 'user') {
        const last: Item = hasPanel
            ? { label: 'Panel', href: '/panel', icon: Building2 }
            : { label: 'Lembaga', href: '/lembaga/daftar', icon: Building2 };

        return (
            <Shell
                home={USER_HOME}
                left={USER_LEFT}
                right={[...USER_RIGHT, last]}
            />
        );
    }

    const perms = shared.panelPerms ?? null;
    const owner = Boolean(shared.panelOwner);
    const left = PANEL_LEFT.filter(
        (i) =>
            owner ||
            perms === null ||
            !i.need ||
            i.need.some((p) => perms.includes(p)),
    );

    return <Shell home={PANEL_HOME} left={left} right={[]} onMenu={onMenu} />;
}
