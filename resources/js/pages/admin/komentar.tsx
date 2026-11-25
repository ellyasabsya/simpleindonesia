import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import KomentarWeb from '@/components/admin/pages/komentar-web';
import KomentarMobile from '@/components/mobile/pages/komentar-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function Komentar(props: ComponentProps<typeof KomentarWeb>) {
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Moderasi Komentar">
                <KomentarMobile {...props} />
            </AdminLayout>
        );
    }

    return <KomentarWeb {...props} />;
}
