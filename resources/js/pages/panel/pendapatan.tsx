import UserLayout from '@/components/user/user-layout';
import { Link, router, useForm } from '@inertiajs/react';
import { ChevronLeft, FileText, Inbox, Lock, X } from 'lucide-react';
import { useState } from 'react';

type Bal = {
    id: number; title: string; subtotal: number; share: number; entitlement: number; transferred: number;
    processing: number; available: number; has_pending: boolean;
};
type H = {
    id: number; event: string; amount: number; bank_name: string; account_number: string; account_name: string; status: string;
    reject_reason: string | null; proof: { url: string; is_pdf: boolean } | null; requested_at: string; transferred_at: string | null;
};
type Acc = { bank_name: string; account_number: string; account_name: string };
type Props = {
    summary: { available: number; processing: number; withdrawn: number };
    balances: Bal[]; history: H[]; account: Acc; hold_until: string | null; has_pin: boolean; pin_locked_until: string | null;
    email_hint: string; institution_name: string; can_withdraw: boolean; min: number;
};

const rp = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

const STATUS: Record<string, { label: string; style: string }> = {
    menunggu: { label: 'Menunggu', style: 'bg-amber-100 text-amber-800' },
    disetujui: { label: 'Disetujui', style: 'bg-sky-100 text-sky-800' },
    ditransfer: { label: 'Ditransfer', style: 'bg-emerald-100 text-emerald-800' },
    ditolak: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800' },
};

const panel = 'rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60';
const label = 'text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300';
const input = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';
const btn = 'rounded-2xl bg-indigo-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60';

