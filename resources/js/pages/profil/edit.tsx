import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, AtSign, Cake, Camera, CalendarDays, Loader2, MapPin, Phone, User } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import UserLayout from '@/components/user/user-layout';
import { SocialChips, socialList } from '@/lib/socials';

const card = 'rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const wrap = 'relative';
const input = 'h-12 w-full rounded-xl border border-slate-200 bg-white/90 pl-11 pr-4 text-[15px] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-indigo-500/20';
const lbl = 'mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200';

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
    return (
        <div className={card}>
            <h2 className="text-lg font-extrabold">{title}</h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
            <div className="grid gap-5 sm:grid-cols-2">{children}</div>
        </div>
    );
}

export default function EditProfil() {
    const pg = usePage().props as any;
    const u = { ...(pg.auth?.user ?? {}), ...(pg.profile ?? {}) };
    const fileRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(u.avatar ?? null);
    const { data, setData, post, processing, errors, isDirty } = useForm<Record<string, any>>({
        name: u.name ?? '', username: u.username ?? '', bio: u.bio ?? '', city: u.city ?? '',
        phone: u.phone ?? '', birth_date: (u.birth_date ?? '').slice(0, 10), socials: { ...Object.fromEntries(socialList.map((p) => [p.key, ''])), ...(u.socials ?? {}) }, avatar: null,
    });
    const err = (k: string) => (errors as Record<string, string>)[k];

    const field = (k: string, text: string, Icon: any, type = 'text', ph = '') => (
        <div>
            <label className={lbl}>{text}</label>
            <div className={wrap}>
                <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type={type} className={input} value={data[k]} placeholder={ph} onChange={(e) => setData(k, e.target.value)} />
            </div>
            {err(k) && <p className="mt-1.5 text-sm text-rose-500">{err(k)}</p>}
        </div>
    );

    const ini = (data.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : null;

    return (
        <UserLayout title="Edit profil" hasPanel>
            <section className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold">Edit <span className="title-gradient">Profil</span></h1>
                <Link href="/dashboard" className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-white dark:bg-white/10"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
                <aside className="lg:sticky lg:top-24">
                    <div className={`${card} overflow-hidden !p-0`}>
                        <div className="relative h-24 bg-gradient-to-r from-indigo-900 via-blue-600 to-fuchsia-500">
                            {preview && <img src={preview} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />}
                            <span className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
                        </div>
                        <div className="px-6 pb-6">
                            <div className="relative -mt-12 h-24 w-24">
                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-blue-600 to-violet-600 text-3xl font-extrabold text-white shadow-xl ring-4 ring-white dark:ring-slate-900">
                                    {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : ini}
                                </div>
                                <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-4 ring-white hover:bg-indigo-700 dark:ring-slate-900"><Camera className="h-4 w-4" /></button>
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0] ?? null; setData('avatar', f); if (f) setPreview(URL.createObjectURL(f)); }} />
                            </div>
                            <h3 className="mt-3 text-2xl font-extrabold"><span className="title-gradient">{data.name || 'Nama Anda'}</span></h3>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{data.username ? `@${data.username}` : '@username'}</p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{data.bio || 'Bio Anda akan tampil di sini.'}</p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                                {data.city && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><MapPin className="h-3 w-3 text-rose-500" /> {data.city}</span>}
                                <SocialChips socials={data.socials} />
                                {joined && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><CalendarDays className="h-3 w-3 text-indigo-500" /> {joined}</span>}
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 px-2 text-center text-xs text-slate-500">Pratinjau langsung: begini orang lain melihat profil Anda.</p>
                    {err('avatar') && <p className="mt-2 text-center text-sm text-rose-500">{err('avatar')}</p>}
                </aside>

                <div className="space-y-6">
                    <Section title="Identitas" hint="Nama dan username yang dikenal teman Anda.">
                        {field('name', 'Nama lengkap', User)}
                        {field('username', 'Username', AtSign, 'text', 'contoh: masell')}
                    </Section>

                    <div className={card}>
                        <h2 className="text-lg font-extrabold">Tentang Anda</h2>
                        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Satu atau dua kalimat yang menggambarkan Anda.</p>
                        <textarea rows={4} maxLength={300} value={data.bio} onChange={(e) => setData('bio', e.target.value)} placeholder="Contoh: Penyanyi dan penggiat seni di Batam."
                            className="w-full rounded-xl border border-slate-200 bg-white/90 p-4 text-[15px] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800" />
                        <div className="mt-1 flex justify-between text-xs text-slate-500">
                            <span className="text-rose-500">{err('bio')}</span><span>{data.bio.length}/300</span>
                        </div>
                    </div>

                    <Section title="Kontak & data diri" hint="Kota tampil di profil. Telepon dan tanggal lahir hanya untuk Anda.">
                        {field('city', 'Kota asal', MapPin, 'text', 'contoh: Batam')}
                        {field('phone', 'Nomor telepon', Phone, 'tel', '08xxxxxxxxxx')}
                        {field('birth_date', 'Tanggal lahir', Cake, 'date')}
                    </Section>

                    <Section title="Media sosial" hint="Isi yang dipakai saja. Cukup username tanpa @, atau alamat untuk website.">
                        {socialList.map((p) => (
                            <div key={p.key}>
                                <label className={lbl}>{p.label}</label>
                                <div className={wrap}>
                                    <span className={`pointer-events-none absolute left-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${p.color}`} />
                                    <input className={input} value={data.socials[p.key] ?? ''} placeholder={p.ph} onChange={(e) => setData('socials', { ...data.socials, [p.key]: e.target.value })} />
                                </div>
                                {err(`socials.${p.key}`) && <p className="mt-1.5 text-sm text-rose-500">{err(`socials.${p.key}`)}</p>}
                            </div>
                        ))}
                    </Section>

                    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/90 p-3 pl-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
                        <span className="text-sm text-slate-500">{isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}</span>
                        <button onClick={() => post('/profil', { forceFormData: true })} disabled={processing} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 px-7 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60">
                            {processing && <Loader2 className="h-4 w-4 animate-spin" />} Simpan profil
                        </button>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
