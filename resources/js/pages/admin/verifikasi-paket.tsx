import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import VerifikasiPaketMobile from '@/components/mobile/pages/verifikasi-paket-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import VerifikasiPaketWeb from '@/components/admin/pages/verifikasi-paket-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function VerifikasiPaket(props: ComponentProps<typeof VerifikasiPaketWeb>) {
    const { orders, status, q, counts, pg, manual_on } = props;
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Verifikasi Paket">
                <VerifikasiPaketMobile orders={orders} status={status} q={q} counts={counts} pg={pg} manual_on={manual_on} />
            </AdminLayout>
        );
    }

    return <VerifikasiPaketWeb {...props} />;
}
