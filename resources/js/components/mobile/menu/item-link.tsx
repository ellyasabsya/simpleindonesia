import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { MenuItem } from './menu-types';

type Props = { item: MenuItem; onClick: () => void; className: string; children: ReactNode };

/** Tautan menu: navigasi Inertia, atau <a> biasa untuk rute non-Inertia. */
export default function ItemLink({ item, onClick, className, children }: Props) {
    return item.external ? (
        <a href={item.href} onClick={onClick} className={className}>
            {children}
        </a>
    ) : (
        <Link href={item.href} onClick={onClick} className={className}>
            {children}
        </Link>
    );
}
