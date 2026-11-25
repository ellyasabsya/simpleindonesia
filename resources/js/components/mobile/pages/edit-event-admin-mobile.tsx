import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { DetailForm, box, h3, type Det, type FormShape } from '@/components/admin/pages/edit-event-form';
import { EditLinkPanel, type LinkRow } from '@/components/admin/pages/edit-event-links';

type Props = { event: Det; subs: Det[]; series: boolean; categories: Record<string, string>; institution: string | null; links?: LinkRow[] };

export default function EditEventAdminMobile({ event, subs, series, categories, institution, links = [] }: Props) {
    const form = useForm<FormShape>({
        ...event, poster: null, juknis: null,
        subs: subs.map((s) => ({ ...s, poster: null, juknis: null })),
    });
    const err = (k: string) => (form.errors as Record<string, string>)[k];
    const nErr = Object.keys(form.errors).length;
    const setMain = (p: Partial<Det>) => form.setData((d) => ({ ...d, ...p }));
    const setSub = (i: number, p: Partial<Det>) => form.setData((d) => ({ ...d, subs: d.subs.map((s, j) => (j === i ? { ...s, ...p } : s)) }));
    const save = () => form.post(`/admin/events/${event.id}/detail`, { forceFormData: true, preserveScroll: true, preserveState: true });

    return (
        <div className="space-y-3 pb-28">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold">Edit Event</h2>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                            {institution ? `${institution} · ` : ''}Paket, metode pendaftaran, dan jumlah kegiatan tidak bisa diubah dari sini.
                        </p>
                    </div>
                    <Link href="/admin/events" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 text-[13px] font-semibold text-white">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Link>
                </div>
            </section>

            <EditLinkPanel eventId={event.id} initial={links} />

            {nErr > 0 && (
                <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                    Ada {nErr} kolom yang perlu diperbaiki. Periksa pesan merah di bawah.
                </div>
            )}

            <section className={box}>
                <h3 className={h3}>{series ? 'Event utama (rangkaian)' : 'Informasi event'}</h3>
                <DetailForm d={form.data} set={setMain} pre="" err={err} categories={categories} detail={!series} />
            </section>

            {form.data.subs.map((sub, i) => (
                <section key={sub.id} className={box}>
                    <h3 className={h3}>Kegiatan {i + 1}: {subs[i]?.title}</h3>
                    <DetailForm d={sub} set={(p) => setSub(i, p)} pre={`subs.${i}.`} err={err} categories={categories} detail />
                </section>
            ))}

            <div className="sticky bottom-20 z-10 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                <Link href="/admin/events" className="flex h-11 items-center justify-center rounded-full bg-slate-900/[0.06] text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    Batal
                </Link>
                <button type="button" onClick={save} disabled={form.processing} className="flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-semibold text-white disabled:opacity-60">
                    {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
                </button>
            </div>
        </div>
    );
}
