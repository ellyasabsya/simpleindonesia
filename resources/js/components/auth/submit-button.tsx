import { ArrowRight, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export default function SubmitButton({ processing, children }: { processing: boolean; children: ReactNode }) {
    return (
        <button
            type="submit"
            disabled={processing}
            className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
            {!processing && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
    );
}
