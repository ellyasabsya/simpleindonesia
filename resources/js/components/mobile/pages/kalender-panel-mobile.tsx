import { Bell, ChevronLeft, ChevronRight, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type Agenda = { id: number; title: string; date: string; start_time: string | null; end_time: string | null; location: string | null; description: string | null; type: string; remind_minutes: number | null };
type Tone = 'start' | 'end' | 'phase' | 'agenda';
type Entry = { key: string; date: string; time: string | null; title: string; tone: Tone; agenda?: Agenda };
type Status = { label: string; cls: string };

type Props = {
    startsAt: string;
    startNote: string;
    agendaCount: number;
    reg: Status; prep: Status; run: Status;
    regText: string; prepText: string; runText: string;
    onPhase: () => void;
    section: 'jadwal' | 'rundown' | 'pengumuman';
    setSection: (s: 'jadwal' | 'rundown' | 'pengumuman') => void;
    rundownCount: number;
    announcementCount: number;
    children?: ReactNode;
    view: 'linimasa' | 'kalender';
    setView: (v: 'linimasa' | 'kalender') => void;
    todayStr: string;
    groups: [string, Entry[]][];
    nowIdx: number;
    hLabel: (d: string) => string;
    fmt: (s: string) => string;
    cur: { y: number; m: number };
    cells: (string | null)[];
    byDate: Map<string, Entry[]>;
    shift: (n: number) => void;
    onAdd: (date: string) => void;
    onEdit: (a: Agenda, date: string) => void;
    onDelete: (a: Agenda) => void;
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const TYPES: Record<string, string> = { agenda: 'Agenda', rapat: 'Rapat', latihan: 'Latihan', gladi: 'Gladi', lainnya: 'Lainnya' };
const REMIND: Record<string, string> = { '15': '15 menit sebelum', '60': '1 jam sebelum', '180': '3 jam sebelum', '1440': '1 hari sebelum', '4320': '3 hari sebelum' };
const BAR: Record<Tone, string> = { start: 'border-l-indigo-600', end: 'border-l-violet-600', phase: 'border-l-emerald-500', agenda: 'border-l-slate-400' };
const DOT: Record<Tone, string> = { start: 'bg-indigo-600', end: 'bg-violet-600', phase: 'bg-emerald-500', agenda: 'bg-slate-400' };
const d0 = (s: string) => new Date(s + 'T00:00:00');
const tabCls = (on: boolean) =>
    'inline-flex h-10 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium capitalize ' + PRESS + ' ' +
    (on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : FIELD + ' text-slate-800 dark:text-slate-100');

/** Kalender Kegiatan HP (ringkas): ringkasan + tahapan, linimasa atau kalender bulanan. */
export default function KalenderPanelMobile(p: Props) {
    const [sel, setSel] = useState(p.todayStr);

    const row = (e: Entry) => {
        const a = e.agenda;
        const time = a?.start_time ? a.start_time + (a.end_time ? ' – ' + a.end_time : '') : 'Seharian';
        return (
            <div key={e.key} className={'space-y-1 border-l-4 px-3.5 py-3 ' + BAR[e.tone]}>
                <div className="flex items-start gap-2">
                    <span className="min-w-0 flex-1">
                        <span className={'block text-[11px] ' + MUTED}>{time} · {a ? TYPES[a.type] ?? 'Agenda' : 'Otomatis'}</span>
                        <span className="block text-sm leading-tight font-semibold">{e.title}</span>
                    </span>
                    {a && (
                        <span className="flex shrink-0 gap-1">
                            <button type="button" aria-label="Ubah" onClick={() => p.onEdit(a, e.date)} className={'flex size-9 items-center justify-center rounded-full ' + FIELD + ' ' + PRESS}><Pencil className="size-4" /></button>
                            <button type="button" aria-label="Hapus" onClick={() => p.onDelete(a)} className={'flex size-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 ' + PRESS}><Trash2 className="size-4" /></button>
                        </span>
                    )}
                </div>
                {a?.remind_minutes && <p className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300"><Bell className="size-3.5" />{REMIND[String(a.remind_minutes)]}</p>}
                {a?.location && <p className={'flex items-center gap-1 text-[11px] ' + MUTED}><MapPin className="size-3.5 shrink-0" />{a.location}</p>}
                {a?.description && <p className={'text-[11px] leading-snug ' + MUTED}>{a.description}</p>}
            </div>
        );
    };

    const marker = (
        <div className="flex items-center gap-2 py-2">
            <span className="h-px flex-1 bg-rose-400" />
            <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold tracking-wider text-white uppercase">Hari ini · {p.fmt(p.todayStr)}</span>
            <span className="h-px flex-1 bg-rose-400" />
        </div>
    );

    const dayList = p.byDate.get(sel) ?? [];

    return (
        <div className="space-y-4 pb-32">
            <section className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {([['linimasa', 'Linimasa'], ['kalender', 'Kalender']] as const).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => { p.setView(v); p.setSection('jadwal'); }} className={tabCls(p.section === 'jadwal' && p.view === v) + ' shrink-0'}>{l}</button>
                ))}
                {([['rundown', 'Rundown', p.rundownCount], ['pengumuman', 'Pengumuman', p.announcementCount]] as const).map(([k, l, n]) => (
                    <button key={k} type="button" onClick={() => p.setSection(k)} className={tabCls(p.section === k) + ' shrink-0 gap-1.5'}>
                        {l}{n ? <span className="rounded-full bg-slate-900/10 px-1.5 text-[11px] dark:bg-white/15">{n}</span> : null}
                    </button>
                ))}
            </section>

            {p.section !== 'jadwal' ? p.children : p.view === 'linimasa' ? (
                <section className="space-y-2">
                    {p.groups.map(([d, list], gi) => {
                        const dt = d0(d);
                        return (
                            <div key={d} className="space-y-2 pt-2">
                                {gi === p.nowIdx && marker}
                                <div>
                                    <p className="mb-1.5 flex items-center gap-2 px-1 text-xs font-semibold">
                                        <span>{DAYS[dt.getDay()]}, {p.fmt(d)}</span>
                                        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">{p.hLabel(d)}</span>
                                    </p>
                                    <div className={GROUP + ' divide-y divide-slate-900/[0.07] dark:divide-white/10'}>{list.map(row)}</div>
                                </div>
                            </div>
                        );
                    })}
                    {p.nowIdx === p.groups.length && marker}
                </section>
            ) : (
                <section className="space-y-2">
                    <div className={'rounded-2xl p-3 ' + CARD}>
                        <div className="mb-2 flex items-center justify-between">
                            <button type="button" onClick={() => p.shift(-1)} aria-label="Bulan sebelumnya" className={'flex size-10 items-center justify-center rounded-full ' + FIELD + ' ' + PRESS}><ChevronLeft className="size-4" /></button>
                            <span className="text-sm font-semibold">{new Date(p.cur.y, p.cur.m, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                            <button type="button" onClick={() => p.shift(1)} aria-label="Bulan berikutnya" className={'flex size-10 items-center justify-center rounded-full ' + FIELD + ' ' + PRESS}><ChevronRight className="size-4" /></button>
                        </div>
                        <div className={'grid grid-cols-7 text-center text-[11px] font-semibold ' + MUTED}>{DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1">
                            {p.cells.map((d, i) => {
                                if (d === null) return <div key={'b' + i} />;
                                const es = p.byDate.get(d) ?? [];
                                const on = d === sel;
                                const today = d === p.todayStr;
                                return (
                                    <button key={d} type="button" onClick={() => setSel(d)} className={'flex h-11 flex-col items-center justify-center rounded-xl text-[13px] font-medium ' + PRESS + ' ' + (on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : today ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300' : FIELD)}>
                                        {d0(d).getDate()}
                                        <span className="flex h-1.5 gap-0.5">
                                            {es.slice(0, 3).map((e) => <span key={e.key} className={'size-1 rounded-full ' + (on ? 'bg-white' : DOT[e.tone])} />)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] font-semibold">{p.fmt(sel)} · {dayList.length} kegiatan</p>
                        <button type="button" onClick={() => p.onAdd(sel)} className="text-xs font-medium text-indigo-700 dark:text-indigo-300">+ Tambah di tanggal ini</button>
                    </div>
                    {dayList.length === 0
                        ? <div className={'rounded-2xl px-4 py-6 text-center text-[13px] ' + FIELD + ' ' + MUTED}>Belum ada kegiatan di tanggal ini.</div>
                        : <div className={GROUP + ' divide-y divide-slate-900/[0.07] dark:divide-white/10'}>{dayList.map(row)}</div>}
                </section>
            )}
            <button type="button" aria-label="Tambah agenda" onClick={() => p.onAdd(p.view === 'kalender' ? sel : p.todayStr)} className={(p.section !== 'jadwal' || p.view === 'kalender' ? 'hidden ' : '') + 'fixed left-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 dark:bg-indigo-500 ' + PRESS}><Plus className="size-6" /></button>
        </div>
    );
}
