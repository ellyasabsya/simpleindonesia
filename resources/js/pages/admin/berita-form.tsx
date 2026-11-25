import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import BeritaFormWeb from '@/components/admin/pages/berita-form-web';
import BeritaFormMobile from '@/components/mobile/pages/berita-form-mobile';
import { usePhone } from '@/components/mobile/use-phone';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function BeritaForm(props: ComponentProps<typeof BeritaFormWeb>) {
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Berita">
                <BeritaFormMobile {...props} />
            </AdminLayout>
        );
    }

    return <BeritaFormWeb {...props} />;
}
