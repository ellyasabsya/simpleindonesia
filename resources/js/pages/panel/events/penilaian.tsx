import JuriTambah, { JuriBelumTugas, JuriHeader, JuriKosong } from './juri-undangan';
import OverallSettings from '@/components/panel/overall-settings';
import Publikasi from './publikasi';
import Rekap from './rekap';
import BasePanelLayout from '@/components/panel/panel-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { Check, ClipboardList, Copy, Lock, MinusCircle, Plus, RefreshCw, Trash2, Users, Megaphone, BarChart3, Trophy, Gavel } from 'lucide-react';
import { Fragment, useState, useEffect, Children, cloneElement, isValidElement } from 'react';

type SubRow = { id: number | null; name: string; description: string; weight: number | string };
type Row = { id: number | null; name: string; description: string; weight: number | string; subs?: SubRow[] };
type Ded = { name: string; points: number | string };
type Judge = { id: number; name: string; contact: string | null; active: boolean; url: string; done: number };
type Rank = { id: number; name: string; judges: number; final: number | null };
type Sub = { id: number; title: string; categories: number; approved: number; criteria: number; judges: number; participants: number; system?: string | null };
type Cat = { id: number; name: string; approved: boolean; participants: number };
type Cfg = { enabled: boolean; scale: number; judge_count: number; avg_decimals: number; rounding: 'nearest' | 'up' | 'down'; deduction_enabled: boolean };
type Props = {
    event: { id: number; title: string };
    isParent: boolean;
    subs?: Sub[];
    settings?: Cfg;
    criteria?: Row[];
    deductions?: Ded[];
    judges?: Judge[];
    siblings?: { id: number; title: string; approved: boolean }[];
    participants?: number;
    ranking?: Rank[];
    hasScores?: boolean;
    categories?: Cat[];
    category?: { id: number; name: string };
    system?: string | null;
    systemLock?: string | null;
    skLomba?: LsData | null;
    overall?: Overall | null;
    isSub?: boolean;
};

const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const lbl = 'text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300';
const inp = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-white/10 dark:bg-white/5';
const inpSm = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-white/10 dark:bg-white/5';
const btn = 'rounded-2xl bg-indigo-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50';
const num = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);

function Badge({ n }: { n: number }) {
    return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-extrabold text-white shadow-lg shadow-indigo-500/30">{n}</span>;
}

function Option({ on, label, approved, href }: { on: boolean; label: string; approved: boolean; href?: string }) {
    const cls = `flex items-center gap-2.5 rounded-xl border px-3 py-2 transition ${on ? 'border-indigo-500 bg-white shadow-sm dark:bg-white/10' : 'border-slate-200 bg-white/70 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5'}`;
    const inner = (
        <>
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-indigo-600' : 'border-slate-300'}`}>{on && <span className="h-2 w-2 rounded-full bg-indigo-600" />}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{label}</span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${approved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{approved ? 'Disahkan' : 'Belum'}</span>
        </>
    );
    return href && !on ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

function Stepper({ steps }: { steps: { label: string; done: boolean }[] }) {
    return (
        <ol className="grid grid-cols-4">
            {steps.map((s, i) => (
                <li key={s.label} className="relative flex flex-col items-center text-center">
                    {i > 0 && <span className={`absolute right-1/2 top-[18px] h-0.5 w-full ${steps[i - 1].done && s.done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-white/10'}`} />}
                    <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${s.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 bg-white text-slate-400 dark:bg-slate-900'}`}>{s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}</span>
                    <span className="mt-2 text-xs font-bold sm:text-sm">{s.label}</span>
                </li>
            ))}
        </ol>
    );
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/20'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
        </button>
    );
}

/** Sama dengan Judging::allocate di server: sisa terbesar, jumlah poin selalu = skala. */
const allocate = (scale: number, weights: number[]): number[] => {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return weights.map(() => 0);
    const ideal = weights.map((w) => (scale * w) / total);
    const base = ideal.map((v) => Math.floor(v + 1e-9));
    let rest = scale - base.reduce((a, b) => a + b, 0);
    const order = ideal.map((_, i) => i).sort((a, b) => Math.round((ideal[b] - base[b]) * 1e6) - Math.round((ideal[a] - base[a]) * 1e6) || a - b);
    for (const i of order) {
        if (rest <= 0) break;
        base[i]++;
        rest--;
    }
    return base;
};

/** Bagi 100% rata ke n sub kriteria (bilangan bulat, sisa ke sub paling atas). */
const autoSub = (subs: SubRow[]): SubRow[] => {
    const n = subs.length;
    if (n === 0) return subs;
    const base = Math.floor(100 / n);
    const rest = 100 - base * n;
    return subs.map((x, k) => ({ ...x, weight: base + (k < rest ? 1 : 0) }));
};

const SYSTEMS = [
    { key: 'weighted', name: 'Penilaian Berbasis Bobot Nilai', desc: 'Nilai akhir dari jumlah (nilai × bobot) tiap kriteria, dinilai beberapa juri. Cocok untuk lomba seni, vokal, tari, dan sejenisnya.', tag: 'Weighted · Versi 1', soon: false },
    { key: 'match', name: 'Penilaian Pertandingan', desc: 'Untuk event olahraga: skor, babak, dan klasemen.', tag: 'Olahraga', soon: true },
];

function SistemPicker({ base, title, system, lockReason, onChosen }: { base: string; title: string; system: string | null; lockReason: string | null; onChosen: () => void }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const canChange = !lockReason;
    const chosen = SYSTEMS.find((s) => s.key === system);

    const pick = (key: string | null) => {
        setBusy(true);
        setErr('');
        router.post(`${base}/sistem`, { system: key } as any, {
            preserveScroll: true,
            onSuccess: () => { if (key) onChosen(); },
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan.')),
            onFinish: () => setBusy(false),
        });
    };
    const cancel = () => {
        if (confirm('Batalkan pilihan sistem? Tab Juri, Pengaturan penilaian, Publikasi, dan Rekap nilai akan disembunyikan. Data yang sudah ada tidak dihapus.')) pick(null);
    };

    return (
        <div className={`${card} space-y-5 p-6`}>
            <div>
                <h2 className="text-xl font-extrabold">Sistem penilaian</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Pilih sistem penilaian untuk seluruh event ini. Tab Juri, Pengaturan penilaian, Publikasi, dan Rekap nilai muncul setelah sistem dipilih. Pengaturan per kategori dilakukan di dalam sistem.</p>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-extrabold text-indigo-700"><span className="h-2 w-2 rounded-full bg-indigo-600" /> Event: {title}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {SYSTEMS.map((s) => {
                    const on = system === s.key;
                    const can = !s.soon && !busy && !on && canChange;
                    return (
                        <button key={s.key} type="button" disabled={!can} onClick={() => pick(s.key)} className={`rounded-2xl border-2 p-4 text-left transition disabled:cursor-default ${on ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10' : 'border-slate-200 bg-white/70 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5'} ${s.soon || (!on && !canChange) ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-2.5">
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-indigo-600' : 'border-slate-300'}`}>{on && <span className="h-2 w-2 rounded-full bg-indigo-600" />}</span>
                                <span className="flex-1 text-sm font-extrabold">{s.name}</span>
                                {s.soon && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">Segera hadir</span>}
                            </div>
                            <p className="mt-1.5 pl-6 text-xs text-slate-600 dark:text-slate-300">{s.desc}</p>
                            <p className="mt-1 pl-6 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{s.tag}</p>
                        </button>
                    );
                })}
            </div>

            {err && <p className="text-sm font-semibold text-rose-700">{err}</p>}

            {chosen ? (
                <div className="space-y-3">
                    <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-800"><Check className="h-4 w-4" strokeWidth={3} /> Sistem dipilih: {chosen.name}. Tab Juri, Pengaturan penilaian, Publikasi, dan Rekap nilai sudah tersedia.</p>
                    {!canChange && <p className="text-xs font-bold text-slate-500">Sistem tidak bisa diganti karena {lockReason}.</p>}
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={onChosen} className={btn}>Lanjut ke Pengaturan penilaian</button>
                        {canChange && <button type="button" disabled={busy} onClick={cancel} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Batalkan pilihan</button>}
                    </div>
                </div>
            ) : (
                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">Belum ada sistem dipilih. Pilih salah satu sistem di atas untuk melanjutkan.</p>
            )}
        </div>
    );
}

