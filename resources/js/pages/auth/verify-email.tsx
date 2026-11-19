import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function VerifyEmail() {
    const { auth } = usePage<{ auth?: { user?: { email?: string } } }>().props;
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);

    const resend = () => {
        setBusy(true);
        router.post('/email/verification-notification', {}, {
            preserveScroll: true,
            onSuccess: () => setSent(true),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
            <h1 className="text-2xl font-semibold">Verifikasi email Anda</h1>
            <p className="text-sm text-gray-600">
                Kami mengirim tautan verifikasi ke {auth?.user?.email ?? 'email Anda'}. Setelah email
                terverifikasi, tiket yang dibeli dengan email ini akan muncul di Tiket Saya dan hasil
                lomba dapat dibuka.
            </p>
            {sent && (
                <p className="rounded bg-green-50 p-3 text-sm text-green-700">
                    Tautan verifikasi baru sudah dikirim.
                </p>
            )}
            <button
                type="button"
                onClick={resend}
                disabled={busy}
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
                {busy ? 'Mengirim…' : 'Kirim ulang tautan'}
            </button>
            <button
                type="button"
                onClick={() => router.post('/logout')}
                className="text-sm text-gray-500 underline"
            >
                Keluar
            </button>
        </div>
    );
}
