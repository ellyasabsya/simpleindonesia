import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import SistemPenilaianWeb from '@/components/admin/pages/sistem-penilaian-web';
import SistemPenilaianMobile from '@/components/mobile/pages/sistem-penilaian-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function SistemPenilaian(props: ComponentProps<typeof SistemPenilaianWeb>) {
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Sistem Penilaian">
                <SistemPenilaianMobile {...props} />
            </AdminLayout>
        );
    }

    return <SistemPenilaianWeb {...props} />;
}
