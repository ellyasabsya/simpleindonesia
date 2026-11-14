import Section, { Placeholder } from './section';

export default function PackageSection() {
    return (
        <Section
            id="paket"
            title="Pilih Paket, Buat Event Anda Bersinar"
            description="Pilih paket untuk event Anda. Biaya layanan transaksi tiket dan voting berlaku untuk semua paket dan terpisah dari harga paket."
        >
            <Placeholder label="Kartu paket (Iklan, Ticketing, Voting) akan ditempatkan di sini" />
        </Section>
    );
}
