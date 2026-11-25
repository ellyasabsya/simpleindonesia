import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import LembagaAdminMobile from '@/components/mobile/pages/lembaga-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import AdminLembagaWeb from '@/components/admin/pages/lembaga-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function AdminLembaga(props: ComponentProps<typeof AdminLembagaWeb>) {
    const { institutions, filters, counts } = props;
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Admin Panel">
                <LembagaAdminMobile institutions={institutions} filters={filters} counts={counts} />
            </AdminLayout>
        );
    }

    return <AdminLembagaWeb {...props} />;
}
