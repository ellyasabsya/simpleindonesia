import { usePage as usePanelPage } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import UserLayout from '@/components/user/user-layout';
import PanelDashboardMobile from '@/components/mobile/pages/panel-dashboard-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Banknote, CalendarDays, Check, Clock, Pencil, Plus, ShieldCheck, Trash2, UserPlus, Users, Wallet, X } from 'lucide-react';
import { Fragment, useState, useEffect } from 'react';

type Perm = 'events' | 'checkin' | 'finance' | 'withdraw' | 'members';
type Inst = { id: number; name: string; email: string; phone: string; status: string; logo_url: string | null };
type Member = { id: number; name: string | null; email: string | null; avatar?: string | null; role: string; permissions: Perm[]; is_owner?: boolean; status?: string };
type SubEv = { id: number; title: string; category: string; starts_at: string; ends_at: string; status: 'pending' | 'published' | 'rejected'; poster_url?: string | null };
type Ev = { id: number; title: string; category: string; package: string; starts_at: string; ends_at: string; status: 'pending' | 'published' | 'rejected'; poster_url?: string | null; subs?: SubEv[] };
type Props = {
    institution: Inst;
    isOwner: boolean;
    owner: { name: string | null; email: string | null; avatar?: string | null };
    members: Member[];
    counts: { total: number; published: number; pending: number; rejected: number };
    balance: { available: number; processing: number; withdrawn: number };
    events: Ev[];
    pagination: { current: number; last: number; total: number; per_page: number };
    filter: string | null;
    upcoming: { title: string; starts_at: string } | null;
};

