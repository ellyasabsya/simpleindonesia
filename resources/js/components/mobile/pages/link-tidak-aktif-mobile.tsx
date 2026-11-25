import { Link2Off } from 'lucide-react';
import EmptyState from '../kit/empty-state';
import { PAGE } from '../kit/soft';

/** Link panitia yang tidak bisa dipakai, HP: keadaan kosong di tengah layar, tanpa bar. */
export default function LinkTidakAktifMobile({ title, body }: { title: string; body: string }) {
    return (
        <div className={'flex min-h-screen items-center justify-center px-4 pb-24 ' + PAGE}>
            <EmptyState icon={Link2Off} title={title} text={body} />
        </div>
    );
}
