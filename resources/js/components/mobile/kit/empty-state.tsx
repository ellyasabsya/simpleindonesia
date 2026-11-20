import type { ReactNode } from 'react';
import type { MenuIcon } from '../menu/menu-types';
import { usePlatform } from '../use-platform';

type Props = { icon: MenuIcon; title: string; text: string; action?: ReactNode };

/** Tampilan kosong: ikon, judul, penjelasan singkat, dan satu tombol opsional. */
export default function EmptyState({ icon: Icon, title, text, action }: Props) {
    const ios = usePlatform() === 'ios';

    return (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <Icon className={`size-10 ${ios ? 'text-black/30 dark:text-white/30' : 'text-[#6750A4] dark:text-[#d0bcff]'}`} />
            <p className={`mt-1 text-lg ${ios ? 'font-semibold' : ''}`}>{title}</p>
            <p className={`max-w-xs text-sm ${ios ? 'text-black/50 dark:text-white/50' : 'text-[#49454f] dark:text-[#cac4d0]'}`}>{text}</p>
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
