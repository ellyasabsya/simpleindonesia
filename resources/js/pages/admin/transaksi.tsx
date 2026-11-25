import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import TransaksiAdminMobile from '@/components/mobile/pages/transaksi-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import TransaksiWeb from '@/components/admin/pages/transaksi-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function Transaksi(props: ComponentProps<typeof TransaksiWeb>) {
    const { rows, summary, filters, pg } = props;
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Transaksi">
                <TransaksiAdminMobile rows={rows} summary={summary} filters={filters} pg={pg} />
            </AdminLayout>
        );
    }

    return <TransaksiWeb {...props} />;
}
