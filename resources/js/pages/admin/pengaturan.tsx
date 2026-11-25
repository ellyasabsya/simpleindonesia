import type { ComponentProps } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import PengaturanWeb from '@/components/admin/pages/pengaturan-web';
import PengaturanMobile from '@/components/mobile/pages/pengaturan-admin-mobile';
import { usePhone } from '@/components/mobile/use-phone';

/** Penyambung saja: memilih tampilan HP atau web. Ubah isi di file masing-masing. */
export default function Pengaturan(props: ComponentProps<typeof PengaturanWeb>) {
    const phone = usePhone();

    if (phone) {
        return (
            <AdminLayout title="Pengaturan">
                <PengaturanMobile settings={props.settings} bank={props.bank} fee_percent={props.fee_percent} admin_whatsapp={props.admin_whatsapp} />
            </AdminLayout>
        );
    }

    return <PengaturanWeb {...props} />;
}
