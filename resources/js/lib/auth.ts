import { usePage } from '@inertiajs/react';

type AuthUser = { id: number; name: string; email: string; role: string };

// Status login + tujuan dashboard sesuai peran.
export function useAuth() {
    const user = usePage<{ auth?: { user?: AuthUser | null } }>().props.auth?.user ?? null;

    return {
        user,
        dashboardUrl: user?.role === 'admin' ? '/admin' : '/dashboard',
    };
}
