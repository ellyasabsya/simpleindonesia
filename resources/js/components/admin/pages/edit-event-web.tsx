import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import { DetailForm, box, h3, type Det, type FormShape } from '@/components/admin/pages/edit-event-form';
import { EditLinkPanel, type LinkRow } from '@/components/admin/pages/edit-event-links';

export type Props = { event: Det; subs: Det[]; series: boolean; categories: Record<string, string>; institution: string | null; links?: LinkRow[] };

export default function EditEvent({ event, subs, series, categories, institution, links = [] }: Props) {
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
        <AdminLayout title="Edit Event">
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Event Management
                        </span>
                        <h2 className="mt-3 text-2xl font-extrabold">Edit Event</h2>
                        <p className="mt-1 max-w-2xl text-sm text-white/80">
                            {institution ? `${institution} · ` : ''}Paket, metode pendaftaran, dan jumlah kegiatan tidak bisa diubah dari sini.
                        </p>
                    </div>
                </div>

                <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke Manajemen Event
                </Link>

                <EditLinkPanel eventId={event.id} initial={links} />

                {nErr > 0 && (
                    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
                        Ada {nErr} kolom yang perlu diperbaiki. Periksa pesan merah di bawah.
                    </div>
                )}

                <section className={box}>
                    <h3 className={h3}>{series ? 'Event utama (rangkaian)' : 'Informasi event'}</h3>
                    <DetailForm d={form.data} set={setMain} pre="" err={err} categories={categories} detail={!series} />
                </section>

                {form.data.subs.map((s, i) => (
                    <section key={s.id} className={box}>
                        <h3 className={h3}>Kegiatan {i + 1}: {subs[i]?.title}</h3>
                        <DetailForm d={s} set={(p) => setSub(i, p)} pre={`subs.${i}.`} err={err} categories={categories} detail />
                    </section>
                ))}

                <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
                    <Link href="/admin/events" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Batal</Link>
                    <button type="button" onClick={save} disabled={form.processing} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">
                        {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan perubahan
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
