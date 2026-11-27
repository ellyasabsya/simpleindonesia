import { CheckCircle2 } from 'lucide-react';
import { CARD, MUTED } from '../kit/soft';

type Stat = { label: string; value: number | string; note?: string };

function Tile({ s, wide, tone }: { s: Stat; wide: boolean; tone?: 'alert' | 'idle' }) {
    const num =
        tone === 'alert' ? 'text-amber-700 dark:text-amber-300' : tone === 'idle' ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-600 dark:text-indigo-300';
    return (
        <div className={'flex flex-col justify-between gap-1 rounded-2xl px-3 py-2.5 ' + CARD + (wide ? ' col-span-2' : '')}>
            <p className={'text-xs leading-snug font-medium ' + MUTED}>{s.label}</p>
            <p className={'text-[17px] leading-none font-semibold tabular-nums ' + num}>{s.value}</p>
        </div>
    );
}

export default function AdminDashboardMobile({ pending, platform, total }: { pending: Stat[]; platform: Stat[]; total: number }) {
    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Ringkasan</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">
                    Lihat apa yang perlu ditindaklanjuti dan kondisi platform saat ini. Laporan keuangan ada di menu Pendapatan.
                </p>
            </section>

            <div
                className={
                    'flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-xs font-semibold ' +
                    (total === 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200')
                }
            >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {total === 0 ? 'Semua beres. Tidak ada yang menunggu tindakan.' : `${total} item menunggu tindakan Anda.`}
            </div>

            <section>
                <h3 className={'mb-1.5 px-1 text-xs font-semibold ' + MUTED}>Perlu tindakan</h3>
                <div className="grid grid-cols-2 gap-2">
                    {pending.map((s, i) => (
                        <Tile key={s.label} s={s} wide={pending.length % 2 === 1 && i === pending.length - 1} tone={Number(s.value) > 0 ? 'alert' : 'idle'} />
                    ))}
                </div>
            </section>

            <section>
                <h3 className={'mb-1.5 px-1 text-xs font-semibold ' + MUTED}>Platform</h3>
                <div className="grid grid-cols-2 gap-2">
                    {platform.map((s) => (
                        <Tile key={s.label} s={s} wide={String(s.value).length > 9} />
                    ))}
                </div>
            </section>
        </div>
    );
}
