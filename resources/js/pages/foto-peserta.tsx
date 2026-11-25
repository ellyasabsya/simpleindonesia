import FotoPesertaMobile from '@/components/mobile/pages/foto-peserta-mobile';
import { useForm, usePage } from '@inertiajs/react';
import { Camera, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

type Props = { token: string; name: string; description: string | null; event: string; photo: string | null };

function FotoDesktop({ token, name, description, event, photo }: Props) {
    const flash = (usePage().props as any).flash ?? {};
    const form = useForm<{ photo: File | null }>({ photo: null });
    const preview = useMemo(() => (form.data.photo ? URL.createObjectURL(form.data.photo) : null), [form.data.photo]);
    const shown = preview ?? photo;

    const pick = (f: File | undefined) => {
        form.clearErrors();
        if (!f) return;
        if (f.size > 3 * 1024 * 1024) { form.setError('photo', 'Ukuran foto maksimal 3 MB.'); return; }
        form.setData('photo', f);
    };
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/foto-peserta/${token}`, { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4f6fc] p-4 text-slate-900 dark:bg-[#0a0c1a] dark:text-white">
            <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-900/[0.07] dark:bg-[#10132b] dark:ring-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">{event}</p>
                <h1 className="mt-2 text-[22px] leading-tight font-semibold tracking-tight">{name}</h1>
                {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>}

                <div className="mx-auto mt-6 flex h-56 w-56 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-white/15 dark:bg-white/5">
                    {shown ? <img src={shown} alt={name} className="h-full w-full object-cover" /> : <Camera className="h-12 w-12 text-slate-300" />}
                </div>

                {flash.success && <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> {flash.success}</p>}
                {form.errors.photo && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{form.errors.photo}</p>}

                <label className="mt-5 block cursor-pointer rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5">
                    {shown ? 'Ganti foto' : 'Pilih foto'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                </label>
                <button type="submit" disabled={!form.data.photo || form.processing} className="mt-3 w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 dark:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">{form.processing ? 'Mengunggah…' : 'Simpan foto'}</button>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">JPG, PNG, atau WebP, maksimal 3 MB. Pakai foto yang jelas dan berorientasi persegi atau potret.</p>
            </form>
        </div>
    );
}

export default function FotoPeserta(props: Props) {
    return (
        <>
            <div className="md:hidden">
                <FotoPesertaMobile {...props} />
            </div>
            <div className="hidden md:block">
                <FotoDesktop {...props} />
            </div>
        </>
    );
}
