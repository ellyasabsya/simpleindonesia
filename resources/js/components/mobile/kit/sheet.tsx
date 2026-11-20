import type { ReactNode } from 'react';
import { usePlatform } from '../use-platform';

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode };

/** Lembar bawah: sudut 14pt dan tombol "Selesai" di iOS, modal bottom sheet 28dp dengan pegangan di Android. */
export default function Sheet({ open, onClose, title, children }: Props) {
    const ios = usePlatform() === 'ios';

    return (
        <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
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
                className={`absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col ${
                    ios
                        ? 'rounded-t-[14px] bg-[#f2f2f7] text-black dark:bg-[#1c1c1e] dark:text-white'
                        : 'rounded-t-[28px] bg-[#fef7ff] text-[#1d1b20] dark:bg-[#141218] dark:text-[#e6e0e9]'
                }`}
            >
                {ios ? (
                    <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center px-4">
                        <span />
                        <h3 className="text-[17px] font-semibold">{title}</h3>
                        <button type="button" onClick={onClose} className="justify-self-end text-[17px] font-semibold text-[#007AFF] active:opacity-40 dark:text-[#0A84FF]">
                            Selesai
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center pt-3 pb-1">
                            <span className="h-1 w-8 rounded-full bg-[#79747e]/60" />
                        </div>
                        <h3 className="px-6 pt-2 pb-2 text-2xl">{title}</h3>
                    </>
                )}
                <div className="overflow-y-auto px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">{open && children}</div>
            </div>
        </div>
    );
}
