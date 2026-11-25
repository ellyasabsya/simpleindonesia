#!/usr/bin/env node
// apply-home.mjs: beranda HP dengan ritme baru.
// Mengubah 2 berkas: mobile/pages/home-mobile.tsx (hero ramping) dan mobile/home/panels.tsx (EventPanel baru).
// Aman dijalankan dua kali. Kalau berkas tidak sesuai dugaan, berhenti tanpa mengubah apa pun.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const HOME = path.join(root, 'resources/js/components/mobile/pages/home-mobile.tsx');
const PANELS = path.join(root, 'resources/js/components/mobile/home/panels.tsx');
const stop = (m) => {
    console.error('BERHENTI: ' + m);
    process.exit(1);
};

for (const f of [HOME, PANELS]) if (!fs.existsSync(f)) stop('berkas tidak ada: ' + path.relative(root, f) + ' (jalankan dari folder simpleindonesia)');

let home = fs.readFileSync(HOME, 'utf8');
let panels = fs.readFileSync(PANELS, 'utf8');

if (panels.includes('function FeaturedCard') && !home.includes('Dipercaya oleh 500+')) {
    console.log('OK: sudah terpasang, tidak ada yang berubah');
    process.exit(0);
}

// ---------- panels.tsx ----------
const P_ICON_OLD = "import { CalendarDays, Check, ChevronDown, Newspaper, Ticket, Trophy } from 'lucide-react';";
const P_ICON_NEW = "import { CalendarDays, Check, ChevronDown, Layers, MapPin, Newspaper, Ticket, Trophy } from 'lucide-react';";
const P_POSTER_OLD = "import PosterCard, { eventRange } from '../kit/poster-card';";
const P_POSTER_NEW = "import { eventRange } from '../kit/poster-card';";
const P_START = '/** Event: satu poster utuh sebagai sorotan';
const P_END = 'export function VotingPanel';

if (!panels.includes(P_ICON_OLD)) stop('impor lucide-react di panels.tsx tidak sesuai dugaan. Pastikan apply-events.mjs sudah dijalankan.');
if (!panels.includes(P_POSTER_OLD)) stop('impor PosterCard di panels.tsx tidak sesuai dugaan.');
const ps = panels.indexOf(P_START);
const pe = panels.indexOf(P_END);
if (ps < 0 || pe < 0 || pe < ps) stop('blok EventPanel di panels.tsx tidak ditemukan.');
if (!panels.includes('export function EventRows')) stop('panels.tsx belum punya EventRows. Jalankan dulu: node apply-events.mjs');

