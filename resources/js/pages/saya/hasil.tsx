import { Link } from '@inertiajs/react';
import { ArrowLeft, Trophy } from 'lucide-react';
import UserLayout from '@/components/user/user-layout';
import { HasilMobile } from '@/components/mobile/pages/saya-mobile';
import { usePhone } from '@/components/mobile/use-phone';

type Row = { rank: number | null; code: string; final: number | null; mine: boolean };

export default function Hasil({ event_title, mode, rows = [] }: { event_title: string; mode: 'hidden' | 'own' | 'all'; rows?: Row[] }) {
    const phone = usePhone();
    if (phone) {
        return (
            <UserLayout title="Hasil lomba" hasPanel={false}>
                <HasilMobile event_title={event_title} mode={mode} rows={rows} />
            </UserLayout>
        );
    }

    return (
        <UserLayout title="Hasil lomba" hasPanel={false}>
            <div className="space-y-6">
                <Link href="/event-saya" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold">Hasil lomba</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">{event_title}</p>
                </div>

                {mode === 'hidden' || rows.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-white/10">
                        <Trophy className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-bold">Hasil belum dibuka</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">Panitia akan menampilkan hasil setelah penilaian selesai.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl bg-white/80 shadow-sm dark:bg-white/5">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="px-4 py-3">Peringkat</th>
                                    <th className="px-4 py-3">ID Peserta</th>
                                    <th className="px-4 py-3 text-right">Nilai akhir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.code} className={r.mine ? 'bg-indigo-50 font-bold dark:bg-indigo-500/10' : ''}>
                                        <td className="px-4 py-3">{r.rank ?? '-'}</td>
                                        <td className="px-4 py-3">{r.code}{r.mine ? ' (Anda)' : ''}</td>
                                        <td className="px-4 py-3 text-right">{r.final ?? 'Belum lengkap'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
