import { openPayScreen } from '@/lib/pay-screen';
import { router, useForm } from '@inertiajs/react';
import { Check, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import FileDrop from '@/components/file-drop';
type TType = { id: number; name: string; price: number; remaining: number; valid_from: string; valid_until: string; max_per_order: number; require_holder_details: boolean; support_enabled: boolean; support_options: string[] };
type Data = {
    event: { id: number; title: string; location: string | null; date: string };
    ticket_types: TType[];
    fee_percent: number;
    payment: { methods: string[]; bank: { bank_name: string; bank_account_number: string; bank_account_holder: string } };
};

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const inp = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white';

export default function TicketBuyModal({ eventId, onClose }: { eventId: number; onClose: () => void }) {
    const [info, setInfo] = useState<Data | null>(null);
    const [failed, setFailed] = useState(false);
    const [done, setDone] = useState(false);
    const [paying, setPaying] = useState(false);
    const [pendingCode, setPendingCode] = useState('');
    const [payMsg, setPayMsg] = useState('');

    const pay = (code: string) => {
        setPaying(true);
        setPayMsg('');
        setPendingCode(code);
        openPayScreen({
            tokenUrl: `/midtrans/token/${code}`,
            onSuccess: () => { setPaying(false); setPendingCode(''); setDone(true); },
            onPending: () => { setPaying(false); setPendingCode(''); setDone(true); },
            onClose: () => { setPaying(false); setPayMsg('Pembayaran belum diselesaikan. Pesanan Anda ditahan 60 menit.'); },
        });
    };
    const [same, setSame] = useState(true);

    const { data, setData, post, processing, errors, transform } = useForm({
        ticket_type_id: 0,
        quantity: 1,
        buyer_name: '',
        buyer_email: '',
        buyer_phone: '',
        holders: [''],
        holder_emails: [''] as string[],
        support_choice: '',
        holder_phones: [''] as string[],
        payment_method: 'transfer_manual',
        payment_proof: null as File | null,
    });

    useEffect(() => {
        fetch(`/events/${eventId}/beli-data`, { headers: { Accept: 'application/json' } })
            .then((r) => {
                if (r.status === 401 || r.status === 419) {
                    window.location.assign(`/tickets?beli=${eventId}`);
                    return new Promise<never>(() => {});
                }
                return r.ok ? r.json() : Promise.reject();
            })
            .then((d: Data) => {
                setInfo(d);
                if (d.ticket_types[0]) setData('ticket_type_id', d.ticket_types[0].id);
                if (d.payment.methods.length && !d.payment.methods.includes('transfer_manual')) setData('payment_method', d.payment.methods[0]);
            })
            .catch(() => setFailed(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    useEffect(() => {
        const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', k);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', k);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const type = info?.ticket_types.find((t) => t.id === data.ticket_type_id);
    const max = type ? Math.max(1, Math.min(type.max_per_order, type.remaining)) : 1;
    const feePct = info?.fee_percent ?? 10;
    const subtotal = (type?.price ?? 0) * data.quantity;
    const fee = Math.round((subtotal * feePct) / 100);
    const holders = Array.from({ length: data.quantity }, (_, i) => (i === 0 && same ? data.buyer_name : data.holders[i] ?? ''));
    const needDetail = !!type?.require_holder_details;
    const hEmails = Array.from({ length: data.quantity }, (_, i) => (i === 0 && same ? data.buyer_email : data.holder_emails[i] ?? ''));
    const hPhones = Array.from({ length: data.quantity }, (_, i) => (i === 0 && same ? data.buyer_phone : data.holder_phones[i] ?? ''));
    const setHolderField = (k: 'holder_emails' | 'holder_phones', i: number, v: string) => setData(k, Array.from({ length: data.quantity }, (_, j) => (j === i ? v : data[k][j] ?? '')));
    const err = (k: string) => (errors as Record<string, string>)[k];

    const setQty = (q: number) => {
        const n = Math.max(1, Math.min(max, q));
        setData((d) => ({ ...d, quantity: n, holders: Array.from({ length: n }, (_, i) => d.holders[i] ?? ''), holder_emails: Array.from({ length: n }, (_, i) => d.holder_emails[i] ?? ''), holder_phones: Array.from({ length: n }, (_, i) => d.holder_phones[i] ?? '') }));
    };
    const setHolder = (i: number, v: string) => setData('holders', Array.from({ length: data.quantity }, (_, j) => (j === i ? v : data.holders[j] ?? '')));

    const submit = () => {
        transform((d) => ({ ...d, holders, holder_emails: needDetail ? hEmails : [], holder_phones: needDetail ? hPhones : [], support_choice: type?.support_enabled ? d.support_choice : '' }));
        post(`/events/${eventId}/beli`, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                const f = ((page.props as any).flash ?? {}) as { pay_online?: boolean; order_code?: string };
                if (f.pay_online && f.order_code) void pay(f.order_code);
                else setDone(true);
            },
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl dark:bg-neutral-900 dark:text-white">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/10">
                    <div>
                        <h2 className="text-xl font-extrabold">Beli Tiket</h2>
                        <p className="text-sm text-slate-500">{info?.event.title ?? 'Memuat...'}</p>
                    </div>
                    <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
                </div>

                {failed || (info && !type && !done) ? (
                    <div className="p-10 text-center text-sm text-slate-600">
                        Tiket untuk event ini tidak tersedia.
                        <div><button onClick={onClose} className="mt-4 font-bold text-indigo-700">Kembali</button></div>
                    </div>
                ) : !info ? (
                    <p className="p-10 text-center text-sm text-slate-400">Memuat...</p>
                ) : done ? (
                    <div className="p-10 text-center">
                        <p className="text-lg font-extrabold">Pesanan berhasil dibuat</p>
                        {subtotal === 0 && <p className="mt-2 text-sm font-bold text-emerald-700">Tiket gratis sudah diterbitkan dan dikirim ke email Anda.</p>}
                        <p className={`mt-2 text-sm text-slate-500 ${subtotal === 0 ? 'hidden' : ''}`}>Bukti transfer diterima. Setelah admin menyetujui, tiket (QR code) otomatis dikirim ke email Anda dan muncul di menu Tiket Saya di dashboard jika Anda login.</p>
                        <button onClick={onClose} className="mt-6 rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 px-6 py-3 font-bold text-white">Tutup</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <div className="space-y-2 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                                {([
                                    ['Tanggal', info.event.date],
                                    ['Lokasi', info.event.location ?? '-'],
                                ] as const).map(([k, v]) => (
                                    <div key={k} className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="text-right font-bold">{v}</span></div>
                                ))}
                            </div>

                            <h3 className="mt-6 text-base font-bold">{info.ticket_types.length > 1 ? 'Pilih Jenis Tiket' : 'Jenis Tiket'}</h3>
                            {info.ticket_types.length > 1 && <p className="mb-3 text-xs text-slate-500">Event ini punya {info.ticket_types.length} jenis tiket. Pilih salah satu.</p>}
                            <div className={`mt-3 grid gap-3 ${info.ticket_types.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                                {info.ticket_types.map((t) => {
                                    const sel = t.id === data.ticket_type_id;
                                    const out = t.remaining <= 0;
                                    return (
                                        <button
                                            type="button"
                                            key={t.id}
                                            disabled={out}
                                            onClick={() => { if (!sel) setData((d) => ({ ...d, ticket_type_id: t.id, quantity: 1, holders: [''], holder_emails: [''], holder_phones: [''], support_choice: '' })); }}
                                            className={`relative rounded-2xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${sel ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/15 dark:bg-indigo-500/10' : 'border-slate-200 hover:border-indigo-300 dark:border-white/10'}`}
                                        >
                                            <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${sel ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>{sel && <Check className="h-3.5 w-3.5" />}</span>
                                            <span className="block pr-8 text-base font-extrabold">{t.name}</span>
                                            <span className="mt-1 block text-xl font-extrabold text-indigo-600 dark:text-indigo-300">{t.price === 0 ? 'Gratis' : rp(t.price)}</span>
                                            <span className="mt-2 block text-xs text-slate-500">{out ? 'Habis' : `Tersedia ${t.remaining} tiket`}</span>
                                            <span className="mt-0.5 block text-xs text-slate-500">Berlaku {t.valid_from} – {t.valid_until}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <h3 className="mt-6 mb-3 text-base font-bold">Data Pembeli</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><label className="mb-1 block text-sm font-bold">Nama *</label><input className={inp} placeholder="Nama pembeli" value={data.buyer_name} onChange={(e) => setData('buyer_name', e.target.value)} />{err('buyer_name') && <p className="mt-1 text-xs text-red-600">{err('buyer_name')}</p>}</div>
                                <div><label className="mb-1 block text-sm font-bold">Email *</label><input className={inp} placeholder="email@example.com" value={data.buyer_email} onChange={(e) => setData('buyer_email', e.target.value)} />{err('buyer_email') && <p className="mt-1 text-xs text-red-600">{err('buyer_email')}</p>}</div>
                            </div>
                            <div className="mt-4"><label className="mb-1 block text-sm font-bold">No. Telepon *</label><input className={inp} placeholder="+6281234567890" value={data.buyer_phone} onChange={(e) => setData('buyer_phone', e.target.value)} />{err('buyer_phone') && <p className="mt-1 text-xs text-red-600">{err('buyer_phone')}</p>}</div>

                            <div className="mt-6 flex items-center justify-between">
                                <h3 className="text-base font-bold">Data Pemegang Tiket ({data.quantity} tiket)</h3>
                                <div className="flex items-center gap-3 rounded-xl border px-3 py-1">
                                    <button type="button" onClick={() => setQty(data.quantity - 1)} className="px-2 text-lg">−</button>
                                    <span className="w-4 text-center font-bold">{data.quantity}</span>
                                    <button type="button" onClick={() => setQty(data.quantity + 1)} className="px-2 text-lg">+</button>
                                </div>
                            </div>
                            <p className="mt-1 mb-3 text-xs text-slate-500">Nama ini tercetak di tiket dan dipakai saat check-in. Maksimal {max} tiket per pesanan.</p>
                            <div className="space-y-3">
                                {holders.map((h, i) => (
                                    <div key={i} className="rounded-xl border p-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <b>Tiket #{i + 1}</b>
                                            {i === 0 && <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /> Sama dengan pembeli</label>}
                                        </div>
                                        {!(i === 0 && same) && <input className={`${inp} mt-2`} placeholder="Nama pemegang tiket" value={h} onChange={(e) => setHolder(i, e.target.value)} />}
                                        {needDetail && !(i === 0 && same) && (
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                <div><input className={inp} placeholder="Email pemegang" value={hEmails[i]} onChange={(e) => setHolderField('holder_emails', i, e.target.value)} />{err(`holder_emails.${i}`) && <p className="mt-1 text-xs text-red-600">{err(`holder_emails.${i}`)}</p>}</div>
                                                <div><input className={inp} placeholder="Telepon pemegang" value={hPhones[i]} onChange={(e) => setHolderField('holder_phones', i, e.target.value)} />{err(`holder_phones.${i}`) && <p className="mt-1 text-xs text-red-600">{err(`holder_phones.${i}`)}</p>}</div>
                                            </div>
                                        )}
                                        {needDetail && i === 0 && same && <p className="mt-2 text-xs text-slate-500">Email dan telepon memakai data pembeli.</p>}
                                        {err(`holders.${i}`) && <p className="mt-1 text-xs text-red-600">{err(`holders.${i}`)}</p>}
                                    </div>
                                ))}
                            </div>
                            {type?.support_enabled && (
                                <div className="mt-6">
                                    <h3 className="mb-1 text-base font-bold">Pilih yang Anda dukung</h3>
                                    <p className="mb-3 text-xs text-slate-500">Setiap tiket menjadi satu dukungan untuk pilihan Anda.</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {type.support_options.map((o) => (
                                            <button key={o} type="button" onClick={() => setData('support_choice', o)} className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${data.support_choice === o ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white hover:border-indigo-300'}`}>{o}</button>
                                        ))}
                                    </div>
                                    {err('support_choice') && <p className="mt-1 text-xs text-red-600">{err('support_choice')}</p>}
                                </div>
                            )}
                            {subtotal === 0 && <p className="mt-6 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Tiket gratis. Tidak perlu pembayaran, tiket langsung diterbitkan dan dikirim ke email Anda.</p>}
                            <h3 className={`mt-6 mb-3 text-base font-bold ${subtotal === 0 ? 'hidden' : ''}`}>Pembayaran</h3>
                            {subtotal === 0 ? null : info.payment.methods.length === 0 ? (
                                <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">Pembayaran belum tersedia. Silakan coba lagi nanti.</p>
                            ) : (
                                <>
                                    {info.payment.methods.length > 1 && (
                                        <div className="mb-3 grid gap-2 sm:grid-cols-2">
                                            {info.payment.methods.map((m) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setData('payment_method', m)}
                                                    className={`rounded-xl border p-3 text-left text-sm font-bold ${data.payment_method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200' : 'border-slate-200 dark:border-white/10'}`}
                                                >
                                                    {m === 'midtrans' ? 'Bayar online (Midtrans)' : 'Transfer manual'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {data.payment_method === 'midtrans' ? (
                                        <div className="space-y-2 rounded-xl border p-4 text-sm">
                                            <p className="font-bold">Bayar online</p>
                                            <p className="text-slate-600 dark:text-slate-300">
                                                Bayar <b>{rp(subtotal + fee)}</b> lewat QRIS, e-wallet, virtual account, atau kartu. Tiket terbit otomatis setelah pembayaran berhasil.
                                            </p>
                                            {err('payment_method') && <p className="text-xs text-red-600">{err('payment_method')}</p>}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 rounded-xl border p-4 text-sm">
                                    <p className="font-bold">Transfer manual</p>
                                    <p className="text-slate-600 dark:text-slate-300">
                                        Transfer <b>{rp(subtotal + fee)}</b> ke {info.payment.bank.bank_name} <b>{info.payment.bank.bank_account_number}</b> a.n. {info.payment.bank.bank_account_holder}, lalu unggah bukti transfer.
                                    </p>
                                    <FileDrop compact file={data.payment_proof} accept="image/*,application/pdf" onChange={(e) => setData('payment_proof', e.target.files?.[0] ?? null)} onClear={() => setData('payment_proof', null)} title="Klik untuk unggah bukti transfer" hint="JPG, PNG, WEBP, atau PDF" />
                                    {err('payment_proof') && <p className="text-xs text-red-600">{err('payment_proof')}</p>}
                                    {err('payment_method') && <p className="text-xs text-red-600">{err('payment_method')}</p>}
                                </div>
                                    )}
                                </>
                            )}
                            {pendingCode && !done && (
                                <div className="mt-3 space-y-2 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
                                    <p>{payMsg || 'Pesanan dibuat. Selesaikan pembayaran untuk menerbitkan tiket.'}</p>
                                    <button type="button" onClick={() => void pay(pendingCode)} disabled={paying} className="rounded-lg bg-amber-600 px-4 py-2 text-white disabled:opacity-60">
                                        {paying ? 'Membuka...' : 'Lanjutkan pembayaran'}
                                    </button>
                                </div>
                            )}
                            {(err('quantity') || err('ticket_type_id') || err('holders')) && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{err('quantity') || err('ticket_type_id') || err('holders')}</p>}
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 dark:border-white/10">
                            <div>
                                <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Total · {data.quantity} tiket</p>
                                <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{rp(subtotal + fee)}</p>
                                <p className="text-[11px] text-slate-500">Tiket {rp(subtotal)} + biaya layanan {feePct}% {rp(fee)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={onClose} className="font-bold text-slate-700 dark:text-slate-200">Batal</button>
                                <button onClick={submit} disabled={processing || paying || !!pendingCode || (subtotal > 0 && info.payment.methods.length === 0)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 px-6 py-3 font-bold text-white disabled:opacity-60">
                                    {processing && <Loader2 className="h-4 w-4 animate-spin" />} {subtotal === 0 ? 'Ambil Tiket Gratis' : 'Beli Tiket'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
}
