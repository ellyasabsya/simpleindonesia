import { router, usePage } from '@inertiajs/react';
import { AlertCircle, Check, Clock, Loader2, Mail, MapPin, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type Invite = { id: number; name: string; email: string; status: string };
type Found = { name: string; city?: string | null };

const solid = 'rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10';
const initial = (n: string) => (n.trim()[0] ?? '?').toUpperCase();

function Avatar({ name, tone = 'indigo' }: { name: string; tone?: 'indigo' | 'amber' }) {
    return (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-black text-white ${tone === 'amber' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-600 to-violet-600'}`}>
            {initial(name)}
        </span>
    );
}

export function JuriHeader({ active, need }: { title?: string; category?: string; active: number; need: number }) {
    const ok = active >= need;
    const pct = need > 0 ? Math.min(100, Math.round((active / need) * 100)) : 0;
    return (
        <div className={`${solid} px-5 py-4`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-black leading-none text-slate-900 dark:text-white">{active}</span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">dari {need} juri aktif</span>
                    {ok && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-900"><Check className="h-3 w-3" /> Cukup</span>}
                </div>
                <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{pct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-violet-600'}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export function JuriKosong() {
    return (
        <div className="mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 px-4 py-8 text-center dark:border-white/10">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15"><Users className="h-6 w-6" /></span>
            <p className="mt-3 font-extrabold text-slate-900 dark:text-white">Belum ada juri yang bergabung</p>
            <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-300">Undang juri lewat email di atas. Setelah menerima undangan, juri muncul di bagian Belum ditugaskan. Tugaskan ke kategori, dan link penilaian aktif untuk kategori itu.</p>
        </div>
    );
}

export function JuriMenunggu() {
    const page = usePage().props as any;
    const base: string = page.inviteBase;
    const invites: Invite[] = page.invites ?? [];
    if (invites.length === 0) return null;

    const cancel = (i: Invite) => {
        if (confirm(`Batalkan undangan untuk ${i.name}?`)) router.delete(`${base}/juri-undangan/${i.id}`, { preserveScroll: true });
    };

    return (
        <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300"><Clock className="h-3.5 w-3.5" /> Menunggu persetujuan ({invites.length})</p>
            <ul className="space-y-2">
                {invites.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 rounded-2xl border border-l-4 border-slate-200 border-l-amber-400 bg-white px-4 py-3 dark:border-white/10 dark:border-l-amber-400 dark:bg-slate-900">
                        <Avatar name={i.name} tone="amber" />
                        <div className="min-w-0 flex-1">
                            <div className="truncate font-extrabold text-slate-900 dark:text-white">{i.name}</div>
                            <div className="truncate text-xs text-slate-600 dark:text-slate-300">{i.email}</div>
                        </div>
                        <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-900 sm:inline">Undangan terkirim</span>
                        <button type="button" onClick={() => cancel(i)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Batalkan undangan ${i.name}`} title="Batalkan undangan"><Trash2 className="h-4 w-4" /></button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function JuriTambah({ btn, children }: { card?: string; inp?: string; btn: string; children?: ReactNode }) {
    const page = usePage().props as any;
    const base: string = page.inviteBase;
    const categoryId: number = page.category?.id ?? 0;

    const [email, setEmail] = useState('');
    const [found, setFound] = useState<Found | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        setFound(null);
        setError(null);
        const v = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(v)) return;
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const r = await fetch(`${base}/juri-undangan/cari?email=${encodeURIComponent(v)}&kategori=${categoryId}`, { headers: { Accept: 'application/json' } });
                const d = await r.json();
                if (d.status === 'ok') setFound(d.user);
                else setError(({ invalid: 'Format email tidak valid.', not_found: 'Belum ada akun SIMPLE dengan email ini. Minta calon juri mendaftar terlebih dahulu.', invited: 'Akun ini sudah diundang atau sudah menjadi juri di event ini.' } as Record<string, string>)[d.status] ?? `Akun ini tidak bisa diundang. (HTTP ${r.status}${d.message ? ': ' + d.message : ''})`);
            } catch {
                setError('Gagal memeriksa email. Coba lagi.');
            } finally {
                setSearching(false);
            }
        }, 500);
        return () => { clearTimeout(t); setSearching(false); };
    }, [email, base, categoryId]);

    const send = () => {
        if (!found || sending) return;
        setSending(true);
        router.post(`${base}/juri-undangan`, { email: email.trim(), category_id: categoryId }, {
            preserveScroll: true,
            onSuccess: () => { setEmail(''); setFound(null); },
            onError: (e) => setError((e.email as string) || 'Gagal mengirim undangan.'),
            onFinish: () => setSending(false),
        });
    };

    return (
        <div className={`${solid} p-5 sm:p-6`}>
            <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30"><UserPlus className="h-6 w-6" /></span>
                <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Undang juri</h3>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">Masukkan email akun SIMPLE calon juri. Undangan tampil di dashboard mereka.</p>
                </div>
            </div>

            <div className="relative mt-5">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-12 text-base font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                    type="email" inputMode="email" autoComplete="off" placeholder="nama@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-indigo-500" />}
            </div>

            {error && <p className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>}

            {found && (
                <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 dark:bg-emerald-500/10">
                    <Avatar name={found.name} />
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-black text-slate-900 dark:text-white">{found.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
                            <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300"><Check className="h-3.5 w-3.5" /> Akun SIMPLE ditemukan</span>
                            {found.city && <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><MapPin className="h-3.5 w-3.5" /> {found.city}</span>}
                        </div>
                    </div>
                    <button type="button" disabled={sending} onClick={send} className={`${btn} inline-flex items-center gap-2 !px-5 !py-2.5`}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim undangan
                    </button>
                </div>
            )}

            <JuriMenunggu />
            {children}
        </div>
    );
}


export function JuriBelumTugas({ btn }: { btn: string }) {
    const page = usePage().props as any;
    const base: string = page.inviteBase;
    const list: { id: number; name: string; contact: string | null; sibling?: boolean }[] = page.unassigned ?? [];
    const cats: { id: number; name: string }[] = page.categories ?? [];
    const [busy, setBusy] = useState<number | null>(null);
    const [errs, setErrs] = useState<Record<number, string>>({});
    if (list.length === 0) return null;

    const assign = (jid: number, sel: number[]) => {
        if (sel.length === 0 || busy !== null) return;
        setBusy(jid);
        setErrs((e) => ({ ...e, [jid]: '' }));
        router.post(`${base}/juri/${jid}/${list.find((x) => x.id === jid)?.sibling ? 'tugas-saudara' : 'tugas'}`, { categories: sel } as any, {
            preserveScroll: true,
            onError: (e) => setErrs((x) => ({ ...x, [jid]: String(Object.values(e)[0] ?? 'Gagal menugaskan juri.') })),
            onFinish: () => setBusy(null),
        });
    };
    const remove = (j: { id: number; name: string }) => {
        if (confirm(`Hapus ${j.name} dari daftar juri?`)) router.delete(`${base}/juri/${j.id}`, { preserveScroll: true });
    };

    return (
        <div className={`${solid} border-l-4 border-l-amber-400 p-5 sm:p-6`}>
            <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">Belum ditugaskan <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{list.length}</span></h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Klik kategori untuk menugaskan juri.</p>
            <ul className="mt-4 space-y-3">
                {list.map((j) => {
                    return (
                        <li key={j.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <Avatar name={j.name} tone="amber" />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-extrabold text-slate-900 dark:text-white">{j.name}</div>
                                    {j.contact && <div className="truncate text-xs text-slate-600 dark:text-slate-300">{j.contact}</div>}
                                </div>
                                {!j.sibling && <button type="button" onClick={() => remove(j)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Hapus ${j.name}`}><Trash2 className="h-4 w-4" /></button>}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {cats.map((c) => (
                                    <button key={c.id} type="button" disabled={busy !== null} onClick={() => assign(j.id, [c.id])} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-extrabold text-indigo-800 transition hover:bg-indigo-600 hover:text-white disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                        {busy === j.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {cats.length === 1 ? 'Tugaskan' : '+ ' + (c.name || 'Semua peserta')}
                                    </button>
                                ))}
                                {cats.length > 1 && (
                                    <button type="button" disabled={busy !== null} onClick={() => assign(j.id, cats.map((c) => c.id))} className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-extrabold text-slate-600 transition hover:border-indigo-300 disabled:opacity-50 dark:border-white/10 dark:text-slate-300">Semua kategori</button>
                                )}
                            </div>
                            {errs[j.id] && <p className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errs[j.id]}</p>}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
