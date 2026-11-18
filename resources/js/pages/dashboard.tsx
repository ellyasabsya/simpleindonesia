import { Link, router, usePage } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, Bell, Ticket, Vote, Cake, CalendarCheck, CalendarDays, Camera, Check, Copy, Gavel, History, Mail, MapPin, Pencil, Phone, Plus, QrCode, ScanLine, Sparkles, UserPlus, Users, X, type LucideIcon } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import UserLayout from '@/components/user/user-layout';
import { Pager, usePaged } from '@/lib/pager';
import { SocialChips } from '@/lib/socials';

type Role = 'peserta' | 'penyelenggara' | 'juri';
type Item = { id: number | string; role: Role; title: string; subtitle?: string | null; date: string; status?: string | null; tone?: 'ok' | 'wait' | 'bad'; href?: string };
type Friend = { username?: string | null; since?: string | null; id: number | string; name: string; avatar?: string | null; city?: string | null; mutual?: number };
type Invite = { id: number | string; member_id?: number; kind: 'juri' | 'event' | 'teman' | 'lembaga'; from: string; title: string; date?: string | null };
type Props = { history?: Item[]; friends?: Friend[]; invitations?: Invite[] };

const roles: Record<Role, { label: string; verb: string; icon: LucideIcon; grad: string; soft: string; text: string }> = {
    peserta: { label: 'Peserta', verb: 'Event yang diikuti', icon: CalendarCheck, grad: 'from-pink-500 to-rose-500', soft: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-300' },
    penyelenggara: { label: 'Penyelenggara', verb: 'Event diselenggarakan', icon: CalendarDays, grad: 'from-blue-600 to-violet-600', soft: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300' },
    juri: { label: 'Juri', verb: 'Event yang dinilai', icon: Gavel, grad: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
};
type Notif = { id: string; text: string; url?: string | null; read: boolean; at: string };
const quick = [
    { label: 'Event', desc: 'Jelajahi semua event', href: '/events', icon: CalendarDays, grad: 'from-blue-600 to-violet-600' },
    { label: 'Event saya', desc: 'Event yang Anda ikuti', href: '/event-saya', icon: CalendarCheck, grad: 'from-pink-500 to-rose-500' },
    { label: 'Tiket saya', desc: 'Tiket yang Anda beli', href: '/tiket', icon: Ticket, grad: 'from-amber-400 to-orange-500' },
    { label: 'Voting', desc: 'Berikan suara favorit', href: '/voting', icon: Vote, grad: 'from-emerald-400 to-teal-600' },
];
const kinds = { juri: 'Undangan menjadi juri', event: 'Undangan event', teman: 'Permintaan pertemanan', lembaga: 'Undangan bergabung ke lembaga' };

const demoHistory: Item[] = [
    { id: 1, role: 'peserta', title: 'Batam Bernyanyi 2026', subtitle: 'Lomba vokal · Ballroom Hotel Pacific', date: '2026-11-17', status: 'Juara 2' },
    { id: 2, role: 'penyelenggara', title: 'Festival Kuliner Kepri', subtitle: 'Lembaga Seni Batam', date: '2026-09-05', status: 'Tayang' },
    { id: 3, role: 'juri', title: 'Kontes Fotografi Kota', subtitle: 'Menilai 24 peserta', date: '2026-03-20', status: 'Selesai' },
    { id: 4, role: 'peserta', title: 'Lomba Desain Poster', subtitle: 'Kategori umum', date: '2025-10-12', status: 'Finalis' },
];
const demoFriends: Friend[] = [
    { id: 1, name: 'Rina Marlina', city: 'Batam', mutual: 4 },
    { id: 2, name: 'Dedi Pratama', city: 'Tanjungpinang', mutual: 2 },
    { id: 3, name: 'Sari Wulandari', city: 'Batam', mutual: 7 },
];
const demoInvites: Invite[] = [
    { id: 1, kind: 'juri', from: 'Lembaga Seni Batam', title: 'Juri Lomba Vokal Kepri', date: '2026-12-02' },
    { id: 2, kind: 'teman', from: 'Rina Marlina', title: 'ingin berteman dengan Anda' },
];

const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const btn = 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition';
const ghost = `${btn} border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20`;
const primary = `${btn} bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 hover:brightness-110`;

function Avatar({ name, src, className }: { name: string; src?: string | null; className: string }) {
    const ini = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    return src ? (
        <img src={src} alt={name} className={`${className} object-cover`} />
    ) : (
        <span className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-600 to-violet-600 font-extrabold text-white`}>{ini}</span>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-extrabold">{title}</h3>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Scanner({ onResult }: { onResult: (t: string) => void }) {
    const [err, setErr] = useState('');
    useEffect(() => {
        let scanner: any;
        let alive = true;
        import('html5-qrcode').then(({ Html5Qrcode }) => {
            if (!alive) return;
            scanner = new Html5Qrcode('qr-reader');
            scanner
                .start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, (t: string) => onResult(t), () => {})
                .catch(() => setErr('Kamera tidak bisa diakses. Izinkan akses kamera di browser, lalu coba lagi.'));
        });
        return () => {
            alive = false;
            if (scanner?.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {});
        };
    }, []);
    return (
        <div>
            <div id="qr-reader" className="overflow-hidden rounded-2xl bg-slate-900" />
            {err ? <p className="mt-3 text-sm text-rose-500">{err}</p> : <p className="mt-3 text-center text-sm text-slate-500">Arahkan kamera ke QR teman Anda.</p>}
        </div>
    );
}

export default function Dashboard({ history = [], friends = [], invitations = [] }: Props) {
    const pg = usePage().props as any;
    const lembagaReady = Boolean(pg.hasPanel);
    const user = { ...(pg.auth?.user ?? {}), ...(pg.profile ?? {}) };
    const name: string = user.name ?? '';
    const demo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');
    const [tab, setTab] = useState<'riwayat' | 'teman' | 'undangan'>('riwayat');
    const pageUrl = usePage().url;
    useEffect(() => {
        const t = new URLSearchParams(pageUrl.split('?')[1] ?? '').get('tab');
        if (t === 'undangan' || t === 'teman' || t === 'riwayat') setTab(t);
    }, [pageUrl]);
    const [filter, setFilter] = useState<Role | 'semua'>('semua');
    const [modal, setModal] = useState<null | 'qr' | 'scan'>(null);
    const [scanned, setScanned] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [gone, setGone] = useState<(number | string)[]>([]);

    const all = [...(demo && history.length === 0 ? demoHistory : history)].sort((a, b) => b.date.localeCompare(a.date));
    const shown = filter === 'semua' ? all : all.filter((i) => i.role === filter);
    const friendList = demo && friends.length === 0 ? demoFriends : friends;
    const invites = (demo && invitations.length === 0 ? demoInvites : invitations).filter((i) => !gone.includes(i.id));
        const count = (r: Role) => all.filter((i) => i.role === r).length;
    const notifs: Notif[] = pg.notifications ?? [];
    const unread = notifs.filter((n) => !n.read).length;
    const hp = usePaged(shown, 5);
    const fp = usePaged(friendList, 6);
    const ip = usePaged(invites, 5);
    const years = [...new Set(hp.rows.map((i) => i.date.slice(0, 4)))];

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/u/${user.username ?? user.id ?? ''}`;
    const joined = user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : null;

    const checks = [
        { label: 'Foto profil', ok: !!user.avatar },
        { label: 'Bio singkat', ok: !!user.bio },
        { label: 'Kota asal', ok: !!user.city },
        { label: 'Nomor telepon', ok: !!user.phone },
        { label: 'Tanggal lahir', ok: !!user.birth_date },
        { label: 'Media sosial', ok: Object.values(user.socials ?? {}).some(Boolean) },
    ];
    const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

    const info: { icon: LucideIcon; label: string; value?: string | null }[] = [
        { icon: Mail, label: 'Email', value: user.email },
        { icon: Phone, label: 'Telepon', value: user.phone },
        { icon: MapPin, label: 'Kota', value: user.city },
        { icon: Cake, label: 'Lahir', value: user.birth_date ? fmt(user.birth_date) : null },
    ];

    const copy = () => { navigator.clipboard?.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };
    const answer = (i: Invite, ok: boolean) => {
        setGone([...gone, i.id]);
        if (!demo) router.post(i.kind === 'juri' ? `/undangan-juri/${i.member_id}/${ok ? 'terima' : 'tolak'}` : i.kind === 'lembaga' ? `/undangan-lembaga/${i.member_id}/${ok ? 'terima' : 'tolak'}` : `/undangan/${i.id}/${ok ? 'terima' : 'tolak'}`, {}, { preserveScroll: true });
    };
    const closeModal = () => { setModal(null); setScanned(null); };
    const openRole = (r: Role) => { setTab('riwayat'); setFilter(filter === r ? 'semua' : r); };

    return (
        <UserLayout title="Profil" hasPanel>
            <section className={`${card} overflow-hidden`}>
                <div className="relative h-24 overflow-hidden bg-gradient-to-r from-indigo-900 via-blue-600 to-fuchsia-500 sm:h-28">
                    {user.avatar && <img src={user.avatar} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />}
                    <span className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
                    <span className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="px-6 pb-6 sm:px-8">
                    <div className="relative z-10 -mt-14 flex flex-wrap items-end justify-between gap-4">
                        <Avatar name={name} src={user.avatar} className="h-28 w-28 rounded-[1.8rem] text-4xl shadow-2xl ring-4 ring-white dark:ring-slate-900" />
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setModal('qr')} className={ghost}><QrCode className="h-4 w-4" /> Kartu QR</button>
                            <button onClick={() => setModal('scan')} className={ghost}><ScanLine className="h-4 w-4" /> Pindai</button>
                            <Link href="/profil/edit" className={primary}><Pencil className="h-4 w-4" /> Edit profil</Link>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h1 className="text-3xl font-extrabold sm:text-4xl"><span className="title-gradient">{name}</span></h1>
                        {user.username && <p className="mt-0.5 text-sm font-semibold text-slate-500 dark:text-slate-400">@{user.username}</p>}
                    </div>
                    {user.bio ? (
                        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{user.bio}</p>
                    ) : (
                        <Link href="/profil/edit" className="mt-3 inline-block text-sm italic text-indigo-600 hover:underline dark:text-indigo-300">Belum ada bio. Ceritakan siapa Anda →</Link>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        {user.city && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-semibold dark:bg-white/10"><MapPin className="h-3.5 w-3.5 text-rose-500" /> {user.city}</span>}
                        <SocialChips socials={user.socials} />
                        {joined && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-semibold dark:bg-white/10"><CalendarDays className="h-3.5 w-3.5 text-indigo-500" /> Bergabung {joined}</span>}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(Object.keys(roles) as Role[]).map((r) => {
                            const c = roles[r]; const Icon = c.icon; const on = tab === 'riwayat' && filter === r;
                            return (
                                <button key={r} onClick={() => openRole(r)} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${on ? 'border-indigo-300 bg-white ring-4 ring-indigo-100 dark:border-indigo-400/40 dark:bg-white/10 dark:ring-indigo-500/10' : 'border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5'}`}>
                                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.grad} text-white shadow-md`}><Icon className="h-5 w-5" /></span>
                                    <span><span className="block text-2xl font-extrabold leading-none">{count(r)}</span><span className="mt-1 block text-xs font-bold">{c.label}</span></span>
                                </button>
                            );
                        })}
                        <button onClick={() => setTab('teman')} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md"><Users className="h-5 w-5" /></span>
                            <span><span className="block text-2xl font-extrabold leading-none">{friendList.length}</span><span className="mt-1 block text-xs font-bold">Teman</span></span>
                        </button>
                    </div>
                </div>
            </section>

            <section className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quick.map((q) => {
                    const Icon = q.icon;
                    return (
                        <Link key={q.label} href={q.href} className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/50">
                            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${q.grad} text-white shadow-md`}><Icon className="h-6 w-6" /></span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-lg font-extrabold leading-tight">{q.label}</span>
                                <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{q.desc}</span>
                            </span>
                            <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                        </Link>
                    );
                })}
            </section>

            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                <aside className="space-y-6">
                    <div className={`${card} p-6`}>
                        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Data diri</h2>{pct < 100 && <Link href="/profil/edit" className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{pct}% lengkap</Link>}</div>
                        <ul className="space-y-3">
                            {info.map(({ icon: Icon, label, value }) => (
                                <li key={label} className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-white/10 dark:text-indigo-300"><Icon className="h-4 w-4" /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">{label}</span>
                                        {value ? <span className="block truncate text-sm font-semibold">{value}</span> : <Link href="/profil/edit" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">+ Tambah</Link>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-white/10">
                            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Media sosial</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(user.socials ?? {}).some(Boolean) ? <SocialChips socials={user.socials} /> : <Link href="/profil/edit" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300">+ Tambah</Link>}
                            </div>
                        </div>
                    </div>

                    <div className={`${card} flex items-center gap-4 p-5`}>
                        <div className="rounded-2xl bg-white p-2 shadow-sm"><QRCodeSVG value={shareUrl} size={72} /></div>
                        <div>
                            <p className="font-extrabold">QR pertemanan</p>
                            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Tunjukkan untuk ditambahkan teman.</p>
                            <button onClick={() => setModal('qr')} className="text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-300">Perbesar</button>
                        </div>
                    </div>
                </aside>

                <main className={`${card} p-6`}>
                    <div className="mb-6 flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/10">
                        {([['riwayat', 'Riwayat', History], ['teman', 'Teman', Users], ['undangan', 'Undangan', Bell]] as const).map(([k, l, Icon]) => (
                            <button key={k} onClick={() => setTab(k)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${tab === k ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                <Icon className="h-4 w-4" /> {l}
                                {k === 'undangan' && invites.length > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] text-white">{invites.length}</span>}
                            </button>
                        ))}
                    </div>

                    {tab === 'riwayat' && (
                        <div>
                            {filter !== 'semua' && (
                                <button onClick={() => setFilter('semua')} className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{roles[filter].label} <X className="h-3 w-3" /></button>
                            )}
                            {shown.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-14 text-center dark:border-white/15">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-white/10"><History className="h-6 w-6 text-indigo-500" /></span>
                                    <p className="text-lg font-extrabold">Belum ada riwayat</p>
                                    <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">Event yang Anda ikuti, selenggarakan, atau nilai akan muncul di sini.</p>
                                    <Link href={lembagaReady ? '/panel/ajukan' : '/lembaga/daftar'} className={`${primary} mt-2`}>Ajukan event</Link>
                                </div>
                            ) : (
                                years.map((y) => (
                                    <div key={y} className="mb-6 last:mb-0">
                                        <p className="mb-3 text-sm font-extrabold tracking-widest text-slate-400">{y}</p>
                                        <ol className="relative ml-5 space-y-4 border-l-2 border-slate-200 pl-8 dark:border-white/10">
                                            {hp.rows.filter((i) => i.date.startsWith(y)).map((i) => {
                                                const c = roles[i.role]; const Icon = c.icon;
                                                const body = (
                                                    <>
                                                        <span className={`absolute -left-[3.2rem] flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${c.grad} text-white shadow-md ring-4 ring-white dark:ring-slate-900`}><Icon className="h-5 w-5" /></span>
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-extrabold ${c.soft} ${c.text}`}>{c.label}</span>
                                                                <p className="mt-1.5 truncate text-lg font-extrabold">{i.title}</p>
                                                                {i.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{i.subtitle}</p>}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{fmt(i.date)}</p>
                                                                {i.status && <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${i.tone === 'bad' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' : i.tone === 'wait' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>{i.status}</span>}
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                                const cls = 'relative block rounded-2xl border border-slate-200 bg-white/70 p-4 transition hover:border-indigo-200 hover:shadow-sm dark:border-white/10 dark:bg-white/5';
                                                return <li key={`${i.role}-${i.id}`}>{i.href ? <Link href={i.href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
                                            })}
                                        </ol>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === 'riwayat' && <Pager {...hp} />}

                    {tab === 'teman' && (
                        <div>
                            {friendList.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-14 text-center dark:border-white/15">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-white/10"><Users className="h-6 w-6 text-emerald-600" /></span>
                                    <p className="text-lg font-extrabold">Belum ada teman</p>
                                    <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">Pindai QR teman atau tunjukkan QR Anda untuk mulai terhubung.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {fp.rows.map((f) => (
                                        <Link key={f.id} href={f.username ? `/u/${f.username}` : '#'} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-white/5">
                                            <Avatar name={f.name} src={f.avatar} className="h-14 w-14 shrink-0 rounded-2xl" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-extrabold">{f.name}</p>
                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{[f.username ? `@${f.username}` : null, f.city].filter(Boolean).join(' · ')}</p>
                                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"><Check className="h-3 w-3" /> Teman{f.since ? ` sejak ${new Date(f.since).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}` : ''}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'teman' && <Pager {...fp} />}

                    {tab === 'undangan' && (
                        invites.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-14 text-center dark:border-white/15">
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-white/10"><Bell className="h-6 w-6 text-amber-500" /></span>
                                <p className="text-lg font-extrabold">Tidak ada undangan</p>
                                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">Undangan juri, event, dan pertemanan akan masuk ke sini.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {ip.rows.map((i) => (
                                    <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${i.kind === 'juri' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : i.kind === 'teman' ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-blue-600 to-violet-600'}`}>
                                                {i.kind === 'juri' ? <Gavel className="h-5 w-5" /> : i.kind === 'teman' ? <UserPlus className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                                            </span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{kinds[i.kind]}</p>
                                                <p className="font-extrabold">{i.from} <span className="font-semibold text-slate-600 dark:text-slate-300">· {i.title}</span></p>
                                                {i.date && <p className="text-xs text-slate-500">{fmt(i.date)}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => answer(i, false)} className={ghost}>Tolak</button>
                                            <button onClick={() => answer(i, true)} className={primary}><Check className="h-4 w-4" /> Terima</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                {tab === 'undangan' && <Pager {...ip} />}
        </main>
            </div>

            <section className={`${card} mt-6 flex flex-wrap items-center gap-4 p-5`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-white shadow-md"><Sparkles className="h-6 w-6" /></span>
                <div className="min-w-0 flex-1">
                    <p className="text-lg font-extrabold leading-tight">Punya acara? Buat event sendiri</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Daftarkan lembaga, ajukan event, tayang setelah diperiksa admin.</p>
                </div>
                <Link href={lembagaReady ? '/panel' : '/lembaga/daftar'} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow transition hover:bg-indigo-700">{lembagaReady ? 'Buka panel lembaga' : 'Daftar lembaga'} <ArrowRight className="h-4 w-4" /></Link>
            </section>

            {modal === 'qr' && (
                <Modal title="Kartu QR saya" onClose={closeModal}>
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-6 dark:from-white/5 dark:to-white/5">
                        <Avatar name={name} src={user.avatar} className="h-16 w-16 rounded-2xl text-xl" />
                        <p className="-mt-2 text-lg font-extrabold">{name}</p>
                        <div className="rounded-2xl bg-white p-4 shadow-md"><QRCodeSVG value={shareUrl} size={200} level="M" /></div>
                        <p className="text-center text-xs text-slate-500">Minta teman memindai kode ini untuk terhubung.</p>
                    </div>
                    <button onClick={copy} className={`${ghost} mt-4 w-full justify-center`}>{copied ? <><Check className="h-4 w-4" /> Tersalin</> : <><Copy className="h-4 w-4" /> Salin tautan profil</>}</button>
                </Modal>
            )}

            {modal === 'scan' && (
                <Modal title="Pindai QR teman" onClose={closeModal}>
                    {scanned ? (
                        <div className="space-y-4 text-center">
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Check className="h-6 w-6" /></span>
                            <p className="font-extrabold">Kode terbaca</p>
                            <p className="break-all rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">{scanned}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setScanned(null)} className={`${ghost} flex-1 justify-center`}><Camera className="h-4 w-4" /> Ulang</button>
                                <button onClick={() => router.post('/teman', { code: scanned }, { onSuccess: closeModal })} className={`${primary} flex-1 justify-center`}><UserPlus className="h-4 w-4" /> Tambah</button>
                            </div>
                        </div>
                    ) : (
                        <Scanner onResult={setScanned} />
                    )}
                </Modal>
            )}
        </UserLayout>
    );
}
