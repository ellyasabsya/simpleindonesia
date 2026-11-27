import { ClipboardList, Receipt } from 'lucide-react';
import type { ReactNode } from 'react';

const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID');

type Props = {
    fee: number | null | undefined;
    isTeam?: boolean;
    className?: string;
    children?: ReactNode;
};

export default function RegistrationInfoCard({ fee, isTeam = false, className = '', children }: Props) {
    const paid = !!fee && fee > 0;
    const Icon = paid ? Receipt : ClipboardList;

    return (
        <div className={`${className} flex items-start gap-5 p-6`}>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                <Icon className="size-6" strokeWidth={2} />
            </div>
            <div>
                <h2 className="text-xl font-bold">
                    {paid ? 'Pendaftaran lewat formulir dan bukti transfer' : 'Pendaftaran lewat formulir'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    {paid
                        ? `${isTeam ? 'Tim' : 'Peserta'} mengisi formulir dan mengunggah bukti transfer ${rupiah(fee!)}${isTeam ? ' per tim' : ''}. Anda yang memverifikasinya.`
                        : `${isTeam ? 'Tim' : 'Peserta'} cukup mengisi formulir, tanpa biaya.`}
                </p>
                {children}
            </div>
        </div>
    );
}
