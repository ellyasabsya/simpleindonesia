import { useForm } from '@inertiajs/react';
import { Building2, CalendarDays, CheckCircle2, Globe, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Field from '@/components/auth/field';
import PanelLayout from '@/components/panel/panel-layout';

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

const card = 'rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';

export default function Profil({ institution, stats }: { institution: Institution; stats: { events: number; published: number } }) {
    const [saved, setSaved] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm<{
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

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setSaved(false);
        post('/panel/profil', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
                setData('logo', null);
            },
        });
    };

    const logo = preview ?? institution.logo_url;
    const input =
        'w-full rounded-xl border border-slate-200 bg-white/90 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-indigo-500/20';
    const label = 'mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200';

    return (
        <PanelLayout title="Profil Lembaga">
            <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
                <section className={`${card} h-fit text-center`}>
                    <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-4xl font-extrabold text-white shadow-lg shadow-indigo-600/25">
                        {logo ? <img src={logo} alt={institution.name} className="h-full w-full object-cover" /> : institution.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="mt-5 text-2xl font-extrabold">{institution.name}</h2>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {institution.status === 'approved' ? 'Terverifikasi' : institution.status}
                    </span>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                            <p className="text-3xl font-extrabold">{stats.events}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total event</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                            <p className="text-3xl font-extrabold">{stats.published}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Event tayang</p>
                        </div>
                    </div>

                    <p className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-4 w-4" />
                        Terdaftar{' '}
                        {institution.created_at ? new Date(institution.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                </section>

                <form onSubmit={submit} className={`${card} space-y-5`}>
                    <div>
                        <h2 className="text-xl font-extrabold">Data lembaga</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Informasi ini tampil di halaman event milik lembaga Anda.</p>
                    </div>

                    {saved && (
                        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <CheckCircle2 className="h-4 w-4" /> Perubahan tersimpan.
                        </p>
                    )}

                    <Field label="Nama lembaga" icon={Building2} value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Email kontak" icon={Mail} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} required />
                        <Field label="Nomor telepon" icon={Phone} type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} required />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Alamat" optional icon={MapPin} value={data.address} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                        <Field label="Website" optional icon={Globe} placeholder="https://" value={data.website} onChange={(e) => setData('website', e.target.value)} error={errors.website} />
                    </div>

                    <div>
                        <label className={label}>Deskripsi <span className="font-normal text-slate-400">(opsional)</span></label>
                        <textarea rows={4} maxLength={1000} value={data.description} onChange={(e) => setData('description', e.target.value)} className={input} />
                        {errors.description && <p className="mt-1 text-sm text-rose-500">{errors.description}</p>}
                    </div>

                    <div>
                        <label className={label}>Logo (maks. 2 MB)</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setData('logo', f);
                                setPreview(f ? URL.createObjectURL(f) : null);
                            }}
                            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-800 dark:file:bg-indigo-500/20 dark:file:text-white"
                        />
                        {errors.logo && <p className="mt-1 text-sm text-rose-500">{errors.logo}</p>}
                    </div>

                    <button
                        disabled={processing}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25 disabled:opacity-60"
                    >
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                    </button>
                </form>
            </div>
        </PanelLayout>
    );
}
