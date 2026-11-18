import { useForm, usePage } from '@inertiajs/react';
import { Camera, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

type Props = { token: string; name: string; description: string | null; event: string; photo: string | null };

export default function FotoPeserta({ token, name, description, event, photo }: Props) {
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-100 p-4 text-slate-900">
            <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
                <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">{event}</p>
                <h1 className="mt-2 text-2xl font-extrabold">{name}</h1>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}

                <div className="mx-auto mt-6 flex h-56 w-56 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50">
                    {shown ? <img src={shown} alt={name} className="h-full w-full object-cover" /> : <Camera className="h-12 w-12 text-slate-300" />}
                </div>

                {flash.success && <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> {flash.success}</p>}
                {form.errors.photo && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{form.errors.photo}</p>}

                <label className="mt-5 block cursor-pointer rounded-2xl border border-slate-200 px-5 py-3 text-sm font-extrabold hover:bg-slate-50">
                    {shown ? 'Ganti foto' : 'Pilih foto'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                </label>
                <button type="submit" disabled={!form.data.photo || form.processing} className="mt-3 w-full rounded-2xl bg-indigo-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50">{form.processing ? 'Mengunggah…' : 'Simpan foto'}</button>
                <p className="mt-3 text-xs text-slate-500">JPG, PNG, atau WebP, maksimal 3 MB. Pakai foto yang jelas dan berorientasi persegi atau potret.</p>
            </form>
        </div>
    );
}
