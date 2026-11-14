import type { LucideIcon } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    icon: LucideIcon;
    error?: string;
    optional?: boolean;
};

export default function Field({ label, icon: Icon, error, optional, type = 'text', ...props }: Props) {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';

    return (
        <label className="block">
            <span className="mb-2 block text-[15px] font-semibold text-slate-700 dark:text-slate-200">
                {label}
                {optional && <span className="ml-1 font-normal text-slate-400">(opsional)</span>}
            </span>
            <span
                className={`flex items-center gap-3 rounded-2xl border bg-white/90 px-4 transition focus-within:ring-4 dark:bg-slate-900/60 ${
                    error
                        ? 'border-rose-400 focus-within:ring-rose-200/60'
                        : 'border-slate-200 focus-within:border-indigo-400 focus-within:ring-indigo-100 dark:border-white/10 dark:focus-within:ring-indigo-500/20'
                }`}
            >
                <Icon className="h-[18px] w-[18px] shrink-0 text-slate-400" />
                <input
                    {...props}
                    type={isPassword && show ? 'text' : type}
                    className="h-12 w-full min-w-0 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="text-xs font-bold tracking-wider text-indigo-700 dark:text-indigo-300"
                    >
                        {show ? 'SEMBUNYI' : 'LIHAT'}
                    </button>
                )}
            </span>
            {error && <span className="mt-1.5 block text-sm font-medium text-rose-500">{error}</span>}
        </label>
    );
}