const NEW_PANEL = String.raw`const PALETTES = [
    { bg: 'from-indigo-100 via-violet-50 to-sky-100 dark:from-indigo-950 dark:via-[#15173a] dark:to-slate-900', ink: 'text-indigo-700 dark:text-indigo-200' },
    { bg: 'from-sky-100 via-cyan-50 to-indigo-100 dark:from-sky-950 dark:via-[#10203a] dark:to-slate-900', ink: 'text-sky-700 dark:text-sky-200' },
    { bg: 'from-violet-100 via-fuchsia-50 to-indigo-100 dark:from-violet-950 dark:via-[#1d1538] dark:to-slate-900', ink: 'text-violet-700 dark:text-violet-200' },
    { bg: 'from-emerald-100 via-teal-50 to-sky-100 dark:from-emerald-950 dark:via-[#0f2a2e] dark:to-slate-900', ink: 'text-emerald-700 dark:text-emerald-200' },
];

const initialsOf = (t: string) =>
    t.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

const dateParts = (s: string | null) => {
    if (!s) return null;
    const d = new Date(s.length > 10 ? s : s + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    return { d: d.getDate(), m: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d) };
};

/** Gambar sampul 16:10. Poster tampil utuh di atas latar buram; tanpa poster: gradasi lembut + inisial. */
function Cover({ e, big }: { e: EventCard; big?: boolean }) {
    const pal = PALETTES[e.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length];

    return (
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-neutral-800">
            {e.poster ? (
                <>
                    <img src={e.poster} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full scale-125 object-cover opacity-80 blur-2xl" />
                    <img src={e.poster} alt={e.title} loading="lazy" className="relative size-full object-contain" />
                </>
            ) : (
                <div className={'absolute inset-0 flex items-center justify-center bg-gradient-to-br ' + pal.bg}>
                    <span aria-hidden className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.2)_1px,transparent_1px)] bg-[length:14px_14px]" />
                    <span
                        className={
                            'relative flex items-center justify-center rounded-2xl bg-white/80 font-semibold tracking-tight ring-1 ring-slate-900/5 dark:bg-white/10 dark:ring-white/10 ' +
                            pal.ink +
                            (big ? ' size-16 text-2xl' : ' size-12 text-lg')
                        }
                    >
                        {initialsOf(e.title)}
                    </span>
                </div>
            )}

            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white ring-1 ring-white/20 backdrop-blur-md">
                <span className={'size-1.5 rounded-full ' + DOT[e.status.key]} />
                {e.status.label}
            </span>
            {big && e.is_series && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Layers className="size-3.5" />
                    {e.sub_count ? e.sub_count + ' acara' : 'Rangkaian'}
                </span>
            )}
        </div>
    );
}

/** Sorotan: kartu lanskap, blok tanggal di kiri, judul dan lokasi di kanan. */
function FeaturedCard({ e }: { e: EventCard }) {
    const dp = dateParts(e.starts_at);
    const multi = !!e.ends_at && e.ends_at !== e.starts_at;
    const label = kind(e);

    return (
        <Link href={e.href ?? '/events/' + (e.slug ?? e.id)} className={'block overflow-hidden rounded-3xl ' + CARD + ' ' + PRESS}>
            <Cover e={e} big />
            <div className="flex items-start gap-3.5 p-4">
                {dp && (
                    <span className={'flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl leading-none ' + FIELD}>
                        <span className="text-[17px] font-semibold text-slate-900 dark:text-white">{dp.d}</span>
                        <span className={'mt-1 text-[11px] font-medium ' + MUTED}>{dp.m}</span>
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[18px] leading-tight font-semibold tracking-tight text-slate-900 dark:text-white">{e.title}</h3>
                    <div className={'mt-1.5 space-y-0.5 text-xs font-medium ' + MUTED}>
                        {multi && (
                            <p className="flex items-center gap-1.5">
                                <CalendarDays className="size-3.5 shrink-0" />
                                {eventRange(e.starts_at, e.ends_at)}
                            </p>
                        )}
                        {e.location && (
                            <p className="flex min-w-0 items-center gap-1.5">
                                <MapPin className="size-3.5 shrink-0" />
                                <span className="truncate">{e.location}</span>
                            </p>
                        )}
                    </div>
                    {label && <p className="mt-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">{label}</p>}
                </div>
            </div>
        </Link>
    );
}

/** Kartu rak: lebar sekitar 72% layar, kartu berikutnya mengintip dari kanan. */
function ShelfCard({ e }: { e: EventCard }) {
    const range = eventRange(e.starts_at, e.ends_at);

    return (
        <Link href={e.href ?? '/events/' + (e.slug ?? e.id)} className={'block w-[72%] shrink-0 snap-start overflow-hidden rounded-3xl ' + CARD + ' ' + PRESS}>
            <Cover e={e} />
            <div className="p-3.5">
                <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-slate-900 dark:text-white">{e.title}</h3>
                <p className={'mt-1 truncate text-xs ' + MUTED}>{[range, e.location].filter(Boolean).join(' · ')}</p>
            </div>
        </Link>
    );
}

function Heading({ children }: { children: ReactNode }) {
    return <h2 className="mt-7 mb-3 px-1 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">{children}</h2>;
}

/** Event: satu sorotan lanskap, rak geser "Segera dimulai", lalu daftar baris. */
export function EventPanel({ events }: { events: EventCard[] }) {
    const [hero, ...others] = events;
    if (!hero) return <Empty icon={<CalendarDays className="size-6" strokeWidth={1.5} />} text="Belum ada event" />;

    const soon = others.filter((e) => e.status.key === 'segera').slice(0, 4);
    const rest = others.filter((e) => !soon.includes(e)).slice(0, 3);

    return (
        <div>
            <FeaturedCard e={hero} />

            {soon.length > 0 && (
                <>
                    <Heading>Segera dimulai</Heading>
                    <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                        {soon.map((e) => (
                            <ShelfCard key={e.id} e={e} />
                        ))}
                    </div>
                </>
            )}

            {rest.length > 0 && (
                <>
                    <Heading>Event lainnya</Heading>
                    <EventRows list={rest} base="/events/" />
                </>
            )}

            <More href="/events" label="Lihat semua event" />
        </div>
    );
}

`;

