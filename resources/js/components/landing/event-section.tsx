import Section, { Placeholder } from './section';

export default function EventSection() {
    return (
        <Section
            id="event"
            title="Event Terbaru"
            description="Temukan event menarik dan daftarkan diri Anda sekarang."
            href="/events"
            linkLabel="Lihat Semua Event"
        >
            <Placeholder label="Kartu event akan ditempatkan di sini" />
        </Section>
    );
}
