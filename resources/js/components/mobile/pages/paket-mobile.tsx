import type { PackageCard } from '@/components/landing/package-card';
import { PackagePanel } from '../home/panels';
import { MUTED } from '../kit/soft';
import PublicScreen from '../public/public-screen';

/** Semua paket untuk HP: daftar yang bisa dibuka satu per satu, sama dengan panel Paket di beranda. */
export default function PaketMobile({ packages }: { packages: PackageCard[] }) {
    return (
        <PublicScreen title="Semua Paket" back="/">
            <p className={'px-1 text-[13px] leading-relaxed ' + MUTED}>
                Bandingkan pilihan paket untuk event Anda, mulai dari tampil di beranda, ticketing, voting, sampai operasional lengkap.
            </p>
            <PackagePanel packages={packages} all />
        </PublicScreen>
    );
}