const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const ghost = 'inline-flex items-center gap-2 rounded-xl bg-white/90 px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/20';
const primary = 'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5';
const TINT = [
    { bg: 'bg-sky-50 dark:bg-sky-500/15', text: 'text-sky-700 dark:text-sky-300' },
    { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
    { bg: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
    { bg: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300' },
];
const eyebrow = 'text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300';

const rp = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID');
const tgl = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS = {
    published: { label: 'Tayang', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
    pending: { label: 'Diproses', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
    rejected: { label: 'Ditolak', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
} as const;

const PERMS: { key: Perm; label: string; hint: string }[] = [
    { key: 'events', label: 'Kelola event', hint: 'Buat dan ubah event' },
    { key: 'checkin', label: 'Check-in tiket', hint: 'Pindai tiket peserta' },
    { key: 'finance', label: 'Lihat keuangan', hint: 'Saldo dan transaksi' },
    { key: 'withdraw', label: 'Tarik saldo', hint: 'Ajukan penarikan dana' },
    { key: 'members', label: 'Kelola anggota', hint: 'Tambah dan atur akses' },
];

const ROLES: Record<string, { label: string; perms: Perm[] }> = {
    admin: { label: 'Admin', perms: ['events', 'checkin', 'finance', 'withdraw', 'members'] },
    manajer: { label: 'Manajer event', perms: ['events', 'checkin'] },
    keuangan: { label: 'Keuangan', perms: ['finance', 'withdraw'] },
    staf: { label: 'Staf lapangan', perms: ['checkin'] },
};

function Avatar({ name, src, className = 'h-11 w-11' }: { name: string; src?: string | null; className?: string }) {
    const [broken, setBroken] = useState(false);
    const url = src ? src.replace(/^https?:\/\/[^/]+(?=\/storage\/)/, '') : null;
    if (url && !broken) return <img src={url} alt={name} onError={() => setBroken(true)} className={`${className} shrink-0 rounded-2xl object-cover`} />;
    return <span className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-extrabold text-white`}>{name.trim().charAt(0).toUpperCase() || '?'}</span>;
}

function Ring({ percent }: { percent: number }) {
    const r = 52;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <defs>
                    <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient>
                </defs>
                <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" className="stroke-slate-200 dark:stroke-white/10" />
                <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" strokeLinecap="round" stroke="url(#ring-grad)" strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl leading-none font-extrabold">{percent}%</span>
                <span className="mt-0.5 text-[9px] leading-none font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{percent === 100 ? 'Siap' : 'Lengkap'}</span>
            </div>
        </div>
    );
}

function MemberModal({ member, onClose }: { member: Member | null; onClose: () => void }) {
    const editing = !!member;
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string>(member?.role ?? 'manajer');
    const [perms, setPerms] = useState<Perm[]>(member?.permissions ?? ROLES.manajer.perms);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [lookup, setLookup] = useState<any>(null);
    const [checking, setChecking] = useState(false);
    const [recheck, setRecheck] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (editing) return;
        const v = email.trim();
        setLookup(null);
        if (!/^\S+@\S+\.\S+$/.test(v)) { setChecking(false); return; }
        setChecking(true);
        const ctl = new AbortController();
        const t = setTimeout(() => {
            fetch(`/panel/anggota/cari?email=${encodeURIComponent(v)}`, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, signal: ctl.signal })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error('gagal'))))
                .then((d) => setLookup(d))
                .catch((e) => { if (e?.name !== 'AbortError') setLookup({ status: 'error' }); })
                .finally(() => { if (!ctl.signal.aborted) setChecking(false); });
        }, 450);
        return () => { clearTimeout(t); ctl.abort(); };
    }, [email, recheck, editing]);

    const registerUrl = typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register';
    const copyRegister = () => {
        navigator.clipboard?.writeText(registerUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
    };
    const canSubmit = editing || lookup?.status === 'ok';

    const pickRole = (k: string) => { setRole(k); setPerms(ROLES[k].perms); };
    const toggle = (p: Perm) => setPerms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        const opts = { preserveScroll: true, onSuccess: onClose, onError: (er: Record<string, string>) => setErrors(er), onFinish: () => setBusy(false) };
        if (editing) router.put(`/panel/anggota/${member!.id}`, { role, permissions: perms }, opts);
        else router.post('/panel/anggota', { email, role, permissions: perms }, opts);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
            <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl [scrollbar-width:none] dark:bg-slate-900 [&::-webkit-scrollbar]:hidden">
                <div className="sticky top-0 z-10 -mx-6 -mt-6 flex items-start justify-between gap-4 bg-white px-6 pb-3 pt-6 dark:bg-slate-900">
                    <div>
                        <p className={eyebrow}>Anggota lembaga</p>
                        <h3 className="mt-1 text-xl font-bold">{editing ? `Ubah akses ${member!.name ?? ''}` : 'Tambah anggota'}</h3>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10"><X className="h-4 w-4" /></button>
                </div>

                {!editing && (
                    <label className="mt-5 block">
                        <span className="text-sm font-bold">Email akun SIMPLE</span>
                        <input autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5" />
                        {errors.email && <span className="mt-1 block text-xs font-semibold text-rose-600">{errors.email}</span>}
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Orang ini harus sudah punya akun SIMPLE.</span>
                    </label>
                )}

                {!editing && checking && (
                    <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Memeriksa akun…</p>
                )}

                {!editing && !checking && lookup?.status === 'ok' && (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-400/30 dark:bg-emerald-500/10">
                        <Avatar name={lookup.user.name} src={lookup.user.avatar} className="h-12 w-12 rounded-full text-base" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-extrabold">{lookup.user.name}</p>
                            <p className="truncate text-xs text-slate-600 dark:text-slate-300">{[lookup.user.username ? `@${lookup.user.username}` : null, lookup.user.city].filter(Boolean).join(' · ') || 'Akun SIMPLE'}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white">Akun ditemukan</span>
                    </div>
                )}

                {!editing && !checking && lookup?.status === 'not_found' && (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-500/10">
                        <p className="text-sm font-extrabold text-amber-800 dark:text-amber-200">Email ini belum terdaftar di SIMPLE.</p>
                        <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/80">Minta orangnya membuat akun dulu dengan email ini. Setelah mendaftar, tekan “Periksa lagi”, lalu anggota bisa ditambahkan.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={copyRegister} className="rounded-xl bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-slate-50 dark:bg-white/10">{copied ? 'Tautan tersalin' : 'Salin tautan daftar'}</button>
                            <a href={`https://wa.me/?text=${encodeURIComponent(`Halo, silakan daftar akun SIMPLE dulu dengan email ini: ${registerUrl}`)}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white px-3 py-2 text-xs font-bold shadow-sm hover:bg-slate-50 dark:bg-white/10">Kirim lewat WhatsApp</a>
                            <button type="button" onClick={() => setRecheck((n) => n + 1)} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700">Periksa lagi</button>
                        </div>
                    </div>
                )}

                {!editing && !checking && lookup?.status === 'owner' && (
                    <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold dark:border-white/10 dark:bg-white/5">Akun ini adalah pemilik lembaga, tidak perlu ditambahkan.</p>
                )}
                {!editing && !checking && lookup?.status === 'member' && (
                    <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold dark:border-white/10 dark:bg-white/5">Akun ini sudah menjadi anggota lembaga.</p>
                )}
                {!editing && !checking && lookup?.status === 'error' && (
                    <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">Gagal memeriksa akun. Coba lagi sebentar lagi.</p>
                )}

                <div className="mt-5">
                    <span className="text-sm font-bold">Peran</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {Object.entries(ROLES).map(([k, v]) => (
                            <button type="button" key={k} onClick={() => pickRole(k)} className={`rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${role === k ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'}`}>{v.label}</button>
                        ))}
                    </div>
                </div>

                <div className="mt-5">
                    <span className="text-sm font-bold">Hak akses</span>
                    <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
                        {PERMS.map((p) => {
                            const on = perms.includes(p.key);
                            return (
                                <button type="button" key={p.key} onClick={() => toggle(p.key)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-white/20'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold">{p.label}</span>
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">{p.hint}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4 dark:border-white/10 dark:bg-slate-900">
                    <button type="button" onClick={onClose} className={ghost}>Batal</button>
                    <button type="submit" disabled={busy || !canSubmit} className={`${primary} disabled:cursor-not-allowed disabled:opacity-60`}>{busy ? 'Menyimpan…' : editing ? 'Simpan akses' : 'Tambah anggota'}</button>
                </div>
            </form>
        </div>,
        document.body,
    );
}

function Pager({ page, last, total, per, onPage }: { page: number; last: number; total: number; per: number; onPage: (n: number) => void }) {
    if (last <= 1) return null;
    const from = (page - 1) * per + 1;
    const to = Math.min(page * per, total);
    const nums = Array.from({ length: last }, (_, i) => i + 1).filter((n) => n === 1 || n === last || Math.abs(n - page) <= 1);
    const nav = 'flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-bold transition disabled:opacity-40';
    return (
        <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
            <p className="text-sm text-slate-500 dark:text-slate-400">{from}–{to} dari {total}</p>
            <div className="flex items-center gap-1">
                <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Sebelumnya" className={`${nav} bg-slate-100 hover:bg-slate-200 dark:bg-white/10`}><ChevronLeft className="h-4 w-4" /></button>
                {nums.map((n, i) => (
                    <Fragment key={n}>
                        {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                        <button type="button" onClick={() => onPage(n)} className={`${nav} ${n === page ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10'}`}>{n}</button>
                    </Fragment>
                ))}
                <button type="button" disabled={page === last} onClick={() => onPage(page + 1)} aria-label="Berikutnya" className={`${nav} bg-slate-100 hover:bg-slate-200 dark:bg-white/10`}><ChevronRight className="h-4 w-4" /></button>
            </div>
        </nav>
    );
}

export default function PanelDashboard({ institution, isOwner, owner, members, counts, balance, events, pagination, filter, upcoming }: Props) {
    const myPerms: string[] = ((usePanelPage().props as any).panelPerms as string[] | null) ?? ['events', 'checkin', 'finance', 'withdraw', 'members'];
    const can = (p: string) => isOwner || myPerms.includes(p);
    const [modal, setModal] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });
    const verified = institution.status === 'approved';
    const phone = usePhone();
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const team: Member[] = [{ id: 0, name: owner.name, email: owner.email, avatar: owner.avatar, role: 'owner', permissions: ['events', 'checkin', 'finance', 'withdraw', 'members'], is_owner: true }, ...members];

    const MEMBERS_PER = 5;
    const [mp, setMp] = useState(1);
    const mLast = Math.max(1, Math.ceil(team.length / MEMBERS_PER));
    const mPage = Math.min(mp, mLast);
    const teamRows = team.slice((mPage - 1) * MEMBERS_PER, mPage * MEMBERS_PER);

    const go = (params: { status?: string | null; page?: number }) => {
        const q: Record<string, string | number> = {};
        const st = params.status !== undefined ? params.status : filter;
        if (st) q.status = st;
        if ((params.page ?? 1) > 1) q.page = params.page as number;
        router.get('/panel', q, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => document.getElementById('event')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        });
    };
    const attention = counts.pending + counts.rejected;
    const rate = counts.total ? Math.round((counts.published / counts.total) * 100) : 0;


    const checklist = [
        { label: 'Lembaga terdaftar', done: true },
        { label: 'Lembaga terverifikasi', done: verified },
        { label: 'Kontak lengkap', done: !!institution.email && !!institution.phone },
        { label: 'Event pertama dibuat', done: counts.total > 0 },
        { label: 'Event tayang', done: counts.published > 0 },
        { label: 'Anggota tim ditambahkan', done: members.length > 0 },
    ];
    const percent = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);


    const statCards = [
        { label: 'Total event', value: counts.total, desc: 'Event terdaftar', icon: CalendarDays, grad: 'from-blue-500 to-sky-400' },
        { label: 'Event tayang', value: counts.published, desc: 'Sudah dipublikasikan', icon: ShieldCheck, grad: 'from-emerald-400 to-teal-500' },
        { label: 'Perlu tindakan', value: attention, desc: attention ? 'Diproses atau ditolak' : 'Tidak ada yang tertunda', icon: Clock, grad: 'from-amber-400 to-orange-500' },
        { label: 'Anggota tim', value: team.length, desc: 'Termasuk pemilik', icon: Users, grad: 'from-rose-500 to-pink-500' },
    ];

    const segments = [
        { s: 'published' as const, n: counts.published },
        { s: 'pending' as const, n: counts.pending },
        { s: 'rejected' as const, n: counts.rejected },
    ];

    const removeMember = (m: Member) => {
        if (confirm(m.status === 'menunggu' ? `Batalkan undangan untuk ${m.name ?? 'anggota ini'}?` : `Keluarkan ${m.name ?? 'anggota ini'} dari lembaga?`)) router.delete(`/panel/anggota/${m.id}`, { preserveScroll: true });
    };

    return (
        <UserLayout title="Panel Lembaga" hasPanel>
            {phone && (
                <PanelDashboardMobile
                    institution={institution}
                    verified={verified}
                    isOwner={isOwner}
                    canEvents={can('events')}
                    canFinance={can('finance')}
                    canWithdraw={can('withdraw')}
                    counts={counts}
                    attention={attention}
                    balance={balance}
                    events={events}
                    pagination={pagination}
                    filter={filter}
                    upcoming={upcoming}
                    checklist={checklist}
                    percent={percent}
                    team={team}
                    roleLabel={(r) => ROLES[r]?.label ?? r}
                    go={go}
                    onAdd={() => setModal({ open: true, member: null })}
                    onEdit={(m) => setModal({ open: true, member: m as Member })}
                    onRemove={(m) => removeMember(m as Member)}
                />
            )}
            <div className={phone ? 'hidden' : 'space-y-8'}>
                {/* HERO */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-5 py-3 text-sm font-bold shadow-sm dark:bg-white/10"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Panel Lembaga · {today}</span>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/dashboard" className={ghost}><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
                        <Link href="/panel/profil" className={ghost}>Ubah profil</Link>
                        <Link href="/panel/ajukan" className={`${primary} ${can('events') ? '' : '!hidden'}`}><Plus className="h-4 w-4" /> Buat event</Link>
                    </div>
                
                    <div className="flex items-center gap-4">
                        <Avatar name={institution.name} src={institution.logo_url} className="h-16 w-16 !rounded-3xl text-2xl" />
                        <div className="min-w-0">
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Kelola <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">{institution.name}</span></h1>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
                                Event, anggota tim, dan keuangan lembaga dalam satu tempat.
                                {verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi</span>}
                            </p>
                        </div>
                    </div>
                </header>

                {/* RINGKASAN + KELENGKAPAN */}
                <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-xl sm:p-6 lg:flex lg:flex-col lg:justify-center">
                        <span className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                        <div className="relative">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-300">Ringkasan event</p>
                            <div className="mt-3 flex items-baseline gap-3"><span className="text-5xl font-extrabold">{counts.total}</span><span className="text-white/70">total event lembaga</span></div>
                            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                                {segments.filter((x) => x.n > 0).map((x) => <span key={x.s} className={STATUS[x.s].dot} style={{ width: `${(x.n / counts.total) * 100}%` }} />)}
                            </div>
                            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                                {segments.map((x) => <li key={x.s} className="flex items-center gap-2 text-white/80"><span className={`h-2.5 w-2.5 rounded-full ${STATUS[x.s].dot}`} /> {STATUS[x.s].label} <b className="text-white">{x.n}</b></li>)}
                            </ul>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60">Tingkat tayang</p><p className="mt-1 text-2xl font-extrabold">{rate}%</p><p className="text-xs text-white/60">dari total event</p></div>
                                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60">Perlu perhatian</p><p className="mt-1 text-2xl font-extrabold">{attention}</p><p className="text-xs text-white/60">diproses dan ditolak</p></div>
                                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60">Event terdekat</p><p className="mt-1 truncate text-2xl font-extrabold">{upcoming ? tgl(upcoming.starts_at) : '—'}</p><p className="truncate text-xs text-white/60">{upcoming?.title ?? 'Belum ada jadwal'}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className={`${card} p-5`}>
                        <div className="flex items-center gap-4">
                            <Ring percent={percent} />
                            <div className="min-w-0">
                                <p className="text-base font-extrabold">Kelengkapan lembaga</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{percent === 100 ? 'Semua langkah selesai 🎉' : 'Lengkapi agar lembaga siap berjualan.'}</p>
                            </div>
                        </div>
                        <ul className={`mt-4 space-y-2.5 ${percent === 100 ? 'hidden' : ''}`}>
                            {checklist.map((c) => (
                                <li key={c.label} className="flex items-center gap-3 text-sm font-semibold">
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${c.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 dark:border-white/20'}`}>{c.done && <Check className="h-3.5 w-3.5" />}</span>
                                    <span className={c.done ? 'text-slate-400 line-through' : ''}>{c.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* STATISTIK */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((s, i) => {
                        const Icon = s.icon;
                        const t = TINT[i % TINT.length];
                        return (
                            <div key={s.label} className={`relative overflow-hidden rounded-2xl px-5 py-4 ${t.bg}`}>
                                <Icon className={`absolute -bottom-4 -right-3 h-24 w-24 opacity-10 ${t.text}`} />
                                <div className="relative">
                                    <p className={`text-[11px] font-extrabold uppercase tracking-[0.18em] ${t.text}`}>{s.label}</p>
                                    <p className={`mt-1 bg-gradient-to-br ${s.grad} bg-clip-text text-4xl font-extrabold leading-none text-transparent`}>{s.value}</p>
                                    <p className="mt-1.5 truncate text-xs text-slate-600 dark:text-slate-300">{s.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* KEUANGAN */}
                <section id="keuangan" className={`scroll-mt-24 space-y-4 ${can('finance') || can('withdraw') ? '' : '!hidden'}`}>
                                        <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-sky-400 p-5 text-white shadow-xl shadow-blue-500/20">
                            <span className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                            <div className="relative">
                                <div className="flex items-center justify-between"><p className="text-sm font-bold">Saldo tersedia</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Wallet className="h-5 w-5" /></span></div>
                                <p className="mt-2 text-2xl font-extrabold">{rp(balance.available)}</p>
                                <p className="mt-1 text-sm text-white/80">Siap ditarik ke rekening</p>
                                <Link href="/panel/pendapatan" className={`mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-blue-700 shadow transition hover:-translate-y-0.5 ${can('withdraw') ? '' : '!hidden'}`}>Tarik saldo <ArrowRight className="h-4 w-4" /></Link>
                            </div>
                        </div>
                        <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-blue-950 p-5 text-white shadow-xl">
                            <div className="flex items-center justify-between"><p className="text-sm font-bold">Sedang diproses</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Clock className="h-5 w-5 text-amber-300" /></span></div>
                            <p className="mt-2 text-2xl font-extrabold">{rp(balance.processing)}</p>
                            <p className="mt-1 text-sm text-white/60">Menunggu penyelesaian pembayaran</p>
                        </div>
                        <div className={`${card} p-5`}>
                            <div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sudah ditarik</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15"><Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-300" /></span></div>
                            <p className="mt-2 text-2xl font-extrabold">{rp(balance.withdrawn)}</p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total dana yang sudah cair</p>
                        </div>
                    </div>
                </section>

                {/* EVENT + ANGGOTA */}
                <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
                    <div id="event" className={`${card} scroll-mt-24 p-6`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold">Event lembaga</h3>
                            <Link href="/panel/ajukan" className={`inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline ${can('events') ? '' : '!hidden'}`}><Plus className="h-4 w-4" /> Buat event</Link>
                        </div>
                        {counts.total > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {([{ k: null, label: 'Semua', n: counts.total }, { k: 'published', label: 'Tayang', n: counts.published }, { k: 'pending', label: 'Diproses', n: counts.pending }, { k: 'rejected', label: 'Ditolak', n: counts.rejected }] as { k: string | null; label: string; n: number }[]).map((t) => (
                                    <button key={t.label} type="button" onClick={() => go({ status: t.k })} className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition ${filter === t.k ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20'}`}>
                                        {t.label}
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${filter === t.k ? 'bg-white/25' : 'bg-white dark:bg-white/10'}`}>{t.n}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {events.length === 0 && counts.total > 0 ? (
                            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Tidak ada event dengan status ini.</p>
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
                                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 dark:bg-white/10"><CalendarDays className="h-7 w-7 text-sky-500" /></span>
                                <p className="text-lg font-bold">Belum ada event</p>
                                <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">Ajukan event pertama Anda. Event tayang setelah diperiksa admin.</p>
                                <Link href="/panel/ajukan" className={`${primary} ${can('events') ? '' : '!hidden'}`}><Plus className="h-4 w-4" /> Buat event</Link>
                            </div>
                        ) : (
                            <ul className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
                                {events.map((e) => (
                                    <li key={e.id}>
                                        <Link href={`/panel/event/${e.id}`} className="-mx-3 flex items-center gap-4 rounded-2xl px-3 py-3.5 transition hover:bg-slate-50 dark:hover:bg-white/5">
                                            <span className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-slate-200/70 dark:from-white/10 dark:to-white/5 dark:ring-white/10">
                                                {e.poster_url ? <img src={e.poster_url} alt={e.title} loading="lazy" className="h-full w-full object-cover" /> : <CalendarDays className="h-6 w-6 text-blue-600" />}
                                                <span className={`absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${STATUS[e.status].dot}`} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-2">
                                                    <span className="truncate font-extrabold">{e.title}</span>
                                                    {e.subs && e.subs.length > 0 && (
                                                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">Rangkaian · {e.subs.length} kegiatan</span>
                                                    )}
                                                </span>
                                                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{e.category ? `${e.category} · ` : ''}{tgl(e.starts_at)}{e.ends_at !== e.starts_at && ` – ${tgl(e.ends_at)}`} · Paket {e.package}</span>
                                            </span>
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[e.status].badge}`}>{STATUS[e.status].label}</span>
                                        </Link>
                                        {e.subs && e.subs.length > 0 && (
                                            <ul className="mb-3 ml-8 space-y-1 border-l-2 border-indigo-100 pl-4 dark:border-white/10">
                                                {e.subs.map((c) => (
                                                    <li key={c.id}>
                                                        <Link href={`/panel/event/${c.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-white/5">
                                                            <span className="relative flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-slate-200/70 dark:from-white/10 dark:to-white/5 dark:ring-white/10">
                                                                {c.poster_url ? <img src={c.poster_url} alt={c.title} loading="lazy" className="h-full w-full object-cover" /> : <CalendarDays className="h-4 w-4 text-blue-600" />}
                                                                <span className={`absolute left-1 top-1 h-2 w-2 rounded-full ring-2 ring-white ${STATUS[c.status].dot}`} />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-bold">{c.title}</span>
                                                                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{c.category ? `${c.category} · ` : ''}{tgl(c.starts_at)}{c.ends_at !== c.starts_at && ` – ${tgl(c.ends_at)}`}</span>
                                                            </span>
                                                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS[c.status].badge}`}>{STATUS[c.status].label}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Pager page={pagination.current} last={pagination.last} total={pagination.total} per={pagination.per_page} onPage={(n) => go({ page: n })} />
                    </div>

                    <div id="anggota" className="scroll-mt-24 space-y-4 lg:sticky lg:top-24 lg:self-start">
                        <div className={`${card} p-6`}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Anggota tim</h3>
                                {isOwner && <button onClick={() => setModal({ open: true, member: null })} className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"><UserPlus className="h-4 w-4" /> Tambah</button>}
                            </div>
                            <ul className="mt-4 space-y-1">
                                {teamRows.map((m) => (
                                    <li key={m.id} className="-mx-2 flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50 dark:hover:bg-white/5">
                                        <Avatar name={m.name ?? m.email ?? '?'} src={m.avatar} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-extrabold">{m.name ?? m.email}</span>
                                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{m.is_owner ? 'Pemilik · Semua akses' : `${ROLES[m.role]?.label ?? m.role} · ${m.permissions.length} akses`}</span>
                                            {m.status === 'menunggu' && <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">Menunggu persetujuan</span>}
                                        </span>
                                        {isOwner && !m.is_owner && (
                                            <span className="flex gap-1">
                                                <button onClick={() => setModal({ open: true, member: m })} aria-label="Ubah akses" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => removeMember(m)} aria-label={m.status === 'menunggu' ? 'Batalkan undangan' : 'Keluarkan'} title={m.status === 'menunggu' ? 'Batalkan undangan' : 'Keluarkan'} className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <Pager page={mPage} last={mLast} total={team.length} per={MEMBERS_PER} onPage={setMp} />
                            {members.length === 0 && <p className="mt-3 rounded-2xl bg-sky-50 p-3 text-xs text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">Tambahkan rekan agar bisa membantu mengurus event dan keuangan.</p>}
                        </div>
                    </div>
                </section>
            </div>

            {modal.open && <MemberModal key={modal.member?.id ?? 'new'} member={modal.member} onClose={() => setModal({ open: false, member: null })} />}
        </UserLayout>
    );
}
