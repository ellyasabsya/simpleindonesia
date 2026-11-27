import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, Check, ChevronDown, Circle, ClipboardList, Copy, ExternalLink, Megaphone, Pencil, Pin, Plus, Share2, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Detail = { time: string | null; title: string; pic: string | null; notes: string | null };
export type RundownItem = { date: string; start_time: string; end_time: string | null; title: string; kind: string; pic: string | null; location: string | null; notes: string | null; details?: Detail[] };
export type Announcement = { id: number; title: string; body: string; category: string; pinned: boolean; published: boolean; updated_label: string };
export type InfoProps = { rundown: RundownItem[]; announcements: Announcement[]; rundownPublished: boolean; infoUrl: string | null };
export type Section = 'jadwal' | 'rundown' | 'pengumuman';
type Range = { start: string | null; end: string | null };

const glass = 'border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const inp = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/70 dark:text-white';
const lbl = 'text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400';
const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50';
const primary = `${btn} bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25`;
const soft = `${btn} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200`;

const SEL: React.CSSProperties = {
    appearance: 'none', WebkitAppearance: 'none', minHeight: '2.4rem', paddingRight: '2.25rem', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5l5 5 5-5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem',
};

const selSm = 'mt-0 w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/70 dark:text-white';
const KINDS: Record<string, string> = { pembukaan: 'Pembukaan', sesi: 'Sesi', lomba: 'Lomba', istirahat: 'Istirahat', penutupan: 'Penutupan', lainnya: 'Lainnya' };
const KIND_BORDER: Record<string, string> = { pembukaan: 'border-l-blue-500', sesi: 'border-l-indigo-500', lomba: 'border-l-emerald-500', istirahat: 'border-l-amber-400', penutupan: 'border-l-violet-500', lainnya: 'border-l-slate-400' };
const CATS: Record<string, { label: string; cls: string }> = {
    info: { label: 'Info', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200' },
    penting: { label: 'Penting', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200' },
    perubahan: { label: 'Perubahan jadwal', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200' },
    pembayaran: { label: 'Pembayaran', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' },
    logistik: { label: 'Logistik', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200' },
};
const PRESETS = [
    { label: 'Perubahan jadwal', category: 'perubahan', title: 'Perubahan jadwal', body: 'Mohon perhatian, ada penyesuaian jadwal.\n\nSemula: …\nMenjadi: …\n\nTerima kasih atas pengertiannya.' },
    { label: 'Yang perlu dibawa', category: 'logistik', title: 'Yang perlu dibawa peserta', body: 'Harap membawa:\n- Kartu identitas\n- Bukti pendaftaran atau tiket\n- Alat tulis dan perlengkapan pribadi' },
    { label: 'Info pembayaran', category: 'pembayaran', title: 'Informasi pembayaran', body: 'Pembayaran dapat dilakukan sebelum …\nMetode: …\nKonfirmasi pembayaran melalui …' },
    { label: 'Pengumuman penting', category: 'penting', title: 'Pengumuman penting', body: 'Kepada seluruh peserta,\n\n…' },
];
const TEMPLATES: { name: string; desc: string; rows: [string, number, string][] }[] = [
    { name: 'Seminar', desc: '8 sesi, sekitar 5 jam', rows: [['Registrasi dan kedatangan peserta', 30, 'pembukaan'], ['Pembukaan dan sambutan', 20, 'pembukaan'], ['Sesi 1: Pemateri utama', 60, 'sesi'], ['Istirahat', 15, 'istirahat'], ['Sesi 2: Diskusi dan tanya jawab', 60, 'sesi'], ['Ishoma', 60, 'istirahat'], ['Sesi 3: Panel atau workshop', 60, 'sesi'], ['Penutupan dan foto bersama', 20, 'penutupan']] },
    { name: 'Lomba', desc: '9 sesi, sekitar 7 jam', rows: [['Persiapan panitia dan juri', 60, 'lainnya'], ['Registrasi ulang peserta', 45, 'pembukaan'], ['Technical meeting', 30, 'sesi'], ['Pembukaan', 20, 'pembukaan'], ['Babak penyisihan', 90, 'lomba'], ['Istirahat', 30, 'istirahat'], ['Babak final', 90, 'lomba'], ['Penjurian', 30, 'lainnya'], ['Pengumuman pemenang dan penutupan', 30, 'penutupan']] },
    { name: 'Workshop', desc: '7 sesi, sekitar 4,5 jam', rows: [['Registrasi', 30, 'pembukaan'], ['Pembukaan', 15, 'pembukaan'], ['Materi dasar', 60, 'sesi'], ['Praktik', 90, 'sesi'], ['Istirahat', 15, 'istirahat'], ['Presentasi hasil', 45, 'sesi'], ['Penutupan dan sertifikat', 15, 'penutupan']] },
];

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const fromMin = (n: number) => { const x = Math.min(1439, Math.max(0, n)); return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (s: string, n: number) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return iso(d); };
const longDate = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
const byTime = (a: RundownItem, b: RundownItem) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time);

export function rundownText(title: string, items: RundownItem[]) {
    const out: string[] = [`*RUNDOWN ${title.toUpperCase()}*`];
    let day = '';
    [...items].sort(byTime).forEach((r) => {
        if (r.date !== day) { day = r.date; out.push('', `*${longDate(r.date)}*`); }
        const t = r.end_time ? `${r.start_time.replace(':', '.')} - ${r.end_time.replace(':', '.')}` : r.start_time.replace(':', '.');
        out.push(`${t} | ${r.title}${r.location ? ` (${r.location})` : ''}${r.pic ? ` - PIC: ${r.pic}` : ''}`);
        (r.details ?? []).forEach((d) => out.push(`     • ${d.time ? `${d.time.replace(':', '.')} ` : ''}${d.title}${d.pic ? ` (${d.pic})` : ''}`));
    });
    return out.join('\n');
}

async function copyText(t: string) {
    try { await navigator.clipboard.writeText(t); return true; } catch {
        const a = document.createElement('textarea');
        a.value = t; document.body.appendChild(a); a.select();
        const ok = document.execCommand('copy'); a.remove(); return ok;
    }
}

function useCopy() {
    const [done, setDone] = useState<string | null>(null);
    const copy = async (key: string, text: string) => { if (await copyText(text)) { setDone(key); setTimeout(() => setDone(null), 1800); } };
    return { done, copy };
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl sm:rounded-3xl sm:p-6 dark:bg-slate-900 dark:text-white">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Switch({ on, onChange, disabled, label }: { on: boolean; onChange: () => void; disabled?: boolean; label: string }) {
    return (
        <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onChange} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/20'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
        </button>
    );
}

/* ---------- Bar atas: kesiapan, tahapan, tautan, tab ---------- */
export type HeroMeta = {
    startsAt: string; startNote: string; agendaCount: number;
    reg: { label: string }; prep: { label: string }; run: { label: string };
    regText: string; prepText: string; runText: string;
    onPhase: () => void;
};

const fmtDate = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const badgeTone = (l: string) => l === 'Akan datang' ? 'bg-amber-300 text-amber-950' : l === 'Berlangsung' ? 'bg-emerald-300 text-emerald-950' : l === 'Selesai' ? 'bg-white/25 text-white' : 'bg-white/15 text-white/80';
const heroBtn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition';

export function InfoBar({ eventId, eventTitle, info, phases, section, setSection, meta, compact, view, setView, actions }: {
    eventId: number; eventTitle: string; info: InfoProps; phases: { registration: Range; preparation: Range }; section: Section; setSection: (s: Section) => void;
    meta?: HeroMeta; compact?: boolean; view?: 'linimasa' | 'kalender'; setView?: (v: 'linimasa' | 'kalender') => void; actions?: React.ReactNode;
}) {
    const { done: copied, copy } = useCopy();
    const base = `/panel/event/${eventId}/kalender/publikasi`;
    const [more, setMore] = useState(false);
    const makeLink = () => router.put(base, {}, { preserveScroll: true });
    const phaseDone = !!(phases.registration.start && phases.registration.end && phases.preparation.start && phases.preparation.end);
    const checks: { ok: boolean; label: string; act: () => void }[] = [
        { ok: phaseDone, label: 'Tahapan diatur', act: () => (meta ? meta.onPhase() : setSection('jadwal')) },
        { ok: info.rundown.length > 0 && info.rundownPublished, label: 'Rundown tampil ke peserta', act: () => setSection('rundown') },
        { ok: info.announcements.some((a) => a.published), label: 'Pengumuman terbit', act: () => setSection('pengumuman') },
        { ok: !!info.infoUrl, label: 'Tautan dibuat', act: makeLink },
    ];
    const ok = checks.filter((c) => c.ok).length;
    const pct = Math.round((ok / checks.length) * 100);
    const waText = `${eventTitle}\nPengumuman dan rundown terbaru ada di sini:\n${info.infoUrl ?? ''}`;

    const tabs: [string, string, number | null][] = compact
        ? [['jadwal', 'Jadwal', null], ['rundown', 'Rundown', info.rundown.length], ['pengumuman', 'Pengumuman', info.announcements.length]]
        : [['linimasa', 'Linimasa', null], ['kalender', 'Kalender', null], ['rundown', 'Rundown', info.rundown.length], ['pengumuman', 'Pengumuman', info.announcements.length]];
    const active = compact ? section : section === 'jadwal' ? (view ?? 'linimasa') : section;
    const pick = (k: string) => {
        if (k === 'linimasa' || k === 'kalender') { setSection('jadwal'); setView?.(k); } else setSection(k as Section);
    };
    const tiles: [string, string, string, boolean][] = meta ? [
        ['Pendaftaran', meta.regText, meta.reg.label, true],
        ['Persiapan', meta.prepText, meta.prep.label, true],
        ['Pelaksanaan', meta.runText, meta.run.label, false],
    ] : [];

    return (
        <div className="mb-5 space-y-3 sm:space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-4 text-white shadow-xl shadow-indigo-600/20 sm:p-6">
                <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full sm:h-20 sm:w-20" style={{ background: `conic-gradient(#fff ${pct * 3.6}deg, rgba(255,255,255,.22) 0deg)` }}>
                        <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-indigo-600 text-xs font-extrabold sm:h-[60px] sm:w-[60px] sm:text-base">{pct}%</span>
                    </span>
                    <div className="min-w-0 flex-1 basis-40">
                        <div className="text-base font-bold sm:text-xl">Kesiapan event</div>
                        <div className="text-xs text-white/80 sm:text-sm">
                            {ok === checks.length ? 'Semua siap. Peserta punya informasi lengkap.' : `${ok} dari ${checks.length} langkah selesai`}
                        </div>
                        {meta && <div className="mt-1 flex items-center gap-1.5 text-xs text-white/70"><CalendarDays className="h-3.5 w-3.5" />Mulai {fmtDate(meta.startsAt)} · {meta.startNote} · {meta.agendaCount} agenda</div>}
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                        {info.infoUrl ? (
                            <>
                                <button type="button" onClick={() => copy('url', info.infoUrl as string)} className={`${heroBtn} flex-1 bg-white text-indigo-700 hover:bg-indigo-50 sm:flex-none`}>{copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied === 'url' ? 'Tersalin' : 'Salin tautan'}</button>
                                <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className={`${heroBtn} flex-1 bg-emerald-500 text-white hover:bg-emerald-400 sm:flex-none`}><Share2 className="h-4 w-4" />WhatsApp</a>
                                <a href={info.infoUrl} target="_blank" rel="noreferrer" aria-label="Buka halaman peserta" className={`${heroBtn} bg-white/15 px-3 hover:bg-white/25`}><ExternalLink className="h-4 w-4" /></a>
                            </>
                        ) : (
                            <button type="button" onClick={makeLink} className={`${heroBtn} w-full bg-white text-indigo-700 hover:bg-indigo-50 sm:w-auto`}><Share2 className="h-4 w-4" />Buat tautan peserta</button>
                        )}
                    </div>
                </div>

                {compact && (
                    <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="relative mt-3 flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold transition hover:bg-white/15">
                        <span>{more ? 'Sembunyikan checklist' : `Lihat checklist (${ok}/${checks.length})`}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${more ? 'rotate-180' : ''}`} />
                    </button>
                )}
                <div className={`relative mt-3 flex-wrap gap-2 ${compact && !more ? 'hidden' : 'flex'} sm:mt-4`}>
                    {checks.map((c) => (
                        <button key={c.label} type="button" onClick={c.act} disabled={c.ok} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${c.ok ? 'bg-emerald-400/25 text-emerald-100' : 'bg-white/15 hover:bg-white/25'}`}>
                            {c.ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Circle className="h-3.5 w-3.5" />}{c.label}
                        </button>
                    ))}
                </div>

                {meta && (
                    <div className={`relative mt-3 gap-2 ${compact ? (more ? 'flex flex-col' : 'hidden') : '-mx-1 flex overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0'}`}>
                        {tiles.map(([title, text, label, editable]) => (
                            <div key={title} className="flex min-w-[15rem] shrink-0 items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 sm:min-w-0">
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-extrabold">{title}</div>
                                    <div className="truncate text-xs text-white/70">{text}</div>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeTone(label)}`}>{label}</span>
                                {editable && <button type="button" aria-label={`Atur ${title}`} onClick={meta.onPhase} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"><Pencil className="h-3.5 w-3.5" /></button>}
                            </div>
                        ))}
                    </div>
                )}

                {info.infoUrl && (
                    <button type="button" onClick={() => { if (confirm('Ganti tautan? Tautan lama langsung tidak bisa dibuka.')) router.put(base, { regenerate: true }, { preserveScroll: true }); }} className="relative mt-3 text-[11px] font-semibold text-white/60 underline hover:text-white">Ganti tautan</button>
                )}
            </div>

            <div className={`${compact ? 'hidden' : ''} flex flex-wrap items-center gap-2 rounded-2xl p-1.5 ${glass}`}>
                <div className="flex min-w-0 flex-wrap gap-1">
                {tabs.map(([k, label, n]) => (
                    <button key={k} type="button" onClick={() => pick(k)} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition sm:px-6 ${active === k ? 'bg-indigo-900 text-white shadow dark:bg-indigo-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {label}{n ? <span className={`rounded-full px-1.5 text-[11px] ${active === k ? 'bg-white/25' : 'bg-slate-200 dark:bg-white/10'}`}>{n}</span> : null}
                    </button>
                ))}
                </div>
                {actions && (active === 'linimasa' || active === 'kalender') ? <div className="ml-auto flex shrink-0 items-center gap-3 px-2">{actions}</div> : null}
            </div>
        </div>
    );
}

export function InfoSections({ section, eventId, eventTitle, startsAt, endsAt, info }: { section: Section; eventId: number; eventTitle: string; startsAt: string; endsAt: string; info: InfoProps }) {
    return section === 'rundown'
        ? <RundownTab eventId={eventId} eventTitle={eventTitle} startsAt={startsAt} endsAt={endsAt} info={info} />
        : <AnnouncementsTab eventId={eventId} eventTitle={eventTitle} info={info} />;
}

/* ---------- Rundown ---------- */
function RundownTab({ eventId, eventTitle, startsAt, endsAt, info }: { eventId: number; eventTitle: string; startsAt: string; endsAt: string; info: InfoProps }) {
    const { done: copied, copy } = useCopy();
    const [items, setItems] = useState<RundownItem[]>(info.rundown);
    const [base, setBase] = useState(() => JSON.stringify(info.rundown));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const dirty = JSON.stringify(items) !== base;

    const days = useMemo(() => {
        const out: string[] = [];
        for (let i = 0; i < 31; i++) { const d = addDays(startsAt, i); out.push(d); if (d >= endsAt) break; }
        return out;
    }, [startsAt, endsAt]);
    const multi = days.length > 1;
    const [day, setDay] = useState(startsAt);
    const inDay = (x: RundownItem) => !multi || x.date === day;
    const dayNo = (d: string) => days.indexOf(d) + 1;

    const flags = useMemo(() => {
        const clash = new Set<number>();
        const bad = new Set<number>();
        const idx = items.map((_, i) => i).sort((a, b) => byTime(items[a], items[b]));
        for (let k = 1; k < idx.length; k++) {
            const p = items[idx[k - 1]], c = items[idx[k]];
            if (p.date === c.date && p.end_time && p.start_time && c.start_time && toMin(p.end_time) > toMin(c.start_time)) { clash.add(idx[k - 1]); clash.add(idx[k]); }
        }
        items.forEach((it, i) => { if (it.end_time && it.start_time && toMin(it.end_time) <= toMin(it.start_time)) bad.add(i); });
        return { clash, bad };
    }, [items]);
    const invalid = items.some((i) => !i.title.trim() || !i.start_time) || flags.bad.size > 0;

    const update = (i: number, patch: Partial<RundownItem>) => setItems((a) => a.map((x, k) => (k === i ? { ...x, ...patch } : x)));
    const add = () => setItems((a) => {
        const last = [...a].filter(inDay).sort(byTime).pop();
        const s = last ? (last.end_time ? toMin(last.end_time) : toMin(last.start_time) + 30) : 8 * 60;
        return [...a, { date: multi ? day : (last?.date ?? startsAt), start_time: fromMin(s), end_time: fromMin(s + 30), title: '', kind: 'sesi', pic: null, location: null, notes: null }];
    });
    const useTemplate = (rows: [string, number, string][]) => {
        let t = 8 * 60;
        setItems((a) => [...a.filter((x) => !inDay(x)), ...rows.map(([title, mins, kind]) => { const it: RundownItem = { date: multi ? day : startsAt, start_time: fromMin(t), end_time: fromMin(t + mins), title, kind, pic: null, location: null, notes: null }; t += mins; return it; })]);
    };
    const shift = (m: number) => setItems((a) => a.map((x) => !inDay(x) ? x : ({ ...x, start_time: fromMin(toMin(x.start_time) + m), end_time: x.end_time ? fromMin(toMin(x.end_time) + m) : null })));

    const copyDay = (from: string) => {
        if (from === day) return;
        const src = items.filter((x) => x.date === from).map((x) => ({ ...x, date: day }));
        if (!src.length) return;
        if (items.some((x) => x.date === day) && !confirm(`Rundown Hari ${dayNo(day)} akan diganti dengan salinan Hari ${dayNo(from)}. Lanjut?`)) return;
        setItems((a) => [...a.filter((x) => x.date !== day), ...src]);
    };

    const OPENING = ['MC membuka acara', 'Menyanyikan lagu Indonesia Raya', 'Pembacaan doa', 'Sambutan ketua panitia', 'Sambutan tamu undangan', 'Pembukaan resmi acara'];
    const setDet = (i: number, n: number, patch: Partial<Detail>) => setItems((a) => a.map((x, k) => (k === i ? { ...x, details: (x.details ?? []).map((d, m) => (m === n ? { ...d, ...patch } : d)) } : x)));

    const save = () => {
        const data = [...items].sort(byTime).map((i) => ({ ...i, title: i.title.trim(), end_time: i.end_time || null, pic: i.pic || null, location: i.location || null, notes: i.notes || null, details: (i.details ?? []).filter((d) => d.title.trim()).map((d) => ({ time: d.time || null, title: d.title.trim(), pic: d.pic || null, notes: d.notes || null })) }));
        setSaving(true); setError('');
        router.put(`/panel/event/${eventId}/kalender/rundown`, { items: data }, {
            preserveScroll: true,
            onSuccess: () => { setItems(data); setBase(JSON.stringify(data)); },
            onError: (e) => setError(String(Object.values(e)[0] ?? 'Gagal menyimpan rundown.')),
            onFinish: () => setSaving(false),
        });
    };

    const sorted = [...items].filter(inDay).sort(byTime);
    const lastEnd = sorted.reduce((m, i) => Math.max(m, toMin(i.end_time ?? i.start_time)), 0);

    const dayPicker = multi ? (
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {days.map((d, n) => {
                        const c = items.filter((x) => x.date === d).length;
                        return (
                            <button key={d} type="button" onClick={() => setDay(d)} className={`shrink-0 rounded-xl px-4 py-2 text-left text-sm font-semibold transition ${day === d ? 'bg-indigo-900 text-white shadow dark:bg-indigo-500' : 'border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>
                                <span className="block">Hari {n + 1}</span>
                                <span className={`block text-[11px] font-semibold ${day === d ? 'text-white/70' : 'text-slate-500'}`}>{shortDate(d)} · {c} sesi</span>
                            </button>
                        );
                    })}
                </div>
    ) : null;

    return (
        <div className="space-y-4">

            {sorted.length === 0 ? (
                <div className={`rounded-3xl p-6 ${glass}`}>
                    {dayPicker ? <div className="mb-5">{dayPicker}</div> : null}
                    <div className="flex items-center gap-2 text-[15px] font-semibold md:text-lg md:font-bold"><ClipboardList className="h-4 w-4 text-indigo-600 md:h-5 md:w-5" />{multi ? `Susun rundown Hari ${dayNo(day)} · ${shortDate(day)}` : 'Mulai susun rundown'}</div>
                    <p className="mt-1 text-xs text-slate-500 md:text-sm">Pilih template lalu sesuaikan jam dan sesinya, atau mulai dari kosong.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {TEMPLATES.map((t) => (
                            <button key={t.name} type="button" onClick={() => useTemplate(t.rows)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-400 dark:border-white/10 dark:bg-white/5">
                                <div className="text-sm font-semibold md:text-base">{t.name}</div>
                                <div className="text-xs text-slate-500">{t.desc}</div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={add} className={soft}><Plus className="h-4 w-4" />Mulai dari kosong</button>
                        {multi && days.some((d) => d !== day && items.some((x) => x.date === d)) && (
                            <select style={SEL} value="" onChange={(e) => e.target.value && copyDay(e.target.value)} className={selSm} aria-label="Salin dari hari lain">
                                <option value="">Salin dari hari lain…</option>
                                {days.filter((d) => d !== day && items.some((x) => x.date === d)).map((d) => <option key={d} value={d}>Hari {dayNo(d)} · {shortDate(d)}</option>)}
                            </select>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className={`rounded-3xl p-4 sm:p-6 ${glass}`}>
                    {dayPicker ? <div className="mb-4">{dayPicker}</div> : null}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="w-full text-sm font-bold text-slate-600 sm:mr-auto sm:w-auto dark:text-slate-300">{sorted.length} sesi · {sorted[0].start_time} – {fromMin(lastEnd)}</span>
                        <div title={dirty ? 'Simpan perubahan dulu sebelum mengubah publikasi.' : 'Atur apakah peserta bisa melihat rundown di tautan info.'} className={`inline-flex items-center gap-2.5 rounded-xl border px-3 py-1.5 ${info.rundownPublished ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-400/30 dark:bg-indigo-500/15' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'}`}>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{info.rundownPublished ? 'Tampil ke peserta' : 'Privat'}</span>
                            <Switch label="Tampilkan rundown ke peserta" on={info.rundownPublished} disabled={dirty || items.length === 0} onChange={() => router.put(`/panel/event/${eventId}/kalender/publikasi`, { rundown_published: !info.rundownPublished }, { preserveScroll: true })} />
                        </div>
                        <select style={SEL} value="" onChange={(e) => e.target.value && shift(Number(e.target.value))} className={selSm} aria-label="Geser semua jam">
                            <option value="">Geser semua jam…</option>
                            {[-60, -30, -15, 15, 30, 60].map((m) => <option key={m} value={m}>{m > 0 ? `+${m}` : m} menit</option>)}
                        </select>
                        {multi && days.some((d) => d !== day && items.some((x) => x.date === d)) && (
                            <select style={SEL} value="" onChange={(e) => e.target.value && copyDay(e.target.value)} className={selSm} aria-label="Salin dari hari lain">
                                <option value="">Salin dari hari lain…</option>
                                {days.filter((d) => d !== day && items.some((x) => x.date === d)).map((d) => <option key={d} value={d}>Hari {dayNo(d)} · {shortDate(d)}</option>)}
                            </select>
                        )}
                        <button type="button" onClick={() => setItems((a) => [...a].sort(byTime))} className={soft}>Urutkan jam</button>
                        <button type="button" onClick={() => copy('wa', rundownText(eventTitle, items))} className={soft}>{copied === 'wa' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied === 'wa' ? 'Tersalin' : 'Salin untuk WhatsApp'}</button>
                        <button type="button" onClick={add} className={primary}><Plus className="h-4 w-4" />Tambah sesi</button>
                    </div>
                    </div>

                    <div className="space-y-3">
                        {items.map((it, i) => !inDay(it) ? null : (
                            <div key={i} className={`rounded-2xl border-l-4 bg-white p-4 shadow-sm dark:bg-slate-900/60 ${flags.clash.has(i) || flags.bad.has(i) ? 'border-l-rose-500' : KIND_BORDER[it.kind] ?? 'border-l-indigo-400'}`}>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[110px_110px_1fr_150px]">
                                    <label><span className={lbl}>Mulai</span><input type="time" value={it.start_time} onChange={(e) => update(i, { start_time: e.target.value })} className={inp} /></label>
                                    <label><span className={lbl}>Selesai</span><input type="time" value={it.end_time ?? ''} onChange={(e) => update(i, { end_time: e.target.value || null })} className={inp} /></label>
                                    <label className="col-span-2 sm:col-span-1"><span className={lbl}>Sesi</span><input value={it.title} maxLength={150} onChange={(e) => update(i, { title: e.target.value })} placeholder="Contoh: Pembukaan" className={inp} /></label>
                                    <label className="col-span-2 sm:col-span-1"><span className={lbl}>Jenis</span><select style={SEL} value={it.kind} onChange={(e) => update(i, { kind: e.target.value })} className={inp}>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                                </div>
                                <div className={`mt-3 grid gap-3 ${multi ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                                    {multi && <label><span className={lbl}>Hari</span><select style={SEL} value={it.date} onChange={(e) => update(i, { date: e.target.value })} className={inp}>{(days.includes(it.date) ? days : [...days, it.date]).map((d, n) => <option key={d} value={d}>Hari {n + 1} · {shortDate(d)}</option>)}</select></label>}
                                    <label><span className={lbl}>Penanggung jawab</span><input value={it.pic ?? ''} maxLength={100} onChange={(e) => update(i, { pic: e.target.value })} placeholder="Nama PIC / MC" className={inp} /></label>
                                    <label><span className={lbl}>Lokasi / ruang</span><input value={it.location ?? ''} maxLength={150} onChange={(e) => update(i, { location: e.target.value })} placeholder="Aula utama" className={inp} /></label>
                                </div>
                                <div className="mt-3 flex items-end gap-3">
                                    <label className="flex-1"><span className={lbl}>Catatan</span><input value={it.notes ?? ''} maxLength={500} onChange={(e) => update(i, { notes: e.target.value })} placeholder="Opsional" className={inp} /></label>
                                    <button type="button" aria-label="Hapus sesi" onClick={() => setItems((a) => a.filter((_, k) => k !== i))} className="rounded-xl p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-5 w-5" /></button>
                                </div>
                                <details className="mt-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3 dark:border-white/15 dark:bg-white/5" open={(it.details?.length ?? 0) > 0}>
                                    <summary className="cursor-pointer text-sm font-bold text-indigo-700 dark:text-indigo-300">Rincian acara{(it.details?.length ?? 0) > 0 ? ` (${it.details?.length})` : ''}</summary>
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Urutan acara di dalam sesi ini, misalnya MC, doa, dan sambutan. Jam boleh dikosongkan.</p>
                                        {(it.details ?? []).map((d, n) => (
                                            <div key={n} className="grid grid-cols-[96px_1fr] gap-2 sm:grid-cols-[100px_1fr_170px_auto]">
                                                <input type="time" style={{ minHeight: '2.4rem' }} value={d.time ?? ''} onChange={(e) => setDet(i, n, { time: e.target.value || null })} className={`${inp} mt-0`} aria-label="Jam rincian" />
                                                <input value={d.title} maxLength={150} onChange={(e) => setDet(i, n, { title: e.target.value })} placeholder="Contoh: Sambutan ketua panitia" className={`${inp} mt-0`} aria-label="Kegiatan rincian" />
                                                <input value={d.pic ?? ''} maxLength={100} onChange={(e) => setDet(i, n, { pic: e.target.value })} placeholder="PIC / pengisi" className={`${inp} mt-0 col-span-2 sm:col-span-1`} aria-label="PIC rincian" />
                                                <button type="button" aria-label="Hapus rincian" onClick={() => update(i, { details: (it.details ?? []).filter((_, m) => m !== n) })} className="col-span-2 justify-self-end rounded-xl p-2 text-rose-500 hover:bg-rose-50 sm:col-span-1 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <button type="button" onClick={() => update(i, { details: [...(it.details ?? []), { time: null, title: '', pic: null, notes: null }] })} className={soft}><Plus className="h-4 w-4" />Tambah rincian</button>
                                            {(it.details?.length ?? 0) === 0 && <button type="button" onClick={() => update(i, { details: OPENING.map((t) => ({ time: null, title: t, pic: null, notes: null })) })} className={soft}>Isi contoh pembukaan</button>}
                                        </div>
                                    </div>
                                </details>
                                {flags.bad.has(i) && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />Jam selesai harus setelah jam mulai.</p>}
                                {!flags.bad.has(i) && flags.clash.has(i) && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />Jam bentrok dengan sesi lain di hari yang sama.</p>}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {(dirty || error) && (
                <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-xl">
                    <span className="text-sm font-bold">{error || (invalid ? 'Lengkapi judul dan jam sesi dulu.' : 'Ada perubahan yang belum disimpan.')}</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setItems(JSON.parse(base)); setError(''); }} className="rounded-xl px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10">Batalkan</button>
                        <button type="button" disabled={saving || invalid} onClick={save} className={primary}>{saving ? 'Menyimpan…' : 'Simpan rundown'}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------- Pengumuman ---------- */
type Preset = { category: string; title: string; body: string };

function AnnouncementModal({ eventId, initial, preset, onClose }: { eventId: number; initial: Announcement | null; preset: Preset | null; onClose: () => void }) {
    const f = useForm({
        title: initial?.title ?? preset?.title ?? '', body: initial?.body ?? preset?.body ?? '',
        category: initial?.category ?? preset?.category ?? 'info', pinned: initial?.pinned ?? false, published: initial?.published ?? true,
    });
    const e = f.errors as Record<string, string | undefined>;
    const base = `/panel/event/${eventId}/kalender/pengumuman`;
    const submit = (ev: React.FormEvent) => {
        ev.preventDefault();
        const opt = { preserveScroll: true, onSuccess: onClose };
        if (initial) f.put(`${base}/${initial.id}`, opt); else f.post(base, opt);
    };
    return (
        <Modal title={initial ? 'Ubah pengumuman' : 'Buat pengumuman'} onClose={onClose}>
            <form onSubmit={submit} className="mt-5 space-y-4">
                <label className="block"><span className={lbl}>Judul</span><input value={f.data.title} maxLength={150} onChange={(x) => f.setData('title', x.target.value)} className={inp} />{e.title && <span className="text-xs text-rose-600">{e.title}</span>}</label>
                <label className="block"><span className={lbl}>Kategori</span><select style={SEL} value={f.data.category} onChange={(x) => f.setData('category', x.target.value)} className={inp}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
                <label className="block"><span className={lbl}>Isi pengumuman</span><textarea rows={6} value={f.data.body} maxLength={2000} onChange={(x) => f.setData('body', x.target.value)} className={inp} />{e.body && <span className="text-xs text-rose-600">{e.body}</span>}</label>
                <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={f.data.pinned} onChange={(x) => f.setData('pinned', x.target.checked)} className="h-4 w-4" />Sematkan di paling atas</label>
                <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={f.data.published} onChange={(x) => f.setData('published', x.target.checked)} className="h-4 w-4" />Terbitkan sekarang (tampil di tautan info peserta)</label>
                <button type="submit" disabled={f.processing || !f.data.title.trim() || !f.data.body.trim()} className={`${primary} w-full`}>{f.processing ? 'Menyimpan…' : initial ? 'Simpan perubahan' : f.data.published ? 'Terbitkan pengumuman' : 'Simpan sebagai draf'}</button>
            </form>
        </Modal>
    );
}

function AnnouncementsTab({ eventId, eventTitle, info }: { eventId: number; eventTitle: string; info: InfoProps }) {
    const { done: copied, copy } = useCopy();
    const [modal, setModal] = useState<{ item: Announcement | null; preset: Preset | null } | null>(null);
    const base = `/panel/event/${eventId}/kalender/pengumuman`;
    const put = (a: Announcement, patch: Partial<Announcement>) => router.put(`${base}/${a.id}`, { title: a.title, body: a.body, category: a.category, pinned: a.pinned, published: a.published, ...patch }, { preserveScroll: true });

    const empty = info.announcements.length === 0;

    return (
        <div className="space-y-4">
            {/* ANN_BAR */}
            <div className={empty ? `overflow-hidden rounded-3xl ${glass}` : 'space-y-4'}>
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 p-3.5 sm:px-4 ${empty ? 'border-b border-slate-200/70 dark:border-white/10' : `rounded-2xl ${glass}`}`}>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{info.announcements.length} pengumuman</span>
                <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:flex-1 sm:flex-wrap sm:overflow-visible sm:border-l sm:border-slate-200 sm:pb-0 sm:pl-4 dark:sm:border-white/10">
                    <span className={`${lbl} shrink-0`}>Cepat:</span>
                    {PRESETS.map((p) => <button key={p.label} type="button" onClick={() => setModal({ item: null, preset: p })} className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{p.label}</button>)}
                </div>
                <button type="button" onClick={() => setModal({ item: null, preset: null })} className={`${primary} w-full sm:w-auto`}><Plus className="h-4 w-4" />Buat pengumuman</button>
            </div>

            {info.announcements.length === 0 ? (
                <div className="p-8 text-center">
                    <Megaphone className="mx-auto h-8 w-8 text-indigo-500" />
                    <div className="mt-2 text-[15px] font-semibold md:text-lg md:font-bold">Belum ada pengumuman</div>
                    <p className="mt-1 text-sm text-slate-500">Pengumuman yang diterbitkan tampil di tautan info peserta, lengkap dengan waktu pembaruan.</p>
                </div>
            ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                    {info.announcements.map((a) => (
                        <div key={a.id} className={`flex flex-col rounded-2xl border-l-4 p-4 sm:p-5 ${glass} ${({ info: 'border-l-blue-500', penting: 'border-l-rose-500', perubahan: 'border-l-amber-400', pembayaran: 'border-l-emerald-500', logistik: 'border-l-violet-500' }as Record<string, string>)[a.category] ?? 'border-l-slate-400'} ${a.pinned ? 'bg-indigo-50/70 dark:bg-indigo-500/10' : ''} ${a.published ? '' : 'opacity-80'}`}>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${CATS[a.category]?.cls}`}>{CATS[a.category]?.label ?? a.category}</span>
                                {a.pinned && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-300"><Pin className="h-3 w-3" />Disematkan</span>}
                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${a.published ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{a.published ? 'Tayang' : 'Draf'}</span>
                                <span className="ml-auto text-xs text-slate-500">{a.updated_label}</span>
                            </div>
                            <h3 className="mt-2 text-base font-semibold">{a.title}</h3>
                            <p className="mt-1 flex-1 text-sm leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">{a.body}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-3 dark:border-white/10">
                                <button type="button" onClick={() => put(a, { published: !a.published })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{a.published ? 'Tarik dari peserta' : 'Terbitkan'}</button>
                                <button type="button" onClick={() => put(a, { pinned: !a.pinned })} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><Pin className="h-3.5 w-3.5" />{a.pinned ? 'Lepas' : 'Sematkan'}</button>
                                <button type="button" onClick={() => copy(`a${a.id}`, `*${CATS[a.category]?.label.toUpperCase()}: ${a.title}*\n\n${a.body}\n\n${eventTitle}${info.infoUrl ? `\n${info.infoUrl}` : ''}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{copied === `a${a.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === `a${a.id}` ? 'Tersalin' : 'Salin WA'}</button>
                                <span className="ml-auto flex gap-0.5">
                                    <button type="button" aria-label="Ubah" onClick={() => setModal({ item: a, preset: null })} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                                    <button type="button" aria-label="Hapus" onClick={() => { if (confirm(`Hapus pengumuman "${a.title}"?`)) router.delete(`${base}/${a.id}`, { preserveScroll: true }); }} className="rounded-full p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
            {modal && <AnnouncementModal eventId={eventId} initial={modal.item} preset={modal.preset} onClose={() => setModal(null)} />}
        </div>
    );
}
