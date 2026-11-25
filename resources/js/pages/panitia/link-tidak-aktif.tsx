import { Head } from '@inertiajs/react';
import LinkTidakAktifMobile from '@/components/mobile/pages/link-tidak-aktif-mobile';

const TEXT: Record<string, { title: string; body: string }> = {
    dipakai: { title: 'Link sudah dipakai', body: 'Link ini hanya berlaku untuk satu kali simpan. Kalau perubahan Anda sudah tersimpan, tidak ada yang perlu dilakukan. Untuk mengedit lagi, minta link baru ke admin.' },
    kedaluwarsa: { title: 'Link sudah kedaluwarsa', body: 'Masa berlaku link ini sudah habis. Minta link baru ke admin.' },
    dicabut: { title: 'Link dicabut', body: 'Link ini sudah dicabut oleh admin. Minta link baru ke admin.' },
    tidak_ditemukan: { title: 'Link tidak ditemukan', body: 'Link tidak valid. Periksa kembali link yang Anda terima atau minta link baru ke admin.' },
};

export default function LinkTidakAktif({ reason }: { reason: string }) {
    const t = TEXT[reason] ?? TEXT.tidak_ditemukan;
    return (
        <>
            <Head title="Link tidak aktif">
                <meta name="robots" content="noindex" />
                <meta name="referrer" content="no-referrer" />
            </Head>
            <div className="md:hidden">
                <LinkTidakAktifMobile title={t.title} body={t.body} />
            </div>
            <div className="hidden min-h-screen items-center justify-center bg-slate-50 p-6 md:flex dark:bg-slate-950">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h1 className="text-xl font-extrabold">{t.title}</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t.body}</p>
                </div>
            </div>
        </>
    );
}
