import { Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import JuriLayout from '@/components/juri/juri-layout';
import { JURI_CSS } from '@/components/mobile/kit/juri-css';
import { usePhone } from '@/components/mobile/use-phone';
import JuriNilaiMobile from '@/components/mobile/juri/juri-nilai-mobile';

type Crit = { id: number; name: string; description: string | null; weight: number; max_score: number; group?: string | null };
type Part = { id: number; name: string; school: string | null; code?: string; code_tail?: string };
type Props = {
    token: string;
    judge: { name: string; active: boolean };
    event: { title: string };
    enabled: boolean;
    scale: number;
    criteria: Crit[];
    participants: Part[];
    scores: Record<string, Record<string, number>>;
};

const num = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);
const codeOf = (p: Part) => p.code || `ID-${p.id}`;

export default function JuriNilai({ token, judge, event, enabled, scale, criteria, participants, scores }: Props) {
    const page = usePage().props as any;
    const phone = usePhone();
    const flash = page.flash ?? {};
    const [drafts, setDrafts] = useState<Record<number, boolean>>({});
    useEffect(() => {
        try {
            const d = JSON.parse(window.localStorage.getItem('juri-draft-' + token) ?? 'null');
            if (!d) return;
            const o: Record<number, boolean> = {};
            participants.forEach((p) => {
                if (scores?.[p.id]) return;
                if (Object.values(d[p.id] ?? {}).some((v) => typeof v === 'number')) o[p.id] = true;
            });
            setDrafts(o);
        } catch { /* abaikan */ }
    }, [token]);

    const isDone = (p: Part) => !!scores?.[p.id] && Object.keys(scores[p.id]).length >= criteria.length && criteria.length > 0;
    const doneCount = participants.filter(isDone).length;
    const pending = participants.length - doneCount;
    const pct = participants.length ? Math.round((doneCount / participants.length) * 100) : 0;
    const blocked = !judge.active ? 'Akses Anda sebagai juri sedang dinonaktifkan oleh panitia.' : !enabled ? 'Penilaian belum dibuka atau sudah ditutup oleh panitia.' : null;
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (phone) {
        return (
            <JuriLayout title={`Penilaian - ${event.title}`} judgeName={judge.name}>
                <JuriNilaiMobile
                    token={token}
                    event={event.title}
                    judgeName={judge.name}
                    criteriaCount={criteria.length}
                    scale={num(scale)}
                    blocked={blocked}
                    success={flash.success}
                    participants={participants.map((x) => ({ id: x.id, name: x.name, school: x.school, code: codeOf(x), done: isDone(x), draft: !!drafts[x.id] }))}
                />
            </JuriLayout>
        );
    }

    return (
        <JuriLayout title={`Penilaian - ${event.title}`} judgeName={judge.name}>
            {phone && (
                <>
                    <span data-mobile-juri hidden />
                    <style>{JURI_CSS}</style>
                </>
            )}
            <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[13px] font-bold shadow-sm dark:bg-white/10"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" />Penilaian Juri · {today}</div>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.75rem]">Nilai <span className="bg-gradient-to-r from-indigo-600 to-sky-400 bg-clip-text text-transparent">{event.title}</span></h1>
                <p className="mt-2 text-base text-slate-600 dark:text-slate-300">Halo, {judge.name}. Pilih peserta untuk mulai menilai. Nilai dikirim di halaman peserta dan dikonfirmasi dengan angka terakhir kode registrasi.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-6 text-white shadow-xl sm:p-8">
                    <div className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">Ringkasan penilaian</div>
                    <div className="mt-3 flex items-end gap-3"><span className="text-6xl font-extrabold">{participants.length}</span><span className="pb-2 text-xl text-blue-100">total peserta</span></div>
                    <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} /></div>
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-base">
                        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" />Sudah dinilai <b>{doneCount}</b></span>
                        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" />Belum dinilai <b>{pending}</b></span>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/10 p-4"><div className="text-xs font-bold uppercase tracking-widest text-blue-200">Progres</div><div className="mt-1 text-3xl font-extrabold">{pct}%</div><div className="text-sm text-blue-200">dari semua peserta</div></div>
                        <div className="rounded-2xl bg-white/10 p-4"><div className="text-xs font-bold uppercase tracking-widest text-blue-200">Kriteria</div><div className="mt-1 text-3xl font-extrabold">{criteria.length}</div><div className="text-sm text-blue-200">dinilai per peserta</div></div>
                        <div className="rounded-2xl bg-white/10 p-4"><div className="text-xs font-bold uppercase tracking-widest text-blue-200">Nilai maksimal</div><div className="mt-1 text-3xl font-extrabold">{num(scale)}</div><div className="text-sm text-blue-200">skala akhir</div></div>
                    </div>
                </section>

                <section className="rounded-[2rem] bg-white/85 p-6 shadow-xl ring-1 ring-white/70 backdrop-blur sm:p-7 dark:bg-white/10 dark:ring-white/10">
                    <div className="flex items-center gap-5">
                        <div className="grid h-[7.5rem] w-[7.5rem] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#3b82f6 ${pct * 3.6}deg, #c7d2fe 0deg)` }}>
                            <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center text-slate-900"><div><div className="text-2xl font-extrabold leading-none">{pct}%</div><div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Selesai</div></div></div>
                        </div>
                        <div><div className="text-xl font-extrabold leading-snug">Kelengkapan penilaian</div><div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{pending === 0 && participants.length > 0 ? 'Semua peserta sudah dinilai 🎉' : `${pending} peserta belum dinilai`}</div></div>
                    </div>
                    <div className="mt-5 max-h-60 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                        {participants.map((p) => {
                            const done = isDone(p);
                            return (
                                <Link key={p.id} href={`/juri/${token}?peserta=${p.id}`} className="flex items-center gap-3 text-sm font-semibold transition hover:text-indigo-600">
                                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 bg-white/60 dark:border-white/30 dark:bg-transparent'}`}>{done && <Check className="h-4 w-4" />}</span>
                                    <span className={`truncate ${done ? 'text-slate-400 line-through dark:text-slate-500' : ''}`}>{codeOf(p)}<span className="font-normal opacity-70"> · {p.name}</span></span>
                                </Link>
                            );
                        })}
                        {participants.length === 0 && <p className="text-sm text-slate-500">Belum ada peserta terdaftar.</p>}
                    </div>
                </section>
            </div>

            {blocked && <p className="rounded-2xl bg-amber-100 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-300">{blocked}</p>}
            {flash.success && <p className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-300">{flash.success}</p>}
            {criteria.length === 0 && !blocked && <p className="rounded-2xl bg-amber-100 p-4 text-sm font-semibold text-amber-900">Kriteria penilaian belum diatur panitia.</p>}

            <h2 className="pt-2 text-xl font-extrabold">Daftar peserta</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {participants.map((p) => {
                    const done = isDone(p);
                    return (
                        <Link key={p.id} href={`/juri/${token}?peserta=${p.id}`} className="group relative overflow-hidden rounded-3xl bg-white/85 p-5 pt-6 shadow-md ring-1 ring-white/70 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl hover:ring-2 hover:ring-indigo-400 dark:bg-white/10 dark:ring-white/10">
                            <div className={`absolute inset-x-8 top-0 h-1 rounded-b-full ${done ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="inline-block max-w-full whitespace-nowrap rounded-xl bg-indigo-600 px-3.5 py-1.5 text-base font-extrabold tracking-wide text-white shadow-sm">{codeOf(p)}</span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>{done ? 'Sudah dinilai' : 'Belum dinilai'}</span>
                                    {drafts[p.id] && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">Ada draf</span>}
                                </div>
                            </div>
                            <div className="mt-4 truncate text-lg font-bold">{p.name}</div>
                            <div className="truncate text-sm text-slate-500 dark:text-slate-300">{p.school ?? '-'}</div>
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-800 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-white/10 dark:text-indigo-100"><span>{done ? 'Lihat atau ubah nilai' : 'Mulai menilai'}</span><span>→</span></div>
                        </Link>
                    );
                })}
            </div>
        </JuriLayout>
    );
}
