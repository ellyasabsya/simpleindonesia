import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import PesananTiketAdminMobile from '@/components/mobile/pages/pesanan-tiket-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import PesananTiketWeb from '@/components/admin/pages/pesanan-tiket-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function PesananTiket(props: ComponentProps<typeof PesananTiketWeb>) {
    const { orders, status, q, counts, pg } = props;
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Verifikasi Tiket">
                <PesananTiketAdminMobile orders={orders} status={status} q={q} counts={counts} pg={pg} />
            </AdminLayout>
        );
    }

    return <PesananTiketWeb {...props} />;
}
