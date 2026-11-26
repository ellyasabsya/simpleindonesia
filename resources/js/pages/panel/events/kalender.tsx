import { router, useForm } from '@inertiajs/react';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import PanelLayout from '@/components/panel/panel-layout';
import KalenderPanelMobile from '@/components/mobile/pages/kalender-panel-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import { InfoBar, InfoSections, type InfoProps, type Section } from '@/components/panel/event-info';

type Agenda = { id: number; title: string; date: string; start_time: string | null; end_time: string | null; location: string | null; description: string | null; type: string; remind_minutes: number | null };
type Range = { start: string | null; end: string | null };
type Props = { info?: InfoProps; eventId: number; event: { title: string; starts_at: string; ends_at: string }; phases: { registration: Range; preparation: Range }; agendas: Agenda[]; subAgendas?: { id: number; sub_title: string; title: string; date: string; start_time: string | null }[] };
type Tone = 'start' | 'end' | 'phase' | 'agenda';
type Entry = { key: string; date: string; time: string | null; title: string; tone: Tone; agenda?: Agenda };

const D = (s: string) => new Date(`${s}T00:00:00`);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const diff = (a: string, b: string) => Math.round((D(a).getTime() - D(b).getTime()) / 864e5);
const fmt = (s: string) => D(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const DAYS = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const TYPES: Record<string, string> = { agenda: 'Agenda', rapat: 'Rapat', latihan: 'Latihan', gladi: 'Gladi', lainnya: 'Lainnya' };
const REMIND: [string, string][] = [['', 'Tanpa pengingat'], ['15', '15 menit sebelum'], ['60', '1 jam sebelum'], ['180', '3 jam sebelum'], ['1440', '1 hari sebelum'], ['4320', '3 hari sebelum']];

const glass = 'border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const inp = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base sm:px-3.5 sm:py-2.5 sm:text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-900/70 dark:text-white';
const lbl = 'text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400';
const TONE: Record<Tone, { box: string; text: string }> = {
    start: { box: 'border-l-blue-600 bg-blue-50/90 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300' },
    end: { box: 'border-l-violet-600 bg-violet-50/90 dark:bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300' },
    phase: { box: 'border-l-emerald-500 bg-emerald-50/90 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
    agenda: { box: 'border-l-indigo-400 bg-white dark:bg-slate-900/60', text: 'text-slate-900 dark:text-white' },
};

function phaseStatus(r: Range, today: string): { label: string; cls: string } {
    if (!r.start && !r.end) return { label: 'Belum diatur', cls: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' };
    if (!r.start || !r.end) return { label: 'Belum lengkap', cls: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' };
    if (today < r.start) return { label: 'Akan datang', cls: 'bg-amber-100 text-amber-700' };
    if (today > r.end) return { label: 'Selesai', cls: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300' };
    return { label: 'Berlangsung', cls: 'bg-emerald-100 text-emerald-700' };
}

const rangeText = (r: Range) => (r.start && r.end ? (r.start === r.end ? fmt(r.start) : `${fmt(r.start)} – ${fmt(r.end)}`) : 'Tanggal belum lengkap');

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl sm:rounded-3xl sm:p-6 dark:bg-slate-900 dark:text-white">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold">{title}</h3>
                    <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function AgendaModal({ eventId, initial, date, onClose }: { eventId: number; initial: Agenda | null; date: string; onClose: () => void }) {
    const f = useForm({
        title: initial?.title ?? '', date: initial?.date ?? date, start_time: initial?.start_time ?? '', end_time: initial?.end_time ?? '',
        location: initial?.location ?? '', description: initial?.description ?? '', type: initial?.type ?? 'agenda', remind_minutes: initial?.remind_minutes ? String(initial.remind_minutes) : '',
    });
    const e = f.errors as Record<string, string | undefined>;
    const base = `/panel/event/${eventId}/kalender/agenda`;
    const submit = (ev: React.FormEvent) => {
        ev.preventDefault();
        const opt = { preserveScroll: true, onSuccess: onClose };
        if (initial) f.put(`${base}/${initial.id}`, opt);
        else f.post(base, opt);
    };
    const err = (k: string) => e[k] && <span className="text-xs text-rose-600">{e[k]}</span>;

    return (
        <Modal title={initial ? 'Ubah agenda' : 'Tambah agenda'} onClose={onClose}>
            <form onSubmit={submit} className="mt-5 space-y-4">
                <label className="block"><span className={lbl}>Judul</span><input value={f.data.title} maxLength={120} onChange={(x) => f.setData('title', x.target.value)} placeholder="Contoh: Technical meeting" className={inp} />{err('title')}</label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className={lbl}>Tanggal</span><input type="date" style={{ minHeight: '2.5rem' }} value={f.data.date} onChange={(x) => f.setData('date', x.target.value)} className={inp} />{err('date')}</label>
                    <label className="block"><span className={lbl}>Jenis</span><select style={{ appearance: 'none', WebkitAppearance: 'none', minHeight: '2.5rem', paddingRight: '2.25rem', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5l5 5 5-5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }} value={f.data.type} onChange={(x) => f.setData('type', x.target.value)} className={inp}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className={lbl}>Jam mulai</span><input type="time" style={{ minHeight: '2.5rem' }} value={f.data.start_time} onChange={(x) => f.setData('start_time', x.target.value)} className={inp} />{err('start_time')}</label>
                    <label className="block"><span className={lbl}>Jam selesai</span><input type="time" style={{ minHeight: '2.5rem' }} value={f.data.end_time} onChange={(x) => f.setData('end_time', x.target.value)} className={inp} />{err('end_time')}</label>
                </div>
                <label className="block"><span className={lbl}>Lokasi</span><input value={f.data.location} maxLength={150} onChange={(x) => f.setData('location', x.target.value)} className={inp} /></label>
                <label className="block"><span className={lbl}>Catatan</span><textarea rows={3} value={f.data.description} maxLength={500} onChange={(x) => f.setData('description', x.target.value)} className={inp} /></label>
                <label className="block"><span className={lbl}>Pengingat ke peserta</span>
                    <select style={{ appearance: 'none', WebkitAppearance: 'none', minHeight: '2.5rem', paddingRight: '2.25rem', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5l5 5 5-5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }} value={f.data.remind_minutes} onChange={(x) => f.setData('remind_minutes', x.target.value)} className={inp}>{REMIND.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                    <span className="mt-1 block text-xs text-slate-500">Dikirim ke peserta event lewat notifikasi dan email.</span>
                </label>
                <button type="submit" disabled={f.processing || !f.data.title.trim() || !f.data.date} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50">{f.processing ? 'Menyimpan…' : 'Simpan agenda'}</button>
            </form>
        </Modal>
    );
}

function PhaseModal({ eventId, phases, onClose }: { eventId: number; phases: Props['phases']; onClose: () => void }) {
    const f = useForm({
        registration_start: phases.registration.start ?? '', registration_end: phases.registration.end ?? '',
        preparation_start: phases.preparation.start ?? '', preparation_end: phases.preparation.end ?? '',
    });
    const e = f.errors as Record<string, string | undefined>;
    const row = (title: string, a: 'registration_start' | 'preparation_start', b: 'registration_end' | 'preparation_end') => (
        <div>
            <div className="font-extrabold">{title}</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="block"><span className={lbl}>Mulai</span><input type="date" style={{ minHeight: '2.5rem' }} value={f.data[a]} onChange={(x) => f.setData(a, x.target.value)} className={inp} /></label>
                <label className="block"><span className={lbl}>Selesai</span><input type="date" style={{ minHeight: '2.5rem' }} value={f.data[b]} onChange={(x) => f.setData(b, x.target.value)} className={inp} />{e[b] && <span className="text-xs text-rose-600">{e[b]}</span>}</label>
            </div>
        </div>
    );
    return (
        <Modal title="Atur tahapan" onClose={onClose}>
            <form onSubmit={(x) => { x.preventDefault(); f.put(`/panel/event/${eventId}/kalender/tahapan`, { preserveScroll: true, onSuccess: onClose }); }} className="mt-5 space-y-5">
                {row('Pendaftaran', 'registration_start', 'registration_end')}
                {row('Persiapan', 'preparation_start', 'preparation_end')}
                <p className="text-xs text-slate-500">Kosongkan tanggal untuk menghapus tahapan. Pelaksanaan mengikuti tanggal event.</p>
                <button type="submit" disabled={f.processing} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50">{f.processing ? 'Menyimpan…' : 'Simpan tahapan'}</button>
            </form>
        </Modal>
    );
}

export default function Kalender({ eventId, event, phases, agendas, subAgendas, info }: Props) {
    const todayStr = useMemo(() => iso(new Date()), []);
    const phone = usePhone();
    const [view, setView] = useState<'linimasa' | 'kalender'>('linimasa');
    const [section, setSection] = useState<Section>('jadwal');
    const [agendaModal, setAgendaModal] = useState<{ item: Agenda | null; date: string } | null>(null);
    const [phaseModal, setPhaseModal] = useState(false);
    const [cur, setCur] = useState(() => { const d = D(event.starts_at); return { y: d.getFullYear(), m: d.getMonth() }; });

    const entries = useMemo<Entry[]>(() => {
        const out: Entry[] = [
            { key: 'start', date: event.starts_at, time: null, title: 'Event dimulai', tone: 'start' },
            { key: 'end', date: event.ends_at, time: null, title: 'Event selesai', tone: 'end' },
        ];
        const { registration: r, preparation: p } = phases;
        if (r.start) out.push({ key: 'rs', date: r.start, time: null, title: 'Pendaftaran dibuka', tone: 'phase' });
        if (r.end) out.push({ key: 're', date: r.end, time: null, title: 'Pendaftaran ditutup', tone: 'phase' });
        if (p.start) out.push({ key: 'ps', date: p.start, time: null, title: 'Persiapan dimulai', tone: 'phase' });
        if (p.end) out.push({ key: 'pe', date: p.end, time: null, title: 'Persiapan selesai', tone: 'phase' });
        agendas.forEach((a) => out.push({ key: `a${a.id}`, date: a.date, time: a.start_time, title: a.title, tone: 'agenda', agenda: a }));
        (subAgendas ?? []).forEach((a) => out.push({ key: `s${a.id}`, date: a.date, time: a.start_time, title: `[${a.sub_title}] ${a.title}`, tone: 'agenda' }));
        return out.sort((x, y) => x.date.localeCompare(y.date) || (x.time ?? '').localeCompare(y.time ?? ''));
    }, [event, phases, agendas, subAgendas]);

    const groups = useMemo(() => {
        const m = new Map<string, Entry[]>();
        entries.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
        return [...m.entries()];
    }, [entries]);
    const nowIdx = (() => { const i = groups.findIndex(([d]) => d >= todayStr); return i === -1 ? groups.length : i; })();

    const hLabel = (d: string) => { const n = diff(d, event.starts_at); return n === 0 ? 'Hari H' : n > 0 ? `H+${n}` : `H${n}`; };
    const untilStart = diff(event.starts_at, todayStr);
    const startNote = untilStart > 0 ? `${untilStart} hari lagi` : todayStr > event.ends_at ? 'Sudah selesai' : 'Sedang berlangsung';
    const reg = phaseStatus(phases.registration, todayStr);
    const prep = phaseStatus(phases.preparation, todayStr);
    const run = phaseStatus({ start: event.starts_at, end: event.ends_at }, todayStr);

    const del = (a: Agenda) => { if (confirm(`Hapus agenda "${a.title}"?`)) router.delete(`/panel/event/${eventId}/kalender/agenda/${a.id}`, { preserveScroll: true }); };

    const marker = (
        <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-rose-300" />
            <span className="rounded-full bg-rose-500 px-3 py-1 text-[10px] font-extrabold tracking-widest text-white uppercase">Hari ini · {fmt(todayStr)}</span>
            <span className="h-px flex-1 bg-rose-300" />
        </div>
    );

    const cells = useMemo(() => {
        const lead = new Date(cur.y, cur.m, 1).getDay();
        const n = new Date(cur.y, cur.m + 1, 0).getDate();
        const arr: (string | null)[] = Array(lead).fill(null);
        for (let d = 1; d <= n; d++) arr.push(iso(new Date(cur.y, cur.m, d)));
        return arr;
    }, [cur]);
    const byDate = useMemo(() => { const m = new Map<string, Entry[]>(); entries.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e])); return m; }, [entries]);
    const shift = (n: number) => setCur((c) => { const d = new Date(c.y, c.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

    const stat = (title: string, big: string, sub: string, subCls = 'text-slate-500') => (
        <div className={`rounded-2xl p-5 ${glass}`}>
            <div className="text-[10px] font-extrabold tracking-[0.22em] text-slate-500 uppercase">{title}</div>
            <div className="mt-2 text-xl font-extrabold">{big}</div>
            <div className={`mt-0.5 text-xs font-semibold ${subCls}`}>{sub}</div>
        </div>
    );
    const phase = (title: string, sub: string, st: { label: string; cls: string }, onEdit?: () => void) => (
        <div className={`flex items-center justify-between gap-3 rounded-2xl p-5 ${glass}`}>
            <div className="min-w-0"><div className="text-base font-extrabold">{title}</div><div className="truncate text-xs text-slate-500">{sub}</div></div>
            <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                {onEdit && <button type="button" onClick={onEdit} aria-label={`Atur ${title}`} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>}
            </div>
        </div>
    );

    return (
        <PanelLayout title="Kalender Kegiatan">
            {info && <InfoBar eventId={eventId} eventTitle={event.title} info={info} phases={phases} section={section} setSection={setSection} compact={phone} view={view} setView={setView}
                meta={{ startsAt: event.starts_at, startNote, agendaCount: agendas.length + (subAgendas?.length ?? 0), reg, prep, run, regText: rangeText(phases.registration), prepText: rangeText(phases.preparation), runText: rangeText({ start: event.starts_at, end: event.ends_at }), onPhase: () => setPhaseModal(true) }} />}
            {section !== 'jadwal' && info && !phone ? <InfoSections section={section} eventId={eventId} eventTitle={event.title} startsAt={event.starts_at} endsAt={event.ends_at} info={info} /> : phone ? (
                <KalenderPanelMobile
                    startsAt={event.starts_at} startNote={startNote} agendaCount={agendas.length + (subAgendas?.length ?? 0)}
                    reg={reg} prep={prep} run={run}
                    regText={rangeText(phases.registration)} prepText={rangeText(phases.preparation)} runText={rangeText({ start: event.starts_at, end: event.ends_at })}
                    onPhase={() => setPhaseModal(true)}
                    section={section} setSection={setSection} rundownCount={info?.rundown.length ?? 0} announcementCount={info?.announcements.length ?? 0}
                    view={view} setView={setView} todayStr={todayStr}
                    groups={groups} nowIdx={nowIdx} hLabel={hLabel} fmt={fmt}
                    cur={cur} cells={cells} byDate={byDate} shift={shift}
                    onAdd={(date) => setAgendaModal({ item: null, date })}
                    onEdit={(a, date) => setAgendaModal({ item: a, date })}
                    onDelete={del}>
                    {section !== 'jadwal' && info ? <InfoSections section={section} eventId={eventId} eventTitle={event.title} startsAt={event.starts_at} endsAt={event.ends_at} info={info} /> : null}
                </KalenderPanelMobile>
            ) : (
            <>
            {/* LINIMASA2 */}
            <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-3.5 sm:px-4 ${glass}`}>
                <div className="mr-auto flex flex-wrap items-baseline gap-x-3">
                    <span className="text-sm font-extrabold">{view === 'linimasa' ? 'Linimasa' : 'Kalender'}</span>
                    <span className="text-xs text-slate-500">{agendas.length + (subAgendas?.length ?? 0)} agenda · {groups.length} tanggal</span>
                </div>
                <button type="button" onClick={() => setAgendaModal({ item: null, date: todayStr })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-600/25"><Plus className="h-4 w-4" />Tambah agenda</button>
            </div>

            {view === 'linimasa' ? (
                <div className="space-y-3 pt-1">{/* LINIMASA3 */}
                    {groups.map(([d, list], gi) => {
                        const dt = D(d);
                        const isToday = d === todayStr;
                        const past = d < todayStr;
                        return (
                            <Fragment key={d}>
                                {gi === nowIdx && marker}
                                <section className={`flex overflow-hidden rounded-2xl ${glass} ${past ? 'opacity-70' : ''}`}>
                                    <div className={`flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 px-2 py-4 text-white sm:w-28 ${isToday ? 'bg-gradient-to-b from-rose-500 to-rose-600' : 'bg-gradient-to-b from-indigo-600 to-violet-600'}`}>
                                        <span className="text-[11px] font-extrabold tracking-widest opacity-80">{DAYS[dt.getDay()]}</span>
                                        <span className="text-3xl leading-none font-extrabold">{dt.getDate()}</span>
                                        <span className="text-[11px] font-extrabold tracking-widest opacity-80">{MONS[dt.getMonth()]}</span>
                                        <span className="mt-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{hLabel(d)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1 divide-y divide-slate-200/70 dark:divide-white/10">
                                        {list.map((e) => {
                                            const isSub = /^s\d/.test(e.key);
                                            const dot = ({ start: 'bg-blue-600', end: 'bg-violet-600', phase: 'bg-emerald-500', agenda: 'bg-indigo-400' } as Record<string, string>)[e.tone];
                                            if (!e.agenda && !isSub) {
                                                return (
                                                    <div key={e.key} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                                                        <span className={`text-sm font-bold ${TONE[e.tone].text}`}>{e.title}</span>
                                                        <span className="ml-auto text-[11px] font-semibold text-slate-400">Otomatis</span>
                                                    </div>
                                                );
                                            }
                                            const time = e.agenda ? (e.agenda.start_time ? `${e.agenda.start_time}${e.agenda.end_time ? ` – ${e.agenda.end_time}` : ''}` : 'Seharian') : (e.time ?? 'Seharian');
                                            return (
                                                <div key={e.key} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                                                    <span className="w-28 shrink-0 pt-0.5 text-sm font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">{time}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            <span className="text-base font-bold">{e.title}</span>
                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{e.agenda ? TYPES[e.agenda.type] ?? 'Agenda' : 'Lomba'}</span>
                                                            {e.agenda?.remind_minutes && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Bell className="h-3.5 w-3.5" />{REMIND.find(([k]) => k === String(e.agenda!.remind_minutes))?.[1]}</span>}
                                                        </div>
                                                        {e.agenda?.location && <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><MapPin className="h-3.5 w-3.5" />{e.agenda.location}</p>}
                                                        {e.agenda?.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{e.agenda.description}</p>}
                                                    </div>
                                                    {e.agenda && (
                                                        <span className="flex shrink-0 gap-0.5">
                                                            <button type="button" aria-label="Ubah" onClick={() => setAgendaModal({ item: e.agenda!, date: e.date })} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                                                            <button type="button" aria-label="Hapus" onClick={() => del(e.agenda!)} className="rounded-full p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </Fragment>
                        );
                    })}
                    {nowIdx === groups.length && marker}
                </div>
            ) : (
                <div className={`rounded-3xl p-5 ${glass}`}>
                    <div className="mb-4 flex items-center justify-between">
                        <button type="button" onClick={() => shift(-1)} aria-label="Bulan sebelumnya" className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></button>
                        <div className="flex items-center gap-2 text-lg font-extrabold"><CalendarDays className="h-5 w-5 text-indigo-600" />{new Date(cur.y, cur.m, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
                        <button type="button" onClick={() => shift(1)} aria-label="Bulan berikutnya" className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight className="h-5 w-5" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold tracking-widest text-slate-500">{DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}</div>
                    <div className="mt-1 grid grid-cols-7 gap-1.5">
                        {cells.map((d, i) => d === null ? <div key={`b${i}`} /> : (
                            <button key={d} type="button" onClick={() => setAgendaModal({ item: null, date: d })} className={`min-h-24 rounded-xl border p-1.5 text-left align-top transition hover:border-indigo-400 ${d === todayStr ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-500/10' : 'border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-white/5'}`}>
                                <div className={`text-xs font-extrabold ${d === todayStr ? 'text-rose-600' : 'text-slate-500'}`}>{D(d).getDate()}</div>
                                <div className="mt-1 space-y-1">
                                    {(byDate.get(d) ?? []).slice(0, 2).map((e) => <div key={e.key} className={`truncate rounded-md border-l-2 px-1.5 py-0.5 text-[10px] font-bold ${TONE[e.tone].box} ${TONE[e.tone].text}`}>{e.title}</div>)}
                                    {(byDate.get(d)?.length ?? 0) > 2 && <div className="text-[10px] font-bold text-slate-500">+{(byDate.get(d)?.length ?? 0) - 2} lagi</div>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            </>
            )}

            {agendaModal && <AgendaModal eventId={eventId} initial={agendaModal.item} date={agendaModal.date} onClose={() => setAgendaModal(null)} />}
            {phaseModal && <PhaseModal eventId={eventId} phases={phases} onClose={() => setPhaseModal(false)} />}
        </PanelLayout>
    );
}
