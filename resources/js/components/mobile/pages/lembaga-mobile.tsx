import { CalendarCheck, Clock, Loader2, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Key = 'name' | 'email' | 'phone';
type Institution = { name: string; email: string; phone: string; status: string };
type Status = { label: string; text: string; style: string };

type Props = {
    institution: Institution | null;
    status: Status | null;
    data: Record<Key, string>;
    setData: (k: Key, v: string) => void;
    errors: Partial<Record<Key, string>>;
    processing: boolean;
    onSubmit: (e: FormEvent) => void;
};

const input = 'h-12 w-full rounded-2xl px-4 text-base outline-none placeholder:text-slate-400 ' + FIELD;
const lbl = 'mb-1.5 block px-1 text-[13px] font-medium ' + MUTED;

/** Daftar lembaga HP: form atau status pendaftaran dalam kartu, dibungkus UserLayout oleh halamannya. */
export default function LembagaMobile({ institution, status, data, setData, errors, processing, onSubmit }: Props) {
    const sent = !!institution && !!status && institution.status !== 'rejected';

    const field = (k: Key, label: string, type: string, ph: string) => (
        <div>
            <label className={lbl}>{label}</label>
            <input type={type} required className={input} value={data[k]} placeholder={ph} onChange={(e) => setData(k, e.target.value)} />
            {errors[k] && <p className="mt-1 px-1 text-sm text-rose-600 dark:text-rose-400">{errors[k]}</p>}
        </div>
    );

    return (
        <div className="space-y-5 pb-4">
            <header className="space-y-1 px-1">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">Pusat Pengelolaan</p>
                <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{sent ? 'Pendaftaran terkirim' : 'Daftarkan lembaga'}</h1>
                <p className={'text-[13px] leading-relaxed ' + MUTED}>Kelola profil lembaga, ajukan kegiatan, dan pantau event serta pendapatan Anda dalam satu tempat.</p>
            </header>

            {sent && institution && status ? (
                <section className={'space-y-4 rounded-3xl p-4 ' + CARD}>
                    <span className={'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium ' + status.style}>
                        <Clock className="size-4" />
                        {status.label}
                    </span>
                    <p className={'text-[13px] leading-relaxed ' + MUTED}>{status.text}</p>
                    <dl className={'divide-y divide-slate-900/[0.07] rounded-2xl text-base dark:divide-white/10 ' + FIELD}>
                        {[
                            ['Nama lembaga', institution.name],
                            ['Email kontak', institution.email],
                            ['Nomor telepon', institution.phone],
                        ].map(([k, v]) => (
                            <div key={k} className="px-4 py-3">
                                <dt className={'text-xs ' + MUTED}>{k}</dt>
                                <dd className="font-medium break-words">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ) : (
                <form onSubmit={onSubmit} className={'space-y-4 rounded-3xl p-4 ' + CARD}>
                    {status && institution?.status === 'rejected' && <p className={'rounded-2xl px-4 py-3 text-[13px] font-medium ' + status.style}>{status.text}</p>}
                    {field('name', 'Nama lembaga', 'text', 'Contoh: Komunitas Kreatif Batam')}
                    {field('email', 'Email kontak', 'email', 'email@lembaga.com')}
                    {field('phone', 'Nomor telepon', 'tel', '08xxxxxxxxxx')}
                    <button type="submit" disabled={processing} className={'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}>
                        {processing && <Loader2 className="size-4 animate-spin" />}
                        Daftarkan Lembaga
                    </button>
                    <p className={'text-center text-xs ' + MUTED}>Pastikan data yang dimasukkan sudah benar.</p>
                </form>
            )}

            <ul className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl text-[13px] dark:divide-white/10 ' + CARD}>
                <li className="flex items-center gap-3 px-4 py-3">
                    <ShieldCheck className="size-5 shrink-0 text-indigo-700 dark:text-indigo-300" />
                    Lembaga akan melalui proses verifikasi admin.
                </li>
                <li className="flex items-center gap-3 px-4 py-3">
                    <CalendarCheck className="size-5 shrink-0 text-indigo-700 dark:text-indigo-300" />
                    Setelah terdaftar, Anda dapat mulai mengajukan event.
                </li>
            </ul>
        </div>
    );
}
