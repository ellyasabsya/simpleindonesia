import { Head, useForm } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';
import { DetailForm, type Det } from '@/components/admin/pages/edit-event-form';

type FormShape = Det & { subs: Det[] };
type Props = { token: string; event: Det; subs: Det[]; series: boolean; categories: Record<string, string>; institution: string | null; expires_at: string };

const box = 'rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-5 dark:border-white/10 dark:bg-slate-900/60';

export default function PanitiaEditEvent({ token, event, subs, series, categories, institution, expires_at }: Props) {
    const form = useForm<FormShape>({
        ...event, poster: null, juknis: null,
        subs: subs.map((s) => ({ ...s, poster: null, juknis: null })),
    });
    const err = (k: string) => (form.errors as Record<string, string>)[k];
    const nErr = Object.keys(form.errors).length;
    const setMain = (p: Partial<Det>) => form.setData((d) => ({ ...d, ...p }));
    const setSub = (i: number, p: Partial<Det>) => form.setData((d) => ({ ...d, subs: d.subs.map((s, j) => (j === i ? { ...s, ...p } : s)) }));
    const save = () => {
        if (!window.confirm('Link ini hanya bisa dipakai untuk satu kali simpan. Setelah berhasil disimpan, link tidak bisa dibuka lagi. Lanjutkan?')) return;
        form.post(`/edit-event/${token}`, { forceFormData: true, preserveScroll: true, preserveState: true });
    };

    return (
        <div className="min-h-screen bg-[#f4f6fc] px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-28 sm:p-6 dark:bg-[#0a0c1a]">
            <Head title="Edit Event">
                <meta name="robots" content="noindex" />
                <meta name="referrer" content="no-referrer" />
            </Head>
            <div className="mx-auto w-full max-w-4xl space-y-3 md:space-y-5">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-500 px-4 py-4 text-white md:rounded-3xl md:via-blue-600 md:to-violet-600 md:px-7 md:py-6 md:shadow-lg md:shadow-indigo-500/20">
                    <h1 className="text-[22px] leading-tight font-semibold md:text-2xl md:font-extrabold">Edit Event</h1>
                    <p className="mt-1 text-[13px] text-white/80 md:text-sm">{institution ? `${institution} · ` : ''}Berlaku sampai {expires_at}. Link ini hanya bisa dipakai untuk satu kali simpan.</p>
                    <p className="mt-1 text-[11px] text-white/70 md:text-xs">Paket, metode pendaftaran, dan jumlah kegiatan tidak bisa diubah.</p>
                </div>

                {nErr > 0 && (
                    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                        Ada {nErr} kolom yang perlu diperbaiki. Periksa pesan merah di bawah. Link Anda belum terpakai.
                    </div>
                )}

                <section className={box}>
                    <h3 className="text-[15px] font-semibold md:text-base md:font-extrabold">{series ? 'Event utama (rangkaian)' : 'Informasi event'}</h3>
                    <DetailForm d={form.data} set={setMain} pre="" err={err} categories={categories} detail={!series} />
                </section>

                {form.data.subs.map((s, i) => (
                    <section key={s.id} className={box}>
                        <h3 className="text-[15px] font-semibold md:text-base md:font-extrabold">Kegiatan {i + 1}: {subs[i]?.title}</h3>
                        <DetailForm d={s} set={(p) => setSub(i, p)} pre={`subs.${i}.`} err={err} categories={categories} detail />
                    </section>
                ))}

                <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex justify-end pr-20 md:pr-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg md:backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
                    <button type="button" onClick={save} disabled={form.processing} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-medium text-white disabled:opacity-50 md:h-auto md:w-auto md:rounded-lg md:bg-indigo-700 md:px-5 md:py-2.5 md:font-bold md:hover:bg-indigo-800">
                        {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan perubahan
                    </button>
                </div>
            </div>
        </div>
    );
}
