import PanelLayout from '@/components/panel/panel-layout';
import { Link, usePage } from '@inertiajs/react';
import { ClipboardList, ScanLine, Ticket } from 'lucide-react';

const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';

export default function TiketMandiri() {
    const pg = usePage().props as any;
    const id = pg.event?.id;

    return (
        <PanelLayout title="Tiket">
            <div className="space-y-5">
                <div className={`${card} flex flex-col items-center p-10 text-center`}>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                        <Ticket className="h-7 w-7" />
                    </span>
                    <h2 className="mt-4 text-2xl font-extrabold">Tiket dikelola panitia</h2>
                    <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                        Event ini memakai pendaftaran transfer manual. Penerbitan, pembayaran, dan pengiriman tiket diatur sendiri oleh panitia, jadi penjualan tiket lewat SIMPLE tidak dipakai di sini.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Link href={`/panel/event/${id}/registrasi`} className={`${card} flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
                        <ClipboardList className="mt-0.5 h-6 w-6 shrink-0 text-indigo-600" />
                        <div>
                            <div className="font-extrabold">Registrasi</div>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Lihat pendaftar dan verifikasi bukti transfer mereka.</p>
                        </div>
                    </Link>
                    <Link href={`/panel/event/${id}/checkin`} className={`${card} flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
                        <ScanLine className="mt-0.5 h-6 w-6 shrink-0 text-indigo-600" />
                        <div>
                            <div className="font-extrabold">Check-in</div>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Catat kehadiran peserta saat acara berlangsung.</p>
                        </div>
                    </Link>
                </div>

                <p className="rounded-2xl bg-sky-50 p-4 text-xs text-sky-900 dark:bg-sky-500/10 dark:text-sky-200">
                    Ingin menjual tiket lewat SIMPLE (dengan QR dan check-in otomatis)? Ubah metode pendaftaran event menjadi Tiket, lalu menu ini akan menampilkan pengaturan jenis tiket.
                </p>
            </div>
        </PanelLayout>
    );
}
