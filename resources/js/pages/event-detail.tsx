import { Trophy } from 'lucide-react';
import { Users } from 'lucide-react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarCheck,
    CalendarDays,
    Check,
    ClipboardList,
    Clock,
    FileText,
    Flag,
    Info,
    Layers,
    Mail,
    MapPin,
    MessageCircle,
    Navigation,
    Phone,
    Share2,
    Tag,
    Ticket,
    Trash2,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import Footer from '@/components/landing/footer';
import PageBackground from '@/components/page-background';
import SiteNavbar from '@/components/site-navbar';
import { useAuth } from '@/lib/auth';

type StatusKey = 'selesai' | 'segera' | 'berlangsung';

type Child = {
    id: number;
    title: string;
    category: string | null;
    location: string | null;
    starts_at: string | null;
    ends_at: string | null;
    juknis: string | null;
    registration_fee: number;
    ticket_price?: number | null;
    ticket_open?: boolean;
    ticket_left?: number | null;
    description?: string | null;
    contact?: { name?: string; position?: string; phone?: string; email?: string } | null;
    registration_method?: 'ticket' | 'transfer_manual' | null;
    slug: string;
    poster: string | null;
    quota: number;
    registered: number;
};

type CommentItem = { id: number; body: string; author: string; created_at: string; mine: boolean; reported: boolean };

type Detail = {
    id: number;
    title: string;
    poster: string | null;
    category: string | null;
    organizer: string | null;
    location: string | null;
    starts_at: string | null;
    ends_at: string | null;
    status: { key: StatusKey; label: string };
    description: string | null;
    registration_fee: number;
    registration_method: 'ticket' | 'transfer_manual' | null;
    juknis: string | null;
    contact: { name?: string; position?: string; phone?: string; email?: string } | null;
    children: Child[];
    comments: CommentItem[];
    fee_from?: boolean;
    parent?: { title: string; slug: string } | null;
    siblings?: { id: number; title: string; slug: string }[];
};

type Icon = ComponentType<{ className?: string }>;

const card =
    'rounded-3xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8 dark:border-white/10 dark:bg-slate-900/50';
const infoBox = 'rounded-2xl bg-white/80 p-5 shadow-sm dark:bg-white/5';
const eyebrow = 'flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400';

const longDate = (s: string) =>
    new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${s}T00:00:00`));
const shortDate = (s: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${s}T00:00:00`));
const stamp = (iso: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

const STATUS: Record<StatusKey, { text: (l: string) => string; dot: string; cls: string }> = {
    segera: { text: (l) => `Dimulai ${l}`, dot: 'bg-blue-600', cls: 'text-blue-700 dark:text-blue-300' },
    berlangsung: { text: () => 'Sedang berlangsung', dot: 'bg-emerald-500', cls: 'text-emerald-700 dark:text-emerald-300' },
    selesai: { text: () => 'Sudah selesai', dot: 'bg-slate-400', cls: 'text-slate-600 dark:text-slate-300' },
};

function waLink(phone: string) {
    const d = phone.replace(/\D/g, '');
    return `https://wa.me/${d.startsWith('0') ? `62${d.slice(1)}` : d}`;
}

function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

function dayCount(start: string | null, end: string | null) {
    if (!start) return null;
    if (!end) return 1;
    const diff = Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000);
    return Math.max(diff, 0) + 1;
}

