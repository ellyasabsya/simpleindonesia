import { Link } from '@inertiajs/react';
import { Check, ChevronRight, Lock, Play, Users } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '../kit/empty-state';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';

type Part = { id: number; name: string; school: string | null; code: string; done: boolean; draft: boolean };

type Props = {
    token: string;
    event: string;
    judgeName: string;
    participants: Part[];
    criteriaCount: number;
    scale: string;
    blocked: string | null;
    success?: string;
};

type Tab = 'all' | 'todo' | 'done';

export default function JuriNilaiMobile({ token, event, judgeName, participants, criteriaCount, scale, blocked, success }: Props) {
    const [tab, setTab] = useState<Tab>('all');
    const [title, ...rest] = event.split(' - ');
    const category = rest.join(' - ');

    const done = participants.filter((p) => p.done).length;
    const todo = participants.length - done;
    const pct = participants.length ? Math.round((done / participants.length) * 100) : 0;
    const firstTodo = participants.find((p) => !p.done);
    const hasDraft = !!firstTodo?.draft;
    const shown = participants.filter((p) => (tab === 'all' ? true : tab === 'todo' ? !p.done : p.done));
    const link = (id: number) => '/juri/' + token + '?peserta=' + id;

    const tabs: [Tab, string, number][] = [['all', 'Semua', participants.length], ['todo', 'Belum', todo], ['done', 'Sudah', done]];

    return (
        <div className="space-y-4 pb-4">
            <header className="space-y-1 px-1">
                {category && <span className="inline-block rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Kategori {category}</span>}
                <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{title}</h1>
                <p className={'text-[13px] leading-relaxed ' + MUTED}>Halo, {judgeName}. Pilih peserta untuk mulai menilai.</p>
            </header>

            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 text-white dark:to-violet-600">
                <div className="flex items-center gap-4">
                    <span className="grid size-[68px] shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#fff ' + pct * 3.6 + 'deg, rgba(255,255,255,.25) 0deg)' }}>
                        <span className="grid size-[52px] place-items-center rounded-full bg-indigo-600 text-sm font-semibold">{pct}%</span>
                    </span>
                    <div className="min-w-0">
                        <div className="text-[26px] leading-none font-semibold">{done}<span className="text-base font-medium text-white/70"> / {participants.length}</span></div>
                        <div className="mt-1 text-xs text-white/80">{todo === 0 && participants.length > 0 ? 'Semua peserta sudah dinilai' : todo + ' peserta menunggu nilai Anda'}</div>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
                    <span className="rounded-full bg-white/15 px-2.5 py-1">{criteriaCount} kriteria</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1">Nilai maks. {scale}</span>
                </div>
            </div>

            {success && <p className="rounded-2xl bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-800 dark:text-emerald-200">{success}</p>}
            {blocked && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-3 py-2.5 text-[13px] leading-snug font-medium text-amber-800 dark:text-amber-200">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    <span>{blocked}</span>
                </div>
            )}

            {!blocked && firstTodo && (
                <Link href={link(firstTodo.id)} className={'flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-semibold text-white dark:bg-indigo-500 ' + PRESS}>
                    <Play className="size-4" fill="currentColor" />
                    {done === 0 && !hasDraft ? 'Mulai menilai' : 'Lanjutkan menilai'}
                </Link>
            )}

            {participants.length === 0 ? (
                <EmptyState icon={Users} title="Belum ada peserta" text="Peserta akan muncul di sini setelah terdaftar." />
            ) : (
                <>
                    <div className="flex gap-2">
                        {tabs.map(([k, label, n]) => (
                            <button key={k} type="button" onClick={() => setTab(k)}
                                className={'inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-medium ' + PRESS + ' ' + (tab === k ? 'bg-indigo-600 text-white dark:bg-indigo-500' : FIELD + ' text-slate-800 dark:text-slate-100')}>
                                {label}
                                <span className={'rounded-full px-1.5 text-[10px] ' + (tab === k ? 'bg-white/25' : 'bg-slate-900/[0.07] dark:bg-white/10')}>{n}</span>
                            </button>
                        ))}
                    </div>

                    {shown.length === 0 ? (
                        <p className={'rounded-3xl p-5 text-center text-sm ' + FIELD + ' ' + MUTED}>{tab === 'todo' ? 'Tidak ada peserta yang menunggu.' : 'Belum ada peserta yang dinilai.'}</p>
                    ) : (
                        <div className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl dark:divide-white/10 ' + CARD}>
                            {shown.map((p) => {
                                const idx = participants.indexOf(p) + 1;
                                const sub = [p.name !== p.code ? p.name : null, p.school].filter(Boolean).join(' · ');
                                return (
                                    <Link key={p.id} href={link(p.id)} className={'flex items-center gap-3 px-4 py-3 ' + PRESS}>
                                        <span className={'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ' + (p.done ? 'bg-emerald-500 text-white' : FIELD + ' text-indigo-700 dark:text-indigo-300')}>
                                            {p.done ? <Check className="size-5" /> : idx}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[15px] font-medium">{p.code}</span>
                                            <span className={'block truncate text-xs ' + MUTED}>{sub || (p.done ? 'Sudah dinilai' : 'Belum dinilai')}</span>
                                        </span>
                                        {p.draft && !p.done && <span className="shrink-0 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">Draf</span>}
                                        <ChevronRight className={'size-4 shrink-0 ' + MUTED} />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
