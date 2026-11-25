import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import PaketWeb from '@/components/admin/pages/paket-web';
import PaketMobile from '@/components/mobile/pages/paket-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function Paket(props: ComponentProps<typeof PaketWeb>) {
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Manajemen Paket">
                <PaketMobile {...props} />
            </AdminLayout>
        );
    }

    return <PaketWeb {...props} />;
}
