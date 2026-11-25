import { Head } from '@inertiajs/react';
import { CalendarDays, Check, Clock, Copy, ExternalLink, MapPin, Megaphone, Pin, Printer, Share2, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Item = { date: string; start_time: string; end_time: string | null; title: string; kind: string; pic: string | null; location: string | null; notes: string | null };
type Ann = { id: number; title: string; body: string; category: string; pinned: boolean; updated_label: string };
type Props = { event: { title: string; starts_at: string; ends_at: string; location: string | null }; rundown: Item[]; rundownUpdated: string | null; announcements: Ann[] };

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

            <header className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-4 pt-8 pb-16 text-white print:bg-none print:pb-4 print:text-black">
                <div className="mx-auto max-w-2xl">
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

            <main className="mx-auto -mt-10 max-w-2xl space-y-6 px-4 pb-16 print:mt-0">
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

                {announcements.length > 0 && (
                    <section className="space-y-3">
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
                        <h2 className="px-1 text-sm font-extrabold tracking-widest text-slate-500 uppercase">Rundown acara</h2>

                        {days.length > 1 && (
                            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 print:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {days.map((d, i) => (
                                    <button key={d} type="button" onClick={() => setPicked(d)} className={`shrink-0 rounded-2xl px-4 py-2 text-left transition ${active === d ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10'}`}>
                                        <div className="text-[11px] font-bold uppercase opacity-80">Hari {i + 1}{today === d ? ' · hari ini' : ''}</div>
                                        <div className="text-sm font-extrabold">{dayName(d)}, {shortDate(d)}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {days.map((d) => (
                            <div key={d} className={`${active === d ? 'block' : 'hidden'} space-y-0 print:block`}>
                                <div className="mb-3 px-1 text-base font-extrabold">{longDate(d)}</div>
                                <ol className="relative space-y-3 before:absolute before:top-3 before:bottom-3 before:left-[4.6rem] before:w-px before:bg-slate-200 dark:before:bg-white/10">
                                    {sorted.filter((r) => r.date === d).map((r, i) => {
                                        const k = KINDS[r.kind] ?? KINDS.lainnya;
                                        const s = toMin(r.start_time), e = r.end_time ? toMin(r.end_time) : s + 30;
                                        const live = today === d && nowMin !== null && nowMin >= s && nowMin < e;
                                        const past = today !== null && (today > d || (today === d && nowMin !== null && nowMin >= e));
                                        return (
                                            <li key={i} className={`relative flex gap-3 ${past ? 'opacity-55' : ''}`}>
                                                <div className="w-16 shrink-0 pt-4 text-right">
                                                    <div className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{r.start_time}</div>
                                                    {r.end_time && <div className="text-xs text-slate-400">{r.end_time}</div>}
                                                </div>
                                                <span className={`relative z-10 mt-5 h-3 w-3 shrink-0 rounded-full ring-4 ring-slate-50 dark:ring-slate-950 ${live ? 'bg-emerald-500' : k.bar}`} />
                                                <div className={`${card} min-w-0 flex-1 p-4 ${live ? 'ring-2 ring-emerald-400' : ''}`}>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${k.chip}`}>{k.label}</span>
                                                        {live && <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white">Sedang berlangsung</span>}
                                                    </div>
                                                    <div className="mt-1 font-extrabold">{r.title}</div>
                                                    {(r.location || r.pic) && (
                                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                            {r.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.location}</span>}
                                                            {r.pic && <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{r.pic}</span>}
                                                        </div>
                                                    )}
                                                    {r.notes && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r.notes}</p>}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        ))}
                        {rundownUpdated && <p className="px-1 text-xs text-slate-500">Rundown diperbarui {rundownUpdated}. Muat ulang halaman untuk melihat info terbaru.</p>}
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
