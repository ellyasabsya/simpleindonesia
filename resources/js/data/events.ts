export type LandingEvent = {
    title: string;
    category: string;
    location: string;
    date: string;
    poster: string;
};

// Poster rasio 4:5. Nanti data ini diganti dari database.
export const events: LandingEvent[] = [
    {
        title: 'Batam Bernyanyi 2026',
        category: 'Perlombaan',
        location: 'Ballroom Hotel Pacific',
        date: '13 – 14 Nov 2026',
        poster: '/images/events/batam-bernyanyi.jpg',
    },
    {
        title: 'Seminar Kebangsaan 2026',
        category: 'Seminar',
        location: 'Ballroom Hotel Planet',
        date: '15 – 17 Nov 2026',
        poster: '/images/events/seminar-kebangsaan.jpg',
    },
    {
        title: 'Batam Bergembira 2026',
        category: 'Festival',
        location: 'Lap. Engku Putri Kota Batam',
        date: '29 – 30 Nov 2026',
        poster: '/images/events/batam-bergembira.jpg',
    },
];
