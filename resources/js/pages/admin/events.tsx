import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import ReviewEventMobile from '@/components/mobile/pages/review-event-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import AdminEventsWeb from '@/components/admin/pages/events-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function AdminEvents(props: ComponentProps<typeof AdminEventsWeb>) {
    const { events, filters, counts, base, pageTitle } = props;
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title={pageTitle}>
                <ReviewEventMobile events={events} filters={filters} counts={counts} base={base} pageTitle={pageTitle} />
            </AdminLayout>
        );
    }

    return <AdminEventsWeb {...props} />;
}
