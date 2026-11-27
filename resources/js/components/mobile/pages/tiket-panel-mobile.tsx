import { ChevronDown, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type T = {
    id: number; name: string; price: number; quota: number; valid_from: string; valid_until: string; valid_days: number; valid_date?: string | null;
    custom_sale: boolean; require_holder_details: boolean; max_per_order: number;
    support_enabled: boolean; support_options: string[]; support_ranking: { name: string; votes: number }[];
    sold: number; remaining: number; revenue: number; locked: boolean;
    sub_id?: number; sub?: string; audience?: 'peserta' | 'umum';
};
type Sub = { id: number; title: string; open: boolean };

type Props = {
    salesOpen: boolean;
    manual: boolean;
    isParent: boolean;
    audienceChoice: boolean;
    feePercent: number;
    subs: Sub[];
    all: T[];
    shown: T[];
    totalSold: number;
    totalRevenue: number;
    filter: number;
    setFilter: (id: number) => void;
    onToggle: () => void;
    onToggleSub: (id: number, open: boolean) => void;
    onSetAll: (open: boolean) => void;
    onNew: () => void;
    onEdit: (t: T) => void;
    onDelete: (t: T) => void;
};

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

function Sw({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={'relative h-6 w-11 shrink-0 rounded-full transition ' + (on ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-white/20')}>
            <span className={'absolute top-1 size-4 rounded-full bg-white shadow transition-all ' + (on ? 'left-6' : 'left-1')} />
        </button>
    );
}

/** Buka-tutup ringan: label biru + panah kecil, isi muncul saat diketuk. */
function Fold({ label, children }: { label: string; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-1 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                {label}
                <ChevronDown className={'size-3.5 transition-transform ' + (open ? 'rotate-180' : '')} />
            </button>
            {open && <div className="mt-1.5">{children}</div>}
        </div>
    );
}

const badge = (label: string, cls: string) => <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ' + cls}>{label}</span>;
const OK = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
const WARN = 'bg-amber-500/10 text-amber-800 dark:text-amber-200';
const OFF = 'bg-slate-500/10 text-slate-600 dark:text-slate-300';

/** Tiket HP (ringkas): status penjualan, ringkasan kuota, daftar jenis tiket. */
export default function TiketPanelMobile(p: Props) {
    const allOpen = p.subs.length > 0 && p.subs.every((x) => x.open);
    const someOpen = p.subs.some((x) => x.open);
    const quota = p.shown.reduce((a, t) => a + t.quota, 0);
    const left = p.shown.reduce((a, t) => a + t.remaining, 0);
    const stats: [string, string][] = [['Jenis tiket', String(p.shown.length)], ['Kuota', String(quota)], ['Sisa', String(left)]];

    return (
        <div className="space-y-3 pb-28">
            {!p.manual && (
                <section className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                    {p.isParent ? (
                        <>
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold">Penjualan tiket</h2>
                                {allOpen ? badge('Dibuka', OK) : someOpen ? badge('Sebagian dibuka', WARN) : badge('Ditutup', OFF)}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => p.onSetAll(true)} disabled={p.subs.every((x) => x.open)} className={'h-10 rounded-full bg-emerald-600 text-[13px] font-medium text-white disabled:opacity-40 ' + PRESS}>Buka semua</button>
                                <button type="button" onClick={() => p.onSetAll(false)} disabled={p.subs.every((x) => !x.open)} className={'h-10 rounded-full bg-slate-800 text-[13px] font-medium text-white disabled:opacity-40 dark:bg-slate-600 ' + PRESS}>Tutup semua</button>
                            </div>
                            <div className={'divide-y divide-slate-900/[0.07] rounded-xl dark:divide-white/10 ' + FIELD}>
                                {p.subs.map((x) => (
                                    <div key={x.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                                        <span className="min-w-0 truncate text-sm font-medium">{x.title}</span>
                                        <span className="flex shrink-0 items-center gap-2">
                                            <span className={'text-[11px] ' + MUTED}>{x.open ? 'Dibuka' : 'Ditutup'}</span>
                                            <Sw on={x.open} label={'Penjualan ' + x.title} onChange={(v) => p.onToggleSub(x.id, v)} />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                                    <span className="truncate">Penjualan tiket</span>
                                    {p.salesOpen ? badge('Dibuka', OK) : badge('Ditutup', OFF)}
                                </h2>
                                <Sw on={p.salesOpen} label="Penjualan tiket" onChange={() => p.onToggle()} />
                            </div>
                            <Fold label="Keterangan">
                                <p className={'text-xs leading-snug ' + MUTED}>{p.salesOpen ? 'Pengunjung bisa membeli tiket sekarang. Tutup penjualan kalau kuota habis atau acara sudah dekat.' : 'Pengunjung tidak bisa membeli tiket. Buka kembali kapan saja.'}</p>
                            </Fold>
                        </>
                    )}
                </section>
            )}

            <section className={'grid grid-cols-3 divide-x divide-slate-900/[0.07] rounded-2xl py-2 dark:divide-white/10 ' + CARD}>
                {stats.map(([l, n]) => (
                    <div key={l} className="min-w-0 px-1 text-center">
                        <p className="truncate text-base leading-tight font-semibold">{n}</p>
                        <p className={'text-[11px] ' + MUTED}>{l}</p>
                    </div>
                ))}
            </section>

            <section className="space-y-2">
                <div className="flex items-center gap-2">
                    {p.isParent ? (
                        <select value={p.filter} onChange={(e) => p.setFilter(Number(e.target.value))} className={'h-10 min-w-0 flex-1 rounded-xl px-3 text-base ' + FIELD}>
                            <option value={0}>Semua sub-event · {p.all.length}</option>
                            {p.subs.map((x) => <option key={x.id} value={x.id}>{x.title} · {p.all.filter((t) => t.sub_id === x.id).length}</option>)}
                        </select>
                    ) : (
                        <h2 className="mr-auto px-1 text-sm font-semibold">Jenis tiket</h2>
                    )}
                    <button type="button" onClick={p.onNew} className={'flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-[13px] font-medium text-white dark:bg-indigo-500 ' + PRESS}><Plus className="size-4" /> Tambah</button>
                </div>

                {p.shown.length === 0 && <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>Belum ada jenis tiket.</div>}

                {p.shown.map((t) => {
                    const pct = t.quota > 0 ? Math.min(100, Math.round((t.sold / t.quota) * 100)) : 0;
                    const detail: [string, string][] = [
                        ['Masa berlaku', t.valid_date ? 'Hanya ' + new Date(t.valid_date + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : t.valid_days + ' hari sejak tanggal event'],
                        ['Jadwal jual', t.custom_sale ? t.valid_from + ' s/d ' + t.valid_until : 'Mengikuti penjualan event'],
                        ['Data pemegang', t.require_holder_details ? 'Nama, email, telepon' : 'Nama saja'],
                        ...(t.audience === 'peserta' ? [] : [['Maks. per pesanan', t.max_per_order + ' tiket'] as [string, string]]),
                        ['Penjualan lunas', rp(t.revenue)],
                    ];
                    return (
                        <div key={t.id} className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                            <div className="flex items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    {p.isParent && t.sub && <p className="truncate text-[11px] font-semibold tracking-wider text-indigo-700 uppercase dark:text-indigo-300">{t.sub}</p>}
                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                        <h3 className="min-w-0 text-sm leading-tight font-semibold break-words">{t.name}</h3>
                                        {p.audienceChoice && badge(t.audience === 'umum' ? 'Umum' : 'Peserta', t.audience === 'umum' ? WARN : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300')}
                                    </div>
                                    <p className="mt-0.5 text-base leading-tight font-semibold text-indigo-700 dark:text-indigo-300">{t.price === 0 ? 'Gratis' : rp(t.price)}</p>
                                </div>
                                <button type="button" aria-label="Ubah" onClick={() => p.onEdit(t)} className={'flex size-8 shrink-0 items-center justify-center rounded-full ' + FIELD + ' ' + PRESS}><Pencil className="size-3.5" /></button>
                                {!t.locked && (
                                    <button type="button" aria-label="Hapus" onClick={() => p.onDelete(t)} className={'flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 ' + PRESS}><Trash2 className="size-3.5" /></button>
                                )}
                            </div>

                            <div>
                                <span className="block h-1.5 overflow-hidden rounded-full bg-slate-900/[0.07] dark:bg-white/10"><span className="block h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: pct + '%' }} /></span>
                                <p className={'mt-1 flex justify-between text-[11px] ' + MUTED}><span>Terpakai {t.sold} dari {t.quota}</span><span>Sisa {t.remaining}</span></p>
                            </div>

                            <Fold label="Detail tiket">
                                <dl className="space-y-1 text-[11px]">
                                    {detail.map(([l, v]) => (
                                        <div key={l} className="flex justify-between gap-3"><dt className={MUTED}>{l}</dt><dd className="text-right font-medium">{v}</dd></div>
                                    ))}
                                </dl>
                            </Fold>

                            {t.support_enabled && (
                                <Fold label={'Pendukung terbanyak (' + t.support_ranking.length + ')'}>
                                    <ol className="space-y-1 text-[11px]">
                                        {t.support_ranking.map((r, i) => <li key={r.name} className="flex justify-between gap-3"><span className="min-w-0 truncate font-medium">{i + 1}. {r.name}</span><span className="shrink-0">{r.votes} dukungan</span></li>)}
                                    </ol>
                                </Fold>
                            )}

                            {t.locked && <p className={'flex items-center gap-1.5 text-[11px] ' + MUTED}><Lock className="size-3.5 shrink-0" /> Harga terkunci, sudah ada pesanan</p>}
                        </div>
                    );
                })}
            </section>

            {!p.manual && (
                <p className={'px-1 text-[11px] leading-snug ' + MUTED}>Biaya layanan {p.feePercent}% dibayar pembeli di atas harga tiket dan tidak mengurangi hak lembaga. Tiket gratis tidak dikenai biaya layanan dan tidak butuh verifikasi pembayaran.</p>
            )}
        </div>
    );
}
