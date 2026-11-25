import { Link } from '@inertiajs/react';
import { ArrowLeft, ScrollText } from 'lucide-react';
import UserLayout from '@/components/user/user-layout';

type Sub = { name: string; description?: string; weight: number };
type Crit = { name: string; description?: string; weight: number; subs?: Sub[] };
type Rules = {
    method?: string; combine?: string; scale?: string; rounding?: string; ranking?: string; deduction?: string;
    deductions?: { name: string; points: number }[]; criteria?: Crit[]; penalty_types?: string[];
};
type SetT = { category: string; version: number; note: string | null; sent_at: string | null; rules: Rules };

export default function Aturan({ event_title, sets = [] }: { event_title: string; sets?: SetT[] }) {
    const facts = (r: Rules): [string, string | undefined][] => [
        ['Metode', r.method], ['Cara menggabung nilai juri', r.combine], ['Skala nilai', r.scale],
        ['Pembulatan', r.rounding], ['Peringkat', r.ranking], ['Pengurangan nilai', r.deduction],
    ];

    return (
        <UserLayout title="Aturan penilaian" hasPanel={false}>
            <div className="space-y-6">
                <Link href="/event-saya" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-extrabold"><ScrollText className="h-7 w-7" /> Aturan penilaian</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">{event_title}</p>
                </div>

                {sets.map((s, i) => (
                    <div key={i} className="space-y-4 rounded-3xl bg-white/80 p-5 shadow-sm dark:bg-white/5">
                        <div>
                            <h2 className="text-xl font-extrabold">{s.category ? `Kategori ${s.category}` : 'Aturan'}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-300">Versi {s.version}{s.sent_at ? ` · ${s.sent_at}` : ''}</p>
                            {s.note && <p className="mt-2 rounded-2xl bg-indigo-50 p-3 text-sm dark:bg-indigo-500/10">{s.note}</p>}
                        </div>

                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                            {facts(s.rules).filter(([, v]) => v).map(([k, v]) => (
                                <div key={k} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                                    <dt className="text-slate-500 dark:text-slate-300">{k}</dt>
                                    <dd className="font-bold">{v}</dd>
                                </div>
                            ))}
                        </dl>

                        {(s.rules.criteria ?? []).length > 0 && (
                            <div>
                                <h3 className="mb-2 font-extrabold">Kriteria dan bobot</h3>
                                <div className="space-y-2">
                                    {(s.rules.criteria ?? []).map((c, j) => (
                                        <div key={j} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                                            <div className="flex justify-between gap-3 font-bold"><span>{c.name}</span><span>{c.weight}%</span></div>
                                            {c.description && <p className="text-sm text-slate-500 dark:text-slate-300">{c.description}</p>}
                                            {(c.subs ?? []).length > 0 && (
                                                <ul className="mt-2 space-y-1 text-sm">
                                                    {(c.subs ?? []).map((x, n) => (
                                                        <li key={n} className="flex justify-between gap-3 pl-3">
                                                            <span>{x.name}{x.description ? ` — ${x.description}` : ''}</span><span>{x.weight}%</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(s.rules.deductions ?? []).length > 0 && (
                            <div>
                                <h3 className="mb-2 font-extrabold">Pengurangan nilai</h3>
                                <ul className="space-y-1 text-sm">
                                    {(s.rules.deductions ?? []).map((d, j) => (
                                        <li key={j} className="flex justify-between gap-3"><span>{d.name}</span><span>-{d.points}</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {(s.rules.penalty_types ?? []).length > 0 && (
                            <div>
                                <h3 className="mb-2 font-extrabold">Jenis sanksi</h3>
                                <p className="text-sm">{(s.rules.penalty_types ?? []).join(', ')}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </UserLayout>
    );
}
