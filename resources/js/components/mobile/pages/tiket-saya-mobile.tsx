import { Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import EmptyState from '../kit/empty-state';
import { Row, Section } from '../kit/section';

type Tk = { code: string; holder_name: string; checked_in: boolean };
type O = { code: string; event_title: string; location: string | null; date: string; tickets: Tk[] };

/** Tiket saya untuk HP: satu kelompok per pesanan, satu baris per tiket dengan QR kecil. */
export default function TiketSayaMobile({ orders }: { orders: O[] }) {
    if (orders.length === 0) {
        return <EmptyState icon={Ticket} title="Belum ada tiket" text="Tiket muncul di sini setelah pembayaran disetujui." />;
    }

    return (
        <div className="space-y-6 pb-4">
            {orders.map((o) => (
                <Section key={o.code} title={o.event_title} footer={`${o.code} · ${o.date} · ${o.location ?? '-'}`}>
                    {o.tickets.map((t) => (
                        <Row
                            key={t.code}
                            leading={
                                <span className="shrink-0 rounded-lg bg-white p-1 ring-1 ring-black/10">
                                    <QRCodeSVG value={t.code} size={40} />
                                </span>
                            }
                            label={t.holder_name}
                            sub={t.checked_in ? 'Sudah check-in' : 'Ketuk untuk membuka tiket'}
                            href={`/tiket/${t.code}`}
                            external
                        />
                    ))}
                </Section>
            ))}
        </div>
    );
}
