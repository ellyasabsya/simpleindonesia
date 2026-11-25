import AdminLayout from '@/components/admin/admin-layout';
import EditEventWeb, { type Props } from '@/components/admin/pages/edit-event-web';
import EditEventMobile from '@/components/mobile/pages/edit-event-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function EditEvent(props: Props) {
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Edit Event">
                <EditEventMobile {...props} />
            </AdminLayout>
        );
    }

    return <EditEventWeb {...props} />;
}
