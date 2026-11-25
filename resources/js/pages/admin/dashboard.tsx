import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import AdminDashboardMobile from '@/components/mobile/pages/admin-dashboard-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import AdminDashboardWeb from '@/components/admin/pages/dashboard-web';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function AdminDashboard(props: ComponentProps<typeof AdminDashboardWeb>) {
    const { pending, platform } = props;
    const total = pending.reduce((sum, p) => sum + Number(p.value), 0);
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Admin Panel">
                <AdminDashboardMobile pending={pending} platform={platform} total={total} />
            </AdminLayout>
        );
    }

    return <AdminDashboardWeb {...props} />;
}
