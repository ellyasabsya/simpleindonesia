import PanelLayout from '@/components/panel/panel-layout';
import TicketScanner, { type Result } from '@/components/panel/ticket-scanner';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

type Row = { code: string; reg_id: string | null; name: string; type: string | null; buyer: string | null; at: string | null; sub?: string | null };
type Props = { eventId: number; rows: Row[]; subs?: string[] };

const PER_PAGE = 25;
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';

function xsrf() {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
}

export default function Checkin({ eventId, rows: initial, subs: subList }: Props) {
    const [rows, setRows] = useState<Row[]>(initial);
    const [q, setQ] = useState('');
    const [type, setType] = useState('');
    const [sub, setSub] = useState('');
    const [tab, setTab] = useState<'semua' | 'hadir' | 'belum'>('semua');
    const [page, setPage] = useState(1);
    const [busy, setBusy] = useState('');
    const [err, setErr] = useState('');

    const mark = useCallback((code: string, at: string) => {
        setRows((l) => l.map((r) => (r.code === code ? { ...r, at } : r)));
    }, []);
    const onIn = useCallback((r: Result) => { if (r.code && r.at) mark(r.code, r.at); }, [mark]);

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
    const scoped = useMemo(() => (sub ? rows.filter((r) => r.sub === sub) : rows), [rows, sub]);
    const total = scoped.length;
    const hadir = useMemo(() => scoped.filter((r) => r.at).length, [scoped]);
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

    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const cur = Math.min(page, pages);
    const view = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
    const from = list.length === 0 ? 0 : (cur - 1) * PER_PAGE + 1;
    const to = Math.min(cur * PER_PAGE, list.length);

    const stat = (t: string, v: number, extra?: string) => (
        <div className={`${card} px-5 py-4`}>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t}</div>
            <div className="mt-1 text-2xl font-extrabold">{v}{extra && <span className="ml-1 text-sm font-semibold text-slate-500">{extra}</span>}</div>
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
            <div className="space-y-5">

                <div className="grid gap-4 sm:grid-cols-3">
                    {stat('Sudah hadir', hadir, `(${pct}%)`)}
                    {stat('Belum hadir', total - hadir)}
                    {stat('Total tiket lunas', total)}
                </div>
                <div className="-mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all" style={{ width: `${pct}%` }} />
                </div>

                <div className={`${card} p-5`}>
                    <TicketScanner eventId={eventId} inline onCheckedIn={onIn} />
                </div>

                <div className={`${card} overflow-hidden`}>
                    <div className="space-y-4 p-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="mr-auto text-lg font-extrabold">Daftar peserta <span className="text-sm font-semibold text-slate-500">({list.length})</span></h3>
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
                        <p className="border-t border-slate-200 px-5 py-12 text-center text-sm font-semibold text-slate-500 dark:border-white/10">{total === 0 ? 'Belum ada tiket lunas.' : 'Tidak ada data yang cocok.'}</p>
                    ) : (
                        <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[820px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr className="text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                        <th className="w-[210px] px-5 py-3">ID registrasi</th>
                                        <th className="px-3 py-3">Peserta</th>
                                        {hasSub && <th className="px-3 py-3">Sub-event</th>}
                                        <th className="px-3 py-3">Jenis</th>
                                        <th className="px-3 py-3">Pembeli</th>
                                        <th className="w-[170px] px-3 py-3">Kehadiran</th>
                                        <th className="w-[120px] px-5 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {view.map((r) => (
                                        <tr key={r.code} className="align-middle">
                                            <td className="px-5 py-3 font-mono text-[13px] font-bold text-indigo-700 dark:text-indigo-300">{r.reg_id ?? <span className="font-sans font-semibold text-slate-400">-</span>}</td>
                                            <td className="px-3 py-3"><div className="font-extrabold">{r.name}</div><div className="font-mono text-[11px] text-slate-500">{r.code}</div></td>
                                            {hasSub && <td className="px-3 py-3 font-semibold">{r.sub}</td>}
                                            <td className="px-3 py-3">{r.type && <span className="whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200">{r.type}</span>}</td>
                                            <td className="px-3 py-3 font-semibold">{r.buyer}</td>
                                            <td className="px-3 py-3">
                                                {r.at
                                                    ? <div><span className="whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Sudah hadir</span><div className="mt-1 text-xs text-slate-500">{r.at}</div></div>
                                                    : <span className="whitespace-nowrap rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">Belum hadir</span>}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {!r.at && <button type="button" disabled={busy === r.code} onClick={() => rowCheckin(r)} className="rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60">{busy === r.code ? '...' : 'Check-in'}</button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {list.length > PER_PAGE && (
                        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-xs font-semibold text-slate-500 dark:border-white/10">
                            <span>{from}-{to} dari {list.length}</span>
                            <div className="flex items-center gap-2">
                                <button type="button" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"><ChevronLeft className="h-4 w-4" /></button>
                                <span>Halaman {cur} / {pages}</span>
                                <button type="button" disabled={cur >= pages} onClick={() => setPage(cur + 1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"><ChevronRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PanelLayout>
    );
}
