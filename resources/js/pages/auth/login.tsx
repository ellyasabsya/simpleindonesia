import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, Mail } from 'lucide-react';
import type { FormEvent } from 'react';
import AuthLayout from '@/components/auth/auth-layout';
import Field from '@/components/auth/field';
import SubmitButton from '@/components/auth/submit-button';
import AuthMobile, { MField, MSubmit, NOTICE_WARN } from '@/components/mobile/pages/auth-mobile';
import { usePhone } from '@/components/mobile/use-phone';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const phone = usePhone();
    const expired = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('expired') === '1';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    if (phone) {
        return (
            <>
                <Head title="Masuk - SIMPLE" />
                <AuthMobile
                    back="/"
                    badge="Selamat datang kembali"
                    title="Masuk ke akun Anda"
                    subtitle="Lanjutkan aktivitas event dan kompetisi Anda di SIMPLE."
                    footer={
                        <>
                            Belum memiliki akun?{' '}
                            <Link href="/register" className="font-semibold text-indigo-700 dark:text-indigo-300">
                                Daftar sekarang
                            </Link>
                        </>
                    }
                >
                    {expired && <p className={NOTICE_WARN}>Sesi Anda berakhir karena tidak ada aktivitas. Silakan masuk kembali.</p>}
                    <form onSubmit={submit} className="space-y-4">
                        <MField label="Alamat email" icon={Mail} type="email" autoComplete="email" placeholder="nama@email.com" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} required />
                        <MField label="Kata sandi" icon={Lock} type="password" autoComplete="current-password" placeholder="Masukkan kata sandi" value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} required />
                        <label className="flex items-center gap-2.5 px-1 text-[14px] text-slate-600 dark:text-slate-300">
                            <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="size-5 rounded accent-indigo-600" />
                            Ingat saya
                        </label>
                        <MSubmit processing={processing}>Masuk ke SIMPLE</MSubmit>
                <a href="/auth/google" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Masuk dengan Google</a>
                    </form>
                </AuthMobile>
            </>
        );
    }

    return (
        <AuthLayout
            pageTitle="Masuk"
            badge="Selamat datang kembali"
            title="Masuk ke akun Anda"
            subtitle="Lanjutkan aktivitas event dan kompetisi Anda di SIMPLE."
            panelHeading={
                <>
                    Lanjutkan Event Anda, <span className="text-amber-200">Lebih Cerdas</span>
                </>
            }
            panelText="Masuk untuk mengelola pendaftaran peserta, penilaian juri, dan publikasi event seminar, festival, serta perlombaan Anda."
        >
            {expired && (
                <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    Sesi Anda berakhir karena tidak ada aktivitas. Silakan masuk kembali.
                </div>
            )}
            <form onSubmit={submit} className="mt-7 space-y-5">
                <Field
                    label="Alamat email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                    autoFocus
                />
                <Field
                    label="Kata sandi"
                    icon={Lock}
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                />

                <label className="flex items-center gap-2 text-[15px] text-slate-600 dark:text-slate-300">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 accent-indigo-700"
                    />
                    Ingat saya
                </label>

                <SubmitButton processing={processing}>Masuk ke SIMPLE</SubmitButton>
                <a href="/auth/google" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Masuk dengan Google</a>
            </form>

            <p className="mt-7 text-center text-[15px] text-slate-600 dark:text-slate-300">
                Belum memiliki akun?{' '}
                <Link href="/register" className="font-bold text-indigo-800 hover:underline dark:text-indigo-300">
                    Daftar sekarang
                </Link>
            </p>
        </AuthLayout>
    );
}
