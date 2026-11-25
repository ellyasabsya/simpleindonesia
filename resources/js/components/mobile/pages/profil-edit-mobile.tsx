import { Camera, Loader2 } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { socialList } from '@/lib/socials';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Props = {
    data: Record<string, any>;
    setData: (k: string, v: any) => void;
    err: (k: string) => string | undefined;
    preview: string | null;
    onPick: (f: File | null) => void;
    fileRef: RefObject<HTMLInputElement | null>;
    initials: string;
    processing: boolean;
    isDirty: boolean;
    onSave: () => void;
};

const input = 'h-12 w-full rounded-2xl px-4 text-base outline-none placeholder:text-slate-400 ' + FIELD;
const lbl = 'mb-1.5 block px-1 text-[13px] font-medium ' + MUTED;

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <section>
            <h2 className="px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{title}</h2>
            {hint && <p className={'mt-1 px-1 text-xs ' + MUTED}>{hint}</p>}
            <div className={'mt-2 space-y-4 rounded-3xl p-4 ' + CARD}>{children}</div>
        </section>
    );
}

/** Form edit profil HP: avatar di tengah, kolom bergaya FIELD, satu tombol simpan. */
export default function ProfilEditMobile({ data, setData, err, preview, onPick, fileRef, initials, processing, isDirty, onSave }: Props) {
    const text = (k: string, label: string, type = 'text', ph = '') => (
        <div>
            <label className={lbl}>{label}</label>
            <input type={type} className={input} value={data[k] ?? ''} placeholder={ph} onChange={(e) => setData(k, e.target.value)} />
            {err(k) && <p className="mt-1 px-1 text-sm text-rose-600 dark:text-rose-400">{err(k)}</p>}
        </div>
    );

    return (
        <div className="space-y-5 pb-4">
            <div className="flex flex-col items-center">
                <div className="relative size-24">
                    <div className={'flex size-24 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-3xl font-semibold text-white ' + (preview ? '' : '')}>
                        {preview ? <img src={preview} alt="" className="size-full object-cover" /> : initials}
                    </div>
                    <button type="button" aria-label="Ganti foto" onClick={() => fileRef.current?.click()} className={'absolute -right-1 -bottom-1 flex size-10 items-center justify-center rounded-full bg-indigo-600 text-white ring-4 ring-[#f4f6fc] dark:bg-indigo-500 dark:ring-[#0a0c1a] ' + PRESS}>
                        <Camera className="size-[18px]" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
                </div>
                {err('avatar') && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{err('avatar')}</p>}
            </div>

            <Group title="Identitas">
                {text('name', 'Nama lengkap')}
                {text('username', 'Username', 'text', 'contoh: masell')}
            </Group>

            <Group title="Tentang Anda" hint="Satu atau dua kalimat yang menggambarkan Anda.">
                <textarea rows={4} maxLength={300} value={data.bio ?? ''} onChange={(e) => setData('bio', e.target.value)} placeholder="Contoh: Penyanyi dan penggiat seni di Batam." className={'w-full resize-none rounded-2xl p-4 text-base outline-none placeholder:text-slate-400 ' + FIELD} />
                <div className={'flex justify-between px-1 text-xs ' + MUTED}>
                    <span className="text-rose-600 dark:text-rose-400">{err('bio')}</span>
                    <span>{(data.bio ?? '').length}/300</span>
                </div>
            </Group>

            <Group title="Kontak & data diri" hint="Kota tampil di profil. Telepon dan tanggal lahir hanya untuk Anda.">
                {text('city', 'Kota asal', 'text', 'contoh: Batam')}
                {text('phone', 'Nomor telepon', 'tel', '08xxxxxxxxxx')}
                {text('birth_date', 'Tanggal lahir', 'date')}
            </Group>

            <Group title="Media sosial" hint="Isi yang dipakai saja. Cukup username tanpa @, atau alamat untuk website.">
                {socialList.map((p) => (
                    <div key={p.key}>
                        <label className={lbl}>{p.label}</label>
                        <input className={input} value={data.socials?.[p.key] ?? ''} placeholder={p.ph} onChange={(e) => setData('socials', { ...data.socials, [p.key]: e.target.value })} />
                        {err('socials.' + p.key) && <p className="mt-1 px-1 text-sm text-rose-600 dark:text-rose-400">{err('socials.' + p.key)}</p>}
                    </div>
                ))}
            </Group>

            <div className="space-y-2">
                <p className={'text-center text-xs ' + MUTED}>{isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'}</p>
                <button type="button" onClick={onSave} disabled={processing} className={'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-60 dark:bg-indigo-500 ' + PRESS}>
                    {processing && <Loader2 className="size-4 animate-spin" />}
                    Simpan profil
                </button>
            </div>
        </div>
    );
}
