import TicketShowcase from '@/components/landing/ticket-showcase';
import Section from './section';

export default function TicketSection() {
    return (
        <Section
            id="tiket"
            title="E-Ticketing"
            description="Kelola tiket event Anda dengan mudah, aman, dan tercetak otomatis."
            href="/tickets"
            linkLabel="Lihat Semua Tiket"
        >
            <TicketShowcase />
        </Section>
    );
}
