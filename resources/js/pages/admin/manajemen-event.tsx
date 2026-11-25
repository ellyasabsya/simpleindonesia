import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import ManajemenEventMobile from '@/components/mobile/pages/manajemen-event-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import ManajemenEventWeb from '@/components/admin/pages/manajemen-event-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function ManajemenEvent(props: ComponentProps<typeof ManajemenEventWeb>) {
    const { events, filters, counts, categories } = props;
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Manajemen Event">
                <ManajemenEventMobile events={events} filters={filters} counts={counts} categories={categories} />
            </AdminLayout>
        );
    }

    return <ManajemenEventWeb {...props} />;
}
