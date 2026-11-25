// Mengelompokkan menu event. Kunci menu diambil dari ujung alamat (mis. /panel/event/5/tiket -> "tiket").
// Tiket dan Check-in selalu berdampingan; Voting punya kelompok sendiri.
const GROUPS: { title: string | null; keys: string[] }[] = [
    { title: null, keys: ['dashboard', 'kalender', 'agenda'] },
    { title: 'Peserta', keys: ['registrasi', 'peserta'] },
    { title: 'Tiket & Check-in', keys: ['tiket', 'checkin', 'pengaturan-tiket', 'checkin-laporan'] },
    { title: 'Voting', keys: ['voting', 'pengaturan-voting', 'laporan-voting'] },
    { title: 'Lomba', keys: ['penilaian', 'juri-penilaian', 'hasil-lomba', 'publikasi', 'sertifikat'] },
    { title: 'Keuangan & Laporan', keys: ['transaksi', 'laporan', 'statistik'] },
];

const keyOf = (href: string): string => {
    const last = href.split('?')[0].replace(/\/+$/, '').split('/').pop() ?? '';
    return /^\d+$/.test(last) ? 'dashboard' : last;
};

export function groupEventItems<T extends { href: string }>(firstTitle: string, items: T[]): { title: string; items: T[] }[] {
    const used = new Set<T>();
    const out: { title: string; items: T[] }[] = GROUPS.map((g) => {
        const rank = (it: T) => g.keys.indexOf(keyOf(it.href));
        const mine = items.filter((it) => rank(it) >= 0).sort((a, b) => rank(a) - rank(b));
        mine.forEach((it) => used.add(it));
        return { title: g.title ?? firstTitle, items: mine };
    });
    const rest = items.filter((it) => !used.has(it));
    if (rest.length) out.push({ title: 'Lainnya', items: rest });
    return out.filter((g) => g.items.length > 0);
}
