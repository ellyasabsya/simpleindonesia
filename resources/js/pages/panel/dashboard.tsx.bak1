import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarDays, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import UserLayout from '@/components/user/user-layout';

type Inst = { id: number; name: string; email: string; phone: string; status: string; logo_url: string | null };
type Member = { id: number; name: string | null; email: string | null; role: string };
type Ev = { id: number; title: string; category: string; package: string; starts_at: string; ends_at: string; status: 'pending' | 'published' | 'rejected' };
type Props = {
    institution: Inst;
    isOwner: boolean;
    owner: { name: string | null; email: string | null };
    members: Member[];
    counts: { total: number; published: number; pending: number; rejected: number };
    balance: { available: number; processing: number; withdrawn: number };
    events: Ev[];
};

const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const eyebrow = 'text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300';
const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const badge = {
    published: { label: 'Tayang', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
    pending: { label: 'Diproses', style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
    rejected: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' },
};

export default function PanelDashboard({ institution, isOwner, owner, members, counts, balance, events }: Props) {
    const [tab, setTab] = useState<'all' | Ev['status']>('all');
    const invite = useForm({ email: '', role: 'staf' });

    const shown = tab === 'all' ? events : events.filter((e) => e.status === tab);
    const tabs = [
        { key: 'all', label: 'Semua', n: counts.total },
        { key: 'published', label: 'Tayang', n: counts.published },
        { key: 'pending', label: 'Diproses', n: counts.pending },
        { key: 'rejected', label: 'Ditolak', n: counts.rejected },
    ] as const;

    const stats = [
        { label: 'Total event', value: counts.total, note: 'Event terdaftar', icon: CalendarDays },
        { label: 'Event tayang', value: counts.published, note: 'Sudah dipublikasikan', icon: ShieldCheck },
        { label: 'Perlu tindakan', value: counts.pending + counts.rejected, note: counts.pending + counts.rejected ? 'Menunggu atau ditolak' : 'Tidak ada yang tertunda', icon: CalendarDays },
        { label: 'Status lembaga', value: institution.status === 'approved' ? 'Terverifikasi' : institution.status, note: 'Verifikasi administrasi', icon: Building2, text: true },
    ];

    const submitInvite = (e: FormEvent) => {
        e.preventDefault();
        invite.post('/panel/anggota', { preserveScroll: true, onSuccess: () => invite.reset('email') });
    };

    return (
        <UserLayout title="Panel Lembaga" hasPanel>
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold shadow-sm dark:bg-white/10">
                        <span className="h-2 w-2 rounded-full bg-sky-400" />
                        Panel Lembaga
                    </span>
                    <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">Kelola <span className="title-gradient">{institution.name}</span></h1>
                    <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">Ajukan kegiatan dan pantau event serta pendapatan lembaga Anda dalam satu tempat.</p>
                </div>
                <Link href="/dashboard" className="flex items-center gap-2 rounded-2xl bg-white/80 px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/20">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
                </Link>
            </section>

            <section className={`${card} overflow-hidden`}>
                <div className="h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-400" />
                <div className="flex flex-wrap items-center justify-between gap-5 p-7">
                    <div>
                        <p className={`${eyebrow} flex items-center gap-2`}><Building2 className="h-4 w-4" />Lembaga Anda</p>
                        <div className="mt-3 flex items-center gap-4">
                            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 text-2xl font-extrabold text-white">
                                {institution.logo_url ? <img src={institution.logo_url} alt="" className="h-full w-full object-cover" /> : institution.name.charAt(0).toUpperCase()}
                            </span>
                            <h2 className="text-3xl font-extrabold">{institution.name}</h2>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                                <ShieldCheck className="h-4 w-4" /> Lembaga terverifikasi
                            </span>
                            <span>ID lembaga: #{institution.id}</span>
                            <span>· {institution.email}</span>
                            <span>· {institution.phone}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/panel/profil" className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-bold shadow-sm hover:bg-white dark:bg-white/10">Ubah profil</Link>
                        <Link href="/panel/ajukan" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/25">
                            <Plus className="h-5 w-5" /> Buat Event
                        </Link>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({ label, value, note, icon: Icon, text }) => (
                    <div key={label} className={`${card} p-5`}>
                        <div className="flex items-start justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-white/10"><Icon className="h-5 w-5" /></span>
                        </div>
                        <p className={`mt-4 font-extrabold ${text ? 'text-2xl' : 'text-4xl'}`}>{value}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{note}</p>
                    </div>
                ))}
            </div>

            <section className={`${card} p-7`}>
                <p className={eyebrow}>Keuangan</p>
                <h3 className="mt-1 text-2xl font-extrabold">Saldo lembaga</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saldo tersedia</p>
                        <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-300">{rp(balance.available)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Bisa ditarik</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sedang diproses</p>
                        <p className="mt-2 text-3xl font-extrabold">{rp(balance.processing)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Menunggu admin</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sudah ditarik</p>
                        <p className="mt-2 text-3xl font-extrabold">{rp(balance.withdrawn)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sudah ditransfer</p>
                    </div>
                </div>
            </section>

            <section className={`${card} p-7`}>
                <p className={eyebrow}>Tim</p>
                <h3 className="mt-1 text-2xl font-extrabold">Anggota lembaga</h3>

                <ul className="mt-5 space-y-3">
                    <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 dark:border-white/10 dark:bg-white/5">
                        <div><p className="font-extrabold">{owner.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{owner.email}</p></div>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold dark:border-white/20">Owner</span>
                    </li>
                    {members.map((m) => (
                        <li key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 dark:border-white/10 dark:bg-white/5">
                            <div><p className="font-extrabold">{m.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{m.email}</p></div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold capitalize dark:border-white/20">{m.role}</span>
                                {isOwner && (
                                    <button onClick={() => confirm(`Hapus ${m.name} dari tim?`) && router.delete(`/panel/anggota/${m.id}`, { preserveScroll: true })} aria-label="Hapus anggota" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>

                {isOwner && (
                    <form onSubmit={submitInvite} className="mt-6 flex flex-wrap items-end gap-3">
                        <label className="min-w-64 flex-1">
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>
                            <input type="email" placeholder="nama@contoh.com" value={invite.data.email} onChange={(e) => invite.setData('email', e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800" />
                        </label>
                        <label>
                            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Peran</span>
                            <select value={invite.data.role} onChange={(e) => invite.setData('role', e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white/90 px-3 text-sm dark:border-white/10 dark:bg-slate-800">
                                <option value="staf">Staf</option>
                                <option value="admin">Admin</option>
                            </select>
                        </label>
                        <button disabled={invite.processing} className="h-11 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 text-sm font-bold text-white shadow-md disabled:opacity-60">Tambah anggota</button>
                        {(invite.errors.email || invite.errors.role) && <p className="w-full text-sm text-rose-500">{invite.errors.email ?? invite.errors.role}</p>}
                    </form>
                )}
            </section>

            <section className={`${card} p-7`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className={eyebrow}>Manajemen kegiatan</p>
                        <h3 className="mt-1 text-2xl font-extrabold">Daftar Event</h3>
                        <p className="text-slate-600 dark:text-slate-300">Pantau kegiatan dan status pengajuannya.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-bold dark:border-white/20">{counts.total} event</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${tab === t.key ? 'bg-blue-600 text-white shadow-md' : 'border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>
                            {t.label} · {t.n}
                        </button>
                    ))}
                </div>

                {shown.length === 0 ? (
                    <p className="py-12 text-center text-slate-500 dark:text-slate-400">Belum ada event di kategori ini.</p>
                ) : (
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        {shown.map((e) => (
                            <article key={e.id} className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-xl font-extrabold">{e.title}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{e.category} · {e.package}</p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge[e.status].style}`}>{badge[e.status].label}</span>
                                </div>
                                <p className="mt-4 flex items-center gap-2 text-slate-700 dark:text-slate-200"><CalendarDays className="h-4 w-4" />{fmt(e.starts_at)} – {fmt(e.ends_at)}</p>
                                {e.status === 'published' && (
                                    <Link href={`/panel/event/${e.id}`} className="mt-4 inline-block rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-md">Buka dashboard</Link>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200/70 pt-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                <span>SIMPLE · Organization Center</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Pengelolaan lembaga dan kegiatan</span>
            </footer>
        </UserLayout>
    );
}
