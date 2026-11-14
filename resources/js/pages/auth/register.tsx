import { Link, useForm } from '@inertiajs/react';
import { Building2, Lock, Mail, Phone, User } from 'lucide-react';
import type { FormEvent } from 'react';
import AuthLayout from '@/components/auth/auth-layout';
import Field from '@/components/auth/field';
import SubmitButton from '@/components/auth/submit-button';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        institution: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/register', { onFinish: () => reset('password') });
    };

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
