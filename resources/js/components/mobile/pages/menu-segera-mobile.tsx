import { Hourglass } from 'lucide-react';
import EmptyState from '../kit/empty-state';

/** Halaman menu event yang belum dibuat, versi HP: keadaan kosong dengan judul menu. */
export default function MenuSegeraMobile({ label }: { label: string }) {
    return (
        <div className="pb-24">
            <EmptyState icon={Hourglass} title={label} text="Segera hadir. Halaman ini kita isi di tahap berikutnya." />
        </div>
    );
}
