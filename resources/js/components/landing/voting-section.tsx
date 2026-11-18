import { usePage } from '@inertiajs/react';
import { Card, type EventCard } from './event-section';
import Section, { Placeholder } from './section';

export default function VotingSection() {
    const { votings = [] } = usePage<{ votings?: EventCard[] }>().props;

    return (
        <Section
            id="voting"
            title="E-Voting"
            description="Dukung peserta favoritmu lewat voting online yang transparan dan real-time."
            href="/voting"
            linkLabel="Lihat Semua Voting"
        >
            {votings.length === 0 ? (
                <Placeholder label="Belum ada voting yang dibuka" />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {votings.slice(0, 4).map((v) => (
                        <Card key={v.id} event={v} />
                    ))}
                </div>
            )}
        </Section>
    );
}
