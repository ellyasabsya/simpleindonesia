import type { ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';
import { FIELD, MUTED } from './soft';

type Props = { icon: MenuIcon; title: string; text: string; action?: ReactNode };

/** Tampilan kosong: ikon indigo di wadah netral, judul, penjelasan singkat, dan satu tombol opsional. */
export default function EmptyState({ icon: Icon, title, text, action }: Props) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className={'flex size-16 items-center justify-center rounded-3xl text-indigo-700 dark:text-indigo-300 ' + FIELD}>
                <Icon className="size-7" />
            </span>
            <p className="mt-2 text-[15px] font-semibold text-slate-900 dark:text-white">{title}</p>
            <p className={'max-w-xs text-[13px] leading-relaxed ' + MUTED}>{text}</p>
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
