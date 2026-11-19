import { useForm } from '@inertiajs/react';
import { Check, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import FileDrop from '@/components/file-drop';
type TType = { id: number; name: string; price: number; remaining: number; valid_from: string; valid_until: string; max_per_order: number; require_holder_details: boolean; support_enabled: boolean };
type Activity = { event_id: number; title: string; date: string; location: string | null; ticket_types: TType[] };
type Data = {
    event: { id: number; title: string; location: string | null; date: string };
    activities: Activity[];
    fee_percent: number;
    payment: { methods: string[]; bank: { bank_name: string; bank_account_number: string; bank_account_holder: string } };
};

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const inp = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white';

export default function TicketSeriesModal({ eventId, onClose }: { eventId: number; onClose: () => void }) {
    const [info, setInfo] = useState<Data | null>(null);
    const [failed, setFailed] = useState(false);
    const [done, setDone] = useState(false);
    const [same, setSame] = useState(true);
    // event_id -> ticket_type_id untuk kegiatan yang dicentang
    const [picked, setPicked] = useState<Record<number, number>>({});

    const { data, setData, post, processing, errors, transform } = useForm({
        items: [] as { event_id: number; ticket_type_id: number }[],
        quantity: 1,
        buyer_name: '',
        buyer_email: '',
        buyer_phone: '',
        holders: [''] as string[],
        holder_emails: [''] as string[],
        holder_phones: [''] as string[],
        payment_method: 'transfer_manual',
        payment_proof: null as File | null,
    });

    useEffect(() => {
        fetch(`/events/${eventId}/beli-rangkaian-data`, { headers: { Accept: 'application/json' } })
            .then((r) => {
                if (r.status === 401 || r.status === 419) {
                    window.location.assign(`/tickets?beli=${eventId}`);
                    return new Promise<never>(() => {});
                }
                return r.ok ? r.json() : Promise.reject();
            })
            .then((d: Data) => setInfo(d))
            .catch(() => setFailed(true));
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

    const chosen = useMemo(() => {
        if (!info) return [] as { a: Activity; t: TType }[];
        return info.activities.flatMap((a) => {
            const t = a.ticket_types.find((x) => x.id === picked[a.event_id]);
            return t ? [{ a, t }] : [];
        });
    }, [info, picked]);

    const max = chosen.length ? Math.max(1, Math.min(...chosen.map(({ t }) => Math.min(t.max_per_order, t.remaining)))) : 1;
    const feePct = info?.fee_percent ?? 10;
    const qty = Math.min(data.quantity, max);
    const subtotal = chosen.reduce((s, { t }) => s + t.price * qty, 0);
    const fee = chosen.reduce((s, { t }) => s + Math.round((t.price * qty * feePct) / 100), 0);
    const free = chosen.length > 0 && subtotal === 0;
    const needDetail = chosen.some(({ t }) => t.require_holder_details);
    const err = (k: string) => (errors as Record<string, string>)[k];

    const holders = Array.from({ length: qty }, (_, i) => (i === 0 && same ? data.buyer_name : data.holders[i] ?? ''));
    const hEmails = Array.from({ length: qty }, (_, i) => (i === 0 && same ? data.buyer_email : data.holder_emails[i] ?? ''));
    const hPhones = Array.from({ length: qty }, (_, i) => (i === 0 && same ? data.buyer_phone : data.holder_phones[i] ?? ''));
    const setHolder = (i: number, v: string) => setData('holders', Array.from({ length: qty }, (_, j) => (j === i ? v : data.holders[j] ?? '')));
    const setField = (k: 'holder_emails' | 'holder_phones', i: number, v: string) => setData(k, Array.from({ length: qty }, (_, j) => (j === i ? v : data[k][j] ?? '')));
    const setQty = (q: number) => setData('quantity', Math.max(1, Math.min(max, q)));

    const toggle = (a: Activity) =>
        setPicked((p) => {
            const n = { ...p };
            if (n[a.event_id]) delete n[a.event_id];
            else {
                const first = a.ticket_types.find((t) => t.remaining > 0);
                if (first) n[a.event_id] = first.id;
            }
            return n;
        });

    const submit = () => {
        transform((d) => ({
            ...d,
            quantity: qty,
            items: chosen.map(({ a, t }) => ({ event_id: a.event_id, ticket_type_id: t.id })),
            holders,
            holder_emails: needDetail ? hEmails : [],
            holder_phones: needDetail ? hPhones : [],
        }));
        post(`/events/${eventId}/beli-rangkaian`, { forceFormData: true, preserveScroll: true, preserveState: true, onSuccess: () => setDone(true) });
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

                {failed || (info && info.activities.length === 0 && !done) ? (
                    <div className="p-10 text-center text-sm text-slate-600">
                        Tiket untuk event ini tidak tersedia.
                        <div><button onClick={onClose} className="mt-4 font-bold text-indigo-700">Kembali</button></div>
                    </div>
                ) : !info ? (
                    <p className="p-10 text-center text-sm text-slate-400">Memuat...</p>
                ) : done ? (
                    <div className="p-10 text-center">
                        <p className="text-lg font-extrabold">Pesanan berhasil dibuat</p>
                        {free ? (
                            <p className="mt-2 text-sm font-bold text-emerald-700">Tiket gratis sudah diterbitkan dan dikirim ke email Anda.</p>
                        ) : (
                            <p className="mt-2 text-sm text-slate-500">Bukti transfer diterima. Setelah admin menyetujui, tiket (QR code) semua kegiatan otomatis dikirim ke email Anda.</p>
                        )}
                        <button onClick={onClose} className="mt-6 rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 px-6 py-3 font-bold text-white">Tutup</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <h3 className="text-base font-bold">Pilih Kegiatan</h3>
                            <p className="mb-3 text-xs text-slate-500">Centang kegiatan yang ingin Anda ikuti. Data diisi satu kali dan dibayar satu kali.</p>
                            <div className="space-y-3">
                                {info.activities.map((a) => {
                                    const sel = picked[a.event_id] !== undefined;
                                    const t = a.ticket_types.find((x) => x.id === picked[a.event_id]);
                                    const allOut = a.ticket_types.every((x) => x.remaining <= 0);
                                    return (
                                        <div key={a.event_id} className={`rounded-2xl border-2 p-4 transition ${sel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10'} ${allOut ? 'opacity-45' : ''}`}>
                                            <button type="button" disabled={allOut} onClick={() => toggle(a)} className="flex w-full items-start gap-3 text-left disabled:cursor-not-allowed">
                                                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${sel ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 dark:border-white/20'}`}>{sel && <Check className="h-4 w-4" />}</span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-base font-extrabold">{a.title}</span>
                                                    <span className="mt-0.5 block text-xs text-slate-500">{a.date}{a.location ? ` · ${a.location}` : ''}</span>
                                                    <span className="mt-1 block text-sm font-extrabold text-indigo-600 dark:text-indigo-300">
                                                        {allOut ? 'Habis' : a.ticket_types.length === 1 ? (a.ticket_types[0].price === 0 ? 'Gratis' : rp(a.ticket_types[0].price)) : `Mulai ${rp(Math.min(...a.ticket_types.map((x) => x.price)))}`}
                                                    </span>
                                                </span>
                                            </button>
                                            {sel && a.ticket_types.length > 1 && (
                                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                    {a.ticket_types.map((x) => (
                                                        <button type="button" key={x.id} disabled={x.remaining <= 0} onClick={() => setPicked((p) => ({ ...p, [a.event_id]: x.id }))} className={`rounded-xl border px-3 py-2 text-left text-sm transition disabled:opacity-45 ${t?.id === x.id ? 'border-indigo-600 bg-white font-bold dark:bg-white/10' : 'border-slate-200 dark:border-white/10'}`}>
                                                            {x.name} · {x.price === 0 ? 'Gratis' : rp(x.price)}
                                                            <span className="block text-xs font-normal text-slate-500">{x.remaining <= 0 ? 'Habis' : `Sisa ${x.remaining}`}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {sel && t && <p className="mt-2 text-xs text-slate-500">Berlaku {t.valid_from} – {t.valid_until} · sisa {t.remaining} tiket</p>}
                                        </div>
                                    );
                                })}
                            </div>
                            {err('items') && <p className="mt-2 text-xs font-bold text-red-600">{err('items')}</p>}

                            <h3 className="mt-6 mb-3 text-base font-bold">Data Pembeli</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><label className="mb-1 block text-sm font-bold">Nama *</label><input className={inp} placeholder="Nama pembeli" value={data.buyer_name} onChange={(e) => setData('buyer_name', e.target.value)} />{err('buyer_name') && <p className="mt-1 text-xs text-red-600">{err('buyer_name')}</p>}</div>
                                <div><label className="mb-1 block text-sm font-bold">Email *</label><input className={inp} placeholder="email@example.com" value={data.buyer_email} onChange={(e) => setData('buyer_email', e.target.value)} />{err('buyer_email') && <p className="mt-1 text-xs text-red-600">{err('buyer_email')}</p>}</div>
                            </div>
                            <div className="mt-4"><label className="mb-1 block text-sm font-bold">No. Telepon *</label><input className={inp} placeholder="+6281234567890" value={data.buyer_phone} onChange={(e) => setData('buyer_phone', e.target.value)} />{err('buyer_phone') && <p className="mt-1 text-xs text-red-600">{err('buyer_phone')}</p>}</div>

                            <div className="mt-6 flex items-center justify-between">
                                <h3 className="text-base font-bold">Data Pemegang Tiket ({qty} orang)</h3>
                                <div className="flex items-center gap-3 rounded-xl border px-3 py-1">
                                    <button type="button" onClick={() => setQty(qty - 1)} className="px-2 text-lg">−</button>
                                    <span className="w-4 text-center font-bold">{qty}</span>
                                    <button type="button" onClick={() => setQty(qty + 1)} className="px-2 text-lg">+</button>
                                </div>
                            </div>
                            <p className="mt-1 mb-3 text-xs text-slate-500">Setiap orang mendapat satu tiket di tiap kegiatan yang dipilih. Maksimal {max} orang per pesanan.</p>
                            <div className="space-y-3">
                                {holders.map((h, i) => (
                                    <div key={i} className="rounded-xl border p-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <b>Orang #{i + 1}</b>
                                            {i === 0 && <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} /> Sama dengan pembeli</label>}
                                        </div>
                                        {!(i === 0 && same) && <input className={`${inp} mt-2`} placeholder="Nama pemegang tiket" value={h} onChange={(e) => setHolder(i, e.target.value)} />}
                                        {needDetail && !(i === 0 && same) && (
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                <div><input className={inp} placeholder="Email pemegang" value={hEmails[i]} onChange={(e) => setField('holder_emails', i, e.target.value)} />{err(`holder_emails.${i}`) && <p className="mt-1 text-xs text-red-600">{err(`holder_emails.${i}`)}</p>}</div>
                                                <div><input className={inp} placeholder="Telepon pemegang" value={hPhones[i]} onChange={(e) => setField('holder_phones', i, e.target.value)} />{err(`holder_phones.${i}`) && <p className="mt-1 text-xs text-red-600">{err(`holder_phones.${i}`)}</p>}</div>
                                            </div>
                                        )}
                                        {needDetail && i === 0 && same && <p className="mt-2 text-xs text-slate-500">Email dan telepon memakai data pembeli.</p>}
                                        {err(`holders.${i}`) && <p className="mt-1 text-xs text-red-600">{err(`holders.${i}`)}</p>}
                                    </div>
                                ))}
                            </div>

                            {free && <p className="mt-6 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Semua kegiatan yang dipilih gratis. Tidak perlu pembayaran, tiket langsung diterbitkan dan dikirim ke email Anda.</p>}
                            {chosen.length > 0 && !free && (
                                <>
                                    <h3 className="mt-6 mb-3 text-base font-bold">Pembayaran</h3>
                                    {info.payment.methods.length === 0 ? (
                                        <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">Pembayaran belum tersedia. Silakan coba lagi nanti.</p>
                                    ) : (
                                        <div className="space-y-3 rounded-xl border p-4 text-sm">
                                            <p className="font-bold">Transfer manual</p>
                                            <p className="text-slate-600 dark:text-slate-300">
                                                Transfer <b>{rp(subtotal + fee)}</b> sekali untuk semua kegiatan ke {info.payment.bank.bank_name} <b>{info.payment.bank.bank_account_number}</b> a.n. {info.payment.bank.bank_account_holder}, lalu unggah satu bukti transfer.
                                            </p>
                                            <FileDrop compact file={data.payment_proof} accept="image/*,application/pdf" onChange={(e) => setData('payment_proof', e.target.files?.[0] ?? null)} onClear={() => setData('payment_proof', null)} title="Klik untuk unggah bukti transfer" hint="JPG, PNG, WEBP, atau PDF" />
                                            {err('payment_proof') && <p className="text-xs text-red-600">{err('payment_proof')}</p>}
                                            {err('payment_method') && <p className="text-xs text-red-600">{err('payment_method')}</p>}
                                        </div>
                                    )}
                                </>
                            )}
                            {(err('quantity') || err('holders')) && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{err('quantity') || err('holders')}</p>}
                        </div>

                        <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 dark:border-white/10">
                            <div>
                                <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Total · {chosen.length} kegiatan × {qty} orang</p>
                                <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{rp(subtotal + fee)}</p>
                                <p className="text-[11px] text-slate-500">Tiket {rp(subtotal)} + biaya layanan {feePct}% {rp(fee)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={onClose} className="font-bold text-slate-700 dark:text-slate-200">Batal</button>
                                <button onClick={submit} disabled={processing || chosen.length === 0 || (!free && info.payment.methods.length === 0)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                                    {processing && <Loader2 className="h-4 w-4 animate-spin" />} {free ? 'Ambil Tiket Gratis' : 'Beli Tiket'}
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
