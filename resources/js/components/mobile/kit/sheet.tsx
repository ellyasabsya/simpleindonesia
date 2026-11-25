import type { ReactNode } from 'react';
import { PAGE } from './soft';

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode };

/** Lembar bawah satu gaya: sudut 32, pegangan, judul 17px. Ketuk latar gelap untuk menutup. */
export default function Sheet({ open, onClose, title, children }: Props) {
    return (
        <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div onClick={onClose} className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
            <div
                role="dialog"
                aria-label={title}
                style={{
                    transform: open ? 'translateY(0)' : 'translateY(100%)',
                    transitionProperty: 'transform, visibility',
                    transitionDuration: '0.3s',
                    transitionDelay: open ? '0s' : '0s, 0.3s',
                    visibility: open ? 'visible' : 'hidden',
                }}
                className={'absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[32px] text-slate-900 shadow-2xl dark:text-white ' + PAGE}
            >
                <div className="flex justify-center pt-3">
                    <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                </div>
                <h3 className="px-5 pt-3 pb-3 text-[17px] font-semibold tracking-tight">{title}</h3>
                <div className="overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{open && children}</div>
            </div>
        </div>
    );
}
