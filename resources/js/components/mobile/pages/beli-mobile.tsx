import { Link, useForm } from '@inertiajs/react';
import { Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import Button from '../kit/button';
import { Section } from '../kit/section';
import { usePlatform } from '../use-platform';

type TType = { id: number; name: string; price: number; remaining: number; valid_from: string; valid_until: string; max_per_order: number };
export type BeliMobileProps = {
    event: { id: number; title: string; slug: string; location: string | null; date: string };
    ticket_types: TType[];
    fee_percent: number;
};

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

export default function BeliMobile({ event, ticket_types, fee_percent }: BeliMobileProps) {
    const ios = usePlatform() === 'ios';
    const { data, setData, post, processing, errors, transform } = useForm({
        ticket_type_id: ticket_types[0]?.id ?? 0,
        quantity: 1,
        buyer_name: '',
        buyer_email: '',
        buyer_phone: '',
        holders: [''],
    });
    const [same, setSame] = useState(true);

    const type = ticket_types.find((t) => t.id === data.ticket_type_id);
    const max = type ? Math.min(type.max_per_order, type.remaining) : 1;
    const subtotal = (type?.price ?? 0) * data.quantity;
    const fee = Math.round((subtotal * fee_percent) / 100);
    const holders = Array.from({ length: data.quantity }, (_, i) => (i === 0 && same ? data.buyer_name : (data.holders[i] ?? '')));
    const err = (k: string) => (errors as Record<string, string>)[k];

    const setQty = (q: number, cap = max) => {
        const n = Math.max(1, Math.min(cap, q));
        setData((d) => ({ ...d, quantity: n, holders: Array.from({ length: n }, (_, i) => d.holders[i] ?? '') }));
    };
    const setHolder = (i: number, v: string) => setData('holders', data.holders.map((h, j) => (j === i ? v : h)));
    const changeType = (id: number) => {
        const t = ticket_types.find((x) => x.id === id);
        setData('ticket_type_id', id);
        if (t) setQty(1, Math.min(t.max_per_order, t.remaining));
    };
    const submit = () => {
        transform((d) => ({ ...d, holders }));
        post('/events/' + event.id + '/beli');
    };

    if (!type) return null;

    const inp = ios
        ? 'w-full bg-transparent text-[17px] text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30'
        : 'w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/30';
    const lbl = ios ? 'text-[13px] text-black/50 dark:text-white/50' : 'text-xs font-medium text-slate-600 dark:text-slate-300';
    const bg = ios ? 'bg-[#f2f2f7] dark:bg-black' : 'bg-[#f4f6fb] dark:bg-[#141218]';
    const errCls = 'mt-1 text-xs text-red-600 dark:text-red-400';
    const infoRows: [string, string][] = [
        ['Tanggal', event.date],
        ['Lokasi', event.location ?? '-'],
        ['Berlaku', type.valid_from + ' – ' + type.valid_until],
        ['Harga', rp(type.price)],
        ['Tersedia', type.remaining + ' tiket'],
    ];
    const rowCls = 'flex items-start justify-between gap-4 px-4 py-3 text-sm';
    const field = 'px-4 py-2.5';
    const stepBtn = ios
        ? 'flex size-8 items-center justify-center rounded-full bg-black/5 text-black active:opacity-60 dark:bg-white/10 dark:text-white'
        : 'flex size-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 active:opacity-70 dark:bg-white/10 dark:text-white';

    return (
        <div className={'min-h-dvh pb-44 ' + bg}>
            <header className="flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
                <div className="min-w-0">
                    <h1 className={ios ? 'text-[28px] font-bold text-black dark:text-white' : 'text-2xl font-semibold text-slate-900 dark:text-white'}>Beli Tiket</h1>
                    <p className={'truncate ' + lbl}>{event.title}</p>
                </div>
                <Link href={'/events/' + event.slug} aria-label="Tutup" className="flex size-10 items-center justify-center rounded-full text-slate-500 active:opacity-60 dark:text-white/60">
                    <X className="size-6" />
                </Link>
            </header>

            <div className="space-y-5 px-4">
                <Section title="Tiket">
                    {infoRows.map(([k, v]) => (
                        <div key={k} className={rowCls}>
                            <span className={lbl}>{k}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-white">{v}</span>
                        </div>
                    ))}
                    <div className={rowCls + ' items-center'}>
                        <span className={lbl}>Jenis Tiket</span>
                        {ticket_types.length > 1 ? (
                            <select className="rounded-lg bg-transparent text-right font-semibold text-slate-900 dark:bg-neutral-900 dark:text-white" value={data.ticket_type_id} onChange={(e) => changeType(Number(e.target.value))}>
                                {ticket_types.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="font-semibold text-slate-900 dark:text-white">{type.name}</span>
                        )}
                    </div>
                </Section>

                <Section title="Data Pembeli">
                    <div className={field}>
                        <label className={lbl}>Nama *</label>
                        <input className={inp} placeholder="Nama pembeli" value={data.buyer_name} onChange={(e) => setData('buyer_name', e.target.value)} />
                        {err('buyer_name') && <p className={errCls}>{err('buyer_name')}</p>}
                    </div>
                    <div className={field}>
                        <label className={lbl}>Email *</label>
                        <input className={inp} type="email" inputMode="email" placeholder="email@example.com" value={data.buyer_email} onChange={(e) => setData('buyer_email', e.target.value)} />
                        {err('buyer_email') && <p className={errCls}>{err('buyer_email')}</p>}
                    </div>
                    <div className={field}>
                        <label className={lbl}>No. Telepon *</label>
                        <input className={inp} type="tel" inputMode="tel" placeholder="+6281234567890" value={data.buyer_phone} onChange={(e) => setData('buyer_phone', e.target.value)} />
                        {err('buyer_phone') && <p className={errCls}>{err('buyer_phone')}</p>}
                    </div>
                </Section>

                <Section title={'Pemegang Tiket (' + data.quantity + ')'} footer={'Nama ini tercetak di tiket dan dipakai saat check-in. Maksimal ' + type.max_per_order + ' tiket per pesanan.'}>
                    <div className={rowCls + ' items-center'}>
                        <span className="font-semibold text-slate-900 dark:text-white">Jumlah tiket</span>
                        <div className="flex items-center gap-4">
                            <button type="button" aria-label="Kurangi" onClick={() => setQty(data.quantity - 1)} className={stepBtn}><Minus className="size-4" /></button>
                            <span className="w-5 text-center text-base font-bold text-slate-900 dark:text-white">{data.quantity}</span>
                            <button type="button" aria-label="Tambah" onClick={() => setQty(data.quantity + 1)} className={stepBtn}><Plus className="size-4" /></button>
                        </div>
                    </div>
                    {holders.map((h, i) => (
                        <div key={i} className={field}>
                            <div className="flex items-center justify-between">
                                <label className={lbl}>Tiket #{i + 1}</label>
                                {i === 0 && (
                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        <input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /> Sama dengan pembeli
                                    </label>
                                )}
                            </div>
                            {i === 0 && same ? (
                                <p className={inp + ' py-0.5 opacity-60'}>{data.buyer_name || 'Nama pembeli'}</p>
                            ) : (
                                <input className={inp} placeholder="Nama pemegang tiket" value={h} onChange={(e) => setHolder(i, e.target.value)} />
                            )}
                            {err('holders.' + i) && <p className={errCls}>{err('holders.' + i)}</p>}
                        </div>
                    ))}
                </Section>

                {(err('quantity') || err('ticket_type_id') || err('holders')) && (
                    <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">{err('quantity') || err('ticket_type_id') || err('holders')}</p>
                )}
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
                <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total · {data.quantity} tiket</p>
                        <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{rp(subtotal + fee)}</p>
                    </div>
                    <p className="text-right text-[11px] text-slate-500">Tiket {rp(subtotal)}<br />Layanan {fee_percent}% {rp(fee)}</p>
                </div>
                <Button full onClick={processing ? undefined : submit}>{processing ? 'Memproses…' : 'Beli Tiket'}</Button>
            </div>
        </div>
    );
}
