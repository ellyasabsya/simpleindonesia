import PanelLayout from '@/components/panel/panel-layout';
import TicketScanner, { type Result } from '@/components/panel/ticket-scanner';
import CheckinMobile from '@/components/mobile/pages/checkin-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import { CalendarDays as StatToday, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock as StatClock, Search, UserCheck as StatCheck, Users as StatUsers } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

type Row = { code: string; reg_id: string | null; name: string; type: string | null; buyer: string | null; at: string | null; sub?: string | null; kind?: string; also?: boolean };
type Props = { eventId: number; rows: Row[]; subs?: string[] };

const PER_PAGE_OPTIONS = [10, 15, 25, 50];
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';

function xsrf() {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function KindBadge({ r }: { r: Row }) {
    return (
        <>
            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${r.kind === 'pengunjung' ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-800'}`}>{r.kind === 'pengunjung' ? 'Pengunjung' : 'Peserta'}</span>
            {r.also && <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Juga peserta</span>}
        </>
    );
}

const th = 'border-b border-r border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700 last:border-r-0 dark:border-white/10 dark:text-slate-200';
const td = 'border-b border-r border-slate-100 px-3 py-2.5 align-middle last:border-r-0 dark:border-white/10';
const pgIcon = 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10';
const pgNum = (on: boolean) => `inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-extrabold ${on ? 'bg-indigo-700 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'}`;

export default function Checkin({ eventId, rows: initial, subs: subList }: Props) {
    const [rows, setRows] = useState<Row[]>(initial);
    const [q, setQ] = useState('');
    const [type, setType] = useState('');
    const [sub, setSub] = useState('');
    const [kind, setKind] = useState<'' | 'pengunjung' | 'peserta'>('');
    const [tab, setTab] = useState<'semua' | 'hadir' | 'belum'>('semua');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [busy, setBusy] = useState('');
    const [err, setErr] = useState('');
    const phone = usePhone();

    const mark = useCallback((code: string, at: string) => {
        setRows((l) => l.map((r) => (r.code === code ? ({ ...r, at, today: true } as typeof r) : r)));
    }, []);
    const onIn = useCallback((r: Result) => {
        const codes = (r as Result & { codes?: string[] }).codes;
        if (codes && r.at) codes.forEach((c) => mark(c, r.at as string));
        else if (r.code && r.at) mark(r.code, r.at);
    }, [mark]);

    const rowCheckin = async (r: Row) => {
        setBusy(r.code); setErr('');
        try {
            const res = await fetch(`/panel/event/${eventId}/registrasi/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf(), 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ code: r.code }),
            });
            if (!res.ok) throw new Error();
            const d: Result = await res.json();
            if ((d.status === 'ok' || d.status === 'duplikat') && d.at) mark(r.code, d.at);
            else setErr(`Gagal check-in ${r.name}.`);
        } catch {
            setErr(`Gagal check-in ${r.name}. Coba lagi.`);
        } finally {
            setBusy('');
        }
    };

    const subs = useMemo(
        () => (subList && subList.length > 0 ? subList : Array.from(new Set(rows.map((r) => r.sub).filter(Boolean) as string[]))),
        [subList, rows],
    );
    const hasSub = subs.length > 0;

    // Statistik mengikuti chip sub-event yang dipilih
    const inSub = useMemo(() => (sub ? rows.filter((r) => r.sub === sub) : rows), [rows, sub]);
    const showKind = useMemo(() => rows.some((r) => r.kind === 'pengunjung') && rows.some((r) => r.kind !== 'pengunjung'), [rows]);
    const kindStat = useMemo(() => {
        const m = { pengunjung: { t: 0, h: 0 }, peserta: { t: 0, h: 0 } };
        for (const r of inSub) {
            const k = r.kind === 'pengunjung' ? 'pengunjung' : 'peserta';
            m[k].t += 1;
            if (r.at) m[k].h += 1;
        }
        return m;
    }, [inSub]);
    const scoped = useMemo(() => (kind ? inSub.filter((r) => (r.kind ?? 'peserta') === kind) : inSub), [inSub, kind]);
    const total = scoped.length;
    const hadir = useMemo(() => scoped.filter((r) => r.at).length, [scoped]);
    const hadirHariIni = useMemo(() => scoped.filter((r) => (r as { today?: boolean }).today).length, [scoped]);
    const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const types = useMemo(() => Array.from(new Set(rows.map((r) => r.type).filter(Boolean) as string[])), [rows]);

    const subStat = useMemo(() => {
        const m: Record<string, { t: number; h: number }> = {};
        for (const s of subs) m[s] = { t: 0, h: 0 };
        for (const r of rows) {
            if (!r.sub) continue;
            m[r.sub] = m[r.sub] ?? { t: 0, h: 0 };
            m[r.sub].t += 1;
            if (r.at) m[r.sub].h += 1;
        }
        return m;
    }, [rows, subs]);

    const list = useMemo(() => {
        const k = q.trim().toLowerCase();
        return scoped.filter((r) =>
            (!type || r.type === type) &&
            (tab === 'semua' || (tab === 'hadir' ? !!r.at : !r.at)) &&
            (!k || [r.reg_id ?? '', r.name, r.buyer ?? '', r.code, r.sub ?? ''].some((v) => v.toLowerCase().includes(k))),
        );
    }, [scoped, q, type, tab]);

    const pages = Math.max(1, Math.ceil(list.length / perPage));
    const cur = Math.min(page, pages);
    const view = list.slice((cur - 1) * perPage, cur * perPage);
    const from = list.length === 0 ? 0 : (cur - 1) * perPage + 1;
    const to = Math.min(cur * perPage, list.length);

    const tones = {
        hadir: { Icon: StatCheck, soft: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
        hariIni: { Icon: StatToday, soft: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300' },
        belum: { Icon: StatClock, soft: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-300' },
        total: { Icon: StatUsers, soft: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
    };
    const stat = (tone: (typeof tones)[keyof typeof tones], t: string, v: number, extra?: string) => (
        <div className={`group relative min-w-0 overflow-hidden rounded-2xl px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${tone.soft}`}>
            <tone.Icon className={`absolute -bottom-4 -right-3 h-24 w-24 opacity-10 transition group-hover:scale-110 ${tone.text}`} />
            <div className="relative">
                <div className={`break-words text-2xl font-extrabold sm:text-3xl ${tone.text}`}>{v}{extra && <span className="ml-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{extra}</span>}</div>
                <div className={`mt-1.5 text-sm font-bold ${tone.text}`}>{t}</div>
            </div>
        </div>
    );
    const tabBtn = (k: typeof tab, label: string) => (
        <button type="button" onClick={() => { setTab(k); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === k ? 'bg-indigo-900 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}>{label}</button>
    );
    const chip = (on: boolean) =>
        `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`;

    return (
        <PanelLayout title="Check-in">
            {phone && (
                <CheckinMobile
                    scanner={<TicketScanner eventId={eventId} inline onCheckedIn={onIn} />}
                    hadir={hadir} hadirHariIni={hadirHariIni} total={total} pct={pct}
                    tab={tab} setTab={(t) => { setTab(t); setPage(1); }}
                    q={q} setQ={(v) => { setQ(v); setPage(1); }}
                    type={type} setType={(v) => { setType(v); setPage(1); }} types={types}
                    sub={sub} setSub={(v) => { setSub(v); setPage(1); }} subs={subs} subStat={subStat}
                    allHadir={rows.filter((r) => r.at).length} allTotal={rows.length}
                    showKind={showKind} kind={kind} setKind={(v) => { setKind(v as typeof kind); setPage(1); }} kindStat={kindStat}
                    view={view} count={list.length} busy={busy} err={err} onCheckin={rowCheckin}
                    cur={cur} pages={pages} setPage={setPage}
                />
            )}
            <div className={phone ? 'hidden' : 'space-y-5'}>

                <div className={`${card} p-6 sm:p-8`}>
                <h2 className="flex flex-wrap items-center gap-3 text-xl font-bold">
                    Check-in
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{hadir} dari {total} hadir</span>
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Pindai tiket atau masukkan kode peserta untuk mencatat kehadiran.</p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                    {stat(tones.hadir, 'Sudah hadir', hadir, `(${pct}%)`)}
                    {stat(tones.hariIni, 'Hadir hari ini', hadirHariIni)}
                    {stat(tones.belum, 'Belum hadir', total - hadir)}
                    {stat(tones.total, 'Total terdaftar', total)}
                </div>

                <div className="mt-6">
                    {!phone && <TicketScanner eventId={eventId} inline onCheckedIn={onIn} />}
                </div>
                </div>

                <div className={`${card} p-4 sm:p-6`}>
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="space-y-4 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="mr-auto text-lg font-bold">Daftar peserta <span className="text-sm font-semibold text-slate-500">({list.length})</span></h3>
                            <div className="flex gap-1 rounded-xl border border-slate-200 p-1 dark:border-white/10">
                                {tabBtn('semua', 'Semua')}{tabBtn('hadir', 'Sudah hadir')}{tabBtn('belum', 'Belum hadir')}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari ID, nama, pembeli, kode" className={`${field} w-64 pl-9`} />
                            </div>
                            {types.length > 1 && (
                                <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={field}>
                                    <option value="">Semua jenis tiket</option>
                                    {types.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            )}
                        </div>
                                                {showKind && (
                            <div className="flex flex-wrap gap-2">
                                {([['', 'Semua', { t: inSub.length, h: inSub.filter((r) => r.at).length }], ['pengunjung', 'Pengunjung', kindStat.pengunjung], ['peserta', 'Peserta', kindStat.peserta]] as const).map(([k, l, st]) => (
                                    <button key={k} type="button" onClick={() => { setKind(k); setPage(1); }} className={chip(kind === k)}>
                                        {l} · hadir {st.h} dari {st.t}
                                    </button>
                                ))}
                            </div>
                        )}
                        {hasSub && (
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => { setSub(''); setPage(1); }} className={chip(sub === '')}>
                                    Semua sub-event · {rows.filter((r) => r.at).length}/{rows.length}
                                </button>
                                {subs.map((s) => (
                                    <button key={s} type="button" onClick={() => { setSub(s); setPage(1); }} className={chip(sub === s)}>
                                        {s} · {subStat[s]?.h ?? 0}/{subStat[s]?.t ?? 0}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {err && <p className="px-5 pb-3 text-xs font-semibold text-rose-600">{err}</p>}

                    {view.length === 0 ? (
                        <p className="border-t border-slate-200 px-5 py-12 text-center text-sm font-semibold text-slate-500 dark:border-white/10">{total === 0 ? 'Belum ada data check-in.' : 'Tidak ada data yang cocok.'}</p>
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        <th className={`${th} w-[210px]`}>ID registrasi</th>
                                        <th className={th}>Peserta</th>
                                        {hasSub && <th className={th}>Sub-event</th>}
                                        <th className={th}>Jenis</th>
                                        <th className={th}>Pembeli / sekolah</th>
                                        <th className={`${th} w-[170px]`}>Kehadiran</th>
                                        <th className={`${th} w-[120px] text-right`}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {view.map((r) => (
                                        <tr key={r.code} className="align-middle transition-colors hover:bg-indigo-50/60 dark:hover:bg-white/5">
                                            <td className={`${td} font-mono text-[13px] font-bold text-indigo-700 dark:text-indigo-300`}>{r.reg_id ?? <span className="font-sans font-semibold text-slate-400">-</span>}</td>
                                            <td className={`${td}`}><div className="font-extrabold">{r.name}</div><div className="font-mono text-[11px] text-slate-500">{r.code}</div></td>
                                            {hasSub && <td className={`${td} font-semibold`}>{r.sub}</td>}
                                            <td className={`${td}`}><div className="flex flex-wrap items-center gap-1"><KindBadge r={r} />{r.type && <span className="whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{r.type}</span>}</div></td>
                                            <td className={`${td} font-semibold`}>{r.buyer}</td>
                                            <td className={`${td}`}>
                                                {r.at
                                                    ? <div><span className="whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Sudah hadir</span><div className="mt-1 text-xs text-slate-500">{r.at}</div></div>
                                                    : <span className="whitespace-nowrap rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">Belum hadir</span>}
                                            </td>
                                            <td className={`${td} text-right`}>
                                                {!r.at && <button type="button" disabled={busy === r.code} onClick={() => rowCheckin(r)} className="rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60">{busy === r.code ? '...' : 'Check-in'}</button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {view.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-white/10">
                            <span className="text-xs font-bold text-slate-500">{list.length} total</span>
                            <div className="flex items-center gap-1">
                                <button type="button" className={pgIcon} disabled={cur <= 1} onClick={() => setPage(1)} aria-label="Halaman pertama"><ChevronsLeft className="h-4 w-4" /></button>
                                <button type="button" className={pgIcon} disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></button>
                                {Array.from({ length: Math.min(5, pages) }, (_, k) => Math.max(1, Math.min(cur - 2, pages - 4)) + k).map((n) => (
                                    <button key={n} type="button" onClick={() => setPage(n)} className={pgNum(n === cur)} aria-current={n === cur ? 'page' : undefined}>{n}</button>
                                ))}
                                <button type="button" className={pgIcon} disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></button>
                                <button type="button" className={pgIcon} disabled={cur >= pages} onClick={() => setPage(pages)} aria-label="Halaman terakhir"><ChevronsRight className="h-4 w-4" /></button>
                                <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className={`${field} ml-2 py-1.5`} aria-label="Baris per halaman">
                                    {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} per halaman</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </PanelLayout>
    );
}
