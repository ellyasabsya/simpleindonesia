import fs from 'node:fs';

const mob = 'resources/js/components/mobile/pages/event-detail-mobile.tsx';
const page = 'resources/js/pages/event-detail.tsx';
for (const f of [mob, page]) {
    if (!fs.existsSync(f)) {
        console.error('Tidak ditemukan: ' + f);
        process.exit(1);
    }
}
const fail = (m) => {
    console.error(m + ' - tidak ada yang diubah.');
    process.exit(1);
};

/* ---------- 1. Komponen HP: hero penuh + bilah aksi bawah ---------- */
let m = fs.readFileSync(mob, 'utf8');
if (!m.includes('data-detail-hero')) {
    const before = m.match(/^(?:export default )?function \w+/gm) ?? [];
    const lenBefore = m.length;
    const iMain = m.indexOf('export default function EventDetailMobile');
    if (iMain < 0) fail('Komponen utama EventDetailMobile tidak ditemukan');
    const rootOpen = '    return (\n        <div className="space-y-5">\n';
    const iRoot = m.indexOf(rootOpen, iMain);
    const iParent = m.indexOf('            {event.parent && (', iMain);
    const iPoster = m.indexOf('            <div className="mx-auto w-full max-w-[260px]', iMain);
    const iSummary = m.indexOf('            <Section>\n                {event.starts_at && (', iMain);
    const iChips = m.indexOf('            <Chips<Tab>', iMain);
    const tailOld = '            <CommentsMobile event={event} />\n        </div>\n    );\n}';
    const iTail = m.lastIndexOf(tailOld);
    if ([iRoot, iParent, iPoster, iSummary, iChips, iTail].some((i) => i < 0) || !(iParent < iPoster && iPoster < iSummary && iSummary < iChips)) {
        fail('Struktur event-detail-mobile.tsx tidak cocok');
    }

    const head = `    const bg = ios ? 'bg-[#f2f2f7] dark:bg-black' : 'bg-[#f4f6fb] dark:bg-[#0b1020]';
    const circle = 'flex size-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-transform active:scale-90';

    return (
        <div className={'min-h-dvh text-slate-900 dark:text-white ' + bg}>
            <div data-detail-hero className="relative h-[52dvh] min-h-[340px] w-full overflow-hidden bg-neutral-300 dark:bg-neutral-800">
                {event.poster ? (
                    <img src={event.poster} alt={event.title} className="absolute inset-0 size-full object-cover object-top" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
                        <span className="text-7xl font-black text-white/90">{initials(event.title)}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
                    <Link href="/events" aria-label="Kembali" className={circle}>
                        <ChevronLeft className="size-6" />
                    </Link>
                    <button type="button" onClick={share} aria-label="Bagikan" className={circle}>
                        {copied ? <Check className="size-5" /> : <Share2 className="size-5" />}
                    </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 px-4 pb-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                            <span className={'size-2 rounded-full ' + statusDot} />
                            {statusText}
                        </span>
                        {event.category && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{event.category}</span>}
                    </div>
                    <h1 className={'mt-3 text-[28px] leading-tight break-words text-white ' + (ios ? 'font-extrabold' : 'font-bold')}>{event.title}</h1>
                    {event.organizer && <p className="mt-1 text-sm text-white/80">oleh {event.organizer}</p>}
                    {event.starts_at && (
                        <p className="mt-1 text-sm font-medium text-white/90">
                            {shortDate(event.starts_at)}
                            {!single && event.ends_at ? ' – ' + shortDate(event.ends_at) : ''}
                        </p>
                    )}
                </div>
            </div>

            <div className={'relative -mt-6 space-y-5 rounded-t-[28px] px-4 pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))] ' + bg}>
`;
    const tail = `            <CommentsMobile event={event} />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/90 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/90">
                <div className="mx-auto flex max-w-md items-center gap-4">
                    <div className="min-w-0">
                        <p className={'text-[11px] ' + muted}>Biaya</p>
                        <p className="truncate text-lg leading-tight font-extrabold">{feeRange(event.registration_fee_min ?? event.registration_fee, event.registration_fee_max ?? event.registration_fee)}</p>
                    </div>
                    <div className="flex-1">
                        {event.status.key === 'selesai' ? (
                            <div className={'flex h-[50px] items-center justify-center gap-2 text-[15px] font-semibold ' + muted + ' ' + surface}>
                                <Ticket className="size-[18px]" />
                                Event Sudah Selesai
                            </div>
                        ) : (
                            <Button full icon={cta.Icon} onClick={go}>
                                {cta.label}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}`;

    m = m.slice(0, iRoot) + head + m.slice(iParent, iPoster) + m.slice(iSummary, iChips) + m.slice(iChips, iTail) + tail + m.slice(iTail + tailOld.length);
    m = m.replace('const { ios, muted, accent, surface } = useStyle();', 'const { ios, muted, surface } = useStyle();');
    const after = m.match(/^(?:export default )?function \w+/gm) ?? [];
    if (before.join('|') !== after.join('|') || m.length < lenBefore - 4000) {
        fail('Pemeriksaan keamanan gagal (fungsi hilang atau berkas menyusut terlalu banyak)');
    }
    fs.writeFileSync(mob, m);
}

/* ---------- 2. Halaman: di HP tampilkan komponen langsung, tanpa navbar web ---------- */
let p = fs.readFileSync(page, 'utf8');
if (!p.includes('usePhone')) {
    const impA = "import EventDetailMobile from '@/components/mobile/pages/event-detail-mobile';";
    const retA = '    return (\n        <>\n            <Head title={`${event.title} - SIMPLE`} />';
    if (!p.includes(impA) || !p.includes(retA)) fail('Pola event-detail.tsx tidak cocok');
    p = p.replace(impA, impA + "\nimport { usePhone } from '@/components/mobile/use-phone';");
    p = p.replace(
        retA,
        '    const phone = usePhone();\n    if (phone) {\n        return (\n            <>\n                <Head title={`${event.title} - SIMPLE`} />\n                <EventDetailMobile event={event} parts={parts} hasHadiah={hasHadiah} cta={cta} statusText={st.text(event.status.label)} statusDot={st.dot} share={share} copied={copied} />\n            </>\n        );\n    }\n\n' + retA,
    );
    p = p.replace(/\s*<div className="px-4 pt-24 pb-32 md:hidden">[\s\S]*?<\/div>\n/, '\n');
    fs.writeFileSync(page, p);
}
console.log('OK: detail event native (hero penuh + bilah aksi bawah).');
