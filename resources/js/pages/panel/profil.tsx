import ProfilLembagaMobile from '@/components/mobile/pages/profil-lembaga-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import UserLayout from '@/components/user/user-layout';
import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarDays, Camera, Check, CheckCircle2, Globe, Loader2, Mail, MapPin, Phone, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';

type Institution = {
    id: number;
    name: string;
    email: string;
    phone: string;
    description: string | null;
    address: string | null;
    website: string | null;
    status: string;
    logo_url: string | null;
    created_at: string | null;
};

const card = 'rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const eyebrow = 'text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300';
const ghost = 'inline-flex items-center gap-2 rounded-xl bg-white/90 px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/20';
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-blue-500/20';

function Field({ label, icon: Icon, optional, error, hint, ...props }: { label: string; icon: LucideIcon; optional?: boolean; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-bold">
                {label} {optional && <span className="font-normal text-slate-400">(opsional)</span>}
            </label>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                <input {...props} className={inputCls} />
            </div>
            {error ? <p className="mt-1.5 text-sm font-semibold text-rose-500">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
        </div>
    );
}

function Chip({ icon: Icon, children, color }: { icon: LucideIcon; children: React.ReactNode; color: string }) {
    return (
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold dark:bg-white/10">
            <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
            <span className="truncate">{children}</span>
        </span>
    );
}

function ProfilDesktop({ institution, stats }: { institution: Institution; stats: { events: number; published: number } }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, isDirty, recentlySuccessful, transform } = useForm<{
        name: string;
        email: string;
        phone: string;
        description: string;
        address: string;
        website: string;
        logo: File | null;
    }>({
        name: institution.name,
        email: institution.email,
        phone: institution.phone,
        description: institution.description ?? '',
        address: institution.address ?? '',
        website: institution.website ?? '',
        logo: null,
    });

    transform((d) => ({ ...d, website: d.website && !/^https?:\/\//i.test(d.website) ? `https://${d.website}` : d.website }));

    const flash = (usePage().props as { flash?: { success?: string } }).flash?.success;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/panel/profil', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData('logo', null);
                setPreview(null);
            },
        });
    };

    const logo = preview ?? (institution.logo_url ? institution.logo_url.replace(/^https?:\/\/[^/]+(?=\/storage\/)/, '') : null);
    const verified = institution.status === 'approved';
    const name = data.name.trim() || 'Nama lembaga';
    const since = institution.created_at ? new Date(institution.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const siteLabel = data.website.replace(/^https?:\/\//i, '');

    return (
        <UserLayout title="Profil Lembaga" hasPanel>
            <form onSubmit={submit} className="space-y-8">
                {recentlySuccessful && flash && (
                    <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">{flash}</div>
                )}
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold shadow-sm dark:bg-white/10">
                            <span className="h-2 w-2 rounded-full bg-sky-400" /> Panel Lembaga
                        </span>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                            Profil <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">Lembaga</span>
                        </h1>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">Informasi ini tampil di halaman event milik lembaga Anda.</p>
                    </div>
                    <Link href="/panel" className={ghost}><ArrowLeft className="h-4 w-4" /> Kembali ke Panel</Link>
                </header>

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <aside className="h-fit space-y-3 lg:sticky lg:top-24">
                        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                            <div className="relative h-24 bg-gradient-to-r from-indigo-900 via-blue-600 to-sky-400">
                                {logo && <img src={logo} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />}
                                <span className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
                            </div>
                            <div className="px-6 pb-6">
                                <div className="relative z-10 -mt-12 w-fit">
                                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-blue-600 to-violet-600 text-4xl font-extrabold text-white shadow-xl ring-4 ring-white dark:ring-slate-900">
                                        {logo ? <img src={logo} alt={name} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
                                    </div>
                                    <button type="button" onClick={() => fileRef.current?.click()} aria-label="Ganti logo" className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white transition hover:bg-blue-700 dark:ring-slate-900">
                                        <Camera className="h-4 w-4" />
                                    </button>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] ?? null;
                                            setData('logo', f);
                                            setPreview(f ? URL.createObjectURL(f) : null);
                                        }}
                                    />
                                </div>

                                <h2 className="mt-4 text-2xl font-extrabold leading-tight">{name}</h2>
                                <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${verified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'}`}>
                                    {verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {verified ? 'Terverifikasi' : institution.status}
                                </span>

                                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{data.description.trim() || 'Deskripsi lembaga Anda akan tampil di sini.'}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {data.email && <Chip icon={Mail} color="text-blue-500">{data.email}</Chip>}
                                    {data.phone && <Chip icon={Phone} color="text-emerald-500">{data.phone}</Chip>}
                                    {data.address && <Chip icon={MapPin} color="text-rose-500">{data.address}</Chip>}
                                    {siteLabel && <Chip icon={Globe} color="text-fuchsia-500">{siteLabel}</Chip>}
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                                        <p className="text-3xl font-extrabold">{stats.events}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total event</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                                        <p className="text-3xl font-extrabold">{stats.published}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Event tayang</p>
                                    </div>
                                </div>

                                <p className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><CalendarDays className="h-4 w-4" /> Terdaftar {since}</p>
                            </div>
                        </div>
                        <p className="px-2 text-center text-xs text-slate-500 dark:text-slate-400">Pratinjau langsung: begini lembaga Anda terlihat di halaman event.</p>
                        {errors.logo && <p className="text-center text-sm font-semibold text-rose-500">{errors.logo}</p>}
                    </aside>

                    <div className="space-y-6">
                        <section className={card}>
                            <p className={eyebrow}>Identitas</p>
                            <h2 className="mt-1 text-xl font-extrabold">Data lembaga</h2>
                            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Nama resmi dan kontak yang bisa dihubungi peserta.</p>
                            <div className="space-y-5">
                                <Field label="Nama lembaga" icon={Building2} value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="Email kontak" icon={Mail} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} required />
                                    <Field label="Nomor telepon" icon={Phone} type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} required />
                                </div>
                            </div>
                        </section>

                        <section className={card}>
                            <p className={eyebrow}>Lokasi dan tautan</p>
                            <h2 className="mt-1 text-xl font-extrabold">Alamat dan website</h2>
                            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Membantu peserta mengenal dan menemukan lembaga Anda.</p>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="Alamat" optional icon={MapPin} placeholder="Kota atau alamat lengkap" value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                                <Field label="Website" optional icon={Globe} placeholder="contoh.com" value={data.website} onChange={(e) => setData('website', e.target.value)} error={errors.website} hint="https:// ditambahkan otomatis." />
                            </div>
                        </section>

                        <section className={card}>
                            <p className={eyebrow}>Tentang</p>
                            <h2 className="mt-1 text-xl font-extrabold">Deskripsi lembaga</h2>
                            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Ceritakan siapa Anda dan acara apa yang biasa diselenggarakan.</p>
                            <textarea
                                rows={5}
                                maxLength={1000}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Contoh: Komunitas seni di Batam yang rutin menggelar lomba vokal dan festival musik."
                                className="w-full rounded-xl border border-slate-200 bg-white/90 p-4 text-[15px] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-blue-500/20"
                            />
                            <div className="mt-1 flex justify-between text-xs text-slate-500">
                                <span className="text-rose-500">{errors.description}</span>
                                <span>{data.description.length}/1000</span>
                            </div>
                        </section>

                        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/90 p-3 pl-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
                            <span className="flex items-center gap-2 text-sm text-slate-500">
                                {recentlySuccessful && !isDirty ? (
                                    <><Check className="h-4 w-4 text-emerald-500" /> <b className="text-emerald-600 dark:text-emerald-300">Perubahan tersimpan.</b></>
                                ) : isDirty ? (
                                    'Ada perubahan yang belum disimpan.'
                                ) : (
                                    'Semua perubahan tersimpan.'
                                )}
                            </span>
                            <button disabled={processing || !isDirty} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-7 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-500/25 transition disabled:opacity-50">
                                {processing && <Loader2 className="h-4 w-4 animate-spin" />} Simpan perubahan
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </UserLayout>
    );
}

type ProfilProps = { institution: Institution; stats: { events: number; published: number } };

export default function Profil(props: ProfilProps) {
    const phone = usePhone();
    if (!phone) return <ProfilDesktop {...props} />;
    return (
        <UserLayout title="Profil Lembaga" hasPanel>
            <ProfilLembagaMobile {...props} />
        </UserLayout>
    );
}
