import { useForm, usePage } from '@inertiajs/react';
import { Camera, Check, Loader2, ShieldCheck } from 'lucide-react';
import { type FormEvent, type ReactNode, useRef, useState } from 'react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Institution = {
    id: number; name: string; email: string; phone: string; description: string | null; address: string | null;
    website: string | null; status: string; logo_url: string | null; created_at: string | null;
};

const head = 'mb-1.5 px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300';
const inp = 'h-10 w-full rounded-xl px-3 text-base outline-none placeholder:text-slate-400 ' + FIELD;

function F({ label, optional, error, hint, children }: { label: string; optional?: boolean; error?: string; hint?: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1 block px-1 text-[13px] font-medium">
                {label} {optional && <span className={'font-normal ' + MUTED}>(opsional)</span>}
            </label>
            {children}
            {error ? <p className="mt-1 px-1 text-xs text-rose-600 dark:text-rose-400">{error}</p> : hint ? <p className={'mt-1 px-1 text-[11px] ' + MUTED}>{hint}</p> : null}
        </div>
    );
}

/** Profil lembaga untuk HP: kartu pratinjau, lalu isian dalam tiga kelompok, tombol simpan di bawah. */
export default function ProfilLembagaMobile({ institution, stats }: { institution: Institution; stats: { events: number; published: number } }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { data, setData, post, processing, errors, isDirty, recentlySuccessful, transform } = useForm<{
        name: string; email: string; phone: string; description: string; address: string; website: string; logo: File | null;
    }>({
        name: institution.name,
        email: institution.email,
        phone: institution.phone,
        description: institution.description ?? '',
        address: institution.address ?? '',
        website: institution.website ?? '',
        logo: null,
    });

    transform((d) => ({ ...d, website: d.website && !/^https?:\/\//i.test(d.website) ? 'https://' + d.website : d.website }));

    const flash = (usePage().props as { flash?: { success?: string } }).flash?.success;
    const logo = preview ?? (institution.logo_url ? institution.logo_url.replace(/^https?:\/\/[^/]+(?=\/storage\/)/, '') : null);
    const verified = institution.status === 'approved';
    const name = data.name.trim() || 'Nama lembaga';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (processing) return;
        post('/panel/profil', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData('logo', null);
                setPreview(null);
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3 pb-24">
            {recentlySuccessful && flash && (
                <p className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-[13px] font-medium text-emerald-700 dark:text-emerald-300">
                    <Check className="size-4 shrink-0" /> {flash}
                </p>
            )}

            <section className={'rounded-2xl p-3 ' + CARD}>
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        <span className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 text-2xl font-semibold text-white dark:bg-indigo-500">
                            {logo ? <img src={logo} alt={name} className="size-full object-cover" /> : name.charAt(0).toUpperCase()}
                        </span>
                        <button type="button" aria-label="Ganti logo" onClick={() => fileRef.current?.click()} className={'absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white ring-2 ring-white dark:bg-indigo-500 dark:ring-[#0a0c1a] ' + PRESS}>
                            <Camera className="size-4" />
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
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[17px] leading-tight font-semibold">{name}</h2>
                        <span className={'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ' + (verified ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-800 dark:text-amber-200')}>
                            {verified && <ShieldCheck className="size-3.5" />} {verified ? 'Terverifikasi' : institution.status}
                        </span>
                    </div>
                </div>
                <div className="mt-3 grid grid-cols-2 divide-x divide-slate-900/[0.07] dark:divide-white/10">
                    {([['Total event', stats.events], ['Event tayang', stats.published]] as const).map(([l, n]) => (
                        <div key={l} className="text-center">
                            <p className="text-base leading-tight font-semibold">{n}</p>
                            <p className={'text-[11px] ' + MUTED}>{l}</p>
                        </div>
                    ))}
                </div>
                {errors.logo && <p className="mt-2 text-center text-xs text-rose-600 dark:text-rose-400">{errors.logo}</p>}
            </section>

            <section>
                <h2 className={head}>Data lembaga</h2>
                <div className={'space-y-3 rounded-2xl p-3 ' + CARD}>
                    <F label="Nama lembaga" error={errors.name}>
                        <input className={inp} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    </F>
                    <F label="Email kontak" error={errors.email}>
                        <input autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" className={inp} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                    </F>
                    <F label="Nomor telepon" error={errors.phone}>
                        <input className={inp} type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} required />
                    </F>
                </div>
            </section>

            <section>
                <h2 className={head}>Alamat dan website</h2>
                <div className={'space-y-3 rounded-2xl p-3 ' + CARD}>
                    <F label="Alamat" optional error={errors.address}>
                        <input className={inp} placeholder="Kota atau alamat lengkap" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                    </F>
                    <F label="Website" optional error={errors.website} hint="https:// ditambahkan otomatis.">
                        <input className={inp} placeholder="contoh.com" value={data.website} onChange={(e) => setData('website', e.target.value)} />
                    </F>
                </div>
            </section>

            <section>
                <h2 className={head}>Deskripsi</h2>
                <div className={'rounded-2xl p-3 ' + CARD}>
                    <textarea
                        rows={4}
                        maxLength={1000}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Ceritakan siapa Anda dan acara apa yang biasa diselenggarakan."
                        className={'w-full resize-none rounded-xl px-3 py-2.5 text-base outline-none placeholder:text-slate-400 ' + FIELD}
                    />
                    <div className={'mt-1 flex justify-between px-1 text-[11px] ' + MUTED}>
                        <span className="text-rose-600 dark:text-rose-400">{errors.description}</span>
                        <span>{data.description.length}/1000</span>
                    </div>
                </div>
            </section>

            <button type="submit" disabled={processing || !isDirty} className={'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-50 dark:bg-indigo-500 ' + PRESS}>
                {processing && <Loader2 className="size-4 animate-spin" />} Simpan perubahan
            </button>
            <p className={'text-center text-[11px] ' + MUTED}>{isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}</p>
        </form>
    );
}
