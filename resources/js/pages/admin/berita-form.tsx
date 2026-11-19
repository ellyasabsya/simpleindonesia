import { Head, Link, useForm } from '@inertiajs/react';
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

    const input =
        'w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700';
    const err = (m?: string) => (m ? <p className="mt-1 text-xs text-red-600">{m}</p> : null);

    return (
        <AdminLayout title="Berita">
            <Head title={editing ? 'Ubah berita' : 'Tambah berita'} />
            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{editing ? 'Ubah berita' : 'Tambah berita'}</h1>
                    <Link href="/admin/berita" className="text-sm text-gray-500 hover:underline">
                        Kembali
                    </Link>
                </div>

                <div>
                    <label className="mb-1 flex justify-between text-sm font-medium">
                        <span>Judul</span>
                        <span className="text-xs text-gray-500">{data.title.length}/200</span>
                    </label>
                    <input
                        className={input}
                        maxLength={200}
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                    />
                    {err(errors.title)}
                </div>

                <div>
                    <label className="mb-1 flex justify-between text-sm font-medium">
                        <span>Ringkasan</span>
                        <span className="text-xs text-gray-500">{data.summary.length}/300</span>
                    </label>
                    <textarea
                        className={input}
                        rows={3}
                        maxLength={300}
                        value={data.summary}
                        onChange={(e) => setData('summary', e.target.value)}
                    />
                    {err(errors.summary)}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Gambar sampul (16:9)</label>
                    <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        {preview ? (
                            <img src={preview} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                Belum ada gambar
                            </div>
                        )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                                setData((d) => ({ ...d, cover: e.target.files?.[0] ?? null, remove_cover: false }));
                            }}
                        />
                        {(news?.cover_url || data.cover) && (
                            <button
                                type="button"
                                className="text-red-600 hover:underline"
                                onClick={() => setData((d) => ({ ...d, cover: null, remove_cover: true }))}
                            >
                                Hapus gambar
                            </button>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG, atau WebP. Maksimal 2 MB.</p>
                    {err(errors.cover)}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Isi berita</label>
                    <textarea
                        className={`${input} font-mono`}
                        rows={16}
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Mendukung Markdown: ## Judul bagian, **tebal**, *miring*, daftar dengan tanda - , dan [teks](tautan).
                    </p>
                    {err(errors.body)}
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Status</label>
                    <div className="flex gap-2">
                        {[
                            ['draft', 'Draf'],
                            ['published', 'Terbit'],
                        ].map(([v, l]) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setData('status', v)}
                                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                                    data.status === v
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-gray-300 dark:border-gray-700'
                                }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    {err(errors.status)}
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <Link href="/admin/berita" className="rounded-lg border border-gray-300 px-5 py-2 text-sm dark:border-gray-700">
                        Batal
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
