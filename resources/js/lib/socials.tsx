export const socialList = [
    { key: 'instagram', label: 'Instagram', color: 'bg-fuchsia-500', ph: 'username', url: (v: string) => `https://instagram.com/${encodeURIComponent(v)}` },
    { key: 'facebook', label: 'Facebook', color: 'bg-blue-600', ph: 'username atau nama halaman', url: (v: string) => `https://facebook.com/${encodeURIComponent(v)}` },
    { key: 'tiktok', label: 'TikTok', color: 'bg-slate-800', ph: 'username', url: (v: string) => `https://tiktok.com/@${encodeURIComponent(v)}` },
    { key: 'youtube', label: 'YouTube', color: 'bg-red-500', ph: 'nama channel', url: (v: string) => `https://youtube.com/@${encodeURIComponent(v)}` },
    { key: 'x', label: 'X', color: 'bg-neutral-900', ph: 'username', url: (v: string) => `https://x.com/${encodeURIComponent(v)}` },
    { key: 'linkedin', label: 'LinkedIn', color: 'bg-sky-700', ph: 'nama di URL profil', url: (v: string) => `https://linkedin.com/in/${encodeURIComponent(v)}` },
    { key: 'website', label: 'Website', color: 'bg-emerald-500', ph: 'contoh.com', url: (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`) },
];

export function SocialChips({ socials }: { socials?: Record<string, string> | null }) {
    const items = socialList
        .filter((p) => socials?.[p.key]?.trim())
        .map((p) => {
            const value = socials![p.key].trim().replace(/^@/, '');
            return { ...p, value, href: p.url(value) };
        });
    return (
        <>
            {items.map((i) => (
                <a key={i.key} href={i.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20">
                    <span className={`h-2 w-2 rounded-full ${i.color}`} />
                    {i.label}
                    <span className="max-w-[10rem] truncate font-normal text-slate-500 dark:text-slate-400">{i.value}</span>
                </a>
            ))}
        </>
    );
}
