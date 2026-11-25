import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { useMemo, type FormEvent } from 'react';
import { CARD, MUTED } from '../kit/soft';

type Item = {
    id: number;
    title: string;
    summary: string | null;
    body: string;
    status: 'draft' | 'published';
    cover_url: string | null;
};

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5';
const LABEL = 'mb-1.5 flex items-center justify-between text-[13px] font-semibold';

export default function BeritaFormMobile({ news }: { news: Item | null }) {
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
        <form onSubmit={submit} className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold">{editing ? 'Ubah berita' : 'Tambah berita'}</h2>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">Isi judul, gambar sampul, dan isi berita lalu pilih status terbit.</p>
                    </div>
                    <Link href="/admin/berita" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 text-[13px] font-semibold text-white">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                </div>
            </section>

            <div className={'space-y-4 rounded-2xl p-4 ' + CARD}>
                <div>
                    <label className={LABEL}>
                        <span>Judul</span>
                        <span className={'text-xs font-normal ' + MUTED}>{data.title.length}/200</span>
                    </label>
                    <input className={INPUT} maxLength={200} placeholder="Tulis judul berita" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                    {err(errors.title)}
                </div>

                <div>
                    <label className={LABEL}>
                        <span>Ringkasan</span>
                        <span className={'text-xs font-normal ' + MUTED}>{data.summary.length}/300</span>
                    </label>
                    <textarea className={INPUT} rows={3} maxLength={300} placeholder="Ringkasan singkat yang tampil di kartu berita" value={data.summary} onChange={(e) => setData('summary', e.target.value)} />
                    {err(errors.summary)}
                </div>
            </div>

            <div className={'rounded-2xl p-4 ' + CARD}>
                <label className={LABEL}>
                    <span>Gambar sampul (16:9)</span>
                </label>
                <div className="aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 dark:border-white/15 dark:bg-white/5">
                    {preview ? (
                        <img src={preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className={'flex h-full flex-col items-center justify-center gap-2 text-sm ' + MUTED}>
                            <ImagePlus className="h-7 w-7" />
                            Belum ada gambar
                        </div>
                    )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                        Pilih gambar
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                setData((d) => ({ ...d, cover: e.target.files?.[0] ?? null, remove_cover: false }));
                            }}
                        />
                    </label>
                    {news?.cover_url || data.cover ? (
                        <button
                            type="button"
                            className="h-10 rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                            onClick={() => setData((d) => ({ ...d, cover: null, remove_cover: true }))}
                        >
                            Hapus gambar
                        </button>
                    ) : (
                        <span />
                    )}
                </div>
                <p className={'mt-2 text-xs ' + MUTED}>JPG, PNG, atau WebP. Maksimal 2 MB.</p>
                {err(errors.cover)}
            </div>

            <div className={'rounded-2xl p-4 ' + CARD}>
                <label className={LABEL}>
                    <span>Isi berita</span>
                </label>
                <textarea className={INPUT + ' font-mono leading-6'} rows={12} placeholder="Tulis isi berita di sini..." value={data.body} onChange={(e) => setData('body', e.target.value)} />
                <p className={'mt-2 text-xs leading-snug ' + MUTED}>Mendukung Markdown: ## Judul bagian, **tebal**, *miring*, daftar dengan tanda - , dan [teks](tautan).</p>
                {err(errors.body)}
            </div>

            <div className={'space-y-3 rounded-2xl p-4 ' + CARD}>
                <div>
                    <div className="mb-2 text-[13px] font-semibold">Status</div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            ['draft', 'Draf'],
                            ['published', 'Terbit'],
                        ].map(([v, l]) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setData('status', v)}
                                className={'h-10 rounded-full text-sm font-semibold ' + (data.status === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300')}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    {err(errors.status)}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Link href="/admin/berita" className="flex h-11 items-center justify-center rounded-full bg-slate-900/[0.06] text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        Batal
                    </Link>
                    <button type="submit" disabled={processing} className="h-11 rounded-full bg-indigo-600 text-sm font-semibold text-white disabled:opacity-60">
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </form>
    );
}
