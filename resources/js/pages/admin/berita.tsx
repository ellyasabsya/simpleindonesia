import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import BeritaWeb from '@/components/admin/pages/berita-web';
import BeritaMobile from '@/components/mobile/pages/berita-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function Berita(props: ComponentProps<typeof BeritaWeb>) {
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Berita">
                <BeritaMobile {...props} />
            </AdminLayout>
        );
    }

    return <BeritaWeb {...props} />;
}
