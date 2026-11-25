// apply-events.mjs: halaman Event HP, gaya Premium Elegant indigo.
// Menulis ulang pages/events-mobile.tsx dan mengekspor Empty + EventRows dari home/panels.tsx.
// Props EventsMobile tidak berubah, jadi pages/events.tsx (web) tidak tersentuh.
// Semua pemeriksaan jalan dulu; kalau ada yang gagal, tidak ada berkas yang diubah.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const M = path.join(root, 'resources/js/components/mobile');
const PANELS = path.join(M, 'home/panels.tsx');
const EVENTS = path.join(M, 'pages/events-mobile.tsx');
const SOFT = path.join(M, 'kit/soft.ts');
const WEBPAGE = path.join(root, 'resources/js/pages/events.tsx');

const stop = (m) => {
    console.error('BERHENTI: ' + m);
    process.exit(1);
};
const read = (p) => {
    if (!fs.existsSync(p)) stop('tidak ada: ' + path.relative(root, p) + ' (jalankan dari ~/Projects/simpleindonesia)');
    return fs.readFileSync(p, 'utf8');
};

const NEW_EVENTS = String.raw`import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { EventCard } from '@/components/landing/event-section';
import { Empty, EventRows } from '../home/panels';
import { CARD, FIELD, LUX_CSS, MUTED, PRESS } from '../kit/soft';

type Paginated = {
    data: EventCard[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};
type Category = { key: string; label: string; count: number };
type Query = { q?: string; kategori?: string; page?: number };

type Props = {
    events: Paginated;
    categories: Category[];
    total: number;
    filters: { q: string; kategori: string };
    q: string;
    setQ: (v: string) => void;
    onVisit: (p: Query) => void;
};

const chip = (active: boolean): string =>
    'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium ' +
    PRESS +
    ' ' +
    (active ? 'bg-indigo-600 text-white dark:bg-indigo-500' : CARD + ' text-slate-700 dark:text-slate-200');

const navBtn = 'flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium text-slate-900 disabled:opacity-40 dark:text-white ' + CARD + ' ' + PRESS;

/** Daftar event HP: cari, chip kategori, daftar baris, paginasi. Dibungkus PublicScreen oleh halamannya. */
export default function EventsMobile({ events, categories, total, filters, q, setQ, onVisit }: Props) {
    const kategori = filters.kategori;
    const go = (page: number): void => {
        onVisit({ q, kategori, page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-4">
            <style>{LUX_CSS}</style>

            <label className={'flex h-12 items-center gap-3 rounded-full px-5 ' + FIELD}>
                <Search className={'size-[18px] shrink-0 ' + MUTED} />
                <input
                    type="search"
                    value={q}
                    onChange={(ev) => setQ(ev.target.value)}
                    placeholder="Cari event atau lokasi"
                    className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400"
                />
            </label>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                <button type="button" onClick={() => onVisit({ q })} className={chip(!kategori)}>
                    Semua
                    <span className="opacity-70">{total}</span>
                </button>
                {categories.map((c: Category) => (
                    <button key={c.key} type="button" onClick={() => onVisit({ q, kategori: c.key })} className={chip(kategori === c.key)}>
                        {c.label}
                        <span className="opacity-70">{c.count}</span>
                    </button>
                ))}
            </div>

            {events.data.length === 0 ? (
                <Empty icon={<CalendarDays className="size-6" strokeWidth={1.5} />} text="Tidak ada event yang cocok dengan pencarian atau kategori ini." />
            ) : (
                <>
                    <p className={'px-1 text-xs ' + MUTED}>
                        {events.from && events.to ? 'Menampilkan ' + events.from + '–' + events.to + ' dari ' + events.total + ' event' : events.total + ' event'}
                    </p>

                    <div key={events.current_page + '|' + kategori + '|' + q}>
                        <EventRows list={events.data} base="/events/" withKind />
                    </div>

                    {events.last_page > 1 && (
                        <nav aria-label="Paginasi" className="flex items-center justify-between gap-3 pt-2">
                            <button type="button" disabled={events.current_page <= 1} onClick={() => go(events.current_page - 1)} className={navBtn}>
                                <ChevronLeft className="size-4" />
                                Sebelumnya
                            </button>
                            <span className={'text-xs ' + MUTED}>
                                {events.current_page} / {events.last_page}
                            </span>
                            <button type="button" disabled={events.current_page >= events.last_page} onClick={() => go(events.current_page + 1)} className={navBtn}>
                                Berikutnya
                                <ChevronRight className="size-4" />
                            </button>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
}
`;

// ---- Pemeriksaan (tidak menulis apa pun) ----
const soft = read(SOFT);
for (const k of ['export const CARD', 'export const FIELD', 'export const MUTED', 'export const PRESS', 'export const LUX_CSS', 'export const GROUP'])
    if (!soft.includes(k)) stop('kit/soft.ts bukan versi Premium Elegant (tidak ada: ' + k + ')');

const web = read(WEBPAGE);
if (!web.includes('EventsMobile') || !web.includes('onVisit={visit}')) stop('pages/events.tsx tidak memakai EventsMobile seperti yang diduga');

let panels = read(PANELS);
const done = panels.includes('export function EventRows') && panels.includes('export function Empty');
const A = 'function Empty({ icon, text }';
const B = 'function EventRows({ list, base }: { list: EventCard[]; base: string }) {';
const C = 'lines={[eventRange(e.starts_at, e.ends_at), e.location]}';
const count = (s, sub) => s.split(sub).length - 1;

if (!done) {
    for (const [name, sub] of [['Empty', A], ['EventRows', B], ['baris lines EventRows', C]])
        if (count(panels, sub) !== 1) stop('home/panels.tsx: potongan "' + name + '" ditemukan ' + count(panels, sub) + 'x (harus 1x). Tidak ada yang diubah.');

    panels = panels.replace(A, 'export ' + A);
    panels = panels.replace(
        B,
        [
            "const kind = (e: EventCard) => (e.is_series ? (e.sub_count ? 'Rangkaian · ' + e.sub_count + ' acara' : 'Rangkaian') : e.category);",
            '',
            '/** Daftar event berbaris: dipakai beranda, voting, dan halaman Event. withKind menambah baris kategori. */',
            'export function EventRows({ list, base, withKind }: { list: EventCard[]; base: string; withKind?: boolean }) {',
        ].join('\n'),
    );
    panels = panels.replace(C, 'lines={[eventRange(e.starts_at, e.ends_at), e.location, withKind ? kind(e) : null]}');
}

// ---- Menulis ----
let n = 0;
if (!done) {
    fs.writeFileSync(PANELS, panels);
    n++;
}
const prev = fs.existsSync(EVENTS) ? fs.readFileSync(EVENTS, 'utf8') : '';
if (prev !== NEW_EVENTS) {
    fs.writeFileSync(EVENTS, NEW_EVENTS);
    n++;
}
console.log(n === 0 ? 'OK: semuanya sudah terpasang, tidak ada yang berubah' : 'OK: ' + n + ' berkas ditulis (events-mobile.tsx' + (done ? '' : ', home/panels.tsx') + ')');
