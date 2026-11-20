import { Link, useForm } from '@inertiajs/react';
import { Lock, Mail } from 'lucide-react';
import type { FormEvent } from 'react';
import AuthLayout from '@/components/auth/auth-layout';
import Field from '@/components/auth/field';
import SubmitButton from '@/components/auth/submit-button';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const expired = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('expired') === '1';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

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
