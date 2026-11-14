import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarCheck, Clock, Mail, Moon, Phone, ShieldCheck, Sun } from 'lucide-react';
import type { FormEvent } from 'react';
import Field from '@/components/auth/field';
import SubmitButton from '@/components/auth/submit-button';
import PageBackground from '@/components/page-background';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

type Institution = { name: string; email: string; phone: string; status: string };

const statusInfo: Record<string, { label: string; text: string; style: string }> = {
    pending: {
        label: 'Menunggu verifikasi',
        text: 'Pendaftaran lembaga Anda sedang diperiksa admin. Kami akan menghubungi lewat email kontak.',
        style: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
    },
    approved: {
        label: 'Terverifikasi',
        text: 'Lembaga Anda sudah terverifikasi. Anda dapat mulai mengajukan event.',
        style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
    },
    rejected: {
        label: 'Ditolak',
        text: 'Pendaftaran belum dapat disetujui. Silakan hubungi admin atau daftar ulang dengan data yang benar.',
        style: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200',
    },
};

export default function DaftarLembaga({ institution }: { institution: Institution | null }) {
    const { dark, toggle } = useTheme();
    const { dashboardUrl } = useAuth();
    const { data, setData, post, processing, errors } = useForm({ name: '', email: '', phone: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/lembaga');
    };

    const status = institution ? statusInfo[institution.status] ?? statusInfo.pending : null;

    return (
        <>
            <Head title="Daftar Lembaga - SIMPLE" />
            <PageBackground />

            {/* Bar atas: ukuran sama dengan navbar landing page */}
            <div className="fixed inset-x-0 top-0 z-30">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    <Link
                        href={dashboardUrl}
                        className="group flex h-11 items-center gap-2 rounded-full bg-white/70 px-5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-indigo-700 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                        Kembali ke Dashboard
                    </Link>
                    <button
                        onClick={toggle}
                        aria-label="Ganti tema"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                    >
                        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className="relative z-10 min-h-screen text-slate-900 dark:text-white">
                <div className="mx-auto max-w-5xl px-6 pb-12 pt-28">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        Pusat Pengelolaan · SIMPLE
                    </span>
                    <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
                        Panel <span className="title-gradient">Lembaga</span>
                    </h1>
                    <p className="mt-2 max-w-2xl text-[15px] text-slate-600 dark:text-slate-300">
                        Kelola profil lembaga, ajukan kegiatan, dan pantau event serta pendapatan Anda dalam satu tempat.
                    </p>

                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        {/* Kartu info */}
                        <section className="flex flex-col rounded-[1.75rem] border border-white/70 bg-white/80 p-8 shadow-xl shadow-indigo-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-800 via-blue-600 to-violet-600 text-white shadow-md shadow-indigo-600/25">
                                <Building2 className="h-7 w-7" />
                            </span>
                            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                                Mulai bersama SIMPLE
                            </p>
                            <h2 className="mt-2 text-3xl font-extrabold">Bangun identitas lembagamu.</h2>
                            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
                                Daftarkan lembaga agar dapat mengajukan seminar, festival, dan perlombaan melalui satu
                                platform pengelolaan event.
                            </p>

                            <ul className="mt-auto space-y-3 border-t border-slate-200/80 pt-6 text-[15px] text-slate-700 dark:border-white/10 dark:text-slate-200">
                                <li className="flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                                    Lembaga akan melalui proses verifikasi admin.
                                </li>
                                <li className="flex items-center gap-3">
                                    <CalendarCheck className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                                    Setelah terdaftar, Anda dapat mulai mengajukan event.
                                </li>
                            </ul>
                        </section>

                        {/* Form atau status */}
                        <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-8 shadow-xl shadow-indigo-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                                Registrasi Lembaga
                            </p>

                            {institution && status && institution.status !== 'rejected' ? (
                                <>
                                    <h2 className="mt-2 text-2xl font-extrabold">Pendaftaran terkirim</h2>
                                    <span className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${status.style}`}>
                                        <Clock className="h-4 w-4" />
                                        {status.label}
                                    </span>
                                    <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{status.text}</p>

                                    <dl className="mt-6 space-y-3 rounded-2xl bg-slate-50/80 p-5 text-[15px] dark:bg-white/5">
                                        {[
                                            ['Nama lembaga', institution.name],
                                            ['Email kontak', institution.email],
                                            ['Nomor telepon', institution.phone],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex justify-between gap-4">
                                                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                                                <dd className="text-right font-semibold">{v}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </>
                            ) : (
                                <>
                                    <h2 className="mt-2 text-2xl font-extrabold">Daftarkan Lembaga</h2>
                                    <p className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-300">
                                        Lengkapi informasi dasar lembaga yang akan didaftarkan.
                                    </p>

                                    {status && institution?.status === 'rejected' && (
                                        <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${status.style}`}>{status.text}</p>
                                    )}

                                    <form onSubmit={submit} className="mt-6 space-y-5">
                                        <Field
                                            label="Nama lembaga"
                                            icon={Building2}
                                            placeholder="Contoh: Komunitas Kreatif Batam"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            error={errors.name}
                                            required
                                        />
                                        <Field
                                            label="Email kontak"
                                            icon={Mail}
                                            type="email"
                                            placeholder="email@lembaga.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={errors.email}
                                            required
                                        />
                                        <Field
                                            label="Nomor telepon"
                                            icon={Phone}
                                            type="tel"
                                            placeholder="08xxxxxxxxxx"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            error={errors.phone}
                                            required
                                        />
                                        <SubmitButton processing={processing}>Daftarkan Lembaga</SubmitButton>
                                        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                                            Pastikan data yang dimasukkan sudah benar.
                                        </p>
                                    </form>
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
