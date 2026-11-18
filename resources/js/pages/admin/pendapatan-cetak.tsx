import { useEffect } from 'react';

type W = { id: number; institution: string; event: string; amount: number; bank_name: string; account_number: string; account_name: string; status: string; requested_at: string };
type Bal = { id: number; title: string; institution: string; subtotal: number; share: number; entitlement: number; transferred: number; processing: number; available: number };
type Summary = { total_paid: number; fee: number; share: number; package: number; platform: number; entitlement: number; transferred: number; processing: number; available: number };

const rp = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

export default function PendapatanCetak({ summary, balances, withdrawals, printed_at }: { summary: Summary; balances: Bal[]; withdrawals: W[]; printed_at: string }) {
    useEffect(() => {
        const t = setTimeout(() => window.print(), 500);
        return () => clearTimeout(t);
    }, []);

    const cell = 'border border-slate-300 px-2 py-1.5 text-left align-top';
    const num = 'border border-slate-300 px-2 py-1.5 text-right align-top';

    return (
        <div className="mx-auto max-w-5xl bg-white p-8 text-sm text-slate-900">
            <h1 className="text-xl font-extrabold">Laporan Pendapatan & Penarikan</h1>
            <p className="text-xs text-slate-500">Dicetak {printed_at}</p>

            <table className="mt-5 w-full border-collapse text-xs">
                <tbody>
                    {[
                        ['Total dibayar pembeli (tiket lunas)', summary.total_paid],
                        ['Biaya layanan', summary.fee],
                        ['Bagi hasil paket', summary.share],
                        ['Pembayaran paket', summary.package],
                        ['Total pendapatan platform', summary.platform],
                        ['Hak penyelenggara', summary.entitlement],
                        ['Sudah ditarik', summary.transferred],
                        ['Dalam proses', summary.processing],
                        ['Saldo tersedia', summary.available],
                    ].map(([l, v]) => (
                        <tr key={l as string}><td className={cell}>{l}</td><td className={num}>{rp(v as number)}</td></tr>
                    ))}
                </tbody>
            </table>

            <h2 className="mt-6 font-bold">Saldo per event</h2>
            <table className="mt-2 w-full border-collapse text-xs">
                <thead><tr className="bg-slate-100">
                    <th className={cell}>Event</th><th className={cell}>Lembaga</th><th className={num}>Penjualan</th><th className={num}>Bagi hasil</th>
                    <th className={num}>Hak</th><th className={num}>Ditarik</th><th className={num}>Proses</th><th className={num}>Saldo</th>
                </tr></thead>
                <tbody>
                    {balances.map((b) => (
                        <tr key={b.id}>
                            <td className={cell}>{b.title}</td><td className={cell}>{b.institution}</td><td className={num}>{rp(b.subtotal)}</td><td className={num}>{rp(b.share)}</td>
                            <td className={num}>{rp(b.entitlement)}</td><td className={num}>{rp(b.transferred)}</td><td className={num}>{rp(b.processing)}</td><td className={num}>{rp(b.available)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2 className="mt-6 font-bold">Permintaan penarikan</h2>
            <table className="mt-2 w-full border-collapse text-xs">
                <thead><tr className="bg-slate-100">
                    <th className={cell}>Tanggal</th><th className={cell}>Lembaga</th><th className={cell}>Event</th><th className={cell}>Rekening</th><th className={num}>Nominal</th><th className={cell}>Status</th>
                </tr></thead>
                <tbody>
                    {withdrawals.map((w) => (
                        <tr key={w.id}>
                            <td className={cell}>{w.requested_at}</td><td className={cell}>{w.institution}</td><td className={cell}>{w.event}</td>
                            <td className={cell}>{w.bank_name} {w.account_number} a.n. {w.account_name}</td><td className={num}>{rp(w.amount)}</td><td className={cell}>{w.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