// ---------- home-mobile.tsx ----------
const H_ICON_OLD = "import { ArrowRight, Award, Moon, Search, Sun, Ticket } from 'lucide-react';";
const H_ICON_NEW = "import { Award, Moon, Search, Sun, Ticket } from 'lucide-react';";
const H_START = '{/* Tamu: satu kartu ajakan ringkas';
if (!home.includes(H_ICON_OLD)) stop('impor lucide-react di home-mobile.tsx tidak sesuai dugaan.');
const hs = home.indexOf(H_START);
const hm = home.indexOf('Dipercaya oleh 500+ organizer');
if (hs < 0 || hm < 0 || hm < hs) stop('blok hero di home-mobile.tsx tidak ditemukan.');
const hSec = home.indexOf('</section>', hm);
const hEnd = hSec < 0 ? -1 : home.indexOf(')}', hSec);
if (hEnd < 0) stop('penutup blok hero tidak ditemukan.');

const I = ' '.repeat(20);
const NEW_HERO = [
    '{/* Tamu: ajakan satu baris, bukan hero landing page. */}',
    I + '{!user && (',
    I + '    <section className="relative mx-5 mt-5 flex items-center gap-4 overflow-hidden rounded-3xl bg-[radial-gradient(120%_140%_at_100%_0%,rgba(129,140,248,0.34),transparent_60%),linear-gradient(160deg,#312e81,#0a0c1a)] px-5 py-4 text-white ring-1 ring-indigo-300/25">',
    I + '        <div className="min-w-0 flex-1">',
    I + '            <h1 className="text-[17px] leading-snug font-semibold tracking-tight">Temukan event yang kamu suka</h1>',
    I + '            <p className="mt-1 text-xs leading-relaxed text-slate-300">Pendaftaran, penilaian juri, dan publikasi event dalam satu platform.</p>',
    I + '        </div>',
    I + '        <Link',
    I + '            href="/register"',
    I + "            className={'relative flex h-10 shrink-0 items-center overflow-hidden rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(99,102,241,0.8)] ' + PRESS}",
    I + '        >',
    I + '            <span aria-hidden className="lux-sheen" />',
    I + '            Daftar',
    I + '        </Link>',
    I + '    </section>',
    I + ')}',
].join('\n');

// ---------- tulis (semua cek lulus) ----------
panels = panels.replace(P_ICON_OLD, () => P_ICON_NEW).replace(P_POSTER_OLD, () => P_POSTER_NEW);
const ps2 = panels.indexOf(P_START);
const pe2 = panels.indexOf(P_END);
panels = panels.slice(0, ps2) + NEW_PANEL + panels.slice(pe2);

home = home.replace(H_ICON_OLD, () => H_ICON_NEW);
const hs2 = home.indexOf(H_START);
const hEnd2 = home.indexOf(')}', home.indexOf('</section>', home.indexOf('Dipercaya oleh 500+ organizer'))) + 2;
home = home.slice(0, hs2) + NEW_HERO + home.slice(hEnd2);

fs.writeFileSync(PANELS, panels);
fs.writeFileSync(HOME, home);
console.log('OK: 2 berkas ditulis (home/panels.tsx, pages/home-mobile.tsx)');