export default function PanelPendapatan({ summary, balances, history, account, hold_until, has_pin, pin_locked_until, email_hint, institution_name, can_withdraw, min }: Props) {
    const [target, setTarget] = useState<Bal | null>(null);
    const [pinMode, setPinMode] = useState(false);
    const [zoom, setZoom] = useState<string | null>(null);

    const wd = useForm({ event_id: '', amount: '', pin: '' });
    const pinForm = useForm({ password: '', code: '', pin: '' });
    const acc = useForm({ bank_name: account.bank_name, account_number: account.account_number, account_name: account.account_name, pin: '' });

    const hasAccount = !!account.account_number;
    const totals = balances.reduce((t, b) => ({ sales: t.sales + b.subtotal, share: t.share + b.share, ent: t.ent + b.entitlement }), { sales: 0, share: 0, ent: 0 });
    const showPin = pinMode || (target !== null && !has_pin);

    const closeModal = () => { setTarget(null); setPinMode(false); wd.reset(); wd.clearErrors(); pinForm.reset(); pinForm.clearErrors(); };

    const start = (b: Bal) => { wd.clearErrors(); wd.setData({ event_id: String(b.id), amount: '', pin: '' }); setTarget(b); };

    const sendCode = () => router.post('/panel/pin/kode', {}, { preserveScroll: true });

    const submitPin = (e: React.FormEvent) => {
        e.preventDefault();
        pinForm.post('/panel/pin', { preserveScroll: true, onSuccess: () => { pinForm.reset(); setPinMode(false); if (!target) closeModal(); } });
    };

    const submitWd = (e: React.FormEvent) => {
        e.preventDefault();
        wd.post('/panel/penarikan', { preserveScroll: true, onSuccess: () => closeModal(), onError: () => wd.setData('pin', '') });
    };

    const submitAcc = (e: React.FormEvent) => {
        e.preventDefault();
        acc.put('/panel/rekening', { preserveScroll: true, onSuccess: () => acc.setData('pin', ''), onError: () => acc.setData('pin', '') });
    };

    const th = 'px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500';
    const td = 'px-4 py-3.5 align-middle';

    const stat = (title: string, value: string, sub: string, color: string) => (
        <div className={`${panel} p-6`}>
            <div className={label}>{title}</div>
            <div className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</div>
        </div>
    );

    return (
        <UserLayout title="Pendapatan" hasPanel>
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900 via-blue-600 to-violet-600 px-8 py-7 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em]"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Pendapatan</span>
                        <h2 className="mt-3 text-3xl font-extrabold">Saldo &amp; Penarikan</h2>
                        <p className="mt-2 max-w-3xl text-sm text-white/85">Pantau pendapatan lembaga dari setiap event, kelola rekening pencairan, dan ajukan penarikan dana.</p>
                        <Link href="/panel" className="mt-5 inline-flex items-center gap-1 text-sm font-extrabold hover:underline"><ChevronLeft className="h-4 w-4" /> Lembaga</Link>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stat('Total penjualan', rp(totals.sales), 'Tiket dan vote yang lunas', 'text-indigo-700')}
                    {stat('Bagi hasil platform', rp(totals.share), 'Bagian SIMPLE dari penjualan', 'text-violet-700')}
                    {stat('Hak lembaga', rp(totals.ent), 'Setelah bagian platform', 'text-emerald-700')}
                    {stat('Sudah ditarik', rp(summary.withdrawn), `Dalam proses: ${rp(summary.processing)}`, 'text-slate-900 dark:text-white')}
                    {stat('Saldo tersedia', rp(summary.available), 'Siap ditarik', 'text-cyan-700')}
                    {stat('Dalam proses', rp(summary.processing), 'Menunggu persetujuan atau transfer', 'text-amber-700')}
                </div>

                <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
                    <section className={`${panel} overflow-hidden`}>
                        <div className="px-6 pb-4 pt-6">
                            <h3 className="text-xl font-extrabold">Saldo per Event</h3>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Hak lembaga = penjualan − bagi hasil platform. Penarikan diproses per event oleh admin.</p>
                            {hold_until && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Rekening baru diganti. Penarikan baru bisa diajukan setelah {hold_until}.</p>}
                        </div>
                        {balances.length === 0 ? (
                            <Empty text="Belum ada penjualan yang lunas." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-sm">
                                    <thead className="bg-slate-50 dark:bg-white/5">
                                        <tr>
                                            <th className={th}>Event</th>
                                            <th className={`${th} text-right`}>Penjualan</th>
                                            <th className={`${th} text-right`}>Bagi hasil</th>
                                            <th className={`${th} text-right`}>Hak lembaga</th>
                                            <th className={`${th} text-right`}>Proses</th>
                                            <th className={`${th} text-right`}>Ditarik</th>
                                            <th className={`${th} text-right`}>Saldo</th>
                                            <th className={`${th} text-right`}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                        {balances.map((b) => {
                                            const blocked = !can_withdraw || !hasAccount || !!hold_until || b.has_pending || b.available < min;
                                            const hint = !can_withdraw ? 'Tidak punya izin penarikan' : !hasAccount ? 'Atur rekening pencairan dulu' : hold_until ? `Ditahan sampai ${hold_until}` : b.has_pending ? 'Masih ada permintaan menunggu' : b.available < min ? `Minimal ${rp(min)}` : '';
                                            return (
                                                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                                                    <td className={`${td} font-extrabold`}>{b.title}</td>
                                                    <td className={`${td} text-right`}>{rp(b.subtotal)}</td>
                                                    <td className={`${td} text-right`}>{rp(b.share)}</td>
                                                    <td className={`${td} text-right font-bold text-emerald-700`}>{rp(b.entitlement)}</td>
                                                    <td className={`${td} text-right text-amber-700`}>{rp(b.processing)}</td>
                                                    <td className={`${td} text-right`}>{rp(b.transferred)}</td>
                                                    <td className={`${td} text-right font-bold text-cyan-700`}>{rp(b.available)}</td>
                                                    <td className={`${td} text-right`}>
                                                        <button type="button" disabled={blocked} title={hint} onClick={() => start(b)} className="rounded-xl bg-indigo-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40">Tarik dana</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className={`${panel} h-fit p-6`}>
                        <h3 className="text-xl font-extrabold">Rekening Pencairan</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Dana ditransfer ke rekening ini. Nomor rekening ikut terkunci saat penarikan diajukan.</p>
                        <form onSubmit={submitAcc} className="mt-4 space-y-4">
                            <label className="block"><span className={label}>Nama bank</span>
                                <input value={acc.data.bank_name} disabled={!can_withdraw} onChange={(e) => acc.setData('bank_name', e.target.value)} className={input} />
                                {acc.errors.bank_name && <p className="mt-1 text-xs text-rose-600">{acc.errors.bank_name}</p>}
                            </label>
                            <label className="block"><span className={label}>Nomor rekening</span>
                                <input inputMode="numeric" value={acc.data.account_number} disabled={!can_withdraw} onChange={(e) => acc.setData('account_number', e.target.value)} className={input} />
                                {acc.errors.account_number && <p className="mt-1 text-xs text-rose-600">{acc.errors.account_number}</p>}
                            </label>
                            <label className="block"><span className={label}>Atas nama</span>
                                <input value={acc.data.account_name} disabled={!can_withdraw} onChange={(e) => acc.setData('account_name', e.target.value)} className={input} />
                                <span className="mt-1 block text-xs text-slate-500">Harus sama dengan nama pemilik rekening lembaga.</span>
                                {acc.errors.account_name && <p className="mt-1 text-xs text-rose-600">{acc.errors.account_name}</p>}
                            </label>
                            {has_pin && can_withdraw && (
                                <label className="block"><span className={label}>PIN penarikan</span>
                                    <input type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={acc.data.pin} onChange={(e) => acc.setData('pin', e.target.value.replace(/\D/g, ''))} className={input} />
                                    {acc.errors.pin && <p className="mt-1 text-xs text-rose-600">{acc.errors.pin}</p>}
                                </label>
                            )}
                            {can_withdraw && <button type="submit" disabled={acc.processing} className={`${btn} w-full`}>{acc.processing ? 'Menyimpan…' : 'Simpan Rekening'}</button>}
                        </form>
                        {can_withdraw && (
                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs dark:bg-white/5">
                                <span className="inline-flex items-center gap-1.5 font-semibold"><Lock className="h-3.5 w-3.5" /> {has_pin ? 'PIN penarikan aktif' : 'PIN belum dibuat'}</span>
                                <button type="button" onClick={() => setPinMode(true)} className="font-extrabold text-indigo-700 underline">{has_pin ? 'Ubah PIN' : 'Buat PIN'}</button>
                            </div>
                        )}
                        {pin_locked_until && <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">PIN terkunci sampai pukul {pin_locked_until}.</p>}
                    </section>
                </div>

                <section className={`${panel} overflow-hidden`}>
                    <div className="px-6 pb-4 pt-6">
                        <h3 className="text-xl font-extrabold">Riwayat Penarikan</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Setiap pengajuan tercatat beserta rekening pada saat diajukan.</p>
                    </div>
                    {history.length === 0 ? (
                        <Empty text="Belum ada penarikan yang diajukan." />
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[760px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        <th className={th}>Diajukan</th>
                                        <th className={th}>Event</th>
                                        <th className={th}>Rekening tujuan</th>
                                        <th className={`${th} text-right`}>Nominal</th>
                                        <th className={th}>Status</th>
                                        <th className={`${th} text-right`}>Bukti</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {history.map((h) => {
                                        const st = STATUS[h.status] ?? STATUS.menunggu;
                                        return (
                                            <tr key={h.id}>
                                                <td className={`${td} whitespace-nowrap text-xs text-slate-500`}>{h.requested_at}</td>
                                                <td className={`${td} font-semibold`}>{h.event}</td>
                                                <td className={td}>
                                                    <div className="font-semibold">{h.bank_name} · {h.account_number}</div>
                                                    <div className="text-xs text-slate-500">a.n. {h.account_name}</div>
                                                </td>
                                                <td className={`${td} text-right font-bold`}>{rp(h.amount)}</td>
                                                <td className={td}>
                                                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${st.style}`}>{st.label}</span>
                                                    {h.status === 'ditolak' && h.reject_reason && <div className="mt-1 max-w-[220px] text-xs text-rose-600">{h.reject_reason}</div>}
                                                    {h.status === 'ditransfer' && h.transferred_at && <div className="mt-1 text-xs text-slate-500">{h.transferred_at}</div>}
                                                </td>
                                                <td className={`${td} text-right`}>
                                                    {h.proof ? (
                                                        h.proof.is_pdf ? (
                                                            <a href={h.proof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 underline"><FileText className="h-4 w-4" /> PDF</a>
                                                        ) : (
                                                            <button type="button" onClick={() => setZoom(h.proof!.url)} className="text-xs font-bold text-indigo-600 underline">Lihat bukti</button>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <p className="pb-2 text-center text-xs text-slate-500">Lembaga: {institution_name} · Penarikan diproses manual oleh admin SIMPLE setelah diperiksa.</p>
            </div>

            {(target || pinMode) && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 p-4" onClick={closeModal}>
                    {showPin ? (
                        <form onSubmit={submitPin} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-extrabold">{target ? 'Ajukan Penarikan' : has_pin ? 'Ubah PIN Penarikan' : 'Buat PIN Penarikan'}</h3>
                                    {target && <p className="text-sm text-slate-600 dark:text-slate-300">{target.title}</p>}
                                </div>
                                <button type="button" onClick={closeModal} className="text-sm font-bold text-slate-500">Tutup</button>
                            </div>
                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Buat PIN penarikan 6 digit. PIN ini diminta setiap kali menarik dana, terpisah dari password.</p>
                            <label className="mt-4 block"><span className={label}>Password akun</span>
                                <input type="password" autoComplete="current-password" value={pinForm.data.password} onChange={(e) => pinForm.setData('password', e.target.value)} className={input} />
                                {pinForm.errors.password && <p className="mt-1 text-xs text-rose-600">{pinForm.errors.password}</p>}
                            </label>
                            <div className="mt-4"><span className={label}>Kode verifikasi email</span>
                                <div className="flex gap-2">
                                    <input inputMode="numeric" maxLength={6} value={pinForm.data.code} onChange={(e) => pinForm.setData('code', e.target.value.replace(/\D/g, ''))} className={input} />
                                    <button type="button" onClick={sendCode} className="mt-1.5 shrink-0 rounded-2xl border border-slate-200 px-4 text-sm font-bold dark:border-white/10">Kirim kode</button>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Kode 6 digit dikirim ke {email_hint}.</p>
                                {pinForm.errors.code && <p className="mt-1 text-xs text-rose-600">{pinForm.errors.code}</p>}
                            </div>
                            <label className="mt-4 block"><span className={label}>PIN baru (6 digit)</span>
                                <input type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={pinForm.data.pin} onChange={(e) => pinForm.setData('pin', e.target.value.replace(/\D/g, ''))} className={input} />
                                {pinForm.errors.pin && <p className="mt-1 text-xs text-rose-600">{pinForm.errors.pin}</p>}
                            </label>
                            <div className="mt-5 flex items-center justify-between gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-3 text-sm font-extrabold">Batal</button>
                                <button type="submit" disabled={pinForm.processing} className={`${btn} flex-1`}>{pinForm.processing ? 'Menyimpan…' : 'Simpan PIN'}</button>
                            </div>
                        </form>
                    ) : (
                        target && (
                            <form onSubmit={submitWd} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-extrabold">Tarik dana</h3>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{target.title}. Saldo tersedia <b>{rp(target.available)}</b>, minimal {rp(min)}.</p>
                                <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                                    <div className="text-xs font-semibold text-slate-500">Rekening tujuan</div>
                                    <div className="font-bold">{account.bank_name} · {account.account_number}</div>
                                    <div className="text-xs text-slate-500">a.n. {account.account_name}</div>
                                </div>
                                <label className="mt-4 block"><span className={label}>Nominal (Rp)</span>
                                    <input type="number" inputMode="numeric" min={min} max={target.available} value={wd.data.amount} onChange={(e) => wd.setData('amount', e.target.value)} className={input} />
                                </label>
                                <button type="button" onClick={() => wd.setData('amount', String(target.available))} className="mt-1 text-xs font-bold text-indigo-600 underline">Tarik semua saldo</button>
                                {wd.errors.amount && <p className="mt-1 text-sm text-rose-600">{wd.errors.amount}</p>}
                                <label className="mt-4 block"><span className={label}>PIN penarikan</span>
                                    <input type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={wd.data.pin} onChange={(e) => wd.setData('pin', e.target.value.replace(/\D/g, ''))} className={input} />
                                    {wd.errors.pin && <p className="mt-1 text-xs text-rose-600">{wd.errors.pin}</p>}
                                </label>
                                <div className="mt-5 flex justify-end gap-2">
                                    <button type="button" onClick={closeModal} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10">Batal</button>
                                    <button type="submit" disabled={wd.processing} className={btn}>{wd.processing ? 'Mengirim…' : 'Ajukan penarikan'}</button>
                                </div>
                            </form>
                        )
                    )}
                </div>
            )}

            {zoom && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-4" onClick={() => setZoom(null)}>
                    <button type="button" aria-label="Tutup" className="absolute right-5 top-5 rounded-full bg-white/90 p-2 text-slate-700"><X className="h-5 w-5" /></button>
                    <img src={zoom} alt="Bukti transfer" className="max-h-[90vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </UserLayout>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10"><Inbox className="h-6 w-6" /></div>
            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">{text}</p>
        </div>
    );
}
