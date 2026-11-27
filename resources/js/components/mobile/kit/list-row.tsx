import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { FIELD, MUTED, PRESS } from './soft';

type Props = {
    href: string;
    image?: string | null;
    /** Ditampilkan saat tidak ada gambar. */
    fallback: ReactNode;
    /** true = template poster 4:5 kecil (foto dipotong mengikuti template), false = persegi. */
    tall?: boolean;
    /** Baris kecil di atas judul (status, kategori). */
    eyebrow?: ReactNode;
    title: string;
    /** Baris info di bawah judul; nilai kosong dilewati. */
    lines?: (string | null | undefined | false)[];
    trailing?: ReactNode;
};

/** Baris daftar standar HP: thumbnail, judul, info, panah. */
export default function ListRow({ href, image, fallback, tall, eyebrow, title, lines = [], trailing }: Props) {
    return (
        <Link href={href} className={'flex items-center gap-3.5 p-3.5 ' + PRESS}>
            <span className={'flex shrink-0 items-center justify-center overflow-hidden rounded-xl text-slate-500 ' + FIELD + (tall ? ' aspect-[4/5] w-16' : ' size-16')}>
                {image ? <img src={image} alt="" loading="lazy" className="size-full object-cover" /> : fallback}
            </span>
            <span className="min-w-0 flex-1">
                {eyebrow && <span className="mb-0.5 block text-[11px] font-medium">{eyebrow}</span>}
                <span className="line-clamp-2 block text-base leading-snug font-semibold text-slate-900 dark:text-white">{title}</span>
                {lines.filter(Boolean).map((l, i) => (
                    <span key={i} className={'mt-0.5 block truncate text-xs ' + MUTED}>
                        {l}
                    </span>
                ))}
            </span>
            {trailing ?? <ChevronRight className={'size-5 shrink-0 ' + MUTED} />}
        </Link>
    );
}
