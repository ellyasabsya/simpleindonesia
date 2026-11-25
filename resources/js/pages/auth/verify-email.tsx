import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import AuthLayout from '@/components/auth/auth-layout';
import SubmitButton from '@/components/auth/submit-button';
import AuthMobile, { MSubmit, NOTICE_OK } from '@/components/mobile/pages/auth-mobile';
import { usePhone } from '@/components/mobile/use-phone';

export default function VerifyEmail() {
    const { auth } = usePage<{ auth?: { user?: { email?: string } } }>().props;
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const phone = usePhone();

    const resend = (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        router.post('/email/verification-notification', {}, {
            preserveScroll: true,
            onSuccess: () => setSent(true),
            onFinish: () => setBusy(false),
        });
    };

    if (phone) {
        return (
            <>
                <Head title="Verifikasi Email - SIMPLE" />
                <AuthMobile
                    badge="Satu langkah lagi"
                    title="Verifikasi email Anda"
                    subtitle={'Kami mengirim tautan verifikasi ke ' + (auth?.user?.email ?? 'email Anda') + '. Setelah terverifikasi, tiket yang dibeli dengan email ini muncul di Tiket Saya dan hasil lomba dapat dibuka.'}
                    footer={
                        <>
                            Bukan akun Anda?{' '}
                            <button type="button" onClick={() => router.post('/logout')} className="font-semibold text-indigo-700 dark:text-indigo-300">
                                Keluar
                            </button>
                        </>
                    }
                >
                    {sent && (
                        <p className={NOTICE_OK}>
                            <CheckCircle2 className="size-4 shrink-0" />
                            Tautan verifikasi baru sudah dikirim.
                        </p>
                    )}
                    <form onSubmit={resend}>
                        <MSubmit processing={busy}>{busy ? 'Mengirim…' : 'Kirim ulang tautan'}</MSubmit>
                    </form>
                </AuthMobile>
            </>
        );
    }

    return (
        <AuthLayout
            pageTitle="Verifikasi Email"
            badge="Satu langkah lagi"
            title="Verifikasi email Anda"
            subtitle={`Kami mengirim tautan verifikasi ke ${auth?.user?.email ?? 'email Anda'}. Setelah email terverifikasi, tiket yang dibeli dengan email ini akan muncul di Tiket Saya dan hasil lomba dapat dibuka.`}
            panelHeading={
                <>
                    Amankan Akun Anda, <span className="text-amber-200">Lebih Cerdas</span>
                </>
            }
            panelText="Verifikasi email agar tiket, hasil lomba, dan notifikasi event terhubung dengan akun Anda."
        >
            {sent && (
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0" />
                    Tautan verifikasi baru sudah dikirim.
                </div>
            )}

            <form onSubmit={resend} className="mt-7 space-y-5">
                <SubmitButton processing={busy}>{busy ? 'Mengirim…' : 'Kirim ulang tautan'}</SubmitButton>
            </form>

            <p className="mt-7 text-center text-[15px] text-slate-600 dark:text-slate-300">
                Bukan akun Anda?{' '}
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="font-bold text-indigo-800 hover:underline dark:text-indigo-300"
                >
                    Keluar
                </button>
            </p>
        </AuthLayout>
    );
}
