import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import PanelLayout from '@/components/panel/panel-layout';

type Pkg = { id: number; name: string; price_label: string; description: string | null; features: string[] };

const input =
    'h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-indigo-500/20';
const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300';
const card = 'rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';

export default function CreateEvent({ packages, categories }: { institution: { name: string }; packages: Pkg[]; categories: Record<string, string> }) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        category: string;
        location: string;
        starts_at: string;
        ends_at: string;
        description: string;
        package_id: number | '';
        poster: File | null;
    }>({
        title: '',
        category: '',
        location: '',
        starts_at: '',
        ends_at: '',
        description: '',
        package_id: '',
        poster: null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/panel/ajukan', { forceFormData: true });
    };

    const err = (k: keyof typeof errors) => errors[k] && <p className="mt-1 text-xs text-rose-500">{errors[k]}</p>;

    return (
        <PanelLayout title="Ajukan Event">
            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                <section className={`${card} space-y-5`}>
                    <h2 className="text-xl font-extrabold">Informasi event</h2>

                    <div>
                        <label className={label}>Nama event *</label>
                        <input className={input} value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Contoh: Batam Bernyanyi 2026" />
                        {err('title')}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={label}>Kategori *</label>
                            <select className={input} value={data.category} onChange={(e) => setData('category', e.target.value)}>
                                <option value="">Pilih kategori</option>
                                {Object.entries(categories).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                            {err('category')}
                        </div>
                        <div>
                            <label className={label}>Lokasi *</label>
                            <input className={input} value={data.location} onChange={(e) => setData('location', e.target.value)} placeholder="Contoh: Ballroom Hotel Pacific" />
                            {err('location')}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={label}>Tanggal mulai *</label>
                            <input type="date" className={input} value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} />
                            {err('starts_at')}
                        </div>
                        <div>
                            <label className={label}>Tanggal selesai *</label>
                            <input type="date" className={input} value={data.ends_at} min={data.starts_at} onChange={(e) => setData('ends_at', e.target.value)} />
                            {err('ends_at')}
                        </div>
                    </div>

                    <div>
                        <label className={label}>Deskripsi</label>
                        <textarea rows={4} maxLength={2000} value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/90 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800" />
                        {err('description')}
                    </div>

                    <div>
                        <label className={label}>Poster (rasio 4:5, maks. 4 MB)</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => setData('poster', e.target.files?.[0] ?? null)}
                            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-800 dark:file:bg-indigo-500/20 dark:file:text-white"
                        />
                        {err('poster')}
                    </div>
                </section>

                <section className={`${card} space-y-4`}>
                    <h2 className="text-xl font-extrabold">Pilih paket *</h2>
                    {packages.length === 0 && <p className="text-sm text-slate-500">Belum ada paket yang tersedia. Hubungi admin.</p>}

                    {packages.map((p) => {
                        const on = data.package_id === p.id;
                        return (
                            <label key={p.id} className={`block cursor-pointer rounded-2xl border p-4 transition ${on ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/50 dark:bg-indigo-500/20' : 'border-slate-200 bg-white/70 hover:border-indigo-200 dark:border-white/10 dark:bg-white/5'}`}>
                                <span className="flex items-start gap-3">
                                    <input type="radio" name="package" checked={on} onChange={() => setData('package_id', p.id)} className="mt-1 h-4 w-4 accent-indigo-700" />
                                    <span className="min-w-0">
                                        <span className="block text-lg font-extrabold">{p.name}</span>
                                        <span className="title-gradient block text-lg font-extrabold">{p.price_label}</span>
                                        {p.description && <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{p.description}</span>}
                                        <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                                            {p.features.map((f) => (
                                                <li key={f} className="flex items-center gap-2"><span className="text-emerald-500">✓</span>{f}</li>
                                            ))}
                                        </ul>
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                    {err('package_id')}

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Fitur dan persentase bagi hasil dikunci saat event diajukan. Perubahan paket di kemudian hari tidak memengaruhi event ini.
                    </p>

                    <button
                        disabled={processing}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25 disabled:opacity-60"
                    >
                        {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                        Ajukan Event
                    </button>
                </section>
            </form>
        </PanelLayout>
    );
}
