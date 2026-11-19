import { CheckCircle2, FileText, UploadCloud } from 'lucide-react';
import { type ChangeEventHandler, useEffect, useRef, useState } from 'react';

const sizeLabel = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function FileDrop({
    file,
    accept,
    onChange,
    onClear,
    invalid = false,
    title = 'Klik untuk unggah file',
    hint,
}: {
    file: File | null;
    accept?: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onClear: () => void;
    invalid?: boolean;
    title?: string;
    hint?: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (file && file.type.startsWith('image/')) {
            const u = URL.createObjectURL(file);
            setUrl(u);
            return () => URL.revokeObjectURL(u);
        }
        setUrl(null);
    }, [file]);

    const open = () => {
        if (ref.current) ref.current.value = '';
        ref.current?.click();
    };
    const clear = () => {
        if (ref.current) ref.current.value = '';
        onClear();
    };

    return (
        <div>
            <input ref={ref} type="file" accept={accept} onChange={onChange} className="sr-only" tabIndex={-1} />
            {file ? (
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-400/40 dark:bg-emerald-500/10">
                    {url ? (
                        <img src={url} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-emerald-200 object-cover" />
                    ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                            <FileText className="h-7 w-7" />
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 shrink-0" /> File terpilih
                        </p>
                        <p className="truncate font-semibold">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{sizeLabel(file.size)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={open} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">Ganti</button>
                        <button type="button" onClick={clear} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10">Hapus</button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={open}
                    className={`flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 ${invalid ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-500/10' : 'border-slate-300 bg-white/60 dark:border-white/15 dark:bg-white/5'}`}
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                        <UploadCloud className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold">{title}</span>
                    {hint && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
                </button>
            )}
        </div>
    );
}
