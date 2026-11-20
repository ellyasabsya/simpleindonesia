import type { ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';

type Props = { icon: MenuIcon; title: string; text: string; action?: ReactNode };

/** Tampilan kosong: ikon dalam kotak berwarna, judul, penjelasan singkat, dan satu tombol opsional. */
export default function EmptyState({ icon: Icon, title, text, action }: Props) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
                <Icon className="size-8" />
            </span>
            <p className="mt-2 text-lg font-bold">{title}</p>
            <p className="max-w-xs text-sm text-slate-600 dark:text-slate-300">{text}</p>
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
