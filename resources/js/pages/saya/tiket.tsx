import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, MapPin, QrCode, Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import UserLayout from '@/components/user/user-layout';

type Holder = { code: string; holder_name: string; checked_in: boolean };
type Row = {
    id: number; code: string; quantity: number; total_price: number; status: string;
    title: string | null; location: string | null; starts_at: string | null; poster?: string | null;
    tickets?: Holder[];
};
type Item = { r: Row; h: Holder; index: number; total: number };

const PER_PAGE = 6;

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-');
const rp = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
const label = 'text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500';

function pageList(current: number, last: number): (number | '…')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    const set = new Set([1, last, current - 1, current, current + 1]);
    const nums = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    nums.forEach((n, i) => {
        if (i > 0 && n - nums[i - 1] > 1) out.push('…');
        out.push(n);
    });
    return out;
}

function TicketCard({ r, h, index, total }: Item) {
    return (
        <a
            href={`/tiket/${h.code}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-indigo-900/10 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-900/20 dark:border-white/10 dark:bg-slate-900"
        >
            <div className="flex items-stretch">
                <div className="relative aspect-[4/5] w-[42%] shrink-0 self-start overflow-hidden bg-slate-900">
                    {r.poster ? (
                        <>
                            <img src={r.poster} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-xl" />
                            <img src={r.poster} alt={r.title ?? 'Event'} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600">
                            <Ticket className="h-12 w-12 text-white/30" />
                        </div>
                    )}
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold capitalize text-emerald-700 shadow">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {r.status}
                    </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5">
                    <div className="min-w-0">
                        <p className={label}>E-Ticket · {index + 1} dari {total}</p>
                        <h2 className="mt-1.5 line-clamp-2 text-xl font-extrabold leading-tight">{r.title ?? '(event dihapus)'}</h2>
                        <div className="mt-3 space-y-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                            <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />{fmt(r.starts_at)}</p>
                            {r.location && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /><span className="line-clamp-2">{r.location}</span></p>}
                        </div>
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-3 dark:border-white/10">
                        <p className={label}>Pemegang tiket</p>
                        <p className="mt-0.5 truncate text-base font-extrabold">{h.holder_name}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-5 border-t-2 border-dashed border-indigo-300/60 bg-gradient-to-r from-indigo-950 via-indigo-900 to-blue-900 px-5 py-4 text-white">
                <div className={`shrink-0 rounded-2xl bg-white p-2.5 shadow-lg ${h.checked_in ? 'opacity-40 grayscale' : ''}`}>
                    <QRCodeSVG value={h.code} size={92} />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    {h.checked_in ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200"><Check className="h-3.5 w-3.5" /> Sudah check-in</span>
                    ) : (
                        <p className="text-sm font-bold">Tunjukkan QR ini saat check-in</p>
                    )}
                    <p className="font-mono text-xs tracking-widest text-white/60">{r.code}</p>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-sky-200 transition group-hover:bg-white/20 sm:inline-flex">
                    <QrCode className="h-3.5 w-3.5" /> Buka tiket
                </span>
            </div>
        </a>
    );
}

function Pagination({ page, last, from, to, count, onChange }: { page: number; last: number; from: number; to: number; count: number; onChange: (p: number) => void }) {
    const btn = 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition';
    return (
        <nav aria-label="Halaman tiket" className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menampilkan {from}–{to} dari {count} tiket</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={`${btn} gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200`}>
                    <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Sebelumnya</span>
                </button>
                {pageList(page, last).map((n, i) =>
                    n === '…' ? (
                        <span key={`gap${i}`} className="px-1 text-slate-400">…</span>
                    ) : (
                        <button
                            key={n}
                            type="button"
                            aria-current={n === page ? 'page' : undefined}
                            onClick={() => onChange(n)}
                            className={`${btn} ${n === page ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-900/20' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200'}`}
                        >
                            {n}
                        </button>
                    ),
                )}
                <button type="button" disabled={page >= last} onClick={() => onChange(page + 1)} className={`${btn} gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200`}>
                    <span className="hidden sm:inline">Berikutnya</span> <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </nav>
    );
}

export default function Tiket({ rows = [] }: { rows?: Row[] }) {
    const items: Item[] = rows.flatMap((r) => (r.tickets ?? []).map((h, index) => ({ r, h, index, total: r.tickets!.length })));
    const pending = rows.filter((r) => !r.tickets || r.tickets.length === 0);
    const last = Math.max(1, Math.ceil(items.length / PER_PAGE));

    const [page, setPage] = useState<number>(() => {
        if (typeof window === 'undefined') return 1;
        const p = parseInt(new URLSearchParams(window.location.search).get('page') ?? '1', 10);
        return Number.isFinite(p) && p > 0 ? p : 1;
    });
    const current = Math.min(page, last);
    const listRef = useRef<HTMLDivElement>(null);
    const first = useRef(true);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (current > 1) url.searchParams.set('page', String(current));
        else url.searchParams.delete('page');
        window.history.replaceState(window.history.state, '', url.toString());
        if (first.current) {
            first.current = false;
            return;
        }
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [current]);

    const start = (current - 1) * PER_PAGE;
    const slice = items.slice(start, start + PER_PAGE);

    const groups: { r: Row; list: Item[] }[] = [];
    slice.forEach((it) => {
        const g = groups[groups.length - 1];
        if (g && g.r.id === it.r.id) g.list.push(it);
        else groups.push({ r: it.r, list: [it] });
    });

    return (
        <UserLayout title="Tiket saya" hasPanel={false}>
            <div className="w-full space-y-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold">Tiket saya</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">Tiket yang sudah Anda beli. Tunjukkan QR di pintu masuk.</p>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-white/10">
                        <Ticket className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-bold">Belum ada tiket</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Tiket yang Anda beli akan muncul di sini setelah pembayaran disetujui.</p>
                    </div>
                ) : (
                    <div ref={listRef} className="scroll-mt-24 space-y-10">
                        {pending.map((r) => (
                            <p key={r.id} className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-white/10">
                                Tiket untuk pesanan <span className="font-mono font-bold">{r.code}</span> sedang diproses.
                            </p>
                        ))}

                        {groups.map((g) => (
                            <section key={`${g.r.id}-${g.list[0].index}`} className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
                                    <p className="font-bold text-slate-500 dark:text-slate-400">Pesanan <span className="ml-1 font-mono tracking-wider text-slate-800 dark:text-white">{g.r.code}</span></p>
                                    <p className="font-semibold text-slate-500 dark:text-slate-400">{g.r.quantity} tiket · {rp(g.r.total_price)}</p>
                                </div>
                                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                                    {g.list.map((it) => <TicketCard key={it.h.code} {...it} />)}
                                </div>
                            </section>
                        ))}

                        {last > 1 && (
                            <Pagination page={current} last={last} from={start + 1} to={start + slice.length} count={items.length} onChange={setPage} />
                        )}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