function ParentPenilaian({ subs = [] }: Props) {
    const used = SYSTEMS.filter((x) => subs.some((s) => s.system === x.key));
    const sysName = (k?: string | null) => SYSTEMS.find((x) => x.key === k)?.name ?? null;

    return (
        <PanelLayout title="Penilaian">
            <div className="space-y-5">
                <div className={`${card} space-y-4 p-6`}>
                    <div>
                        <h2 className="text-xl font-extrabold">Sistem penilaian</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Sistem dipilih di tiap sub-event. Di sini tampil sistem yang dipakai sub-event.</p>
                    </div>
                    {used.length === 0 ? (
                        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">Belum ada sub-event yang memilih sistem penilaian. Buka menu Penilaian di sub-event, lalu pilih sistemnya.</p>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {used.map((x) => (
                                <div key={x.key} className="rounded-2xl border-2 border-indigo-500 bg-indigo-50/60 p-4 dark:bg-indigo-500/10">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600"><span className="h-2 w-2 rounded-full bg-indigo-600" /></span>
                                        <span className="flex-1 text-sm font-extrabold">{x.name}</span>
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Dipakai</span>
                                    </div>
                                    <p className="mt-1.5 pl-6 text-xs text-slate-600 dark:text-slate-300">{x.desc}</p>
                                    <p className="mt-1 pl-6 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{x.tag}</p>
                                    <p className="mt-2 pl-6 text-xs font-bold text-slate-700 dark:text-slate-200">Dipakai oleh: {subs.filter((s) => s.system === x.key).map((s) => s.title).join(', ')}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    {subs.map((s) => (
                        <div key={s.id} className={`${card} flex flex-col gap-3 p-6`}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-extrabold">{s.title}</h3>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.categories > 0 && s.approved === s.categories ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>Disahkan {s.approved} dari {s.categories}</span>
                            </div>
                            <p className={`text-sm font-bold ${s.system ? 'text-indigo-700' : 'text-amber-700'}`}>{s.system ? sysName(s.system) : 'Belum memilih sistem penilaian'}</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {[['Kategori', s.categories], ['Juri', s.judges], ['Peserta', s.participants]].map(([l, v]) => (
                                    <div key={String(l)} className="rounded-xl bg-slate-50 py-2.5 dark:bg-white/5"><div className="text-xl font-extrabold">{v}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{l}</div></div>
                                ))}
                            </div>
                            <Link href={`/panel/event/${s.id}/penilaian`} className="mt-auto inline-flex items-center justify-center rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-800">Kelola</Link>
                        </div>
                    ))}
                </div>
            </div>
        </PanelLayout>
    );
}

type SkRow = { rank: number | null; rank_shared?: boolean; code: string; name?: string; school?: string | null; score: number | null; provisional: boolean };
type SkCat = { category: { id: number; name: string }; locked: boolean; finalized_at: string | null; finalized_by: string | null; rows: SkRow[] };

const nf = (v: number | null | undefined) => (v === null || v === undefined ? '-' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(v));
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type LsTableRow = { rank: number | null; shared: boolean; code: string; name: string; school: string; order: number | null; judges_done: number; base: number | null; deduction: number; penalty: number; score: number | null; provisional: boolean; status: 'belum' | 'sebagian' | 'selesai' };
type LsRow = { rank: number; shared: boolean; code: string; name: string; school: string; score: number };
type LsCat = { id: number; name: string; locked: boolean; saved?: boolean; need: number; unranked: number; rows: LsRow[]; table: LsTableRow[] };
type LsData = {
    institution: string; title: string; parent_title: string | null; categories: LsCat[];
    blockers: string[]; warnings: string[]; progress: { done: number; total: number }; finalized: boolean;
    letter: { number: string; date: string; signer_name: string; signer_position: string; finalized_at: string | null; finalized_by: string | null } | null;
};

const lsToday = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const lsDate = (v: string) => (v ? new Date(`${v.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const lsNf = (v: number | null | undefined) => (v === null || v === undefined ? '-' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(v));
const LsMark = ({ t }: { t: string }) => <mark className="rounded bg-amber-200 px-1.5 text-amber-900">{t}</mark>;
const lsStatus: Record<LsTableRow['status'], { t: string; c: string }> = {
    belum: { t: 'Belum dinilai', c: 'bg-slate-100 text-slate-700' },
    sebagian: { t: 'Sedang dinilai', c: 'bg-amber-100 text-amber-900' },
    selesai: { t: 'Selesai', c: 'bg-emerald-100 text-emerald-900' },
};

function LsTable({ rows }: { rows: LsRow[] }) {
    const th = 'border border-slate-400 bg-slate-100 px-2 py-1 text-left font-bold';
    const td = 'border border-slate-400 px-2 py-1';
    return (
        <table className="mt-2 w-full border-collapse text-[13px]">
            <thead><tr><th className={`${th} w-20 text-center`}>Peringkat</th><th className={th}>Peserta</th><th className={th}>Sekolah / lembaga</th><th className={`${th} w-28 text-right`}>Nilai bersih</th></tr></thead>
            <tbody>
                {rows.map((r, i) => (
                    <tr key={i}>
                        <td className={`${td} text-center font-bold`}>{r.rank}{r.shared ? ' =' : ''}</td>
                        <td className={td}>{r.name || '-'} <span className="font-mono text-[11px] text-slate-600">({r.code})</span></td>
                        <td className={td}>{r.school || '-'}</td>
                        <td className={`${td} text-right font-bold`}>{lsNf(r.score)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

type OverallRow = { rank: number; shared: boolean; school: string; points: number; counts: number[]; categories: number };
type OverallCat = { sub: string; sub_id: number; category: string; category_id: number; participants: number; locked: boolean; winners: { rank: number; code: string; school: string }[] };
type OverallCheck = { ok: boolean; title: string; detail: string };
type Overall = { points: number[]; winner_count: number; locked: boolean; finalized_at: string | null; finalized_by: string | null; provisional: boolean; standings: OverallRow[]; categories: OverallCat[]; checks: OverallCheck[]; ties: boolean };

type PTab = 'sistem' | 'pengaturan' | 'penetapan';

type OvCat = LsCat & { saved?: boolean };
type OvGroup = { sub_id: number; sub: string; categories: OvCat[] };
type OverallX = Overall & {
    institution?: string; title?: string; progress?: { done: number; total: number }; warnings?: string[]; groups?: OvGroup[];
    letter?: { number: string; date: string; signer_name: string; signer_position: string; finalized_at: string | null; finalized_by: string | null } | null;
};

function ovNum(v: any): string {
    return v === null || v === undefined || v === '' ? '–' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

function ParentSK({ ov: ovIn, base, title, dirty: dirtyProp = false }: { ov: Overall; base: string; title: string; dirty?: boolean }) {
    const ov = ovIn as OverallX;
    const [dirtySet, setDirtySet] = useState(false);
    const dirty = dirtyProp || dirtySet;
    const groups = ov.groups ?? [];
    const warnings = ov.warnings ?? [];
    const progress = ov.progress ?? { done: 0, total: 0 };
    const [number, setNumber] = useState(ov.letter?.number ?? '');
    const [date, setDate] = useState(ov.letter?.date?.slice(0, 10) ?? lsToday());
    const [signer, setSigner] = useState(ov.letter?.signer_name ?? '');
    const [position, setPosition] = useState(ov.letter?.signer_position ?? '');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPrev, setLogoPrev] = useState<string | null>(null);
    const skLogo = logoPrev ?? (ov as { logo_url?: string | null }).logo_url ?? null;
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const locked = ov.locked;
    const filled = number.trim() !== '' && date !== '' && signer.trim() !== '' && position.trim() !== '';
    const okBlock = ov.checks.length > 0 && ov.checks.every((x) => x.ok);
    const can = !locked && okBlock && !dirty && filled && confirmed && !busy;
    const winners = ov.standings.filter((s) => s.rank <= ov.winner_count);
    const ranked = groups.reduce((a, g) => a + g.categories.reduce((b, x) => b + x.rows.length, 0), 0);
    const klasemenUrl = base.replace(/\/penilaian\/?$/, '/klasemen');
    const saved = !!(ov as any).saved;
    const blockers = ov.checks.filter((x) => !x.ok && !(x as any).saveStep);
    const canSaveResult = !locked && !saved && blockers.length === 0 && !dirty && !busy;
    const saveResult = () => {
        if (!canSaveResult) return;
        setErr('');
        router.post(`${base}/juara-umum/simpan`, {}, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => setBusy(false),
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan hasil.')),
        });
    };
    const reopenResult = () => {
        if (locked || !saved || busy) return;
        if (!confirm('Buka kembali hasil juara umum? Pengaturan bisa diubah lagi dan hasil harus disimpan ulang sebelum SK ditetapkan.')) return;
        router.post(`${base}/juara-umum/buka`, {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };

    const submit = () => {
        if (!confirm(`Tetapkan hasil ${title} dan juara umum? Semua kategori di semua sub-event akan dikunci dan tidak bisa diubah lagi.`)) return;
        setErr('');
        setBusy(true);
        router.post(`${base}/juara-umum/tetapkan`, { number, date, signer_name: signer, signer_position: position, confirm: true, ...(logoFile ? { logo: logoFile } : {}) } as any, {
            preserveScroll: true,
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menetapkan SK.')),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="space-y-5">
            <style>{`@media print { body * { visibility: hidden !important; } #sk-print, #sk-print * { visibility: visible !important; } #sk-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; } }`}</style>

            <div className={`${card} space-y-4 p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-extrabold text-white">SK</span>
                        <div>
                            <h2 className="text-xl font-extrabold">Surat keputusan: {title}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Satu SK memuat hasil semua lomba dan juara umum.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-white/10 dark:text-slate-200">{progress.done}/{progress.total} kategori disimpan</span>{okBlock ? <Link href={klasemenUrl} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-orange-500/40 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/50"><Trophy className="h-4 w-4" /> Klasemen</Link> : <span aria-disabled="true" title="Klasemen bisa dibuka setelah semua syarat penetapan terpenuhi" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-extrabold text-slate-400 dark:bg-white/10 dark:text-slate-500"><Trophy className="h-4 w-4" /> Klasemen</span>}</div>
                </div>

                {locked ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-800"><Check className="h-4 w-4" strokeWidth={3} /> SK ditetapkan{ov.finalized_at ? ` pada ${ov.finalized_at}` : ''}{ov.finalized_by ? ` oleh ${ov.finalized_by}` : ''}. Semua kategori dan juara umum terkunci.</p>
                        <button type="button" onClick={() => window.print()} className={btn}>Cetak / simpan PDF</button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Nomor SK *</span><input className={`${inpSm} mt-1`} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Contoh: 001/SK/2026" /></label>
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Tanggal SK *</span><input className={`${inpSm} mt-1`} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Nama penandatangan *</span><input className={`${inpSm} mt-1`} value={signer} onChange={(e) => setSigner(e.target.value)} placeholder="Nama lengkap" /></label>
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Jabatan penandatangan *</span><input className={`${inpSm} mt-1`} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Contoh: Ketua Panitia" /></label>
                            <div className="md:col-span-2 xl:col-span-4">
                                <span className={`${lbl} !normal-case !tracking-normal`}>Logo kop SK (opsional)</span>
                                <div className="mt-1 flex flex-wrap items-center gap-3">
                                    {skLogo
                                        ? <img src={skLogo} alt="Logo SK" className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-contain p-1" />
                                        : <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-300 text-[10px] font-bold text-slate-400">Logo</div>}
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="block max-w-xs text-sm file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-700"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0] ?? null;
                                            setLogoFile(f);
                                            setLogoPrev(f ? URL.createObjectURL(f) : null);
                                        }}
                                    />
                                    {logoFile && <button type="button" onClick={() => { setLogoFile(null); setLogoPrev(null); }} className="text-xs font-bold text-rose-600">Batalkan logo baru</button>}
                                    <span className="text-xs text-slate-500">PNG/JPG/WEBP, maks. 2 MB. Kosongkan untuk memakai logo lembaga.</span>
                                </div>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {ov.checks.map((x, i) => (
                                <li key={`c${i}`} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${x.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200'}`}>{x.ok ? '✓' : '✕'} {x.title}<span className="ml-2 font-semibold opacity-80">· {x.detail}</span></li>
                            ))}
                            {warnings.map((m, i) => <li key={`w${i}`} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">! {m}</li>)}
                            {dirty && <li className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">! Ada perubahan pengaturan juara umum yang belum disimpan. Simpan dulu di tab Pengaturan penilaian.</li>}
                        </ul>
                    </>
                )}
            </div>

            {groups.map((g) => (
                <div key={g.sub_id} className={`${card} space-y-5 p-6`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg font-extrabold">{g.sub}</h3>
                        <Link href={`/panel/event/${g.sub_id}/penilaian`} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 hover:bg-slate-200">Buka sub-event</Link>
                    </div>
                    {g.categories.map((x) => (
                        <div key={x.id} className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="flex items-center gap-2 font-extrabold"><span className={`h-3 w-3 rounded-full ${x.locked ? 'bg-emerald-500' : x.saved ? 'bg-indigo-500' : 'bg-amber-400'}`} /> {x.name ? `Kategori ${x.name}` : g.sub}</h4>
                                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${x.locked ? 'bg-emerald-100 text-emerald-900' : x.saved ? 'bg-indigo-100 text-indigo-900' : 'bg-amber-100 text-amber-900'}`}>{x.locked ? 'Ditetapkan' : x.saved ? 'Tersimpan' : 'Belum disimpan'}</span>
                            </div>
                            <div className="mt-3">
                                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Tabel lengkap · {x.table.length} tim</p>
                                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5">
                                    <table className="w-full min-w-[720px] text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-300">
                                                <th className="px-4 py-3">Peringkat</th>
                                                <th className="px-4 py-3">Peserta</th>
                                                <th className="px-4 py-3">Asal</th>
                                                <th className="px-4 py-3 text-center">Juri</th>
                                                <th className="px-4 py-3 text-right">Nilai dasar</th>
                                                <th className="px-4 py-3 text-right">Potongan</th>
                                                <th className="px-4 py-3 text-right">Penalti</th>
                                                <th className="px-4 py-3 text-right">Nilai akhir</th>
                                                <th className="px-4 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                            {(x.table as any[]).map((t: any, ti: number) => (
                                                <tr key={`${t.code}-${ti}`} className={t.rank !== null && t.rank <= 3 ? 'bg-indigo-50/40 dark:bg-indigo-500/5' : ''}>
                                                    <td className="px-4 py-3">
                                                        {t.rank === null ? (
                                                            <span className="text-slate-400">–</span>
                                                        ) : (
                                                            <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-extrabold ${t.rank === 1 ? 'bg-amber-400 text-white' : t.rank === 2 ? 'bg-slate-400 text-white' : t.rank === 3 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                                                                {t.rank}{t.shared ? '=' : ''}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-extrabold">{t.code}</span>
                                                        {t.name ? <span className="block text-xs text-slate-500 dark:text-slate-400">{t.name}</span> : null}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.school || '–'}</td>
                                                    <td className="px-4 py-3 text-center tabular-nums">{t.judges_done}/{(x as any).need}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">{ovNum(t.base)}</td>
                                                    <td className={`px-4 py-3 text-right tabular-nums ${t.deduction ? 'font-bold text-rose-600' : 'text-slate-400'}`}>{t.deduction ? ovNum(t.deduction) : '–'}</td>
                                                    <td className={`px-4 py-3 text-right tabular-nums ${t.penalty ? 'font-bold text-rose-600' : 'text-slate-400'}`}>{t.penalty ? ovNum(t.penalty) : '–'}</td>
                                                    <td className="px-4 py-3 text-right text-base font-extrabold tabular-nums">
                                                        {ovNum(t.score)}
                                                        {t.provisional ? <sup title="Nilai sementara" className="ml-0.5 text-amber-600">*</sup> : null}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${(lsStatus as any)[t.status]?.c ?? 'bg-slate-100 text-slate-600'}`}>{(lsStatus as any)[t.status]?.t ?? t.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            <OverallSettings points={ov.points} winnerCount={ov.winner_count} tiebreak={(ov as any).tiebreak?.order ?? ['medals']} tieShared={(ov as any).tiebreak?.shared ?? true} locked={ov.locked || saved} note={saved && !ov.locked ? 'Hasil juara umum sudah disimpan. Klik "Buka kembali" di klasemen untuk mengubah pengaturan.' : null} finalizedAt={ov.finalized_at} base={base} onDirty={setDirtySet} />

            <div className={`${card} space-y-4 p-6`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-extrabold">Klasemen juara umum</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {saved && !locked ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900">Tersimpan · {(ov as any).saved_at}</span> : ov.provisional ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">Sementara</span> : null}
                        {!locked && !saved && (
                            <button type="button" onClick={saveResult} disabled={!canSaveResult} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-extrabold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50">
                                {busy ? 'Menyimpan…' : 'Simpan hasil'}
                            </button>
                        )}
                        {!locked && saved && (
                            <button type="button" onClick={reopenResult} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200">
                                Buka kembali
                            </button>
                        )}
                    </div>
                    <p className="w-full text-xs font-semibold text-slate-500 dark:text-slate-300">
                        {locked ? 'Juara umum sudah ditetapkan.' : saved ? 'Hasil sudah disimpan. SK bisa ditetapkan.' : blockers.length > 0 ? 'Belum bisa disimpan: ' + blockers.map((b) => b.title).join('; ') + '.' : dirty ? 'Simpan pengaturan dulu sebelum menyimpan hasil.' : 'Simpan hasil dulu, baru SK bisa ditetapkan.'}
                    </p>
                </div>
                {ov.standings.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">Belum ada peringkat yang bisa dihitung.</p>
                ) : (
                    <>
                        <div className="mb-4 flex flex-wrap gap-3">
                            {ov.standings.filter((s) => s.rank <= ov.winner_count).map((s, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 ring-1 ring-emerald-200/70 dark:from-emerald-500/10 dark:to-teal-500/10 dark:ring-emerald-400/20">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow">{s.rank}</span>
                                    <div>
                                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Juara umum {s.rank}{s.shared ? ' (bersama)' : ''}</p>
                                        <p className="text-lg font-extrabold leading-tight">{s.school}</p>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{num(s.points)} poin</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-300">
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Peserta</th>
                                        <th className="px-4 py-3 text-right">Poin</th>
                                        {ov.points.map((_, i) => <th key={i} className="px-3 py-3 text-center">Juara {i + 1}</th>)}
                                        <th className="px-4 py-3 text-right">Total nilai</th>
                                        <th className="px-4 py-3">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                    {ov.standings.map((s, i) => {
                                        const win = s.rank <= ov.winner_count;
                                        return (
                                            <tr key={i} className={win ? 'bg-emerald-50/60 dark:bg-emerald-500/10' : 'hover:bg-slate-50/60 dark:hover:bg-white/5'}>
                                                <td className="px-4 py-3 align-top">
                                                    <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-extrabold ${s.rank === 1 ? 'bg-amber-400 text-white' : s.rank === 2 ? 'bg-slate-400 text-white' : s.rank === 3 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{s.rank}{s.shared ? '=' : ''}</span>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    <span className="font-extrabold">{s.school}</span>
                                                    {(s as any).pid ? <span className="block text-xs font-semibold text-slate-400">ID {(s as any).pid}</span> : null}
                                                </td>
                                                <td className="px-4 py-3 text-right align-top">
                                                    <span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-base font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{num(s.points)}</span>
                                                </td>
                                                {s.counts.map((n, k) => (
                                                    <td key={k} className="px-3 py-3 text-center align-top">
                                                        {n > 0 ? <span className="font-extrabold">{n}</span> : <span className="text-slate-300 dark:text-slate-600">–</span>}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-right align-top font-semibold tabular-nums text-slate-600 dark:text-slate-300">{Number((s as any).score_total ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-3 align-top">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {win && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-900">Juara umum {s.rank}</span>}
                                                        {s.shared ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">Juara bersama</span> : null}
                                                        {(s as any).tie ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-extrabold text-rose-700">Seri belum terpecahkan</span> : null}
                                                    </div>
                                                    {(s as any).why ? <p className="mt-1 max-w-md text-xs leading-snug text-slate-500 dark:text-slate-300">{(s as any).why}</p> : null}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </>
                )}
                {ov.ties && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">Ada seri yang tidak terpecahkan di posisi juara umum. Sekolah/lembaga yang seri ditetapkan sebagai juara bersama.</p>}
            </div>

            <div className="rounded-3xl bg-slate-100/70 p-4 sm:p-6 dark:bg-white/5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Pratinjau surat keputusan</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{ranked} peringkat tercantum</span>
                </div>

                <div id="sk-print" className="mx-auto max-w-3xl space-y-8 font-serif text-[14px] leading-relaxed text-slate-900 print:space-y-0">
                    {/* ===== Halaman 1: Surat Keputusan ===== */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12 sm:min-h-[1086px] print:min-h-0 print:rounded-none print:p-0 print:shadow-none">
                        <div className="pb-1 text-center">
                            {skLogo
                                ? <img src={skLogo} alt={ov.institution || 'Logo lembaga'} className="mx-auto h-24 w-auto max-w-full object-contain" />
                                : <div className="text-lg font-bold uppercase">{ov.institution || 'Nama lembaga'}</div>}
                        </div>
                        <div className="mt-6 text-center">
                            <div className="text-lg font-bold">SURAT KEPUTUSAN</div>
                            <div>Nomor: {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</div>
                            <div className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Tentang</div>
                            <div className="font-bold uppercase">Penetapan juara dan juara umum {title}</div>
                        </div>

                        <div className="mt-6 grid grid-cols-[6.5rem_1fr] gap-y-3">
                            <div>Menimbang</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Bahwa seluruh lomba pada {title} telah dilaksanakan melalui sistem SIMPLE dan seluruh penilaian telah diselesaikan oleh juri;</li>
                                <li>Bahwa hasil penilaian telah direkapitulasi dan diperiksa oleh panitia, sehingga perlu ditetapkan dengan Surat Keputusan.</li>
                            </ol>
                            <div>Mengingat</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Rekapitulasi nilai seluruh lomba pada {title} yang tersimpan pada sistem SIMPLE;</li>
                                <li>Hasil pemeriksaan oleh panitia penyelenggara.</li>
                            </ol>
                        </div>

                        <p className="mt-6 text-center font-bold">MEMUTUSKAN</p>
                        <div className="mt-2 grid grid-cols-[6.5rem_1.25rem_1fr] gap-y-2">
                            <div>Menetapkan</div><div>:</div>
                            <div className="text-justify font-bold uppercase">Keputusan tentang penetapan juara dan juara umum {title};</div>
                            <div>Kesatu</div><div>:</div>
                            <div className="text-justify">Hasil dan peringkat tiap lomba ditetapkan sebagaimana tercantum dalam Lampiran bagian A keputusan ini;</div>
                            <div>Kedua</div><div>:</div>
                            <div className="text-justify">Juara umum {title} ditetapkan berdasarkan akumulasi poin peringkat dari seluruh kategori, sebagaimana tercantum dalam Lampiran bagian B keputusan ini;</div>
                            <div>Ketiga</div><div>:</div>
                            <div className="text-justify">Keputusan ini berlaku sejak tanggal ditetapkan, dan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</div>
                        </div>

                        <div className="ml-auto mt-10 w-1/2 text-center">
                            <div>Ditetapkan pada tanggal <b>{date ? lsDate(date) : '…'}</b></div>
                            <div className="mt-1">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />},</div>
                            <div className="h-20" />
                            <div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>
                        </div>
                    </div>

                    {/* ===== Halaman 2: Lampiran ===== */}
                    <div className="break-before-page rounded-2xl bg-white p-8 shadow-sm sm:p-12 sm:min-h-[1086px] print:min-h-0 print:rounded-none print:p-0 print:shadow-none">
                        <div className="pb-1">
                            <p className="font-bold">LAMPIRAN SURAT KEPUTUSAN</p>
                            <p className="font-bold">NOMOR {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</p>
                        </div>
                        <div className="mt-6 text-center font-bold uppercase">
                            <div>Penetapan juara dan juara umum {title}</div>
                            {ov.institution && <div>{ov.institution}</div>}
                        </div>

                        <p className="mt-5 font-bold">A. Hasil per lomba</p>
                        {groups.length === 0 && <p className="mt-2 rounded bg-amber-100 px-3 py-2 text-center text-[13px] text-amber-900">Belum ada kategori yang bisa dicantumkan.</p>}
                        {groups.map((g, gi) => (
                            <div key={g.sub_id} className="mt-3">
                                <p className="font-semibold">{gi + 1}. {g.sub}</p>
                                <table className="mt-1 w-full border-collapse border border-slate-900 text-[12.5px]">
                                    <thead>
                                        <tr className="bg-slate-200 text-center font-bold uppercase">
                                            <th className="w-9 border border-slate-900 px-1.5 py-2">No</th>
                                            <th className="w-24 border border-slate-900 px-1.5 py-2">Kategori</th>
                                            <th className="w-14 border border-slate-900 px-1.5 py-2">Juara</th>
                                            <th className="w-32 border border-slate-900 px-1.5 py-2">Kode peserta</th>
                                            <th className="border border-slate-900 px-1.5 py-2">Nama</th>
                                            <th className="border border-slate-900 px-1.5 py-2">Sekolah / lembaga</th>
                                            <th className="w-20 border border-slate-900 px-1.5 py-2">Nilai akhir</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {g.categories.map((x, i) => x.rows.length === 0 ? (
                                            <tr key={`x${x.id}`}>
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-center">{i + 1}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-center">{x.name || g.sub}</td>
                                                <td colSpan={5} className="border border-slate-900 px-1.5 py-1.5 text-center italic">Belum ada peringkat yang bisa dicantumkan.</td>
                                            </tr>
                                        ) : x.rows.map((r, k) => (
                                            <tr key={`x${x.id}-${k}`}>
                                                {k === 0 && <td rowSpan={x.rows.length} className="border border-slate-900 px-1.5 py-1.5 text-center align-middle">{i + 1}</td>}
                                                {k === 0 && <td rowSpan={x.rows.length} className="border border-slate-900 px-1.5 py-1.5 text-center align-middle">{x.name || g.sub}</td>}
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-center font-bold">{r.rank}{r.shared ? ' =' : ''}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-center font-mono text-[11.5px]">{r.code}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5">{r.name || '-'}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5">{r.school || '-'}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-right font-semibold">{lsNf(r.score)}</td>
                                            </tr>
                                        )))}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        <p className="mt-6 font-bold">B. Juara umum {title}</p>
                        {winners.length === 0
                            ? <p className="mt-2 rounded bg-amber-100 px-3 py-2 text-center text-[13px] text-amber-900">Belum ada juara umum yang bisa dicantumkan.</p>
                            : (
                                <table className="mt-2 w-full border-collapse border border-slate-900 text-[12.5px]">
                                    <thead>
                                        <tr className="bg-slate-200 text-center font-bold uppercase">
                                            <th className="w-9 border border-slate-900 px-1.5 py-2">No</th>
                                            <th className="w-28 border border-slate-900 px-1.5 py-2">Juara umum</th>
                                            <th className="border border-slate-900 px-1.5 py-2">Sekolah / lembaga</th>
                                            <th className="w-24 border border-slate-900 px-1.5 py-2">Total poin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {winners.map((w, i) => (
                                            <tr key={i}>
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-center">{i + 1}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-center font-bold">{w.rank}{w.shared ? ' =' : ''}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5">{w.school}</td>
                                                <td className="border border-slate-900 px-1.5 py-1.5 text-right font-semibold">{num(w.points)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                        <div className="ml-auto mt-10 w-1/2 text-center">
                            <div>Ditetapkan pada tanggal <b>{date ? lsDate(date) : '…'}</b></div>
                            <div className="mt-1">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />},</div>
                            <div className="h-20" />
                            <div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>
                        </div>
                    </div>
                </div>
            </div>

            {!locked && (
                <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                    <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
                        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5" />
                        Saya sudah memeriksa SK dan hasilnya sudah benar
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                        {err
                            ? <span className="max-w-xs text-xs font-bold text-rose-700">{err}</span>
                            : !okBlock
                                ? <span className="text-xs font-bold text-rose-700">Selesaikan pemeriksaan ✕ di atas</span>
                                : !filled
                                    ? <span className="text-xs font-bold text-amber-700">Lengkapi data SK di atas</span>
                                    : null}
                        <button type="button" disabled={!can} onClick={submit} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"><Lock className="h-4 w-4" /> Tetapkan hasil</button>
                    </div>
                </div>
            )}
        </div>
    );
}


function PenetapanSK({ sk, base }: { sk: LsData | null; base: string }) {
    const [number, setNumber] = useState(sk?.letter?.number ?? '');
    const [date, setDate] = useState(sk?.letter?.date?.slice(0, 10) ?? lsToday());
    const [signer, setSigner] = useState(sk?.letter?.signer_name ?? '');
    const [position, setPosition] = useState(sk?.letter?.signer_position ?? '');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPrev, setLogoPrev] = useState<string | null>(null);
    const skLogo = logoPrev ?? (sk as { logo_url?: string | null } | null)?.logo_url ?? null;
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [podium, setPodium] = useState<Record<number, boolean>>({});

    if (!sk) return <div className={`${card} p-6 text-sm`}>Data SK belum tersedia.</div>;

    const locked = sk.finalized;
    const klasemenUrl = base.replace(/\/penilaian\/?$/, '/klasemen');
    const filled = number.trim() !== '' && date !== '' && signer.trim() !== '' && position.trim() !== '';
    const okBlock = sk.blockers.length === 0;
    const can = !locked && okBlock && filled && confirmed && !busy;
    const ranked = sk.categories.reduce((a, c) => a + c.rows.length, 0);
    const onParent = sk.parent_title ? ` pada ${sk.parent_title}` : '';

    const submit = () => {
        if (!confirm(`Tetapkan hasil ${sk.title}? Hasil semua kategori akan dikunci dan tidak bisa diubah lagi.`)) return;
        setErr('');
        setBusy(true);
        router.post(`${base}/sk/tetapkan-lomba`, { number, date, signer_name: signer, signer_position: position, confirm: true, ...(logoFile ? { logo: logoFile } : {}) } as any, {
            preserveScroll: true,
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menetapkan SK.')),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="space-y-5">
            <style>{`@media print { body * { visibility: hidden !important; } #sk-print, #sk-print * { visibility: visible !important; } #sk-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; } }`}</style>

            <div className={`${card} space-y-4 p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-extrabold text-white">SK</span>
                        <div>
                            <h2 className="text-xl font-extrabold">Surat keputusan: {sk.title}</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Satu SK memuat hasil semua kategori lomba ini{sk.categories.length > 1 ? ` (${sk.categories.map((c) => c.name).filter(Boolean).join(', ')})` : ''}.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700 dark:bg-white/10 dark:text-slate-200">{sk.progress.done}/{sk.progress.total} kategori disimpan</span>{okBlock ? <Link href={klasemenUrl} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-orange-500/40 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/50"><Trophy className="h-4 w-4" /> Klasemen</Link> : <span aria-disabled="true" title="Klasemen bisa dibuka setelah semua syarat penetapan terpenuhi" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-extrabold text-slate-400 dark:bg-white/10 dark:text-slate-500"><Trophy className="h-4 w-4" /> Klasemen</span>}</div>
                </div>

                {locked ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-800"><Check className="h-4 w-4" strokeWidth={3} /> SK ditetapkan{sk.letter?.finalized_at ? ` pada ${sk.letter.finalized_at}` : ''}{sk.letter?.finalized_by ? ` oleh ${sk.letter.finalized_by}` : ''}. Hasil semua kategori terkunci.</p>
                        <button type="button" onClick={() => window.print()} className={btn}>Cetak / simpan PDF</button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Nomor SK *</span><input className={`${inpSm} mt-1`} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Contoh: 001/SK/2026" /></label>
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Tanggal SK *</span><input className={`${inpSm} mt-1`} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Nama penandatangan *</span><input className={`${inpSm} mt-1`} value={signer} onChange={(e) => setSigner(e.target.value)} placeholder="Nama lengkap" /></label>
                            <label><span className={`${lbl} !normal-case !tracking-normal`}>Jabatan penandatangan *</span><input className={`${inpSm} mt-1`} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Contoh: Ketua Panitia" /></label>
                            {!locked && (
                                <div className="sm:col-span-2 lg:col-span-4">
                                    <span className={`${lbl} !normal-case !tracking-normal`}>Logo kop SK (opsional)</span>
                                    <div className="mt-1 flex flex-wrap items-center gap-3">
                                        {skLogo
                                            ? <img src={skLogo} alt="Logo SK" className="h-14 w-14 rounded-xl border border-slate-200 bg-white object-contain p-1" />
                                            : <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-300 text-[10px] font-bold text-slate-400">Logo</div>}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="block max-w-xs text-sm file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-700"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0] ?? null;
                                                setLogoFile(f);
                                                setLogoPrev(f ? URL.createObjectURL(f) : null);
                                            }}
                                        />
                                        {logoFile && <button type="button" onClick={() => { setLogoFile(null); setLogoPrev(null); }} className="text-xs font-bold text-rose-600">Batalkan logo baru</button>}
                                        <span className="text-xs text-slate-500">PNG/JPG/WEBP, maks. 2 MB. Kosongkan untuk memakai logo lembaga.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {(sk.blockers.length > 0 || sk.warnings.length > 0) && (
                            <ul className="space-y-2">
                                {sk.blockers.map((m, i) => <li key={`b${i}`} className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">✕ {m}</li>)}
                                {sk.warnings.map((m, i) => <li key={`w${i}`} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">! {m}</li>)}
                            </ul>
                        )}
                    </>
                )}
            </div>

            {sk.categories.map((c) => (
                <div key={c.id} className={`${card} space-y-3 p-6`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-lg font-extrabold"><span className={`h-3 w-3 rounded-full ${c.locked ? 'bg-emerald-500' : c.saved ? 'bg-indigo-500' : 'bg-amber-400'}`} /> {c.name ? `Kategori ${c.name}` : sk.title}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${c.locked ? 'bg-emerald-100 text-emerald-900' : c.saved ? 'bg-indigo-100 text-indigo-900' : 'bg-amber-100 text-amber-900'}`}>{c.locked ? 'Ditetapkan' : c.saved ? 'Tersimpan' : 'Belum disimpan'}</span>
                            
                        </div>
                    </div>

                    {podium[c.id] && (() => {
                        const top = c.table.filter((r) => r.rank !== null && r.rank <= 3 && r.score !== null);
                        return top.length === 0 ? (
                            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">Belum ada peringkat untuk ditampilkan.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-3">
                                {top.map((r, k) => (
                                    <div key={k} className="rounded-2xl border border-slate-200 p-4 text-center dark:border-white/10">
                                        <div className="text-3xl font-black">{r.rank}{r.shared ? ' =' : ''}</div>
                                        <div className="mt-1 font-extrabold">{r.name || r.code}</div>
                                        <div className="text-xs text-slate-500">{r.school || '-'}</div>
                                        <div className="mt-2 text-lg font-black">{lsNf(r.score)}</div>
                                        {!c.locked && <div className="text-[10px] font-bold uppercase text-amber-700">sementara</div>}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    
                    <div className="mt-3">
                        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Tabel lengkap · {c.table.length} tim</p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-white/10">
                                    <th className="py-3 pr-3">#</th><th className="py-3 pr-3">Tim</th><th className="py-3 pr-3">Juri</th>
                                    <th className="py-3 pr-3 text-right">Dasar</th><th className="py-3 pr-3 text-right">Kurang</th><th className="py-3 pr-3 text-right">Penalti</th>
                                    <th className="py-3 pr-3 text-right">Nilai bersih</th><th className="py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {c.table.map((r, k) => (
                                    <tr key={k} className={k % 2 ? 'bg-slate-50/70 dark:bg-white/[0.03]' : ''}>
                                        <td className="py-3 pr-3 font-black">{r.rank ?? '-'}{r.shared ? ' =' : ''}</td>
                                        <td className="py-3 pr-3"><div className="font-semibold">{r.name || '-'}{r.order != null ? <span className="ml-2 font-black">#{r.order}</span> : null}</div><div className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">{r.code}</div>{r.school ? <div className="text-xs text-slate-500">{r.school}</div> : null}</td>
                                        <td className="py-3 pr-3 font-semibold">{r.judges_done}/{c.need}</td>
                                        <td className="py-3 pr-3 text-right">{lsNf(r.base)}</td>
                                        <td className="py-3 pr-3 text-right">{lsNf(r.deduction)}</td>
                                        <td className="py-3 pr-3 text-right">{lsNf(r.penalty)}</td>
                                        <td className="py-3 pr-3 text-right text-base font-black">{lsNf(r.score)}{r.provisional && <span className="block text-[10px] font-bold uppercase text-amber-700">sementara</span>}</td>
                                        <td className="py-3"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${lsStatus[r.status].c}`}>{lsStatus[r.status].t}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </div>
                </div>
            ))}

            <div className="rounded-3xl bg-slate-100/70 p-4 sm:p-6 dark:bg-white/5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Pratinjau surat keputusan</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{ranked} peringkat tercantum</span>
                </div>

                <div id="sk-print" className="mx-auto max-w-3xl space-y-8 font-serif text-[14px] leading-relaxed text-slate-900 print:space-y-0">
                    {/* ===== Halaman 1: Surat Keputusan ===== */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12 sm:min-h-[1086px] print:min-h-0 print:rounded-none print:p-0 print:shadow-none">
                        <div className="pb-1 text-center">
                            {skLogo
                                ? <img src={skLogo as string} alt={sk.institution || 'Logo lembaga'} className="mx-auto h-24 w-auto max-w-full object-contain" />
                                : <div className="text-lg font-bold uppercase">{sk.institution || 'Nama lembaga'}</div>}
                        </div>
                        <div className="mt-6 text-center">
                            <div className="text-lg font-bold">SURAT KEPUTUSAN</div>
                            <div>Nomor: {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</div>
                            <div className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Tentang</div>
                            <div className="font-bold uppercase">Penetapan juara {sk.title}</div>
                            {sk.parent_title && <div className="font-bold uppercase">{sk.parent_title}</div>}
                        </div>

                        <div className="mt-6 grid grid-cols-[6.5rem_1fr] gap-y-3">
                            <div>Menimbang</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Bahwa lomba {sk.title}{onParent} telah dilaksanakan melalui sistem SIMPLE dan seluruh penilaian telah diselesaikan oleh juri;</li>
                                <li>Bahwa hasil penilaian telah direkapitulasi dan diperiksa oleh panitia, sehingga perlu ditetapkan dengan Surat Keputusan.</li>
                            </ol>
                            <div>Mengingat</div>
                            <ol className="list-decimal space-y-1 pl-5 text-justify">
                                <li>Rekapitulasi nilai lomba {sk.title} yang tersimpan pada sistem SIMPLE;</li>
                                <li>Hasil pemeriksaan oleh panitia penyelenggara.</li>
                            </ol>
                        </div>

                        <p className="mt-6 text-center font-bold">MEMUTUSKAN</p>
                        <div className="mt-2 grid grid-cols-[6.5rem_1.25rem_1fr] gap-y-2">
                            <div>Menetapkan</div><div>:</div>
                            <div className="text-justify font-bold uppercase">Keputusan tentang penetapan juara {sk.title}{sk.parent_title ? ` ${sk.parent_title}` : ''};</div>
                            <div>Kesatu</div><div>:</div>
                            <div className="text-justify">Hasil dan peringkat lomba {sk.title} ditetapkan sebagaimana tercantum dalam lampiran keputusan ini;</div>
                            <div>Kedua</div><div>:</div>
                            <div className="text-justify">Peringkat ditetapkan berdasarkan hasil rekapitulasi nilai yang telah disimpan pada sistem;</div>
                            <div>Ketiga</div><div>:</div>
                            <div className="text-justify">Keputusan ini berlaku sejak tanggal ditetapkan, dan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</div>
                        </div>

                        <div className="ml-auto mt-10 w-1/2 text-center">
                            <div>Ditetapkan pada tanggal <b>{date ? lsDate(date) : '…'}</b></div>
                            <div className="mt-1">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />},</div>
                            <div className="h-20" />
                            <div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>
                        </div>
                    </div>

                    {/* ===== Halaman 2: Lampiran ===== */}
                    <div className="break-before-page rounded-2xl bg-white p-8 shadow-sm sm:p-12 sm:min-h-[1086px] print:min-h-0 print:rounded-none print:p-0 print:shadow-none">
                        <div className="pb-1">
                            <p className="font-bold">LAMPIRAN SURAT KEPUTUSAN</p>
                            <p className="font-bold">NOMOR {number.trim() ? number : <LsMark t="Nomor SK belum diisi" />}</p>
                        </div>
                        <div className="mt-6 text-center font-bold uppercase">
                            <div>Penetapan juara {sk.title}</div>
                            {sk.parent_title && <div>{sk.parent_title}</div>}
                            {sk.institution && <div>{sk.institution}</div>}
                        </div>

                        {sk.categories.length === 0 && <p className="mt-4 rounded bg-amber-100 px-3 py-2 text-center text-[13px] text-amber-900">Belum ada kategori yang bisa dicantumkan.</p>}
                        {sk.categories.length > 0 && (
                            <table className="mt-5 w-full border-collapse border border-slate-900 text-[12.5px]">
                                <thead>
                                    <tr className="bg-slate-200 text-center font-bold uppercase">
                                        <th className="w-9 border border-slate-900 px-1.5 py-2">No</th>
                                        <th className="w-24 border border-slate-900 px-1.5 py-2">Kategori</th>
                                        <th className="w-14 border border-slate-900 px-1.5 py-2">Juara</th>
                                        <th className="w-32 border border-slate-900 px-1.5 py-2">Kode peserta</th>
                                        <th className="border border-slate-900 px-1.5 py-2">Nama</th>
                                        <th className="border border-slate-900 px-1.5 py-2">Sekolah / lembaga</th>
                                        <th className="w-20 border border-slate-900 px-1.5 py-2">Nilai akhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sk.categories.map((c, i) => c.rows.length === 0 ? (
                                        <tr key={`c${c.id}`}>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center">{i + 1}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center">{c.name || sk.title}</td>
                                            <td colSpan={5} className="border border-slate-900 px-1.5 py-1.5 text-center italic">Belum ada peringkat yang bisa dicantumkan.</td>
                                        </tr>
                                    ) : c.rows.map((r, k) => (
                                        <tr key={`c${c.id}-${k}`}>
                                            {k === 0 && <td rowSpan={c.rows.length} className="border border-slate-900 px-1.5 py-1.5 text-center align-middle">{i + 1}</td>}
                                            {k === 0 && <td rowSpan={c.rows.length} className="border border-slate-900 px-1.5 py-1.5 text-center align-middle">{c.name || sk.title}</td>}
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center font-bold">{r.rank}{r.shared ? ' =' : ''}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-center font-mono text-[11.5px]">{r.code}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5">{r.name || '-'}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5">{r.school || '-'}</td>
                                            <td className="border border-slate-900 px-1.5 py-1.5 text-right font-semibold">{lsNf(r.score)}</td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                        )}

                        <div className="ml-auto mt-10 w-1/2 text-center">
                            <div>Ditetapkan pada tanggal <b>{date ? lsDate(date) : '…'}</b></div>
                            <div className="mt-1">{position.trim() ? position : <LsMark t="Jabatan belum diisi" />},</div>
                            <div className="h-20" />
                            <div className="font-bold underline">{signer.trim() ? signer : <LsMark t="Nama penandatangan belum diisi" />}</div>
                        </div>
                    </div>
                </div>
            </div>

            {!locked && (
                <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                    <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
                        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="h-5 w-5" />
                        Saya sudah memeriksa SK dan hasilnya sudah benar
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                        {err
                            ? <span className="max-w-xs text-xs font-bold text-rose-700">{err}</span>
                            : !okBlock
                                ? <span className="text-xs font-bold text-rose-700">Selesaikan pemeriksaan ✕ di atas</span>
                                : !filled
                                    ? <span className="text-xs font-bold text-amber-700">Lengkapi data SK di atas</span>
                                    : null}
                        <button type="button" disabled={!can} onClick={submit} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"><Lock className="h-4 w-4" /> Tetapkan hasil</button>
                    </div>
                </div>
            )}
        </div>
    );
}

type ParentBar = { base: string; current: number | 'umum'; subs: { id: number; title: string }[] };

// patch-264: di menu induk, tampilkan pemilih sub-event di atas halaman, dan arahkan
// navigasi GET ke alamat sub-event kembali ke alamat induk (?sub=ID) supaya sidebar tetap milik induk.
function PanelLayout(props: React.ComponentProps<typeof BasePanelLayout>) {
    const pb = (usePage().props as any).parentBar as ParentBar | null | undefined;
    const pbBase = pb?.base;

    useEffect(() => {
        if (!pb) return undefined;
        const off = router.on('before', (e: any) => {
            const v = e.detail.visit;
            if (String(v.method).toLowerCase() !== 'get') return undefined;
            let u: URL;
            try { u = new URL(String(v.url), window.location.origin); } catch { return undefined; }
            const m = u.pathname.match(/^\/panel\/event\/(\d+)\/penilaian\/?$/);
            if (!m || !pb.subs.some((s) => String(s.id) === m[1])) return undefined;
            u.pathname = pb.base;
            u.searchParams.set('sub', m[1]);
            router.visit(u.pathname + u.search, { preserveScroll: v.preserveScroll, preserveState: v.preserveState, replace: v.replace, only: v.only });
            return false;
        });
        return off;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pbBase]);

    const chip = (on: boolean) =>
        `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`;

    const bar = pb ? (
        <div className={`${card} flex flex-wrap items-center gap-2 px-4 py-3`} data-subbar>
            <span className={`${lbl} mr-1`}>Sub-event</span>
            {pb.subs.map((s) => (
                <Link key={s.id} href={`${pb.base}?sub=${s.id}`} className={chip(pb.current === s.id)}>{s.title}</Link>
            ))}
        </div>
    ) : null;

    // patch-265: elemen pertama halaman (baris tab: Sistem penilaian, Juri, ...) tetap paling atas;
    // pemilih sub-event disisipkan tepat di bawahnya.
    let body: React.ReactNode = props.children;
    if (bar) {
        const root = props.children as any;
        if (isValidElement(root)) {
            const parts = Children.toArray((root as any).props.children);
            body = parts.length > 0
                ? cloneElement(root as React.ReactElement<any>, undefined, parts[0], bar, ...parts.slice(1))
                : <div className="space-y-5">{bar}</div>;
        } else {
            body = <div className="space-y-5">{bar}{props.children}</div>;
        }
    }

    return <BasePanelLayout {...props}>{body}</BasePanelLayout>;
}

export default function Penilaian(props: Props) {
    if (props.isParent) return <ParentPenilaian key={`p${props.event.id}`} {...props} />;
    return <PenilaianInner key={`${props.event.id}-${props.category?.id ?? 0}`} {...props} />;
}

function JuriSudahAda({ base, cid, catName, card, btn }: { base: string; cid: number; catName: string; card: string; btn: string }) {
    const [list, setList] = useState<{ id: number; name: string; contact: string | null; from: string[] }[]>([]);
    const [n, setN] = useState(0);
    const [busy, setBusy] = useState(0);
    useEffect(() => {
        let off = false;
        fetch(`${base}/juri-event?kategori=${cid}`, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : []))
            .then((d) => { if (!off) setList(Array.isArray(d) ? d : []); })
            .catch(() => {});
        return () => { off = true; };
    }, [base, cid, n]);
    if (list.length === 0) return null;
    const add = (id: number) => {
        setBusy(id);
        router.post(`${base}/juri/${id}/kategori`, { category_id: cid }, { preserveScroll: true, onSuccess: () => setN((x) => x + 1), onFinish: () => setBusy(0) });
    };
    return (
        <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">Sudah diundang di kategori lain ({list.length})</h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Tidak perlu diundang lagi, cukup tambahkan ke kategori {catName}.</p>
            <ul className="mt-4 space-y-2">
                {list.map((j) => (
                    <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3 dark:border-white/10">
                        <div className="min-w-0">
                            <div className="font-extrabold">{j.name}</div>
                            <div className="text-xs text-slate-500">Juri di: {j.from.join(', ')}{j.contact ? ` · ${j.contact}` : ''}</div>
                        </div>
                        <button type="button" disabled={busy === j.id} onClick={() => add(j.id)} className={`${btn} !px-4 !py-2 !text-xs`}>{busy === j.id ? 'Menambahkan…' : `Tambahkan ke ${catName}`}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PenilaianInner({ event, isParent, overall = null, subs = [], settings, criteria = [], deductions = [], judges = [], participants = 0, hasScores = false, categories = [], category = { id: 0, name: '' }, system = null, systemLock = null, skLomba = null, isSub = false }: Props) {
    const base = `/panel/event/${event.id}/penilaian`;
    const cfg: Cfg = settings ?? { enabled: false, scale: 100, judge_count: 3, avg_decimals: 2, rounding: 'nearest', deduction_enabled: false };
    const locked = cfg.enabled;
    const cid = category.id;
    const multiCat = categories.length > 1 || cid > 0;

    type TabKey = 'sistem' | 'nilai' | 'juri' | 'publikasi' | 'rekap' | 'sk';
    const hasSystem = system !== null;
    const [tabRaw, setTabState] = useState<TabKey>(() => {
        if (!hasSystem) return 'sistem';
        try {
            const v = sessionStorage.getItem('penilaian-tab');
            return v === 'sistem' || v === 'nilai' || v === 'juri' || v === 'publikasi' || v === 'rekap' || (v === 'sk' && (!isSub || !!overall)) ? v : 'juri';
        } catch {
            return 'juri';
        }
    });
    const setTab = (t: TabKey) => {
        setTabState(t);
        try { sessionStorage.setItem('penilaian-tab', t); } catch { /* abaikan */ }
    };
    const tab: TabKey = hasSystem ? (isSub && !overall && tabRaw === 'sk' ? 'juri' : tabRaw) : 'sistem';
    const [scale, setScale] = useState<number>(cfg.scale);
    const [judgeCount, setJudgeCount] = useState<string>(String(cfg.judge_count));
    const [decimals, setDecimals] = useState<string>(String(cfg.avg_decimals));
    const [rounding, setRounding] = useState<Cfg['rounding']>(cfg.rounding);
    const [dedOn, setDedOn] = useState<boolean>(cfg.deduction_enabled);
    const [rows, setRows] = useState<Row[]>(criteria.length ? criteria.map((r) => ({ ...r, subs: autoSub(r.subs ?? []) })) : [{ id: null, name: '', description: '', weight: 100 }]);
    const [deds, setDeds] = useState<Ded[]>(deductions);
    const [err, setErr] = useState('');
    const [jName, setJName] = useState('');
    const [jContact, setJContact] = useState('');
    const [jErr, setJErr] = useState('');
    const [copied, setCopied] = useState('');

    const subSum = (r: Row) => (r.subs ?? []).reduce((a, x) => a + (Number(x.weight) || 0), 0);
    const leafW: number[] = [];
    rows.forEach((r) => {
        if ((r.subs ?? []).length) (r.subs ?? []).forEach((x) => leafW.push(((Number(r.weight) || 0) * (Number(x.weight) || 0)) / 100));
        else leafW.push(Number(r.weight) || 0);
    });
    const leafP = allocate(scale, leafW);
    const ptsOf = (i: number, k: number | null) => {
        let n = 0;
        for (let a = 0; a < i; a++) n += (rows[a].subs ?? []).length || 1;
        return leafP[n + (k ?? 0)] ?? 0;
    };
    const total = rows.reduce((a, r) => a + (Number(r.weight) || 0), 0);
    const valid = total === 100 && rows.every((r) => r.name.trim() !== '' && Number(r.weight) >= 1 && (r.subs ?? []).every((x) => x.name.trim() !== '' && Number(x.weight) >= 1) && ((r.subs ?? []).length === 0 || subSum(r) === 100)) && Number(judgeCount) >= 1 && deds.every((d) => d.name.trim() !== '');
    const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
    const setSub = (i: number, k: number, patch: Partial<SubRow>) => setRows(rows.map((r, n) => (n === i ? { ...r, subs: (r.subs ?? []).map((x, m) => (m === k ? { ...x, ...patch } : x)) } : r)));
    const addSub = (i: number) => setRows(rows.map((r, n) => (n === i ? { ...r, subs: autoSub([...(r.subs ?? []), { id: null, name: '', description: '', weight: 0 }]) } : r)));
    const delSub = (i: number, k: number) => setRows(rows.map((r, n) => (n === i ? { ...r, subs: autoSub((r.subs ?? []).filter((_, m) => m !== k)) } : r)));
    const setDed = (i: number, patch: Partial<Ded>) => setDeds(deds.map((r, k) => (k === i ? { ...r, ...patch } : r)));

    const save = () => {
        if (hasScores && !confirm('Nilai juri yang sudah masuk akan dihapus karena skala atau bobot bisa berubah. Lanjutkan?')) return;
        setErr('');
        router.put(`${base}/kriteria`, {
            category_id: cid, scale, judge_count: Number(judgeCount), avg_decimals: Number(decimals), rounding, deduction_enabled: dedOn,
            criteria: rows.map((r) => ({ id: r.id, name: r.name, description: r.description, weight: Number(r.weight), subs: (r.subs ?? []).map((x) => ({ id: x.id, name: x.name, description: '', weight: Number(x.weight) })) })),
            deductions: deds.map((d) => ({ name: d.name, points: Number(d.points) || 0 })),
        } as any, { preserveScroll: true, onSuccess: () => window.scrollTo({ top: 0, behavior: 'smooth' }), onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan.')) });
    };
    const toggle = () => {
        if (locked && !confirm('Tutup penilaian? Juri tidak bisa mengisi nilai sampai Anda mengesahkannya lagi.')) return;
        router.post(`${base}/aktif`, { open: !locked, category_id: cid }, { preserveScroll: true });
    };
    const addJudge = () => {
        if (jName.trim() === '') return;
        router.post(`${base}/juri`, { name: jName, contact: jContact, category_id: cid }, {
            preserveScroll: true,
            onSuccess: () => { setJName(''); setJContact(''); setJErr(''); },
            onError: (e) => setJErr(String(Object.values(e)[0] ?? 'Gagal menambah juri.')),
        });
    };
    const copy = (text: string, key: string) => { navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1600); }); };
    const resetLink = (j: Judge) => { if (confirm(`Buat link baru untuk "${j.name}"? Link lama tidak akan berlaku lagi.`)) router.post(`${base}/juri/${j.id}/link`, {}, { preserveScroll: true }); };
    const toggleJudge = (j: Judge) => router.put(`${base}/juri/${j.id}`, { name: j.name, contact: j.contact ?? '', active: !j.active }, { preserveScroll: true });
    const delJudge = (j: Judge) => { if (confirm(`Hapus juri "${j.name}"? Semua nilainya ikut terhapus.`)) router.delete(`${base}/juri/${j.id}`, { preserveScroll: true }); };


    if (isParent) {
        return (
            <PanelLayout title="Penilaian">
                <div className="space-y-5">
                    <div className={`${card} p-6`}>
                        <h2 className="text-xl font-extrabold">Penilaian per lomba</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Pengaturan nilai dan juri diatur di tiap sub-event, karena peserta ada di sana. Halaman ini hanya ringkasan.</p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {subs.map((s) => (
                            <div key={s.id} className={`${card} flex flex-col gap-3 p-6`}>
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-lg font-extrabold">{s.title}</h3>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.categories > 0 && s.approved === s.categories ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>Disahkan {s.approved} dari {s.categories}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {[['Kategori', s.categories], ['Juri', s.judges], ['Peserta', s.participants]].map(([l, v]) => (
                                        <div key={String(l)} className="rounded-xl bg-slate-50 py-2.5 dark:bg-white/5"><div className="text-xl font-extrabold">{v}</div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{l}</div></div>
                                    ))}
                                </div>
                                
                                <Link href={`/panel/event/${s.id}/penilaian`} className="mt-auto inline-flex items-center justify-center rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-800">Kelola</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </PanelLayout>
        );
    }

    const activeJudges = judges.filter((j) => j.active).length;
    const savedTotal = criteria.reduce((a, c) => a + Number(c.weight), 0);
    const rawSteps = [
        { label: 'Sistem', done: true },
        { label: 'Skala, kriteria, bobot', done: criteria.length > 0 && savedTotal === 100 },
        { label: 'Pengurangan nilai', done: !cfg.deduction_enabled || deductions.length > 0 },
        { label: 'Pengesahan', done: cfg.enabled },
    ];
    const steps = rawSteps.map((st, n) => ({ ...st, done: rawSteps.slice(0, n + 1).every((x) => x.done) }));
    const allTabs = ([{ k: 'sistem', t: 'Sistem penilaian', i: Trophy }, { k: 'juri', t: 'Juri', i: Users }, { k: 'nilai', t: 'Pengaturan penilaian', i: ClipboardList }, { k: 'publikasi', t: 'Publikasi', i: Megaphone }, { k: 'rekap', t: 'Rekap nilai', i: BarChart3 }, { k: 'sk', t: 'Penetapan & SK', i: Gavel }] as const).filter((x) => !(isSub && !overall && x.k === 'sk'));
    const tabs = allTabs.filter((x) => x.k === 'sistem' || hasSystem);
    const choice = (w: number, k: number) => (w / 100) * scale * (k / 5);

    return (
        <PanelLayout title="Penilaian">
            <div className="space-y-5">

                <div className="flex flex-wrap gap-2">
                    {tabs.map(({ k, t, i: Icon }) => (
                        <button key={k} type="button" onClick={() => setTab(k)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${tab === k ? 'bg-indigo-900 text-white shadow' : 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}><Icon className="h-4 w-4" /> {t}</button>
                    ))}
                </div>

                {tab === 'sistem' && <SistemPicker base={base} title={event.title} system={system} lockReason={systemLock} onChosen={() => setTab('nilai')} />}

                <div className={`${card} space-y-5 p-6 ${tab === 'nilai' ? '' : 'hidden'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold">Penilaian</h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Atur sistem nilai, kriteria, dan juri untuk lomba ini.</p>
                            <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-extrabold text-indigo-700"><span className="h-2 w-2 rounded-full bg-indigo-600" /> Mengatur: {event.title}{multiCat && category.name ? ` · ${category.name}` : ''}</span>
                        </div>
                        <button type="button" onClick={toggle} disabled={!locked && !steps[1].done} className={locked ? 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200' : btn}>
                            {locked ? <><Lock className="h-4 w-4" /> Buka kunci kategori ini</> : multiCat ? `Sahkan kategori ${category.name}` : 'Sahkan & buka penilaian'}
                        </button>
                    </div>

                    <div className={`grid gap-3 ${tab === 'nilai' ? 'md:grid-cols-2' : ''}`}>
                        <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                            <div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-extrabold text-white">1</span><h3 className="text-base font-extrabold">Kategori</h3></div>
                            <div className="mt-3 space-y-2">
                                {categories.map((c) => <Option key={c.id} on={c.id === cid} label={c.name} approved={c.approved} href={`${base}?kategori=${c.id}`} />)}
                            </div>
                        </div>
                        <div className={`rounded-2xl border border-slate-200/80 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5 ${tab === 'nilai' ? '' : 'hidden'}`}>
                            <div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-extrabold text-white">2</span><h3 className="text-base font-extrabold">Sistem perlombaan</h3></div>
                            <p className={`mt-3 text-xs font-bold ${locked ? 'text-emerald-700' : 'text-slate-600 dark:text-slate-300'}`}>{locked ? 'Kategori ini sudah disahkan, sistemnya tidak bisa diganti.' : 'Sistem yang dipakai untuk menghitung nilai akhir.'}</p>
                            <div className={`mt-2 rounded-xl border border-indigo-300 bg-white p-3 dark:bg-white/5 ${locked ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-2.5"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600"><span className="h-2 w-2 rounded-full bg-indigo-600" /></span><span className="text-sm font-extrabold">Penilaian Berbasis Bobot Nilai</span></div>
                                <p className="mt-1 pl-6 text-xs text-slate-600 dark:text-slate-300">Nilai akhir dari jumlah (nilai × bobot) tiap kriteria.</p>
                                <p className="mt-1 pl-6 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Weighted · Versi 1</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200/70 dark:border-white/10" />

                    {tab === 'nilai' && <Stepper steps={steps} />}

                    {locked ? (
                        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-800"><Check className="h-4 w-4" strokeWidth={3} /> Disahkan{multiCat && category.name ? ` untuk kategori ${category.name}` : ''}: Penilaian Berbasis Bobot Nilai. Konfigurasi terkunci dan juri sudah bisa menilai.</p>
                    ) : (
                        <div className={`flex flex-wrap gap-2 text-xs font-bold justify-center ${tab === 'nilai' ? '' : 'hidden'}`}>
                            <span className={`rounded-full px-2.5 py-1 ${steps[1].done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{steps[1].done ? '✓ Bobot kriteria 100%' : '• Bobot kriteria belum 100%'}</span>
                            <span className={`rounded-full px-2.5 py-1 ${activeJudges >= cfg.judge_count ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{activeJudges >= cfg.judge_count ? `✓ ${activeJudges} juri aktif` : `• Juri aktif ${activeJudges} dari ${cfg.judge_count}`}</span>
                            <span className={`rounded-full px-2.5 py-1 ${participants > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{participants > 0 ? `✓ ${participants} peserta dinilai` : '• Belum ada peserta terdaftar'}</span>
                        </div>
                    )}
                </div>

                {tab === 'rekap' && <Rekap />}

                {tab === 'sk' && (overall
                    ? <><style>{`[data-subbar]{display:none}`}</style><ParentSK ov={overall} base={(overall as any).base} title={(overall as any).title} /></>
                    : <PenetapanSK sk={skLomba} base={base} />)}

                {tab === 'publikasi' && <Publikasi btn={btn} onGoSettings={(id: number) => { if (id === category.id) setTab('nilai'); else router.get(base, { kategori: id }, { preserveState: true, preserveScroll: true, onSuccess: () => setTab('nilai') }); }} />}

                {tab === 'nilai' && (
                    <>
                        {/* 2. Skala, kriteria, bobot */}
                        <div className={`${card} space-y-4 p-4`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-extrabold text-white">3</span><div><h3 className="text-base font-extrabold">Skala, kriteria, dan bobot</h3><p className="text-sm text-slate-600 dark:text-slate-300">Pilih skala nilai akhir, lalu susun kriteria dan bobotnya. Total bobot harus 100%.</p></div></div>
                                <div className="w-full sm:w-72">
                                    <div className="flex justify-between text-xs font-extrabold"><span>Total bobot</span><span className={total === 100 ? 'text-emerald-600' : 'text-amber-600'}>{total}% {total === 100 && '✓'}</span></div>
                                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className={`h-full rounded-full transition-all ${total === 100 ? 'bg-emerald-500' : total > 100 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(total, 100)}%` }} /></div>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-extrabold">Skala nilai akhir</div>
                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                    {[[100, 'Ratusan'], [1000, 'Ribuan']].map(([v, name]) => (
                                        <button key={v} type="button" disabled={locked} onClick={() => setScale(Number(v))} className={`relative rounded-xl border-2 p-4 text-left transition disabled:cursor-not-allowed ${scale === v ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10' : 'border-slate-200 bg-white/60 hover:border-slate-300 dark:border-white/10'} ${locked && scale !== v ? 'opacity-50' : ''}`}>
                                            <div className="text-xl font-extrabold">{num(Number(v))}</div>
                                            <div className="text-sm font-extrabold">{name}</div>
                                            <div className="text-sm text-slate-500">Nilai akhir maksimal {num(Number(v))}</div>
                                            {scale === v && <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-extrabold">Kriteria dan bobot</div>
                                <div className="mt-2 space-y-2">
                                    {rows.map((r, i) => (
                                        <div key={i} className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 font-extrabold text-white">{i + 1}</span>
                                                <input className={`${inp} min-w-[160px] flex-1`} placeholder="Nama kriteria, contoh: Suara" maxLength={60} disabled={locked} value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} />
                                                <div className="flex w-28 items-center gap-1.5"><input className={`${inp} text-right`} type="number" min={1} max={100} disabled={locked} value={r.weight} onChange={(e) => setRow(i, { weight: e.target.value })} /><span className="font-bold text-slate-500">%</span></div>
                                                <span className="w-28 text-sm font-bold text-slate-500">maks {num((Number(r.weight) || 0) / 100 * scale)} poin</span>
                                                <button type="button" disabled={locked || rows.length === 1} onClick={() => setRows(rows.filter((_, k) => k !== i))} className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-30" aria-label="Hapus kriteria"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                            <input className={`${inp} mt-2`} placeholder="Indikator atau penjelasan untuk juri (opsional)" maxLength={200} disabled={locked} value={r.description} onChange={(e) => setRow(i, { description: e.target.value })} />
                                            {(r.subs ?? []).length > 0 && (
                                                <div className="mt-2 space-y-2 border-l-2 border-indigo-200 pl-3 dark:border-indigo-400/30">
                                                    {(r.subs ?? []).map((x, k) => (
                                                        <div key={k} className="space-y-1.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="flex h-7 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-extrabold text-indigo-700">{i + 1}.{k + 1}</span>
                                                                <input className={`${inpSm} min-w-[140px] flex-1`} placeholder="Nama sub kriteria, contoh: Intonasi" maxLength={60} disabled={locked} value={x.name} onChange={(e) => setSub(i, k, { name: e.target.value })} />
                                                                <div className="flex w-24 items-center justify-end gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-extrabold text-slate-700 dark:bg-white/10 dark:text-slate-200" title="Dihitung otomatis oleh sistem">{x.weight}<span className="font-bold text-slate-500">%</span></div>
                                                                <span className="w-28 text-xs font-bold text-slate-500">maks {num(ptsOf(i, k))} poin</span>
                                                                <button type="button" disabled={locked} onClick={() => delSub(i, k)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30" aria-label="Hapus sub kriteria"><Trash2 className="h-3.5 w-3.5" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className={`text-xs font-extrabold ${subSum(r) === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>Bobot sub kriteria dibagi rata otomatis, total {subSum(r)}% {subSum(r) === 100 ? '✓' : '(harus 100%)'}</div>
                                                </div>
                                            )}
                                            <button type="button" disabled={locked || (r.subs ?? []).length >= 15} onClick={() => addSub(i)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 px-2.5 py-1.5 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Sub kriteria</button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" disabled={locked || rows.length >= 15} onClick={() => setRows([...rows, { id: null, name: '', description: '', weight: 0 }])} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><Plus className="h-4 w-4" /> Tambah kriteria</button>
                                {err && <p className="mt-3 text-sm font-semibold text-rose-700">{err}</p>}
                            </div>

                            <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                                <h4 className="font-extrabold">Pratinjau pilihan nilai juri</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Ini angka yang akan diklik juri. Dihitung otomatis dari bobot dan skala, tidak perlu diisi manual.</p>
                                <div className="mt-3 overflow-x-auto">
                                    <table className="w-full min-w-[560px] text-sm">
                                        <thead><tr className="text-left font-bold text-slate-500"><th className="py-2 pr-3">Kriteria</th><th className="py-2 pr-3 text-right">Bobot</th>{[1, 2, 3, 4, 5].map((k) => <th key={k} className="py-2 pl-3 text-right">Level {k} (puncak)</th>)}</tr></thead>
                                        <tbody>
                                            {rows.map((r, i) => (
                                                <Fragment key={i}>
                                                    <tr className="border-t border-slate-100 dark:border-white/10"><td className="py-2.5 pr-3 font-extrabold">{r.name || `Kriteria ${i + 1}`}</td><td className="py-2.5 pr-3 text-right text-slate-500">{Number(r.weight) || 0}%</td>{(r.subs ?? []).length > 0 ? <td colSpan={5} className="py-2.5 pl-3 text-right text-xs text-slate-400">dinilai per sub kriteria</td> : [1, 2, 3, 4, 5].map((k) => <td key={k} className="py-2.5 pl-3 text-right font-extrabold">{num((ptsOf(i, null) * k) / 5)}</td>)}</tr>
                                                    {(r.subs ?? []).map((x, m) => {
                                                        const w = ((Number(r.weight) || 0) * (Number(x.weight) || 0)) / 100;
                                                        return <tr key={m} className="border-t border-slate-50 dark:border-white/5"><td className="py-2 pl-5 pr-3 text-slate-700 dark:text-slate-200">{x.name || `Sub ${i + 1}.${m + 1}`}</td><td className="py-2 pr-3 text-right text-slate-500">{num(w)}%</td>{[1, 2, 3, 4, 5].map((k) => <td key={k} className="py-2 pl-3 text-right font-bold">{num((ptsOf(i, m) * k) / 5)}</td>)}</tr>;
                                                    })}
                                                </Fragment>
                                            ))}
                                            <tr className="border-t-2 border-slate-200 bg-indigo-50/60 font-extrabold dark:bg-indigo-500/10"><td className="rounded-l-xl py-2.5 pl-3 pr-3">Total</td><td className="py-2.5 pr-3 text-right">{total}%</td>{[1, 2, 3, 4, 5].map((k) => <td key={k} className="py-2.5 pl-3 text-right last:rounded-r-xl last:pr-3">{num(choice(total, k))}</td>)}</tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-3 text-xs text-slate-500">Rumus: pilihan = bobot% × skala × (1 sampai 5) ÷ 5. Nilai maksimal juri sama dengan skala hanya jika total bobot 100%.</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                                <h4 className="font-extrabold">Juri dan pembulatan</h4>
                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                    <label><span className={lbl}>Jumlah juri</span><input className={`${inp} mt-1.5`} type="number" min={1} max={15} disabled={locked} value={judgeCount} onChange={(e) => setJudgeCount(e.target.value)} /></label>
                                    <label><span className={lbl}>Desimal rata-rata</span><input className={`${inp} mt-1.5`} type="number" min={0} max={4} disabled={locked} value={decimals} onChange={(e) => setDecimals(e.target.value)} /></label>
                                    <label><span className={lbl}>Pembulatan</span>
                                        <select className={`${inp} mt-1.5`} disabled={locked} value={rounding} onChange={(e) => setRounding(e.target.value as Cfg['rounding'])}>
                                            <option value="nearest">Terdekat</option><option value="up">Ke atas</option><option value="down">Ke bawah</option>
                                        </select>
                                    </label>
                                </div>
                                <p className="mt-3 text-xs text-slate-500">Nilai akhir = rata-rata juri yang sudah selesai menilai.</p>
                            </div>
                        </div>

                        {/* 3. Pengurangan nilai */}
                        <div className={`${card} p-4`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-extrabold text-white">4</span><div><h3 className="text-base font-extrabold">Pengurangan nilai</h3><p className="text-sm text-slate-600 dark:text-slate-300">Pelanggaran ringan yang mengurangi nilai. Terpisah dari penalti.</p></div></div>
                                <label className="flex items-center gap-3 text-sm font-extrabold">Aktifkan untuk lomba ini <Toggle on={dedOn} onChange={setDedOn} disabled={locked} /></label>
                            </div>
                            {!dedOn ? (
                                <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300"><MinusCircle className="h-5 w-5 shrink-0 text-slate-400" /> Pengurangan nilai tidak dipakai pada lomba ini. Aktifkan lewat saklar di kanan atas.</div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {deds.map((d, i) => (
                                        <div key={i} className="flex flex-wrap items-center gap-3">
                                            <input className={`${inp} min-w-[180px] flex-1`} placeholder="Contoh: Terlambat naik panggung" maxLength={60} disabled={locked} value={d.name} onChange={(e) => setDed(i, { name: e.target.value })} />
                                            <div className="flex w-36 items-center gap-1.5"><span className="text-sm font-bold text-slate-500">−</span><input className={`${inp} text-right`} type="number" min={0} step="0.5" disabled={locked} value={d.points} onChange={(e) => setDed(i, { points: e.target.value })} /><span className="text-sm font-bold text-slate-500">poin</span></div>
                                            <button type="button" disabled={locked} onClick={() => setDeds(deds.filter((_, k) => k !== i))} className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-30" aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                    <button type="button" disabled={locked || deds.length >= 20} onClick={() => setDeds([...deds, { name: '', points: 0 }])} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"><Plus className="h-4 w-4" /> Tambah jenis pengurangan</button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button type="button" disabled={locked || !valid} onClick={save} className={btn}>Simpan pengaturan</button>
                            {locked && <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500"><Lock className="h-4 w-4" /> Terkunci. Tutup penilaian untuk mengubah.</span>}
                            {!locked && !valid && (() => {
                                const msgs: string[] = [];
                                const tot = rows.reduce((a, r) => a + (Number(r.weight) || 0), 0);
                                if (tot !== 100) msgs.push(`Total bobot kriteria ${tot}%, ${tot < 100 ? 'kurang ' + (100 - tot) : 'lebih ' + (tot - 100)}%. Harus tepat 100%.`);
                                rows.forEach((r, i) => {
                                    const nm = r.name.trim() || `Kriteria ${i + 1}`;
                                    if (r.name.trim() === '') msgs.push(`Kriteria ${i + 1}: nama belum diisi.`);
                                    if ((r.subs ?? []).length && subSum(r) !== 100) msgs.push(`Sub kriteria "${nm}" total ${subSum(r)}%, harus 100%.`);
                                    (r.subs ?? []).forEach((x, k) => {
                                        if (x.name.trim() === '') msgs.push(`"${nm}": sub kriteria ${k + 1} belum diberi nama.`);
                                    });
                                });
                                const jc = Number(judgeCount);
                                if (!(jc >= 1 && jc <= 15)) msgs.push('Jumlah juri harus antara 1 sampai 15.');
                                const dc = Number(decimals);
                                if (!(dc >= 0 && dc <= 4)) msgs.push('Desimal rata-rata harus antara 0 sampai 4.');
                                if (dedOn) deds.forEach((d, i) => { if (d.name.trim() === '') msgs.push(`Jenis pengurangan ke-${i + 1} belum diberi nama.`); });
                                if (msgs.length === 0) msgs.push('Ada isian yang belum valid. Periksa semua kolom di atas.');
                                return <ul className="min-w-[240px] flex-1 space-y-0.5 text-sm font-bold text-amber-700">{msgs.map((m, i) => <li key={i}>{m}</li>)}</ul>;
                            })()}
                        </div>

                    </>
                )}

                {tab === 'juri' && (
                    <>
<div className={`${card} p-4`}>
    {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
                <button
                    key={c.id}
                    type="button"
                    onClick={() => { if (c.id !== cid) router.get(base, { kategori: c.id }, { preserveState: true, preserveScroll: true, onSuccess: () => setTab('juri') }); }}
                    className={`rounded-full border px-4 py-2 text-sm font-extrabold transition ${c.id === cid ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}
                >
                    {c.name}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${c.id === cid ? 'bg-white/20 text-white' : ((c as any).judges >= (c as any).need ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}`}>{(c as any).judges ?? 0}/{(c as any).need ?? 0}</span>
                </button>
            ))}
        </div>
    )}
    <div className={categories.length > 1 ? 'mt-4' : ''}>
        <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700 dark:text-slate-200">{activeJudges} dari {cfg.judge_count} juri aktif</span>
            <span className={`font-extrabold ${activeJudges >= cfg.judge_count ? 'text-emerald-600' : 'text-slate-500'}`}>{activeJudges >= cfg.judge_count ? 'Cukup' : `Kurang ${cfg.judge_count - activeJudges}`}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className={`h-full rounded-full transition-all ${activeJudges >= cfg.judge_count ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${cfg.judge_count > 0 ? Math.min(100, Math.round((activeJudges / cfg.judge_count) * 100)) : 0}%` }} />
        </div>
    </div>
</div>
<JuriTambah card={card} inp={inpSm} btn={btn}>
<JuriSudahAda base={base} cid={cid} catName={category.name || 'ini'} card={card} btn={btn} />
</JuriTambah>
<JuriBelumTugas btn={btn} />

                        <div className={`${card} p-4`}>
                            <h3 className="text-base font-extrabold">Juri terdaftar <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{judges.length}</span></h3>
                            {judges.length === 0 ? (
                                <JuriKosong />
                            ) : (
                                <ul className="mt-4 space-y-3">
                                    {judges.map((j) => {
                                        const pct = participants ? Math.round((j.done / participants) * 100) : 0;
                                        return (
                                            <li key={j.id} className={`rounded-2xl border border-slate-100 p-4 dark:border-white/10 ${j.active ? '' : 'opacity-60'}`}>
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="font-extrabold">{j.name} {!j.active && <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">Nonaktif</span>}</div>
                                                        {j.contact && <div className="text-xs text-slate-500">{j.contact}</div>}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => copy(j.url, `j${j.id}`)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-800 hover:bg-indigo-100">{copied === `j${j.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === `j${j.id}` ? 'Tersalin' : 'Salin link'}</button>
                                                        <button type="button" onClick={() => resetLink(j)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-200"><RefreshCw className="h-3.5 w-3.5" /> Reset link</button>
                                                        <button type="button" onClick={() => toggleJudge(j)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-200">{j.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                                                        <button type="button" onClick={() => delJudge(j)} className="rounded-xl p-2 text-rose-600 hover:bg-rose-50" aria-label="Hapus juri"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center gap-3">
                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-violet-600'}`} style={{ width: `${pct}%` }} /></div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{j.done} dari {participants} peserta dinilai</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </div>
        </PanelLayout>
    );
}
