import { Link, usePage } from '@inertiajs/react';
import { Building2, CalendarDays, CheckCircle2, Circle, ClipboardList, Clock, Inbox, Ticket, Trophy, User, Vote, Zap } from 'lucide-react';
import UserLayout from '@/components/user/user-layout';

type Step = { label: string; done: boolean; href?: string };
type Recent = { id: number; title: string; institution: string | null; starts_at: string; status: 'pending' | 'published' | 'rejected' };
type Props = {
    hasPanel: boolean;
    institution: { id: number; name: string; status: string } | null;
    institutionCount: number;
    summary: { total: number; published: number; pending: number; rejected: number; publishRate: number };
    nearest: { title: string; starts_at: string } | null;
    recent: Recent[];
    steps: Step[];
};

const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const statusBadge = {
    published: { label: 'Tayang', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200', dot: 'bg-emerald-500' },
    pending: { label: 'Diproses', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200', dot: 'bg-amber-500' },
    rejected: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200', dot: 'bg-rose-500' },
};

function greeting() {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 18) return 'Selamat sore';
    return 'Selamat malam';
}

export default function Dashboard({ hasPanel, institution, institutionCount, summary, nearest, recent, steps }: Props) {
    const name = usePage<{ auth?: { user?: { name?: string } } }>().props.auth?.user?.name ?? 'Pengguna';

    const doneCount = steps.filter((s) => s.done).length;
    const percent = Math.round((doneCount / steps.length) * 100);
    const circumference = 2 * Math.PI * 42;
    const eventHref = hasPanel ? '/panel/event' : '/lembaga/daftar';

    const shortcuts = [
        { label: 'Event', note: 'Semua event', icon: CalendarDays, color: 'from-indigo-500 to-blue-600', href: eventHref },
        { label: 'Ticketing', note: 'Segera hadir', icon: Ticket, color: 'from-amber-400 to-orange-500' },
        { label: 'Voting', note: 'Segera hadir', icon: Vote, color: 'from-emerald-400 to-teal-500' },
        { label: 'Lomba saya', note: 'Segera hadir', icon: Trophy, color: 'from-pink-500 to-rose-500' },
    ];

    const stats = [
        { label: 'Lembaga', value: institutionCount, note: 'Terdaftar atas akun Anda', icon: Building2, color: 'from-indigo-500 to-violet-600' },
        { label: 'Total event', value: summary.total, note: 'Semua pengajuan', icon: CalendarDays, color: 'from-sky-400 to-blue-500' },
        { label: 'Tayang', value: summary.published, note: 'Terlihat oleh publik', icon: CheckCircle2, color: 'from-emerald-400 to-green-500' },
        { label: 'Dalam proses', value: summary.pending, note: 'Menunggu review admin', icon: Clock, color: 'from-amber-400 to-orange-500' },
    ];

    const bar = [
        { v: summary.published, c: 'bg-emerald-500' },
        { v: summary.pending, c: 'bg-amber-500' },
        { v: summary.rejected, c: 'bg-rose-500' },
    ];

    return (
        <UserLayout title="Dashboard" hasPanel={hasPanel}>
            <section>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold shadow-sm dark:bg-white/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
                    {greeting()}, <span className="title-gradient">{name}</span>
                </h1>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">Pantau lembaga dan event Anda di satu tempat.</p>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {shortcuts.map(({ label, note, icon: Icon, color, href }) => {
                    const body = (
                        <>
                            <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                                <Icon className="h-6 w-6" />
                            </span>
                            <span>
                                <span className="block font-extrabold">{label}</span>
                                <span className="block text-sm text-slate-500 dark:text-slate-400">{note}</span>
                            </span>
                        </>
                    );
                    return href ? (
                        <Link key={label} href={href} className={`${card} flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md`}>{body}</Link>
                    ) : (
                        <div key={label} className={`${card} flex items-center gap-4 p-4 opacity-70`}>{body}</div>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-8 text-white shadow-xl shadow-indigo-900/20">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Ringkasan event</p>
                    <p className="mt-3 flex items-end gap-3">
                        <span className="text-6xl font-extrabold leading-none">{summary.total}</span>
                        <span className="pb-1 text-lg text-slate-300">total pengajuan</span>
                    </p>

                    <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-white/10">
                        {summary.total > 0 && bar.map((b, i) => <div key={i} className={b.c} style={{ width: `${(b.v / summary.total) * 100}%` }} />)}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Tayang <b>{summary.published}</b></span>
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Dalam proses <b>{summary.pending}</b></span>
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Ditolak <b>{summary.rejected}</b></span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tingkat tayang</p>
                            <p className="mt-1 text-2xl font-extrabold">{summary.publishRate}%</p>
                            <p className="text-sm text-slate-400">dari total pengajuan</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Perlu perhatian</p>
                            <p className="mt-1 text-2xl font-extrabold">{summary.rejected}</p>
                            <p className="text-sm text-slate-400">event ditolak</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Event terdekat</p>
                            <p className="mt-1 text-xl font-extrabold">{nearest ? fmt(nearest.starts_at) : '-'}</p>
                            <p className="truncate text-sm text-slate-400">{nearest?.title ?? 'Belum ada jadwal'}</p>
                        </div>
                    </div>
                </section>

                <section className={`${card} p-6`}>
                    <div className="flex items-center gap-5">
                        <div className="relative h-24 w-24 shrink-0">
                            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-white/10" />
                                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round" stroke="url(#g)" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} />
                                <defs>
                                    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="100%" stopColor="#7c3aed" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold">{percent}%</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold">Langkah memulai</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{doneCount === steps.length ? 'Semua langkah selesai 🎉' : `${doneCount} dari ${steps.length} langkah selesai`}</p>
                        </div>
                    </div>

                    <ul className="mt-5 space-y-3">
                        {steps.map((s) => {
                            const row = (
                                <span className="flex items-center gap-3">
                                    {s.done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />}
                                    <span className={s.done ? 'text-slate-400 line-through' : 'font-semibold'}>{s.label}</span>
                                </span>
                            );
                            return <li key={s.label}>{!s.done && s.href ? <Link href={s.href} className="block hover:text-indigo-700 dark:hover:text-indigo-300">{row}</Link> : row}</li>;
                        })}
                    </ul>
                </section>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({ label, value, note, icon: Icon, color }) => (
                    <div key={label} className={`${card} flex items-start justify-between p-5`}>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="mt-2 text-4xl font-extrabold">{value}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{note}</p>
                        </div>
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}><Icon className="h-5 w-5" /></span>
                    </div>
                ))}
            </div>

            <section>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-600/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold">Peserta</p>
                                <p className="mt-3 text-5xl font-extrabold">0</p>
                                <p className="mt-1 text-blue-50/90">Total pendaftaran event</p>
                            </div>
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20"><User className="h-6 w-6" /></span>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2 text-sm">
                            {['Menunggu', 'Disetujui', 'Ditolak', 'Dibatalkan'].map((t) => <span key={t} className="rounded-full bg-white/20 px-3 py-1">{t}: 0</span>)}
                        </div>
                    </div>
                    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-lg shadow-indigo-900/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold">Juri</p>
                                <p className="mt-3 text-5xl font-extrabold">—</p>
                                <p className="mt-1 text-slate-300">Data penugasan juri belum tersedia</p>
                            </div>
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><ClipboardList className="h-6 w-6" /></span>
                        </div>
                        <p className="mt-5 text-sm text-slate-300">Penugasan akan muncul setelah penyelenggara menambahkan Anda sebagai juri.</p>
                    </div>
                </div>
            </section>

            <section className={`${card} p-6`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-extrabold">Riwayat Interaksi</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Aktivitas Anda sebagai peserta maupun juri.</p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">0 aktivitas</span>
                </div>
                <div className="flex flex-col items-center py-10 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-white/10"><Inbox className="h-7 w-7" /></span>
                    <p className="mt-4 font-extrabold">Belum ada riwayat pendaftaran</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aktivitas pendaftaran event akan muncul di sini.</p>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <section className={`${card} p-6`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-extrabold">Event terbaru</h3>
                        {hasPanel && <Link href="/panel/event" className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Lihat semua →</Link>}
                    </div>
                    {recent.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 dark:text-slate-400">Belum ada event. {hasPanel ? 'Ajukan event pertama Anda.' : 'Daftarkan lembaga untuk mulai mengajukan event.'}</p>
                    ) : (
                        <ul className="mt-4 divide-y divide-slate-200/70 dark:divide-white/10">
                            {recent.map((e) => {
                                const b = statusBadge[e.status];
                                const row = (
                                    <>
                                        <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-white/10">
                                            <CalendarDays className="h-5 w-5" />
                                            <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${b.dot}`} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-extrabold">{e.title}</span>
                                            <span className="block text-sm text-slate-500 dark:text-slate-400">{e.institution} · {fmt(e.starts_at)}</span>
                                        </span>
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${b.style}`}>{b.label}</span>
                                    </>
                                );
                                return (
                                    <li key={e.id}>
                                        <div className="flex items-center gap-4 py-3">{row}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <div className="space-y-5">
                    <section className={`${card} p-6`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-extrabold">Lembaga saya</h3>
                            <Link href={hasPanel ? '/panel/profil' : '/lembaga/daftar'} className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Kelola</Link>
                        </div>
                        {institution ? (
                            <div className="mt-4 flex items-center gap-4">
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 text-lg font-bold text-white">{institution.name.charAt(0).toUpperCase()}</span>
                                <div>
                                    <p className="font-extrabold">{institution.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {institution.status === 'approved' ? 'Terverifikasi' : institution.status === 'pending' ? 'Menunggu verifikasi' : 'Belum disetujui'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Belum ada lembaga.</p>
                        )}
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <Link href={hasPanel ? '/panel/ajukan' : '/lembaga/daftar'} className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-4 text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5">
                            <Zap className="h-6 w-6" />
                            <p className="mt-5 font-extrabold">{hasPanel ? 'Ajukan event' : 'Daftar lembaga'}</p>
                            <p className="text-sm text-blue-50/90">{hasPanel ? 'Buat pengajuan baru' : 'Langkah pertama'}</p>
                        </Link>
                        <Link href={hasPanel ? '/panel' : '/'} className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-4 text-white shadow-lg shadow-indigo-900/20 transition hover:-translate-y-0.5">
                            <Building2 className="h-6 w-6" />
                            <p className="mt-5 font-extrabold">{hasPanel ? 'Panel lembaga' : 'Halaman utama'}</p>
                            <p className="text-sm text-slate-300">{hasPanel ? 'Kelola event' : 'Lihat landing page'}</p>
                        </Link>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
