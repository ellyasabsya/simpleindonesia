import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import UserLayout from '@/components/user/user-layout';

type Pkg = { id: number; name: string; price_label: string; description: string | null; features: string[] };
type Props = { institution: { name: string }; packages: Pkg[]; categories: Record<string, string> };

const steps = ['Informasi', 'Jadwal & Poster', 'Paket', 'Tinjau'];
const input =
    'h-12 w-full rounded-xl border border-slate-200 bg-white/90 px-4 text-[15px] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-indigo-500/20';
const label = 'mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200';
const card = 'rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const fmt = (d: string) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');
const fieldStep: Record<string, number> = { title: 0, category: 0, location: 0, starts_at: 1, ends_at: 1, description: 1, poster: 1, package_id: 2 };

export default function CreateEvent({ packages, categories }: Props) {
    const [step, setStep] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [local, setLocal] = useState<Record<string, string>>({});

    const { data, setData, post, processing, errors } = useForm<{
        title: string; category: string; location: string; starts_at: string; ends_at: string;
        description: string; package_id: number | ''; poster: File | null;
    }>({ title: '', category: '', location: '', starts_at: '', ends_at: '', description: '', package_id: '', poster: null });

    const err = (k: string) => local[k] ?? (errors as Record<string, string>)[k];
    const pkg = packages.find((p) => p.id === data.package_id);

    const validate = (s: number) => {
        const e: Record<string, string> = {};
        if (s === 0) {
            if (!data.title.trim()) e.title = 'Nama event wajib diisi.';
            if (!data.category) e.category = 'Pilih kategori event.';
            if (!data.location.trim()) e.location = 'Lokasi wajib diisi.';
        }
        if (s === 1) {
            if (!data.starts_at) e.starts_at = 'Tanggal mulai wajib diisi.';
            if (!data.ends_at) e.ends_at = 'Tanggal selesai wajib diisi.';
            else if (data.starts_at && data.ends_at < data.starts_at) e.ends_at = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
        }
        if (s === 2 && !data.package_id) e.package_id = 'Pilih paket event.';
        setLocal(e);
        return Object.keys(e).length === 0;
    };

    const next = () => validate(step) && setStep(step + 1);
    const back = () => { setLocal({}); setStep(step - 1); };

    const submit = () => {
        post('/panel/ajukan', {
            forceFormData: true,
            onError: (errs) => setStep(Math.min(...Object.keys(errs).map((k) => fieldStep[k] ?? 3))),
        });
    };

    const Err = ({ k }: { k: string }) => (err(k) ? <p className="mt-1.5 text-sm text-rose-500">{err(k)}</p> : null);

    return (
        <UserLayout title="Ajukan Event" hasPanel>
            <section className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold">Ajukan <span className="title-gradient">Event Baru</span></h1>
                <Link href="/panel" className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-white dark:bg-white/10">
                    <ArrowLeft className="h-4 w-4" /> Panel Lembaga
                </Link>
            </section>

            <ol className="flex items-center py-1">
                {steps.map((s, i) => (
                    <li key={s} className="flex flex-1 items-center last:flex-none">
                        <span className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold transition ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/80 text-slate-400 dark:bg-white/10'}`}>
                                {i < step ? <Check className="h-5 w-5" /> : i + 1}
                            </span>
                            <span className={`hidden text-sm font-bold sm:block ${i === step ? '' : 'text-slate-400'}`}>{s}</span>
                        </span>
                        {i < steps.length - 1 && <span className={`mx-3 h-1 flex-1 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`} />}
                    </li>
                ))}
            </ol>

            <div className={`${card} w-full`}>
                {step === 0 && (
                    <div className="space-y-5">
                        <h2 className="text-2xl font-extrabold">Informasi event</h2>
                        <div>
                            <label className={label}>Nama event *</label>
                            <input className={input} value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Contoh: Batam Bernyanyi 2026" />
                            <Err k="title" />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label className={label}>Kategori *</label>
                                <select className={input} value={data.category} onChange={(e) => setData('category', e.target.value)}>
                                    <option value="">Pilih kategori</option>
                                    {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                                <Err k="category" />
                            </div>
                            <div>
                                <label className={label}>Lokasi *</label>
                                <input className={input} value={data.location} onChange={(e) => setData('location', e.target.value)} placeholder="Contoh: Ballroom Hotel Pacific" />
                                <Err k="location" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-extrabold">Jadwal & poster</h2>
                        <div className="grid gap-6 md:grid-cols-[1fr_200px]">
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={label}>Tanggal mulai *</label>
                                        <input type="date" className={input} value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} />
                                        <Err k="starts_at" />
                                    </div>
                                    <div>
                                        <label className={label}>Tanggal selesai *</label>
                                        <input type="date" className={input} min={data.starts_at} value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} />
                                        <Err k="ends_at" />
                                    </div>
                                </div>
                                <div>
                                    <label className={label}>Deskripsi</label>
                                    <textarea rows={5} maxLength={2000} value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/90 p-4 text-[15px] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800" />
                                    <Err k="description" />
                                </div>
                            </div>
                            <div>
                                <label className={label}>Poster (4:5, maks. 4 MB)</label>
                                <div className="flex h-[180px] w-36 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-indigo-900 via-blue-700 to-purple-600 text-xs text-white/70">
                                    {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : '4:5'}
                                </div>
                                <input type="file" accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => { const f = e.target.files?.[0] ?? null; setData('poster', f); setPreview(f ? URL.createObjectURL(f) : null); }}
                                    className="mt-3 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-800 dark:file:bg-indigo-500/20 dark:file:text-white" />
                                <Err k="poster" />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-extrabold">Pilih paket</h2>
                        {packages.length === 0 && <p className="text-sm text-slate-500">Belum ada paket tersedia. Hubungi admin.</p>}
                        <div className="grid gap-4 md:grid-cols-3">
                            {packages.map((p) => {
                                const on = data.package_id === p.id;
                                return (
                                    <label key={p.id} className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition ${on ? 'border-indigo-400 bg-indigo-50 ring-4 ring-indigo-100 dark:border-indigo-400/50 dark:bg-indigo-500/20 dark:ring-indigo-500/10' : 'border-slate-200 bg-white/70 hover:border-indigo-200 dark:border-white/10 dark:bg-white/5'}`}>
                                        <span className="flex items-center gap-2">
                                            <input type="radio" name="package" checked={on} onChange={() => setData('package_id', p.id)} className="h-4 w-4 accent-indigo-700" />
                                            <span className="text-lg font-extrabold">{p.name}</span>
                                        </span>
                                        <span className="title-gradient mt-1 block text-base font-extrabold">{p.price_label}</span>
                                        {p.description && <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{p.description}</span>}
                                        <span className="mt-3 flex flex-col gap-1">
                                            {p.features.map((f) => <span key={f} className="text-xs font-semibold">✓ {f}</span>)}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <Err k="package_id" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Fitur dan persentase bagi hasil dikunci saat event diajukan.</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5">
                        <h2 className="text-2xl font-extrabold">Tinjau pengajuan</h2>
                        <dl className="divide-y divide-slate-200/70 rounded-2xl border border-slate-200 bg-white/70 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
                            {[
                                ['Nama event', data.title],
                                ['Kategori', categories[data.category] ?? '-'],
                                ['Lokasi', data.location],
                                ['Tanggal', `${fmt(data.starts_at)} – ${fmt(data.ends_at)}`],
                                ['Paket', pkg ? `${pkg.name} · ${pkg.price_label}` : '-'],
                                ['Poster', data.poster ? data.poster.name : 'Tidak ada'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4 px-5 py-3 text-[15px]">
                                    <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                                    <dd className="text-right font-semibold">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        {Object.keys(errors).length > 0 && <p className="text-sm text-rose-500">Ada isian yang belum sesuai. Silakan periksa langkah sebelumnya.</p>}
                    </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                    <button onClick={back} disabled={step === 0} className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:invisible dark:text-slate-300 dark:hover:bg-white/10">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                    {step < 3 ? (
                        <button onClick={next} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
                            Lanjut <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button onClick={submit} disabled={processing} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-7 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60">
                            {processing && <Loader2 className="h-4 w-4 animate-spin" />} Ajukan Event
                        </button>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
