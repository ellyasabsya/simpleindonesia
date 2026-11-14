import { Link, router } from '@inertiajs/react';
import type { ReactNode } from 'react';

// Kembali ke halaman sebelumnya jika ada, kalau tidak ke `fallback`.
export default function BackLink({ fallback = '/', children, className }: { fallback?: string; children: ReactNode; className?: string }) {
    const canGoBack = typeof window !== 'undefined' && window.history.length > 1 && document.referrer.startsWith(window.location.origin);

    if (!canGoBack) {
        return <Link href={fallback} className={className}>{children}</Link>;
    }

    return (
        <a
            href={fallback}
            onClick={(e) => {
                e.preventDefault();
                window.history.back();
            }}
            className={className}
        >
            {children}
        </a>
    );
}
