import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { FormEvent, useMemo } from 'react';
import AdminLayout from '@/components/admin/admin-layout';

type Item = {
    id: number;
    title: string;
    summary: string | null;
    body: string;
    status: 'draft' | 'published';
    cover_url: string | null;
};

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-slate-900/60';
const input =
    'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15 dark:bg-slate-900 dark:text-white';
const label = 'mb-1.5 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100';
const counter = 'text-xs font-normal text-slate-500';

export default function BeritaForm({ news }: { news: Item | null }) {
    const editing = news !== null;
    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        title: string;
        summary: string;
        body: string;
        status: string;
        cover: File | null;
        remove_cover: boolean;
    }>({
        _method: editing ? 'put' : 'post',
        title: news?.title ?? '',
        summary: news?.summary ?? '',
        body: news?.body ?? '',
        status: news?.status ?? 'draft',
        cover: null,
        remove_cover: false,
    });

    const preview = useMemo(() => {
        if (data.cover) return URL.createObjectURL(data.cover);
        if (data.remove_cover) return null;
        return news?.cover_url ?? null;
    }, [data.cover, data.remove_cover, news?.cover_url]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(editing ? `/admin/berita/${news!.id}` : '/admin/berita', { forceFormData: true });
    };

    const err = (m?: string) => (m ? <p className="mt-1.5 text-xs font-medium text-rose-600">{m}</p> : null);

    return (
        <AdminLayout title="Berita">
            <Head title={editing ? 'Ubah berita' : 'Tambah berita'} />
            <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Konten
                            </span>
                            <h1 className="mt-3 text-2xl font-extrabold">{editing ? 'Ubah berita' : 'Tambah berita'}</h1>
                            <p className="mt-1 text-sm text-white/80">Isi judul, gambar sampul, dan isi berita lalu pilih status terbit.</p>
                        </div>
                        <Link
                            href="/admin/berita"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                        >
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Link>
                    </div>
                </div>

                <div className={`${card} space-y-5`}>
                    <div>
                        <label className={label}>
                            <span>Judul</span>
                            <span className={counter}>{data.title.length}/200</span>
                        </label>
                        <input
                            className={input}
                            maxLength={200}
                            placeholder="Tulis judul berita"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {err(errors.title)}
                    </div>

                    <div>
                        <label className={label}>
                            <span>Ringkasan</span>
                            <span className={counter}>{data.summary.length}/300</span>
                        </label>
                        <textarea
                            className={input}
                            rows={3}
                            maxLength={300}
                            placeholder="Ringkasan singkat yang tampil di kartu berita"
                            value={data.summary}
                            onChange={(e) => setData('summary', e.target.value)}
                        />
                        {err(errors.summary)}
                    </div>
                </div>

                <div className={card}>
                    <label className={label}>
                        <span>Gambar sampul (16:9)</span>
                    </label>
                    <div className="aspect-video w-full max-w-lg overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-white/15 dark:bg-white/5">
                        {preview ? (
                            <img src={preview} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400">
                                <ImagePlus className="h-8 w-8" />
                                Belum ada gambar
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700 dark:text-slate-300"
                            onChange={(e) => {
                                setData((d) => ({ ...d, cover: e.target.files?.[0] ?? null, remove_cover: false }));
                            }}
                        />
                        {(news?.cover_url || data.cover) && (
                            <button
                                type="button"
                                className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200"
                                onClick={() => setData((d) => ({ ...d, cover: null, remove_cover: true }))}
                            >
                                Hapus gambar
                            </button>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
                    {err(errors.cover)}
                </div>

                <div className={card}>
                    <label className={label}>
                        <span>Isi berita</span>
                    </label>
                    <textarea
                        className={`${input} font-mono leading-6`}
                        rows={16}
                        placeholder="Tulis isi berita di sini..."
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Mendukung Markdown: ## Judul bagian, **tebal**, *miring*, daftar dengan tanda - , dan [teks](tautan).
                    </p>
                    {err(errors.body)}
                </div>

                <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
                    <div>
                        <div className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Status</div>
                        <div className="flex gap-2">
                            {[
                                ['draft', 'Draf'],
                                ['published', 'Terbit'],
                            ].map(([v, l]) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setData('status', v)}
                                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                        data.status === v
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        {err(errors.status)}
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/berita"
                            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
