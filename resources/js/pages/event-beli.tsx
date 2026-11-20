import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import BeliMobile from '@/components/mobile/pages/beli-mobile';

type TType = { id: number; name: string; price: number; remaining: number; valid_from: string; valid_until: string; max_per_order: number };
type Props = {
    event: { id: number; title: string; slug: string; location: string | null; date: string };
    ticket_types: TType[];
    fee_percent: number;
};

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const inp = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5';

export default function EventBeli({ event, ticket_types, fee_percent }: Props) {
    const { data, setData, post, processing, errors } = useForm({
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

    const holders = Array.from({ length: data.quantity }, (_, i) => (i === 0 && same ? data.buyer_name : data.holders[i] ?? ''));
    const setQty = (q: number) => {
        const n = Math.max(1, Math.min(max, q));
        setData((d) => ({ ...d, quantity: n, holders: Array.from({ length: n }, (_, i) => d.holders[i] ?? '') }));
    };
    const setHolder = (i: number, v: string) => setData('holders', data.holders.map((h, j) => (j === i ? v : h)));
    const err = (k: string) => (errors as Record<string, string>)[k];

    const submit = () => {
        setData('holders', holders);
        post(`/events/${event.id}/beli`, { transform: (d: Record<string, unknown>) => ({ ...d, holders }) } as never);
    };

    if (!type) {
        return (
            <div className="mx-auto max-w-xl p-10 text-center">
                <p className="mb-4 text-slate-600">Tiket untuk event ini sudah tidak tersedia.</p>
                <Link href={`/events/${event.slug}`} className="font-bold text-indigo-700">Kembali</Link>
            </div>
        );
    }

    return (
        <>
            <div className="md:hidden">
                <BeliMobile event={event} ticket_types={ticket_types} fee_percent={fee_percent} />
            </div>
            <div className="hidden md:contents">
        <div className="min-h-screen bg-slate-100 px-4 py-10 dark:bg-neutral-950">
            <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl dark:bg-neutral-900 md:p-8">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Beli Tiket</h1>
                        <p className="text-slate-500">{event.title}</p>
                    </div>
                    <Link href={`/events/${event.slug}`} className="text-2xl text-slate-400">×</Link>
                </div>

                <div className="mb-6 space-y-2 rounded-2xl border border-sky-100 bg-sky-50/60 p-5 text-sm dark:border-white/10 dark:bg-white/5">
                    {([
                        ['Tanggal', event.date],
                        ['Lokasi', event.location ?? '-'],
                        ['Berlaku', `${type.valid_from} – ${type.valid_until}`],
                        ['Harga', rp(type.price)],
                        ['Tersedia', `${type.remaining} tiket`],
                    ] as const).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="text-right font-bold">{v}</span></div>
                    ))}
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Jenis Tiket</span>
                        {ticket_types.length > 1 ? (
                            <select className="rounded-lg border px-2 py-1 font-bold" value={data.ticket_type_id} onChange={(e) => { setData('ticket_type_id', Number(e.target.value)); setQty(1); }}>
                                {ticket_types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        ) : <span className="font-bold">{type.name}</span>}
                    </div>
                </div>

                <h2 className="mb-3 text-lg font-bold">Data Pembeli</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm font-bold">Nama *</label><input className={inp} placeholder="Nama pembeli" value={data.buyer_name} onChange={(e) => setData('buyer_name', e.target.value)} />{err('buyer_name') && <p className="mt-1 text-xs text-red-600">{err('buyer_name')}</p>}</div>
                    <div><label className="mb-1 block text-sm font-bold">Email *</label><input className={inp} placeholder="email@example.com" value={data.buyer_email} onChange={(e) => setData('buyer_email', e.target.value)} />{err('buyer_email') && <p className="mt-1 text-xs text-red-600">{err('buyer_email')}</p>}</div>
                </div>
                <div className="mt-4"><label className="mb-1 block text-sm font-bold">No. Telepon *</label><input className={inp} placeholder="+6281234567890" value={data.buyer_phone} onChange={(e) => setData('buyer_phone', e.target.value)} />{err('buyer_phone') && <p className="mt-1 text-xs text-red-600">{err('buyer_phone')}</p>}</div>

                <div className="mt-8 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Data Pemegang Tiket ({data.quantity} tiket)</h2>
                    <div className="flex items-center gap-3 rounded-xl border px-3 py-1.5">
                        <button type="button" onClick={() => setQty(data.quantity - 1)} className="px-2 text-lg">−</button>
                        <span className="w-4 text-center font-bold">{data.quantity}</span>
                        <button type="button" onClick={() => setQty(data.quantity + 1)} className="px-2 text-lg">+</button>
                    </div>
                </div>
                <p className="mt-1 mb-3 text-xs text-slate-500">Nama ini tercetak di tiket dan dipakai saat check-in. Maksimal {type.max_per_order} tiket per pesanan.</p>
                <div className="space-y-3">
                    {holders.map((h, i) => (
                        <div key={i} className="rounded-xl border p-3">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <b>Tiket #{i + 1}</b>
                                {i === 0 && <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /> Sama dengan pembeli</label>}
                            </div>
                            {!(i === 0 && same) && <input className={inp} placeholder="Nama pemegang tiket" value={h} onChange={(e) => setHolder(i, e.target.value)} />}
                            {err(`holders.${i}`) && <p className="mt-1 text-xs text-red-600">{err(`holders.${i}`)}</p>}
                        </div>
                    ))}
                </div>
                {(err('quantity') || err('ticket_type_id') || err('holders')) && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{err('quantity') || err('ticket_type_id') || err('holders')}</p>}

                <div className="mt-8 flex items-center justify-between gap-4 border-t pt-5">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total · {data.quantity} tiket</p>
                        <p className="text-3xl font-extrabold text-indigo-700">{rp(subtotal + fee)}</p>
                        <p className="text-xs text-slate-500">Tiket {rp(subtotal)} + biaya layanan {fee_percent}% {rp(fee)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/events/${event.slug}`} className="font-bold text-slate-700">Batal</Link>
                        <button onClick={submit} disabled={processing} className="rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 px-6 py-3 font-bold text-white disabled:opacity-60">Beli Tiket</button>
                    </div>
                </div>
            </div>
        </div>
            </div>
        </>
    );
}
