import Section, { Placeholder } from './section';

export default function NewsSection() {
    return (
        <Section
            id="berita"
            title="Berita"
            description="Kabar terbaru seputar event dan kegiatan di SIMPLE."
            href="/news"
            linkLabel="Lihat Semua Berita"
        >
            <Placeholder label="Daftar berita akan ditempatkan di sini" />
        </Section>
    );
}
