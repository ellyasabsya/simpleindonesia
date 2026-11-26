import { Head } from '@inertiajs/react';
import { CalendarDays, Check, Clock, Copy, ExternalLink, MapPin, Megaphone, Pin, Printer, Share2, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Item = { date: string; start_time: string; end_time: string | null; title: string; kind: string; pic: string | null; location: string | null; notes: string | null; details?: { time: string | null; title: string; pic: string | null; notes: string | null }[] };
type Ann = { id: number; title: string; body: string; category: string; pinned: boolean; updated_label: string };
type Props = { event: { title: string; starts_at: string; ends_at: string; location: string | null }; rundown: Item[]; rundownUpdated: string | null; announcements: Ann[] };

type Tab = 'rundown' | 'susunan' | 'pengumuman';
const CATS: Record<string, { label: string; chip: string; box: string }> = {
    info: { label: 'Info', chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200', box: '' },
    penting: { label: 'Penting', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200', box: 'ring-rose-200 bg-rose-50/60 dark:bg-rose-500/10 dark:ring-rose-500/30' },
    perubahan: { label: 'Perubahan jadwal', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200', box: 'ring-amber-200 bg-amber-50/60 dark:bg-amber-500/10 dark:ring-amber-500/30' },
    pembayaran: { label: 'Pembayaran', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200', box: '' },
    logistik: { label: 'Logistik', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200', box: '' },
};
const KINDS: Record<string, { label: string; bar: string; chip: string }> = {
    pembukaan: { label: 'Pembukaan', bar: 'bg-blue-500', chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200' },
    sesi: { label: 'Sesi', bar: 'bg-indigo-500', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200' },
    lomba: { label: 'Lomba', bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' },
    istirahat: { label: 'Istirahat', bar: 'bg-amber-400', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200' },
    penutupan: { label: 'Penutupan', bar: 'bg-violet-500', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200' },
    lainnya: { label: 'Lainnya', bar: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
};

const D = (s: string) => new Date(`${s}T00:00:00`);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const longDate = (s: string) => D(s).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (s: string) => D(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const dayName = (s: string) => D(s).toLocaleDateString('id-ID', { weekday: 'short' });
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const diffDays = (a: string, b: string) => Math.round((D(a).getTime() - D(b).getTime()) / 864e5);

export default function InfoEvent({ event, rundown, rundownUpdated, announcements }: Props) {
    const [now, setNow] = useState<Date | null>(null);
    const [copied, setCopied] = useState(false);
    const [tab, setTab] = useState<Tab | null>(null);

    useEffect(() => {
        setNow(new Date());
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const sorted = useMemo(() => [...rundown].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)), [rundown]);
    const days = useMemo(() => [...new Set(sorted.map((r) => r.date))], [sorted]);
    const [picked, setPicked] = useState<string | null>(null);
    const today = now ? iso(now) : null;
    const nowMin = now ? now.getHours() * 60 + now.getMinutes() : null;
    const active = picked ?? (today && days.includes(today) ? today : days[0]);
    const tabs = ([
        { k: 'rundown', label: 'Rundown kegiatan', n: sorted.length },
        { k: 'susunan', label: 'Susunan acara', n: sorted.filter((r) => (r.details ?? []).length > 0).length },
        { k: 'pengumuman', label: 'Pengumuman', n: announcements.length },
    ] as { k: Tab; label: string; n: number }[]).filter((t) => t.n > 0);
    const curTab: Tab | undefined = tabs.some((t) => t.k === tab) ? (tab as Tab) : tabs[0]?.k;

    const range = event.starts_at === event.ends_at ? longDate(event.starts_at) : `${shortDate(event.starts_at)} – ${longDate(event.ends_at)}`;
    const status = (() => {
        if (!today) return null;
        if (today < event.starts_at) { const n = diffDays(event.starts_at, today); return { label: n === 1 ? 'Besok' : `${n} hari lagi`, cls: 'bg-amber-300 text-amber-950' }; }
        if (today > event.ends_at) return { label: 'Sudah selesai', cls: 'bg-white/25 text-white' };
        return { label: 'Sedang berlangsung', cls: 'bg-emerald-300 text-emerald-950' };
    })();
    const mapUrl = event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : null;
    const first = sorted[0], last = sorted[sorted.length - 1];
    const span = first ? `${first.start_time} – ${[...sorted].sort((a, b) => toMin(b.end_time ?? b.start_time) - toMin(a.end_time ?? a.start_time))[0].end_time ?? last.start_time}` : null;

    const text = () => {
        const out: string[] = [`*RUNDOWN ${event.title.toUpperCase()}*`];
        if (event.location) out.push(`Lokasi: ${event.location}`);
        days.forEach((d) => {
            out.push('', `*${longDate(d)}*`);
            sorted.filter((r) => r.date === d).forEach((r) => out.push(`${r.start_time.replace(':', '.')}${r.end_time ? ` - ${r.end_time.replace(':', '.')}` : ''} | ${r.title}${r.location ? ` (${r.location})` : ''}${r.pic ? ` - PIC: ${r.pic}` : ''}`));
        });
        return out.join('\n');
    };
    const copy = async () => { try { await navigator.clipboard.writeText(text()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* abaikan */ } };
    const share = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${event.title}\n${window.location.href}`)}`, '_blank');

    const btn = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition print:hidden';
    const card = 'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
            <Head title={`Info ${event.title}`}><meta name="robots" content="noindex" /></Head>

            <header className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-4 pt-8 pb-16 sm:px-6 lg:px-8 text-white print:bg-none print:pb-4 print:text-black">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold tracking-[0.25em] text-white/70 uppercase print:text-slate-500">Informasi peserta</span>
                        {status && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.cls} print:hidden`}>{status.label}</span>}
                    </div>
                    <h1 className="mt-2 text-3xl leading-tight font-extrabold sm:text-4xl">{event.title}</h1>
                    <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                        <button type="button" onClick={share} className={`${btn} bg-emerald-500 text-white hover:bg-emerald-400`}><Share2 className="h-4 w-4" />Bagikan WhatsApp</button>
                        {sorted.length > 0 && <button type="button" onClick={copy} className={`${btn} bg-white/15 text-white hover:bg-white/25`}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Tersalin' : 'Salin rundown'}</button>}
                        <button type="button" onClick={() => window.print()} className={`${btn} bg-white/15 text-white hover:bg-white/25`}><Printer className="h-4 w-4" />Cetak</button>
                    </div>
                </div>
            </header>

            <main className="mx-auto -mt-10 max-w-7xl space-y-6 px-4 pb-16 sm:px-6 lg:px-8 print:mt-0">
                <section className={`${card} grid gap-px overflow-hidden bg-slate-200 p-0 sm:grid-cols-3 dark:bg-white/10`}>
                    <div className="flex items-start gap-3 bg-white p-4 dark:bg-slate-900">
                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                        <div className="min-w-0"><div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Tanggal</div><div className="text-sm font-extrabold">{range}</div></div>
                    </div>
                    <div className="flex items-start gap-3 bg-white p-4 dark:bg-slate-900">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Lokasi</div>
                            <div className="text-sm font-extrabold">{event.location ?? 'Akan diumumkan'}</div>
                            {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 print:hidden">Buka peta<ExternalLink className="h-3 w-3" /></a>}
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white p-4 dark:bg-slate-900">
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <div className="min-w-0"><div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Acara</div><div className="text-sm font-extrabold">{sorted.length ? `${sorted.length} sesi` : 'Belum tersusun'}</div>{span && days.length === 1 && <div className="text-xs text-slate-500">{span}</div>}</div>
                    </div>
                </section>

                {tabs.length > 1 && (
                    <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 print:hidden dark:bg-slate-900 dark:ring-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {tabs.map((t) => (
                            <button key={t.k} type="button" onClick={() => setTab(t.k)} className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${curTab === t.k ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`}>
                                {t.label}
                                <span className={`rounded-full px-1.5 text-[11px] ${curTab === t.k ? 'bg-white/25' : 'bg-slate-200 dark:bg-white/10'}`}>{t.n}</span>
                            </button>
                        ))}
                    </nav>
                )}

                {announcements.length > 0 && (
                    <section className={`space-y-3 ${curTab === 'pengumuman' ? '' : 'hidden print:block'}`}>
                        <h2 className="flex items-center gap-2 px-1 text-sm font-extrabold tracking-widest text-slate-500 uppercase"><Megaphone className="h-4 w-4" />Pengumuman</h2>
                        {announcements.map((a) => (
                            <article key={a.id} className={`${card} p-5 ${CATS[a.category]?.box ? `ring-2 ${CATS[a.category].box}` : ''}`}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${CATS[a.category]?.chip}`}>{CATS[a.category]?.label}</span>
                                    {a.pinned && <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600"><Pin className="h-3.5 w-3.5" />Disematkan</span>}
                                    <span className="ml-auto text-xs text-slate-500">{a.updated_label}</span>
                                </div>
                                <h3 className="mt-2 text-lg font-extrabold">{a.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">{a.body}</p>
                            </article>
                        ))}
                    </section>
                )}

                {sorted.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="hidden px-1 text-sm font-extrabold tracking-widest text-slate-500 uppercase print:block">Rundown kegiatan</h2>

                        <style>{`@media print { .rd-day + .rd-day { break-before: page; } .rd-table tr { break-inside: avoid; } @page { margin: 14mm; } }`}</style>

                        {days.length > 1 && (
                            <div className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 print:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${curTab === 'rundown' ? '' : 'hidden'}`}>
                                {days.map((d, i) => (
                                    <button key={d} type="button" onClick={() => setPicked(d)} className={`shrink-0 rounded-2xl px-4 py-2 text-left transition ${active === d ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10'}`}>
                                        <div className="text-[11px] font-bold uppercase opacity-80">Hari {i + 1}{today === d ? ' · hari ini' : ''}</div>
                                        <div className="text-sm font-extrabold">{dayName(d)}, {shortDate(d)}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {(() => {
                            const hasLoc = sorted.some((r) => r.location);
                            const hasPic = sorted.some((r) => r.pic);
                            const th = 'px-3 py-2.5';
                            return days.map((d, di) => {
                                const rows = sorted.filter((r) => r.date === d);
                                return (
                                    <div key={d} className={`rd-day ${curTab === 'rundown' && active === d ? 'block' : 'hidden'} print:block`}>
                                        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1 px-1">
                                            <div className="text-base font-extrabold">{days.length > 1 ? `Hari ${di + 1} · ` : ''}{longDate(d)}</div>
                                            <div className="text-xs text-slate-500">{rows.length} sesi</div>
                                        </div>
                                        <div className={`${card} overflow-hidden print:shadow-none`}>
                                            <table className="rd-table hidden w-full border-collapse text-left text-sm sm:table print:table">
                                                <thead>
                                                    <tr className="bg-slate-100 text-[11px] font-extrabold tracking-wider text-slate-600 uppercase dark:bg-white/5 dark:text-slate-300 print:bg-slate-100">
                                                        <th className={`${th} w-10 text-center`}>No</th>
                                                        <th className={`${th} w-32`}>Waktu</th>
                                                        <th className={th}>Kegiatan</th>
                                                        <th className={`${th} w-28`}>Jenis</th>
                                                        {hasLoc && <th className={th}>Lokasi</th>}
                                                        {hasPic && <th className={th}>PIC</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.map((r, i) => {
                                                        const k = KINDS[r.kind] ?? KINDS.lainnya;
                                                        const s = toMin(r.start_time), e = r.end_time ? toMin(r.end_time) : s + 30;
                                                        const live = today === d && nowMin !== null && nowMin >= s && nowMin < e;
                                                        const past = today !== null && (today > d || (today === d && nowMin !== null && nowMin >= e));
                                                        return (
                                                            <tr key={i} className={`border-t border-slate-200 align-top dark:border-white/10 ${live ? 'bg-emerald-50 dark:bg-emerald-500/10' : i % 2 ? 'bg-slate-50/70 dark:bg-white/[0.03]' : ''} ${r.kind === 'istirahat' ? 'text-slate-500 italic' : ''} ${past ? 'opacity-55 print:opacity-100' : ''}`}>
                                                                <td className={`${th} text-center text-slate-400`}>{i + 1}</td>
                                                                <td className={`${th} font-bold whitespace-nowrap text-indigo-700 tabular-nums dark:text-indigo-300 print:text-black`}>{r.start_time}{r.end_time ? ` – ${r.end_time}` : ''}</td>
                                                                <td className={th}>
                                                                    <div className="font-bold">{r.title}{live && <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white not-italic print:hidden">Berlangsung</span>}</div>
                                                                    {r.notes && <div className="mt-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">{r.notes}</div>}
                                                                    {(r.details ?? []).length > 0 && <div className="mt-1 text-xs font-bold text-indigo-600 not-italic dark:text-indigo-300">Lihat susunan acara di bawah ↓</div>}
                                                                    
                                                                </td>
                                                                <td className={th}><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold not-italic ${k.chip}`}>{k.label}</span></td>
                                                                {hasLoc && <td className={th}>{r.location ?? '–'}</td>}
                                                                {hasPic && <td className={th}>{r.pic ?? '–'}</td>}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>

                                            <ul className="divide-y divide-slate-200 sm:hidden print:hidden dark:divide-white/10">
                                                {rows.map((r, i) => {
                                                    const k = KINDS[r.kind] ?? KINDS.lainnya;
                                                    const s = toMin(r.start_time), e = r.end_time ? toMin(r.end_time) : s + 30;
                                                    const live = today === d && nowMin !== null && nowMin >= s && nowMin < e;
                                                    const past = today !== null && (today > d || (today === d && nowMin !== null && nowMin >= e));
                                                    return (
                                                        <li key={i} className={`p-3.5 ${live ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''} ${past ? 'opacity-55' : ''}`}>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-sm font-extrabold text-indigo-700 tabular-nums dark:text-indigo-300">{r.start_time}{r.end_time ? ` – ${r.end_time}` : ''}</span>
                                                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${k.chip}`}>{live ? 'Berlangsung' : k.label}</span>
                                                            </div>
                                                            <div className="mt-1 font-bold">{r.title}</div>
                                                            {(r.location || r.pic) && (
                                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {r.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.location}</span>}
                                                                    {r.pic && <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{r.pic}</span>}
                                                                </div>
                                                            )}
                                                            {r.notes && <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{r.notes}</p>}
                                                            
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        
                        <style>{`@media print { .rd-det { break-inside: avoid; } }`}</style>
                        {(() => {
                            const withDet = sorted.filter((r) => (r.details ?? []).length > 0);
                            if (!withDet.length) return null;
                            return (
                                <div className={`space-y-4 pt-2 print:pt-6 ${curTab === 'susunan' ? '' : 'hidden print:block'}`}>
                                    <div className="px-1">
                                        <h2 className="text-sm font-extrabold tracking-widest text-slate-500 uppercase">Susunan acara</h2>
                                        <p className="mt-1 text-xs text-slate-500">Urutan acara di dalam setiap sesi.</p>
                                    </div>
                                    {withDet.map((r, idx) => {
                                        const k = KINDS[r.kind] ?? KINDS.lainnya;
                                        const det = r.details ?? [];
                                        const hasTime = det.some((x) => x.time);
                                        const hasPic = det.some((x) => x.pic);
                                        const th = 'px-4 py-2.5';
                                        return (
                                            <article key={idx} className={`${card} rd-det overflow-hidden print:shadow-none`}>
                                                <div className="flex flex-wrap items-start justify-between gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-white print:border-b-2 print:border-slate-800 print:bg-none print:text-black">
                                                    <div className="min-w-0">
                                                        <div className="text-lg leading-snug font-extrabold">{r.title}</div>
                                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/85 print:text-slate-600">
                                                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{days.length > 1 ? `Hari ${days.indexOf(r.date) + 1} · ` : ''}{longDate(r.date)}</span>
                                                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{r.start_time}{r.end_time ? ` – ${r.end_time}` : ''}</span>
                                                            {r.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.location}</span>}
                                                        </div>
                                                    </div>
                                                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold print:border print:border-slate-400">{k.label}</span>
                                                </div>
                                                <table className="w-full border-collapse text-left text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-100 text-[11px] font-extrabold tracking-wider text-slate-600 uppercase dark:bg-white/5 dark:text-slate-300 print:bg-slate-100">
                                                            <th className={`${th} w-12 text-center`}>No</th>
                                                            {hasTime && <th className={`${th} w-24`}>Jam</th>}
                                                            <th className={th}>Acara</th>
                                                            {hasPic && <th className={`${th} w-48`}>Pengisi / PIC</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {det.map((x, n) => (
                                                            <tr key={n} className={`border-t border-slate-200 align-top dark:border-white/10 ${n % 2 ? 'bg-slate-50/70 dark:bg-white/[0.03]' : ''}`}>
                                                                <td className={`${th} text-center`}><span className="inline-grid h-6 w-6 place-items-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200 print:bg-slate-200 print:text-black">{n + 1}</span></td>
                                                                {hasTime && <td className={`${th} font-bold whitespace-nowrap text-indigo-700 tabular-nums dark:text-indigo-300 print:text-black`}>{x.time ?? '–'}</td>}
                                                                <td className={th}>
                                                                    <div className="font-bold">{x.title}</div>
                                                                    {x.notes && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{x.notes}</div>}
                                                                </td>
                                                                {hasPic && <td className={th}>{x.pic ?? '–'}</td>}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </article>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        {rundownUpdated && curTab !== 'pengumuman' && <p className="px-1 text-xs text-slate-500">Rundown diperbarui {rundownUpdated}. Muat ulang halaman untuk melihat info terbaru.</p>}
                    </section>
                )}

                {announcements.length === 0 && rundown.length === 0 && (
                    <div className={`${card} p-8 text-center`}>
                        <div className="text-lg font-extrabold">Belum ada informasi</div>
                        <p className="mt-1 text-sm text-slate-500">Panitia belum menerbitkan pengumuman atau rundown. Cek lagi nanti.</p>
                    </div>
                )}

                <footer className="pt-4 text-center text-xs text-slate-400">Informasi dikelola panitia lewat SIMPLE</footer>
            </main>
        </div>
    );
}
