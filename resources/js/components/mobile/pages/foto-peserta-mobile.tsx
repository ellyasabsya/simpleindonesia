import { useForm, usePage } from '@inertiajs/react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { CARD, FIELD, MUTED, PAGE, PRESS } from '../kit/soft';

type Props = { token: string; name: string; description: string | null; event: string; photo: string | null };

/** Unggah foto peserta lewat link khusus, HP: satu kartu, pratinjau persegi, simpan di bawah. */
export default function FotoPesertaMobile({ token, name, description, event, photo }: Props) {
    const flash = (usePage().props as { flash?: { success?: string } }).flash ?? {};
    const form = useForm<{ photo: File | null }>({ photo: null });
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!form.data.photo) {
            setPreview(null);
            return;
        }
        const u = URL.createObjectURL(form.data.photo);
        setPreview(u);
        return () => URL.revokeObjectURL(u);
    }, [form.data.photo]);

    const shown = preview ?? photo;

    const pick = (f: File | undefined) => {
        form.clearErrors();
        if (!f) return;
        if (f.size > 3 * 1024 * 1024) {
            form.setError('photo', 'Ukuran foto maksimal 3 MB.');
            return;
        }
        form.setData('photo', f);
    };
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!form.data.photo || form.processing) return;
        form.post('/foto-peserta/' + token, { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <form onSubmit={submit} className={'min-h-screen px-4 pt-8 pb-24 text-slate-900 dark:text-white ' + PAGE}>
            <div className={'space-y-3 rounded-3xl p-5 text-center ' + CARD}>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{event}</p>
                <h1 className="text-[22px] leading-tight font-semibold tracking-tight break-words">{name}</h1>
                {description && <p className={'text-[13px] ' + MUTED}>{description}</p>}

                <div className={'mx-auto flex size-56 items-center justify-center overflow-hidden rounded-3xl ' + FIELD}>
                    {shown ? <img src={shown} alt={name} className="size-full object-cover" /> : <Camera className="size-12 text-slate-400" />}
                </div>

                {flash.success && (
                    <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 p-3 text-[13px] font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-4 shrink-0" /> {flash.success}
                    </p>
                )}
                {form.errors.photo && <p className="rounded-2xl bg-rose-500/10 p-3 text-[13px] font-medium text-rose-700 dark:text-rose-300">{form.errors.photo}</p>}

                <label className={'flex h-10 w-full cursor-pointer items-center justify-center rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-200 ' + FIELD + ' ' + PRESS}>
                    {shown ? 'Ganti foto' : 'Pilih foto'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                </label>
                <button type="submit" disabled={!form.data.photo || form.processing} className={'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-50 dark:bg-indigo-500 ' + PRESS}>
                    {form.processing && <Loader2 className="size-4 animate-spin" />} {form.processing ? 'Mengunggah...' : 'Simpan foto'}
                </button>
                <p className={'text-[11px] leading-snug ' + MUTED}>JPG, PNG, atau WebP, maksimal 3 MB. Pakai foto yang jelas dan berorientasi persegi atau potret.</p>
            </div>
        </form>
    );
}