const mapUrl = (loc: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;

function SectionTitle({ icon: Icon, children }: { icon: Icon; children: string }) {
    return (
        <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-800 dark:bg-white/10 dark:text-white">
                <Icon className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold">{children}</h2>
        </div>
    );
}

function Fact({ icon: Icon, label, value, tone, action }: { icon: Icon; label: string; value: string; tone: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 rounded-2xl bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/5">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1.5 break-words text-base font-bold">{value}</p>
                {action}
            </div>
        </div>
    );
}

function Comments({ event }: { event: Detail }) {
    const { user } = useAuth();
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/events/${event.id}/komentar`, { preserveScroll: true, onSuccess: () => reset() });
    };

    const remove = (id: number) => {
        if (confirm('Hapus komentar ini?')) router.delete(`/komentar/${id}`, { preserveScroll: true });
    };

    const report = (id: number) => {
        if (confirm('Laporkan komentar ini ke admin?')) router.post(`/komentar/${id}/lapor`, {}, { preserveScroll: true });
    };

    return (
        <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm md:p-8 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-xl font-bold">Komentar</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Ada pertanyaan soal event ini? Tanyakan di sini.</p>

            {user ? (
                <form onSubmit={submit} className="mt-5">
                    <textarea
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        maxLength={1000}
                        rows={4}
                        placeholder="Tulis komentar..."
                        className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                    />
                    {errors.body && <p className="mt-2 text-sm font-medium text-red-600">{errors.body}</p>}
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">{data.body.length}/1000</span>
                        <button
                            type="submit"
                            disabled={processing || data.body.trim() === ''}
                            className="rounded-xl bg-indigo-900 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        >
                            Kirim
                        </button>
                    </div>
                </form>
            ) : (
                <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:bg-white/5">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Masuk terlebih dahulu untuk menulis komentar.</p>
                    <Link href="/login" className="rounded-xl bg-indigo-900 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-indigo-800">
                        Masuk
                    </Link>
                </div>
            )}

            <div className="mt-8">
                {event.comments.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">Belum ada komentar. Jadilah yang pertama.</p>
                ) : (
                    <ul className="space-y-5">
                        {event.comments.map((c) => (
                            <li key={c.id} className="flex gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 text-xs font-bold text-white">
                                    {initials(c.author)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">{c.author}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{stamp(c.created_at)}</span>
                                        {!c.mine && user && (
                                            <button
                                                onClick={() => report(c.id)}
                                                disabled={c.reported}
                                                className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-default disabled:text-amber-600 disabled:hover:bg-transparent"
                                            >
                                                <Flag className="h-3.5 w-3.5" />
                                                {c.reported ? 'Dilaporkan' : 'Lapor'}
                                            </button>
                                        )}
                                        {c.mine && (
                                            <button
                                                onClick={() => remove(c.id)}
                                                aria-label="Hapus komentar"
                                                className="ml-auto rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">{c.body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

type Participants = {
    registered: number;
    approved: number;
    branches: {
        id: string;
        title: string;
        subtitle: string | null;
        quota: number;
        registered: number;
        approved: number;
        names: { name: string; school: string | null }[];
        info?: { min_age: number | null; max_age: number | null; requirements: string | null; prizes: { rank: string; prize: string }[] };
    }[];
};

function PesertaTab({ data }: { data?: Participants }) {
    const branches = data?.branches ?? [];
    return (
        <section className={card}>
            <SectionTitle icon={Users}>Peserta</SectionTitle>

            {branches.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Kuota peserta belum diatur untuk event ini.</p>
            ) : (
                <div className="mt-8 space-y-4">
                    <p className={eyebrow}>Progres per cabang</p>
                    {branches.map((b) => {
                        const pct = b.quota > 0 ? Math.min(100, Math.round((b.registered / b.quota) * 100)) : 0;
                        return (
                            <div key={b.id} className={infoBox}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-bold">{b.title}</p>
                                        {b.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{b.subtitle}</p>}
                                    </div>
                                    <p className="shrink-0 text-sm font-bold">
                                        {b.registered}{b.quota > 0 ? ` / ${b.quota}` : ''}{' '}
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">peserta</span>
                                    </p>
                                </div>
                                {b.quota > 0 && (
                                    <>
                                        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            {pct}% terisi · {b.approved} disetujui · sisa {Math.max(0, b.quota - b.registered)} slot
                                        </p>
                                    </>
                                )}
                                {b.names.length > 0 && (
                                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                                        {b.names.map((p, i) => (
                                            <li key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 text-[11px] font-bold text-white">
                                                    {initials(p.name)}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-bold">{p.name}</span>
                                                    {p.school && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{p.school}</span>}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                    <p className="text-xs text-slate-500 dark:text-slate-400">Hanya nama dan asal sekolah peserta yang disetujui yang ditampilkan.</p>
                </div>
            )}
        </section>
    );
}

function HadiahTab({ data }: { data?: Participants }) {
    const rows = (data?.branches ?? []).filter((b) => b.info);
    const age = (a: number | null, b: number | null) =>
        a != null && b != null ? `${a}–${b} tahun` : a != null ? `Minimal ${a} tahun` : b != null ? `Maksimal ${b} tahun` : null;
    return (
        <section className={card}>
            <SectionTitle icon={Trophy}>Hadiah</SectionTitle>
            <div className="mt-6 space-y-4">
                {rows.map((b) => {
                    const i = b.info!;
                    const ageText = age(i.min_age, i.max_age);
                    const showSub = b.subtitle && !b.title.toLowerCase().endsWith(b.subtitle.toLowerCase());
                    return (
                        <div key={b.id} className={infoBox}>
                            <p className="text-lg font-bold">{b.title}</p>
                            {showSub && <p className="text-sm text-slate-500 dark:text-slate-400">{b.subtitle}</p>}
                            {i.prizes.length > 0 ? (
                                <ul className="mt-4 divide-y divide-slate-200/70 dark:divide-white/10">
                                    {i.prizes.map((p, k) => (
                                        <li key={k} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                                            <span className="flex items-center gap-2 font-bold"><Trophy className="h-4 w-4 text-amber-500" />{p.rank}</span>
                                            {p.prize && <span className="text-right font-semibold text-slate-700 dark:text-slate-200">{p.prize}</span>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Trophy className="h-4 w-4 text-amber-500" />Memperebutkan Juara 1, 2, dan 3</p>
                            )}
                            {(ageText || i.requirements) && (
                                <div className="mt-4 space-y-1 border-t border-slate-200/70 pt-3 text-sm dark:border-white/10">
                                    {ageText && <p><span className="font-semibold text-slate-500 dark:text-slate-400">Usia: </span><span className="font-bold">{ageText}</span></p>}
                                    {i.requirements && <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">{i.requirements}</p>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

const KEGIATAN_PER_HALAMAN = 8;

function KegiatanTab({ event }: { event: Detail }) {
    const { user } = useAuth();
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('');
    const [limit, setLimit] = useState(KEGIATAN_PER_HALAMAN);
    const money = (n: number) => (n > 0 ? `Rp${new Intl.NumberFormat('id-ID').format(n)}` : 'Gratis');

    const cats = Array.from(new Set(event.children.map((c) => c.category).filter((x): x is string => !!x)));
    const list = event.children.filter((c) => (!cat || c.category === cat) && `${c.title} ${c.location ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
    const shown = list.slice(0, limit);
    const chip = (on: boolean) =>
        `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`;

    return (
        <>
            <section className={card}>
                <SectionTitle icon={Layers}>Rangkaian Kegiatan</SectionTitle>
                <p className="mt-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Event ini terdiri dari {event.children.length} kegiatan. Tiket semua kegiatan dibeli sekaligus lewat tombol di bagian atas halaman.
                </p>
                {(event.children.length > 6 || cats.length > 1) && (
                    <div className="mt-5 space-y-3">
                        {event.children.length > 6 && (
                            <input
                                type="search"
                                value={q}
                                onChange={(e) => { setQ(e.target.value); setLimit(KEGIATAN_PER_HALAMAN); }}
                                placeholder="Cari kegiatan atau lokasi..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
                            />
                        )}
                        {cats.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => { setCat(''); setLimit(KEGIATAN_PER_HALAMAN); }} className={chip(cat === '')}>Semua · {event.children.length}</button>
                                {cats.map((c) => (
                                    <button key={c} type="button" onClick={() => { setCat(c); setLimit(KEGIATAN_PER_HALAMAN); }} className={chip(cat === c)}>
                                        {c} · {event.children.filter((x) => x.category === c).length}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {list.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">Tidak ada kegiatan yang cocok.</p>
            ) : (
                <div className="space-y-3">
                    {shown.map((c) => {
                        const price = c.ticket_price ?? c.registration_fee;
                        const left = c.ticket_left != null ? `sisa ${c.ticket_left} tiket` : c.quota > 0 ? `sisa ${Math.max(0, c.quota - c.registered)} slot` : null;
                        const daftar = !c.ticket_open && c.registration_method === 'transfer_manual';
                        return (
                            <article key={c.id} className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur md:gap-5 md:p-4 dark:border-white/10 dark:bg-slate-900/50">
                                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 md:h-28 md:w-24">
                                    {c.poster && <img src={c.poster} alt={c.title} className="h-full w-full object-cover object-top" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    {c.category && <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">{c.category}</span>}
                                    <h3 className="mt-1 text-lg font-bold">{c.title}</h3>
                                    {c.description && <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{c.description}</p>}
                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-600 dark:text-slate-300">
                                        {c.starts_at && (
                                            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{shortDate(c.starts_at)}{c.ends_at && c.ends_at !== c.starts_at ? ` – ${shortDate(c.ends_at)}` : ''}</span>
                                        )}
                                        {c.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{c.location}</span>}
                                        <span className="inline-flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" />{money(price)}{left ? ` · ${left}` : ''}</span>
                                    </div>
                                    {(daftar || c.juknis) && (
                                        <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                                            {daftar && <a href={user ? `/events/${c.id}/daftar` : `/events/${c.id}/masuk`} className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white">Daftar</a>}
                                            {c.juknis && <a href={c.juknis} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-white/20 dark:text-slate-200">Juknis</a>}
                                        </div>
                                    )}
                                </div>
                                {(daftar || c.juknis) && (
                                    <div className="hidden shrink-0 flex-col gap-2 sm:flex">
                                        {daftar && <a href={user ? `/events/${c.id}/daftar` : `/events/${c.id}/masuk`} className="rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 px-5 py-2.5 text-center text-sm font-bold text-white shadow transition hover:shadow-lg">Daftar</a>}
                                        {c.juknis && <a href={c.juknis} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-5 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10">Juknis</a>}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                    <div className="flex flex-col items-center gap-2 pt-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Menampilkan {shown.length} dari {list.length} kegiatan</p>
                        {shown.length < list.length && (
                            <button type="button" onClick={() => setLimit((n) => n + KEGIATAN_PER_HALAMAN)} className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/5 dark:text-slate-200">Tampilkan lebih banyak</button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function ContactBlock({ contact }: { contact: NonNullable<Detail['contact']> }) {
    return (
        <div className="space-y-4">
            {(contact.name || contact.position) && (
                <div>
                    {contact.name && <p className="text-lg font-bold">{contact.name}</p>}
                    {contact.position && <p className="text-sm text-slate-500 dark:text-slate-400">{contact.position}</p>}
                </div>
            )}
            <div className="flex flex-wrap gap-3">
                {contact.phone && (
                    <>
                        <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10">
                            <Phone className="h-4 w-4 text-indigo-700" />
                            {contact.phone}
                        </a>
                        <a href={waLink(contact.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-600">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                        </a>
                    </>
                )}
                {contact.email && (
                    <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10">
                        <Mail className="h-4 w-4 text-indigo-700" />
                        {contact.email}
                    </a>
                )}
            </div>
        </div>
    );
}

function EventDetailSingle() {
    const { event } = usePage<{ event: Detail }>().props;
    const [tabRaw, setTab] = useState<'kegiatan' | 'info' | 'hadiah' | 'peserta' | 'kontak'>(event.children.length > 0 ? 'kegiatan' : 'info');
    const [copied, setCopied] = useState(false);
    const st = STATUS[event.status.key];
    const single = !event.ends_at || event.ends_at === event.starts_at;
    const days = dayCount(event.starts_at, event.ends_at);
    const parts = (event as unknown as { participants?: Participants }).participants;
    const hasHadiah = !!(event as unknown as { has_competition?: boolean }).has_competition && (parts?.branches ?? []).some((b) => b.info);
    const tab = tabRaw === 'hadiah' && !hasHadiah ? 'info' : tabRaw;
    const { user } = useAuth();

    // Tujuan sementara: ganti dua href ini setelah form pembelian tiket / pendaftaran dibuat.
    const cta =
        event.children.length > 0
            ? event.children.some((c) => c.ticket_open)
                ? { label: 'Beli Tiket', Icon: Ticket, href: `/events/${event.id}/tiket` }
                : { label: 'Pilih kegiatan', Icon: Layers, href: '#kegiatan' }
            : event.registration_method === 'transfer_manual'
            ? { label: 'Daftar', Icon: ClipboardList, href: user ? `/events/${event.id}/daftar` : `/events/${event.id}/masuk` }
            : { label: 'Beli Tiket', Icon: Ticket, href: `/events/${event.id}/tiket` };

    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: event.title, url });
            } else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            /* dibatalkan pengguna */
        }
    };

    const tabBtn = (active: boolean) =>
        `rounded-xl px-6 py-3 text-sm font-bold transition ${
            active
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 hover:text-indigo-900 dark:text-slate-300 dark:hover:text-white'
        }`;

    return (
        <>
            <Head title={`${event.title} - SIMPLE`} />
            <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
                <PageBackground />
                <SiteNavbar />

                <div className="relative z-10">
                    {/* Lebar & padding sama dengan navbar (max-w-7xl, px-6) */}
                    <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
                        <Link
                            href="/events"
                            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-900 dark:text-slate-300 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                            Semua Event
                        </Link>
                        {event.parent && (
                            <div className="mt-4 rounded-2xl border border-white/70 bg-white/60 p-4 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/40">
                                <p className="text-slate-600 dark:text-slate-300">Bagian dari rangkaian <Link href={`/events/${event.parent.slug}`} className="font-bold text-indigo-700 hover:underline dark:text-indigo-300">{event.parent.title}</Link></p>
                                {(event.siblings?.length ?? 0) > 1 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {event.siblings!.map((x) => (
                                            <Link key={x.id} href={`/events/${x.slug}`} className={`rounded-full px-4 py-1.5 text-xs font-bold ${x.id === event.id ? 'bg-indigo-900 text-white' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-white/10 dark:text-slate-200'}`}>{x.title}</Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Kartu utama */}
                        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur md:p-10 dark:border-white/10 dark:bg-slate-900/40">
                            <div className="grid gap-8 md:grid-cols-[22rem_minmax(0,1fr)] md:gap-10">
                                {/* Poster: rasio tetap 4:5, foto menyesuaikan bingkai */}
                                <div className="mx-auto w-full max-w-sm md:max-w-none">
                                    <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-xl dark:bg-slate-800">
                                        {event.poster ? (
                                            <img src={event.poster} alt={event.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
                                                <span className="text-6xl font-bold text-white/90">{initials(event.title)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold dark:border-white/10 dark:bg-white/10 ${st.cls}`}>
                                            <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                                            {st.text(event.status.label)}
                                        </span>
                                        {event.category && (
                                            <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                                                {event.category}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="mt-4 break-words text-3xl font-black leading-tight tracking-tight md:text-5xl">{event.title}</h1>
                                    {event.organizer && (
                                        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                                            diselenggarakan oleh <span className="font-bold text-slate-900 dark:text-white">{event.organizer}</span>
                                        </p>
                                    )}

                                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                        {event.starts_at && (
                                            <div className={infoBox}>
                                                <p className={eyebrow}><CalendarDays className="h-4 w-4 text-indigo-700" />Tanggal Mulai</p>
                                                <p className="mt-3 text-lg font-bold">{longDate(event.starts_at)}</p>
                                                {!single && event.ends_at && (
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">s.d. {longDate(event.ends_at)}</p>
                                                )}
                                            </div>
                                        )}
                                        {event.location && (
                                            <div className={infoBox}>
                                                <p className={eyebrow}><MapPin className="h-4 w-4 text-indigo-700" />Lokasi</p>
                                                <p className="mt-3 text-lg font-bold">{event.location}</p>
                                            </div>
                                        )}
                                        {event.organizer && (
                                            <div className={infoBox}>
                                                <p className={eyebrow}><Building2 className="h-4 w-4 text-indigo-700" />Penyelenggara</p>
                                                <p className="mt-3 text-lg font-bold">{event.organizer}</p>
                                            </div>
                                        )}
                                        <div className={infoBox}>
                                            <p className={eyebrow}><Ticket className="h-4 w-4 text-indigo-700" />Biaya Pendaftaran</p>
                                            <p className="mt-3 text-lg font-bold">
                                                {event.registration_fee > 0 ? `Rp${new Intl.NumberFormat('id-ID').format(event.registration_fee)}` : 'Gratis'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white/70 p-4 sm:flex-row dark:bg-white/5">
                                        {event.status.key === 'selesai' ? (
                                            <span className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-200 py-4 text-sm font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                                                <Ticket className="h-5 w-5" />
                                                Event Sudah Selesai
                                            </span>
                                        ) : (
                                            <a
                                                href={cta.href}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5">
                                                <cta.Icon className="h-5 w-5" />
                                                {cta.label}
                                            </a>
                                        )}
                                        <button
                                            onClick={share}
                                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white"
                                        >
                                            {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Share2 className="h-5 w-5" />}
                                            {copied ? 'Tertaut' : 'Bagikan'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {event.children.length > 0 && !event.children.some((c) => c.ticket_price != null) && (
                            <section id="kegiatan" className="mt-6 scroll-mt-28">
                                <h2 className="text-2xl font-black">Pilih Kegiatan</h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Event ini terdiri dari beberapa kegiatan. Pilih salah satu untuk melihat detail dan mendaftar.</p>
                                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                    {event.children.map((c) => {
                                        const left = Math.max(0, c.quota - c.registered);
                                        return (
                                            <Link key={c.id} href={`/events/${c.slug}`} className="group overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/50">
                                                {c.poster ? (
                                                    <img src={c.poster} alt={c.title} className="aspect-[16/9] w-full object-cover object-top" />
                                                ) : (
                                                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
                                                )}
                                                <div className="space-y-3 p-5">
                                                    {c.category && <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">{c.category}</span>}
                                                    <h3 className="text-xl font-bold">{c.title}</h3>
                                                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                                        {c.starts_at && (
                                                            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{shortDate(c.starts_at)}{c.ends_at && c.ends_at !== c.starts_at ? ` – ${shortDate(c.ends_at)}` : ''}</p>
                                                        )}
                                                        {c.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{c.location}</p>}
                                                        <p className="flex items-center gap-2"><Ticket className="h-4 w-4" />{(c.ticket_price ?? c.registration_fee) > 0 ? `Rp${new Intl.NumberFormat('id-ID').format((c.ticket_price ?? c.registration_fee))}` : 'Gratis'}{c.ticket_left != null ? ` · sisa ${c.ticket_left} tiket` : c.quota > 0 ? ` · sisa ${left} slot` : ''}</p>
                                                    </div>
                                                    <span className="inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow transition group-hover:shadow-lg">Lihat detail</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Tab */}
                        <div className="mt-6 flex gap-1 rounded-2xl border border-white/70 bg-white/60 p-1.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/40">
                            {event.children.length > 0 && <button onClick={() => setTab('kegiatan')} className={tabBtn(tab === 'kegiatan')}>Kegiatan · {event.children.length}</button>}
                            <button onClick={() => setTab('info')} className={tabBtn(tab === 'info')}>Informasi</button>
                            {hasHadiah && <button onClick={() => setTab('hadiah')} className={tabBtn(tab === 'hadiah')}>Hadiah</button>}
                            <button onClick={() => setTab('peserta')} className={tabBtn(tab === 'peserta')}>Peserta</button>
                            <button onClick={() => setTab('kontak')} className={tabBtn(tab === 'kontak')}>Kontak Panitia</button>
                        </div>

                        <div className="mt-6 space-y-6">
                            {tab === 'kegiatan' ? (
                                <KegiatanTab event={event} />
                            ) : tab === 'hadiah' ? (
                                <HadiahTab data={parts} />
                            ) : tab === 'peserta' ? (
                                <PesertaTab data={(event as unknown as { participants?: Participants }).participants} />
                            ) : tab === 'info' ? (
                                <>
                                    <section className={card}>
                                        <SectionTitle icon={Info}>Tentang Event</SectionTitle>
                                        {event.description ? (
                                            <p className="mt-6 whitespace-pre-line break-words text-base leading-8 text-slate-700 dark:text-slate-200">{event.description}</p>
                                        ) : (
                                            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Deskripsi belum tersedia.</p>
                                        )}
                                    </section>
                                    {event.juknis && (
                                        <section id="juknis" className={card}>
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <SectionTitle icon={FileText}>Juknis</SectionTitle>
                                                <a
                                                    href={event.juknis}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10"
                                                >
                                                    <FileText className="h-4 w-4 text-indigo-700" />
                                                    Buka / Unduh PDF
                                                </a>
                                            </div>
                                            <iframe
                                                src={event.juknis}
                                                title="Juknis"
                                                className="mt-6 h-[640px] w-full rounded-2xl border border-slate-200 bg-white dark:border-white/10"
                                            />
                                        </section>
                                    )}




                                    <section className={card}>
                                        <SectionTitle icon={CalendarDays}>Waktu & Tempat</SectionTitle>
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {event.starts_at && (
                                                <Fact icon={CalendarDays} label="Mulai" value={longDate(event.starts_at)} tone="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200" />
                                            )}
                                            {event.ends_at && (
                                                <Fact icon={CalendarCheck} label="Selesai" value={longDate(event.ends_at)} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" />
                                            )}
                                            {days && (
                                                <Fact icon={Clock} label="Durasi" value={days === 1 ? '1 hari' : `${days} hari`} tone="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200" />
                                            )}
                                            {event.location && (
                                                <Fact
                                                    icon={MapPin}
                                                    label="Lokasi"
                                                    value={event.location}
                                                    tone="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                                                    action={
                                                        <a href={mapUrl(event.location)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-700 hover:underline dark:text-indigo-300">
                                                            <Navigation className="h-4 w-4" /> Buka di Peta
                                                        </a>
                                                    }
                                                />
                                            )}
                                            {event.organizer && (
                                                <Fact icon={Building2} label="Penyelenggara" value={event.organizer} tone="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" />
                                            )}
                                            {event.category && (
                                                <Fact icon={Tag} label="Kategori" value={event.category} tone="bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200" />
                                            )}
                                        </div>
                                    </section>
                                </>
                            ) : (
                                <section className={card}>
                                    <SectionTitle icon={Phone}>Kontak Panitia</SectionTitle>
                                    {event.children.some((c) => c.contact) ? (
                                        <div className="mt-6 space-y-8">
                                            {event.contact && <ContactBlock contact={event.contact} />}
                                            {event.children.map((c) =>
                                                c.contact ? (
                                                    <div key={c.id} className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0 dark:border-white/10">
                                                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{c.title}</p>
                                                        <ContactBlock contact={c.contact} />
                                                    </div>
                                                ) : null,
                                            )}
                                        </div>
                                    ) : event.contact ? (
                                        <div className="mt-6 space-y-5">
                                            {(event.contact.name || event.contact.position) && (
                                                <div>
                                                    {event.contact.name && <p className="text-lg font-bold">{event.contact.name}</p>}
                                                    {event.contact.position && <p className="text-sm text-slate-500 dark:text-slate-400">{event.contact.position}</p>}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-3">
                                                {event.contact.phone && (
                                                    <>
                                                        <a href={`tel:${event.contact.phone}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10">
                                                            <Phone className="h-4 w-4 text-indigo-700" />
                                                            {event.contact.phone}
                                                        </a>
                                                        <a href={waLink(event.contact.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-600">
                                                            <MessageCircle className="h-4 w-4" />
                                                            WhatsApp
                                                        </a>
                                                    </>
                                                )}
                                                {event.contact.email && (
                                                    <a href={`mailto:${event.contact.email}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10">
                                                        <Mail className="h-4 w-4 text-indigo-700" />
                                                        {event.contact.email}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Kontak panitia belum tersedia.</p>
                                    )}
                                </section>
                            )}

                            <Comments event={event} />
                        </div>
                    </main>
                    <Footer />
                </div>
            </div>
        </>
    );
}


export default function EventDetail() {
    return <EventDetailSingle />; // patch-249: rangkaian memakai halaman detail biasa
}

// patch-248

// patch-249

// patch-250

// patch-251

// patch-253
