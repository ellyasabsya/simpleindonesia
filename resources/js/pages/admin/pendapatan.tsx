import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import PendapatanAdminMobile from '@/components/mobile/pages/pendapatan-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import PendapatanWeb from '@/components/admin/pages/pendapatan-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function Pendapatan(props: ComponentProps<typeof PendapatanWeb>) {
    const { tab, status, q, withdrawals, counts, summary, balances, pg } = props;
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Pendapatan">
                <PendapatanAdminMobile tab={tab} status={status} q={q} withdrawals={withdrawals} counts={counts} summary={summary} balances={balances} pg={pg} />
            </AdminLayout>
        );
    }

    return <PendapatanWeb {...props} />;
}
