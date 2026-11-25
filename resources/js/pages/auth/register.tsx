import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Lock, Mail, Phone, User } from 'lucide-react';
import type { FormEvent } from 'react';
import AuthLayout from '@/components/auth/auth-layout';
import Field from '@/components/auth/field';
import SubmitButton from '@/components/auth/submit-button';
import AuthMobile, { MField, MSubmit } from '@/components/mobile/pages/auth-mobile';
import { usePhone } from '@/components/mobile/use-phone';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        institution: '',
    });

    const phone = usePhone();

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/register', { onFinish: () => reset('password') });
    };

    if (phone) {
        return (
            <>
                <Head title="Daftar - SIMPLE" />
                <AuthMobile
                    back="/"
                    badge="Mulai bersama SIMPLE"
                    title="Buat akun baru"
                    subtitle="Satu akun untuk mengikuti event dan menjalankan penugasan juri."
                    footer={
                        <>
                            Sudah memiliki akun?{' '}
                            <Link href="/login" className="font-semibold text-indigo-700 dark:text-indigo-300">
                                Masuk sekarang
                            </Link>
                        </>
                    }
                >
                    <form onSubmit={submit} className="space-y-4">
                        <MField label="Nama lengkap" icon={User} autoComplete="name" placeholder="Nama lengkap Anda" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />
                        <MField label="Alamat email" icon={Mail} type="email" autoComplete="email" placeholder="nama@email.com" value={data.email} onChange={(e) => setData('email', e.target.value)} error={errors.email} required />
                        <MField label="Kata sandi" icon={Lock} type="password" autoComplete="new-password" placeholder="Minimal 8 karakter" value={data.password} onChange={(e) => setData('password', e.target.value)} error={errors.password} required />
                        <MField label="Nomor telepon" optional icon={Phone} type="tel" placeholder="08xxxxxxxxxx" value={data.phone} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                        <MField label="Institusi" optional icon={Building2} placeholder="Sekolah / Kampus" value={data.institution} onChange={(e) => setData('institution', e.target.value)} error={errors.institution} />
                        <MSubmit processing={processing}>Buat Akun SIMPLE</MSubmit>
                <a href="/auth/google" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Daftar dengan Google</a>
                    </form>
                </AuthMobile>
            </>
        );
    }

    return (
        <AuthLayout
            pageTitle="Daftar"
            badge="Mulai bersama SIMPLE"
            title="Buat akun baru"
            subtitle="Satu akun untuk mengikuti event dan menjalankan penugasan juri."
            panelHeading={
                <>
                    Mulai Event Anda, <span className="text-amber-200">Lebih Cerdas</span>
                </>
            }
            panelText="Satu akun untuk mengikuti event dan menjalankan penugasan juri. Daftar sekarang dan kelola semuanya dari satu tempat."
        >
            <form onSubmit={submit} className="mt-7 space-y-5">
                <Field
                    label="Nama lengkap"
                    icon={User}
                    autoComplete="name"
                    placeholder="Nama lengkap Anda"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    required
                    autoFocus
                />
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
                />
                <Field
                    label="Kata sandi"
                    icon={Lock}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                />

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                        label="Nomor telepon"
                        optional
                        icon={Phone}
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        error={errors.phone}
                    />
                    <Field
                        label="Institusi"
                        optional
                        icon={Building2}
                        placeholder="Sekolah / Kampus"
                        value={data.institution}
                        onChange={(e) => setData('institution', e.target.value)}
                        error={errors.institution}
                    />
                </div>

                <SubmitButton processing={processing}>Buat Akun SIMPLE</SubmitButton>
                <a href="/auth/google" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Daftar dengan Google</a>
            </form>

            <p className="mt-7 text-center text-[15px] text-slate-600 dark:text-slate-300">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="font-bold text-indigo-800 hover:underline dark:text-indigo-300">
                    Masuk sekarang
                </Link>
            </p>
        </AuthLayout>
    );
}
