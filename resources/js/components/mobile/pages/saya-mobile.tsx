import { Link } from '@inertiajs/react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Gavel, Lock, MapPin, Trophy } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '../kit/empty-state';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

const head = (title: string, sub?: string) => (
    <header className="space-y-1 px-1">
        <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{title}</h1>
        {sub && <p className={'text-[13px] leading-relaxed ' + MUTED}>{sub}</p>}
    </header>
);

const nav = 'flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium text-slate-900 disabled:opacity-40 dark:text-white ' + CARD + ' ' + PRESS;

/* ---------- Hasil lomba ---------- */
type HasilRow = { rank: number | null; code: string; final: number | null; mine: boolean };

export function HasilMobile({ event_title, mode, rows }: { event_title: string; mode: 'hidden' | 'own' | 'all'; rows: HasilRow[] }) {
    return (
        <div className="space-y-5 pb-4">
            {head('Hasil lomba', event_title)}
            {mode === 'hidden' || rows.length === 0 ? (
                <EmptyState icon={Trophy} title="Hasil belum dibuka" text="Panitia akan menampilkan hasil setelah penilaian selesai." />
            ) : (
                <div className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl dark:divide-white/10 ' + CARD}>
                    {rows.map((r) => (
                        <div key={r.code} className={'flex items-center gap-3.5 px-4 py-3 ' + (r.mine ? 'bg-indigo-500/[0.08]' : '')}>
                            <span className={'flex size-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-semibold ' + (r.rank === 1 ? 'bg-indigo-600 text-white dark:bg-indigo-500' : FIELD + ' text-indigo-700 dark:text-indigo-300')}>
                                {r.rank ?? '-'}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] font-medium">{r.code}</span>
                                {r.mine && <span className="block text-xs font-medium text-indigo-700 dark:text-indigo-300">Anda</span>}
                            </span>
                            <span className={'shrink-0 text-[15px] font-semibold ' + (r.final === null ? MUTED : '')}>{r.final ?? 'Belum lengkap'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---------- Panel juri ---------- */
type JuriRow = { id: number; event: string; parent: string | null; category: string | null; token: string; total: number; done: number; status: 'selesai' | 'berjalan' | 'belum' | 'kosong'; locked: boolean };

export function JuriMobile({ rows, pending }: { rows: JuriRow[]; pending: string[] }) {
    const finished = rows.filter((r) => r.status === 'selesai').length;
    const left = rows.length - finished;
    const pct = rows.length ? Math.round((finished / rows.length) * 100) : 0;
    const groups = new Map<string, { event: string; parent: string | null; items: JuriRow[] }>();
    rows.forEach((r) => {
        const k = (r.parent ?? '') + '|' + r.event;
        const g = groups.get(k) ?? { event: r.event, parent: r.parent, items: [] };
        g.items.push(r);
        groups.set(k, g);
    });
    const allDone = (g: { items: JuriRow[] }) => g.items.every((x) => x.status === 'selesai');
    const list = Array.from(groups.values()).sort((x, y) => Number(allDone(x)) - Number(allDone(y)));
    const IND = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';

    return (
        <div className="space-y-4 pb-4">
            {head('Panel juri')}
            {rows.length === 0 ? (
                <EmptyState icon={Gavel} title="Belum ada tugas penilaian" text="Tugas muncul di sini setelah panitia menugaskan Anda ke sebuah kategori." />
            ) : (
                <>
                    <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 text-white dark:to-violet-600">
                        <span className="grid size-[68px] shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#fff ' + pct * 3.6 + 'deg, rgba(255,255,255,.25) 0deg)' }}>
                            <span className="grid size-[52px] place-items-center rounded-full bg-indigo-600 text-sm font-semibold">{pct}%</span>
                        </span>
                        <div className="min-w-0">
                            <div className="text-[26px] leading-none font-semibold">{finished}<span className="text-base font-medium text-white/70"> / {rows.length}</span></div>
                            <div className="mt-1 text-xs text-white/80">{left === 0 ? 'Semua tugas penilaian selesai' : left + ' tugas masih menunggu penilaian Anda'}</div>
                        </div>
                    </div>

                    {list.map((g) => (
                        <div key={g.parent + '|' + g.event} className={'overflow-hidden rounded-3xl ' + CARD}>
                            <div className="px-4 pt-3.5 pb-2">
                                {g.parent && <p className={'truncate text-[11px] font-medium ' + MUTED}>{g.parent}</p>}
                                <h2 className="text-[16px] leading-snug font-semibold">{g.event}</h2>
                            </div>
                            <div className="divide-y divide-slate-900/[0.07] border-t border-slate-900/[0.07] dark:divide-white/10 dark:border-white/10">
                                {g.items.map((r) => {
                                    const done = r.status === 'selesai';
                                    const p = r.total ? Math.round((r.done / r.total) * 100) : 0;
                                    const info = r.status === 'kosong' ? 'Belum ada peserta' : done ? 'Selesai · ' + r.total + ' peserta' : r.done + '/' + r.total + ' peserta dinilai';
                                    return (
                                        <a key={r.id} href={'/juri/' + r.token} className={'flex items-center gap-3 px-4 py-3 ' + PRESS}>
                                            <span className={'flex size-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ' + (done ? 'bg-emerald-500 text-white' : IND)}>
                                                {done ? <Check className="size-5" /> : p + '%'}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[15px] font-medium">{r.category ? 'Kategori ' + r.category : 'Semua peserta'}</span>
                                                <span className={'block truncate text-xs ' + MUTED}>{info}</span>
                                            </span>
                                            {r.locked && <Lock className={'size-3.5 shrink-0 ' + MUTED} />}
                                            {!done && r.status !== 'kosong' && (
                                                <span className="shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white dark:bg-indigo-500">{r.status === 'berjalan' ? 'Lanjutkan' : 'Nilai'}</span>
                                            )}
                                            <ChevronRight className={'size-4 shrink-0 ' + MUTED} />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}
            {pending.length > 0 && <p className={'rounded-3xl p-4 text-[13px] leading-relaxed ' + FIELD + ' ' + MUTED}>Menunggu penugasan kategori dari panitia: {pending.join(', ')}.</p>}
        </div>
    );
}

/* ---------- Event saya ---------- */
type LombaRow = { key?: string; ticket_url?: string | null; id: number; status: string; title: string | null; category: string | null; location: string | null; starts_at: string | null; poster: string | null; can_results?: boolean; rules_url?: string | null };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const PER_PAGE = 6;

export function LombaMobile({ rows }: { rows: LombaRow[] }) {
    const [page, setPage] = useState(1);
    const last = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const current = Math.min(page, last);
    const visible = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);
    const go = (n: number) => {
        setPage(Math.min(Math.max(1, n), last));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-5 pb-4">
            {head('Event saya', 'Semua event yang Anda ikuti.')}
            {rows.length === 0 ? (
                <EmptyState icon={Trophy} title="Belum ada event yang diikuti" text="Event yang Anda daftar akan muncul di sini." />
            ) : (
                <div className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl dark:divide-white/10 ' + CARD}>
                    {visible.map((r) => (
                        <div key={r.key ?? r.id} className="flex gap-3.5 p-3.5">
                            <span className={'flex aspect-[4/5] w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl text-slate-500 ' + FIELD}>
                                {r.poster ? <img src={r.poster} alt="" loading="lazy" className="size-full object-cover" /> : <Trophy className="size-6" strokeWidth={1.5} />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <span className="mb-0.5 inline-block text-[11px] font-medium text-emerald-700 capitalize dark:text-emerald-300">{r.status}</span>
                                <h2 className="line-clamp-2 text-[15px] leading-snug font-semibold">{r.title ?? '(event dihapus)'}</h2>
                                {r.category && <p className={'truncate text-xs ' + MUTED}>{r.category}</p>}
                                <p className={'mt-1 flex items-center gap-1.5 text-xs ' + MUTED}>
                                    <CalendarDays className="size-3.5 shrink-0" />
                                    {fmt(r.starts_at)}
                                </p>
                                {r.location && (
                                    <p className={'flex min-w-0 items-center gap-1.5 text-xs ' + MUTED}>
                                        <MapPin className="size-3.5 shrink-0" />
                                        <span className="truncate">{r.location}</span>
                                    </p>
                                )}
                                {r.rules_url && (
                                    <Link href={r.rules_url} className={'mt-2 mr-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-[13px] font-medium text-white dark:bg-indigo-500 ' + PRESS}>
                                        Lihat aturan
                                    </Link>
                                )}
                                {r.ticket_url && (
                                    <Link href={r.ticket_url} className="mt-2 mr-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-900 px-4 text-[13px] font-medium text-white dark:bg-white dark:text-slate-900">
                                        Lihat tiket
                                    </Link>
                                )}
                                {r.can_results && (
                                    <Link href={'/event-saya/' + r.id + '/hasil'} className={'mt-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-[13px] font-medium text-white dark:bg-indigo-500 ' + PRESS}>
                                        <Trophy className="size-4" />
                                        Lihat hasil
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {last > 1 && (
                <nav aria-label="Paginasi" className="flex items-center justify-between gap-3 pt-2">
                    <button type="button" disabled={current <= 1} onClick={() => go(current - 1)} className={nav}>
                        <ChevronLeft className="size-4" />
                        Sebelumnya
                    </button>
                    <span className={'text-xs ' + MUTED}>{current} / {last}</span>
                    <button type="button" disabled={current >= last} onClick={() => go(current + 1)} className={nav}>
                        Berikutnya
                        <ChevronRight className="size-4" />
                    </button>
                </nav>
            )}
        </div>
    );
}
