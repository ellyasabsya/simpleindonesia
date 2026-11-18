import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Landmark, Loader2, PauseCircle, Save, Zap } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';

type PaySettings = { pay_midtrans: boolean; pay_manual: boolean };
type Bank = { bank_name: string; bank_account_number: string; bank_account_holder: string };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={() => onChange(!on)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full shadow-inner transition-colors duration-200 ${
                on ? 'bg-gradient-to-r from-indigo-500 to-violet-600' : 'bg-slate-300 dark:bg-white/20'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    on ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

function Field({ label, value, onChange, error, placeholder, inputMode }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
    inputMode?: 'numeric' | 'text';
}) {
    return (
        <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                inputMode={inputMode}
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 dark:bg-white/5 ${
                    error
                        ? 'border-red-300 focus:ring-red-300/40 dark:border-red-500/40'
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/30 dark:border-white/10'
                }`}
            />
            {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}
        </label>
    );
}

export default function AdminPengaturan({ settings, bank, fee_percent }: { settings: PaySettings; bank: Bank; fee_percent: number; votingNow?: boolean }) {
    const { errors } = usePage().props as { errors?: Record<string, string> };
    const [pay, setPay] = useState<PaySettings>(settings);
    const [rek, setRek] = useState<Bank>(bank);
    const [fee, setFee] = useState(String(fee_percent));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const dirty = JSON.stringify([pay, rek, fee]) !== JSON.stringify([settings, bank, String(fee_percent)]);
    const votingNow = pay.pay_midtrans || !pay.pay_manual;

    const save = () => {
        router.patch('/admin/pengaturan', { ...pay, ...rek, service_fee_percent: fee }, {
            preserveScroll: true,
            onStart: () => {
                setSaving(true);
                setSaved(false);
            },
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            },
            onFinish: () => setSaving(false),
        });
    };

    const panel = 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60';
    const panelHead = 'border-b border-slate-200 px-5 py-4 dark:border-white/10';
    const sub = 'text-sm text-slate-500 dark:text-slate-400';

    const methodCard = (on: boolean) =>
        `flex h-full flex-col rounded-xl border p-4 transition-colors ${
            on
                ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-400/40 dark:bg-indigo-500/10'
                : 'border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-white/5'
        }`;

    const iconClass = (on: boolean) =>
        `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            on ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500'
        }`;

    const badge = (on: boolean) => (
        <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                on ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'
            }`}
        >
            {on ? 'Aktif' : 'Nonaktif'}
        </span>
    );

    return (
        <AdminLayout title="Pengaturan">
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Simple Platform Management
                            </span>
                            <h2 className="mt-3 text-2xl font-extrabold">Pengaturan Platform</h2>
                            <p className="mt-1 max-w-2xl text-sm text-white/80">Atur metode pembayaran, rekening tujuan transfer, dan biaya layanan.</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            {saving && (
                                <span className="inline-flex items-center gap-2 text-white/80">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                                </span>
                            )}
                            {!saving && saved && (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-200">
                                    <CheckCircle2 className="h-4 w-4" /> Tersimpan
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={save}
                                disabled={!dirty || saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-800 shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" /> Simpan
                            </button>
                        </div>
                    </div>
                </div>

                <div className={panel}>
                    <div className={panelHead}>
                        <h3 className="text-base font-extrabold">Metode Pembayaran</h3>
                        <p className={sub}>Minimal satu metode harus aktif.</p>
                    </div>
                    <div className="space-y-4 p-5">
                        {errors?.pay_midtrans && (
                            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <div>{errors.pay_midtrans}</div>
                            </div>
                        )}

                        <div className="grid items-stretch gap-4 md:grid-cols-2">
                            <div className={methodCard(pay.pay_midtrans)}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={iconClass(pay.pay_midtrans)}><Zap className="h-5 w-5" /></div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-extrabold">Midtrans</h4>
                                                {badge(pay.pay_midtrans)}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Pembayaran online, konfirmasi otomatis</div>
                                        </div>
                                    </div>
                                    <Toggle on={pay.pay_midtrans} label="Midtrans" onChange={(v) => setPay({ ...pay, pay_midtrans: v })} />
                                </div>
                                <p className={`mt-4 border-t border-slate-200 pt-4 dark:border-white/10 ${sub}`}>
                                    E-wallet, kartu, atau virtual account. Dibutuhkan untuk voting berbayar.
                                </p>
                            </div>

                            <div className={methodCard(pay.pay_manual)}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={iconClass(pay.pay_manual)}><Landmark className="h-5 w-5" /></div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-extrabold">Transfer manual</h4>
                                                {badge(pay.pay_manual)}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Transfer ke rekening, dikonfirmasi admin</div>
                                        </div>
                                    </div>
                                    <Toggle on={pay.pay_manual} label="Transfer manual" onChange={(v) => setPay({ ...pay, pay_manual: v })} />
                                </div>

                                {pay.pay_manual ? (
                                    <div className="mt-4 space-y-3 border-t border-indigo-200/70 pt-4 dark:border-white/10">
                                        <Field label="Nama bank" placeholder="Contoh: BCA" value={rek.bank_name}
                                            onChange={(v) => setRek({ ...rek, bank_name: v })} error={errors?.bank_name} />
                                        <Field label="Nomor rekening" placeholder="Contoh: 1234567890" inputMode="numeric" value={rek.bank_account_number}
                                            onChange={(v) => setRek({ ...rek, bank_account_number: v })} error={errors?.bank_account_number} />
                                        <Field label="Atas nama" placeholder="Nama pemilik rekening" value={rek.bank_account_holder}
                                            onChange={(v) => setRek({ ...rek, bank_account_holder: v })} error={errors?.bank_account_holder} />
                                    </div>
                                ) : (
                                    <p className={`mt-4 border-t border-slate-200 pt-4 dark:border-white/10 ${sub}`}>
                                        Aktifkan untuk mengisi nama bank dan nomor rekening tujuan.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div
                            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                                votingNow
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                            }`}
                        >
                            {votingNow ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                            <div>
                                <span className="font-semibold">Voting berbayar: {votingNow ? 'terbuka' : 'berhenti sementara'}.</span>{' '}
                                {votingNow
                                    ? 'Midtrans aktif, jadi pembelian vote bisa dikonfirmasi otomatis.'
                                    : 'Hanya transfer manual yang aktif, sedangkan voting butuh konfirmasi otomatis.'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={panel}>
                    <div className={panelHead}>
                        <h3 className="text-base font-extrabold">Biaya Layanan</h3>
                        <p className={sub}>Persentase yang ditambahkan ke harga tiket dan voting. Order lama tidak berubah saat angka ini diganti.</p>
                    </div>
                    <div className="p-5">
                        <div className="max-w-xs">
                            <Field label="Biaya layanan (%)" placeholder="10" value={fee} onChange={setFee} error={errors?.service_fee_percent} />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
