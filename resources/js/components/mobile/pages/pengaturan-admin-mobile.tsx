import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Landmark, Loader2, PauseCircle, Save, Zap } from 'lucide-react';
import { useState } from 'react';
import { CARD, MUTED } from '../kit/soft';

type PaySettings = { pay_midtrans: boolean; pay_manual: boolean };
type Bank = { bank_name: string; bank_account_number: string; bank_account_holder: string };
type Props = { settings: PaySettings; bank: Bank; fee_percent: number; admin_whatsapp: string };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={() => onChange(!on)}
            className={'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ' + (on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/20')}
        >
            <span className={'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ' + (on ? 'translate-x-7' : 'translate-x-1')} />
        </button>
    );
}

function Field({ label, value, onChange, error, placeholder, inputMode }: { label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; inputMode?: 'numeric' | 'text' | 'decimal' }) {
    return (
        <label className="block">
            <span className={'mb-1.5 block text-xs font-semibold ' + MUTED}>{label}</span>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                inputMode={inputMode}
                className={'h-11 w-full rounded-xl border bg-white px-3.5 text-base outline-none dark:bg-white/5 ' + (error ? 'border-rose-300 dark:border-rose-500/40' : 'border-slate-200 focus:border-indigo-400 dark:border-white/10')}
            />
            {error && <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span>}
        </label>
    );
}

const badge = (on: boolean) => (
    <span className={'rounded-full px-2 py-0.5 text-[11px] font-bold ' + (on ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>
        {on ? 'Aktif' : 'Nonaktif'}
    </span>
);

const iconBox = (on: boolean) => 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' + (on ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500');

export default function PengaturanAdminMobile({ settings, bank, fee_percent, admin_whatsapp }: Props) {
    const { errors } = usePage().props as { errors?: Record<string, string> };
    const [pay, setPay] = useState<PaySettings>(settings);
    const [rek, setRek] = useState<Bank>(bank);
    const [fee, setFee] = useState(String(fee_percent));
    const [wa, setWa] = useState(admin_whatsapp);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const dirty = JSON.stringify([pay, rek, fee, wa]) !== JSON.stringify([settings, bank, String(fee_percent), admin_whatsapp]);
    const votingNow = pay.pay_midtrans || !pay.pay_manual;

    const save = () => {
        router.patch(
            '/admin/pengaturan',
            { ...pay, ...rek, service_fee_percent: fee, admin_whatsapp: wa },
            {
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
            },
        );
    };

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Pengaturan Platform</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">Atur metode pembayaran, rekening tujuan transfer, dan biaya layanan.</p>
            </section>

            {errors?.pay_midtrans && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>{errors.pay_midtrans}</div>
                </div>
            )}

            <p className={'px-1 text-xs font-semibold ' + MUTED}>Metode pembayaran (minimal satu aktif)</p>

            <div className={'space-y-3 rounded-2xl p-3.5 ' + CARD}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={iconBox(pay.pay_midtrans)}><Zap className="h-5 w-5" /></div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="text-[15px] font-semibold">Midtrans</h4>
                                {badge(pay.pay_midtrans)}
                            </div>
                            <div className={'text-xs leading-snug ' + MUTED}>Online, konfirmasi otomatis</div>
                        </div>
                    </div>
                    <Toggle on={pay.pay_midtrans} label="Midtrans" onChange={(v) => setPay({ ...pay, pay_midtrans: v })} />
                </div>
                <p className={'border-t border-slate-900/[0.07] pt-3 text-xs leading-snug dark:border-white/10 ' + MUTED}>E-wallet, kartu, atau virtual account. Dibutuhkan untuk voting berbayar.</p>
            </div>

            <div className={'space-y-3 rounded-2xl p-3.5 ' + CARD}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={iconBox(pay.pay_manual)}><Landmark className="h-5 w-5" /></div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="text-[15px] font-semibold">Transfer manual</h4>
                                {badge(pay.pay_manual)}
                            </div>
                            <div className={'text-xs leading-snug ' + MUTED}>Dikonfirmasi admin</div>
                        </div>
                    </div>
                    <Toggle on={pay.pay_manual} label="Transfer manual" onChange={(v) => setPay({ ...pay, pay_manual: v })} />
                </div>
                {pay.pay_manual ? (
                    <div className="space-y-3 border-t border-slate-900/[0.07] pt-3 dark:border-white/10">
                        <Field label="Nama bank" placeholder="Contoh: BCA" value={rek.bank_name} onChange={(v) => setRek({ ...rek, bank_name: v })} error={errors?.bank_name} />
                        <Field label="Nomor rekening" placeholder="Contoh: 1234567890" inputMode="numeric" value={rek.bank_account_number} onChange={(v) => setRek({ ...rek, bank_account_number: v })} error={errors?.bank_account_number} />
                        <Field label="Atas nama" placeholder="Nama pemilik rekening" value={rek.bank_account_holder} onChange={(v) => setRek({ ...rek, bank_account_holder: v })} error={errors?.bank_account_holder} />
                    </div>
                ) : (
                    <p className={'border-t border-slate-900/[0.07] pt-3 text-xs leading-snug dark:border-white/10 ' + MUTED}>Aktifkan untuk mengisi nama bank dan nomor rekening tujuan.</p>
                )}
            </div>

            <div
                className={
                    'flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[13px] leading-snug ' +
                    (votingNow
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200')
                }
            >
                {votingNow ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <div>
                    <span className="font-semibold">Voting berbayar: {votingNow ? 'terbuka' : 'berhenti sementara'}.</span>{' '}
                    {votingNow ? 'Midtrans aktif, jadi pembelian vote bisa dikonfirmasi otomatis.' : 'Hanya transfer manual yang aktif, sedangkan voting butuh konfirmasi otomatis.'}
                </div>
            </div>

            <div className={'space-y-2 rounded-2xl p-3.5 ' + CARD}>
                <h3 className="text-[15px] font-semibold">Biaya Layanan</h3>
                <p className={'text-xs leading-snug ' + MUTED}>Persentase yang ditambahkan ke harga tiket dan voting. Order lama tidak berubah saat angka ini diganti.</p>
                <Field label="Biaya layanan (%)" placeholder="10" inputMode="decimal" value={fee} onChange={setFee} error={errors?.service_fee_percent} />
            </div>

            <div className={'space-y-2 rounded-2xl p-3.5 ' + CARD}>
                <h3 className="text-[15px] font-semibold">Kontak WhatsApp Admin</h3>
                <p className={'text-xs leading-snug ' + MUTED}>Nomor tujuan tombol chat &quot;Hubungi Admin&quot;. Boleh ditulis 0812... atau 62812...</p>
                <Field label="Nomor WhatsApp" placeholder="081234567890" inputMode="numeric" value={wa} onChange={setWa} error={errors?.admin_whatsapp} />
            </div>

            <div className="px-1 text-sm">
                {saving ? (
                    <span className={'inline-flex items-center gap-2 ' + MUTED}>
                        <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                    </span>
                ) : saved ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Tersimpan
                    </span>
                ) : (
                    <span className={'text-xs ' + MUTED}>{dirty ? 'Ada perubahan belum disimpan.' : 'Belum ada perubahan.'}</span>
                )}
            </div>

            <button type="button" onClick={save} disabled={!dirty || saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="h-4 w-4" /> Simpan
            </button>
        </div>
    );
}
