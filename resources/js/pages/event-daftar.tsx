import Footer from '@/components/landing/footer';
import PageBackground from '@/components/page-background';
import SiteNavbar from '@/components/site-navbar';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, ClipboardList, Clock, Copy, Lock, Plus, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';

import FileDrop from '@/components/file-drop';
import AppBar from '@/components/mobile/app-bar';
import { PAGE } from '@/components/mobile/kit/soft';
import { usePhone } from '@/components/mobile/use-phone';
type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'file';
type Field = { key: string; label: string; type: FieldType; required: boolean; options: string[] };
type Cat = { id: number; name: string; label: string };
type Reg = { status: string; note: string | null; message: string | null; amount: number; at: string; category: string | null; teams: { name: string; category: string | null }[] };
type Props = {
    event: { id: number; title: string; location?: string | null; starts_at?: string | null; poster?: string | null };
    isTeam: boolean;
    fee: number;
    bank: { name: string; number: string; holder: string | null } | null;
    categories: Cat[];
    fields: Field[];
    steps: { title: string; sub: string }[];
    activeStep: number;
    closed: string | null;
    registration: Reg | null;
    justSent: boolean;
    done: boolean;
    followup: { fields: Field[]; completed: boolean; values: Record<string, unknown> } | null;
    user: { name: string; email: string };
    backUrl: string;
};
type Answer = string | string[] | File | null;
type TeamRow = { name: string; category_id: string };
type FormData = {
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    school: string;
    participant_category_id: string;
    teams: TeamRow[];
    answers: Record<string, Answer>;
    bukti: File | null;
    consent: boolean;
};

const rupiah = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const card = 'daftar-card rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const box = 'daftar-box w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-white/10 dark:bg-white/5';
const lbl = 'daftar-lbl mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500';
const FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf';

const DAFTAR_CSS = `
[data-mobile-daftar] .daftar-card{border:0;border-radius:24px;background:#fff;box-shadow:0 0 0 1px rgba(15,23,42,.07);backdrop-filter:none}
.dark [data-mobile-daftar] .daftar-card{background:rgba(255,255,255,.04);box-shadow:0 0 0 1px rgba(255,255,255,.1)}
[data-mobile-daftar] .daftar-card.p-6,[data-mobile-daftar] .daftar-card.p-8,[data-mobile-daftar] .daftar-card .p-6{padding:16px}
[data-mobile-daftar] .daftar-box{border:0;border-radius:16px;background:rgba(15,23,42,.045);padding:8px 12px;font-size:16px;min-height:40px;border-radius:12px;box-shadow:none}
.dark [data-mobile-daftar] .daftar-box{background:rgba(255,255,255,.07)}
[data-mobile-daftar] .daftar-box:focus{box-shadow:0 0 0 3px rgba(99,102,241,.25)}
[data-mobile-daftar] .daftar-lbl{font-size:13px;font-weight:500;text-transform:none;letter-spacing:0;color:#475569;padding-left:4px}
.dark [data-mobile-daftar] .daftar-lbl{color:#cbd5e1}
[data-mobile-daftar] h1{font-size:20px;line-height:1.25;font-weight:600}
[data-mobile-daftar] h2{font-size:17px;font-weight:600}
[data-mobile-daftar] .font-extrabold{font-weight:600}
[data-mobile-daftar] .bg-blue-600{background-color:#4f46e5}
[data-mobile-daftar] .bg-blue-50{background-color:rgba(79,70,229,.08)}
[data-mobile-daftar] .text-blue-600,[data-mobile-daftar] .text-blue-700{color:#4338ca}
.dark [data-mobile-daftar] .text-blue-600,.dark [data-mobile-daftar] .text-blue-700{color:#a5b4fc}
[data-mobile-daftar] button[type=submit],[data-mobile-daftar] a.bg-blue-600{background-image:none;background-color:#4f46e5;border-radius:9999px;min-height:40px}
[data-mobile-daftar] [style*="grid-template-columns"]{grid-template-columns:1fr !important;gap:12px}
[data-mobile-daftar] .daftar-lbl{margin-bottom:4px}
[data-mobile-daftar] .daftar-head{padding:14px !important}
[data-mobile-daftar] .daftar-head > div:first-child{gap:12px}
[data-mobile-daftar] .daftar-head img{width:48px;height:48px;border-radius:12px}
[data-mobile-daftar] .daftar-head > div:first-child > span{width:40px;height:40px;border-radius:12px}
[data-mobile-daftar] .daftar-head > div:first-child > span svg{width:20px;height:20px}
[data-mobile-daftar] .daftar-head .dh-kicker{text-transform:none;letter-spacing:0;font-size:12px;font-weight:500}
[data-mobile-daftar] .daftar-head h1{font-size:17px;margin-top:2px}
[data-mobile-daftar] .daftar-head p{font-size:12px;margin-top:2px;line-height:1.3}
[data-mobile-daftar] .daftar-steps{grid-template-columns:none !important;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px;margin-top:12px;padding-top:12px}
[data-mobile-daftar] .daftar-steps .ds-row{margin-top:6px;gap:6px}
[data-mobile-daftar] .daftar-steps .ds-n{width:20px;height:20px;font-size:11px}
[data-mobile-daftar] .daftar-steps .ds-t{font-size:11px;font-weight:600;line-height:1.2}
[data-mobile-daftar] .daftar-steps .ds-sub{display:none}
[data-mobile-daftar] .daftar-card .dsec-h{padding:12px 14px !important;gap:10px}
[data-mobile-daftar] .dsec-n{width:24px;height:24px;border-radius:8px;font-size:12px}
[data-mobile-daftar] .dsec-h h2{font-size:15px;line-height:1.25}
[data-mobile-daftar] .dsec-h p{font-size:12px;line-height:1.3}
[data-mobile-daftar] .daftar-card .dsec-b{padding:12px 14px !important;display:flex;flex-direction:column;gap:10px}
[data-mobile-daftar] .dsec-b > *{margin:0 !important}
[data-mobile-daftar] .dsec-b .grid{gap:10px}
[data-mobile-daftar] .dsec-b .p-4{padding:10px}
[data-mobile-daftar] .daftar-form{gap:12px}
[data-mobile-daftar] .daftar-form > div:first-child{display:flex;flex-direction:column;gap:12px}
[data-mobile-daftar] .daftar-form > div:first-child > *{margin:0 !important}
[data-mobile-daftar] .daftar-card .p-5{padding:12px 14px}
[data-mobile-daftar] .daftar-card .text-lg{font-size:15px}
`;

function Section({ n, title, hint, action, children }: { n: number; title: string; hint: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className={card}>
            <div className="dsec-h flex items-start gap-4 border-b border-slate-100 p-6 dark:border-white/10">
                <span className="dsec-n flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-extrabold text-white">{n}</span>
                <div className="mr-auto">
                    <h2 className="text-lg font-extrabold">{title}</h2>
                    <p className="text-sm text-slate-500">{hint}</p>
                </div>
                {action}
            </div>
            <div className="dsec-b space-y-4 p-6">{children}</div>
        </section>
    );
}

function Steps({ steps, active, done }: { steps: Props['steps']; active: number; done: boolean }) {
    return (
        <div className="daftar-steps mt-6 grid gap-4 border-t border-slate-100 pt-6 dark:border-white/10" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => (
                <div key={s.title}>
                    <div className={`h-1 rounded-full ${i <= active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/10'}`} />
                    <div className="ds-row mt-3 flex items-center gap-3">
                        <span className={`ds-n flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${i <= active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-white/10'}`}>{done && i === steps.length - 1 ? '✓' : i + 1}</span>
                        <div>
                            <div className="ds-t text-sm font-extrabold">{s.title}</div>
                            <div className="ds-sub text-xs text-slate-500">{i === active ? (done && i === steps.length - 1 ? 'Selesai' : 'Anda di sini') : i < active ? 'Selesai' : s.sub}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function FollowupForm({ eventId, n, followup }: { eventId: number; n: number; followup: NonNullable<Props['followup']> }) {
    const init: Record<string, Answer> = {};
    followup.fields.forEach((f) => {
        if (f.type === 'file') return;
        const v = followup.values[f.key];
        init[f.key] = f.type === 'checkbox' ? (Array.isArray(v) ? (v as string[]) : []) : v == null ? '' : String(v);
    });
    const form = useForm<{ answers: Record<string, Answer> }>({ answers: init });
    const [editing, setEditing] = useState(false);
    const [fileErr, setFileErr] = useState<Record<string, string>>({});
    const errs = form.errors as unknown as Record<string, string | undefined>;
    const setA = (k: string, v: Answer) => form.setData('answers', { ...form.data.answers, [k]: v });
    const toggleA = (k: string, o: string) => {
        const cur = (form.data.answers[k] as string[] | undefined) ?? [];
        setA(k, cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
    };
    const submit = (e: FormEvent) => { e.preventDefault(); form.post(`/events/${eventId}/daftar/lengkapi`, { forceFormData: true, onSuccess: () => setEditing(false) }); };

    if (followup.completed && !editing) {
        return (
            <Section
                n={n}
                title="Data Lengkap"
                hint="Terima kasih, data tambahan Anda sudah kami terima."
                action={
                    <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:hover:bg-white/5">
                        Ubah Data
                    </button>
                }
            >
                <dl className="divide-y divide-slate-100 dark:divide-white/10">
                    {followup.fields.map((f) => {
                        const v = followup.values[f.key];
                        const text = f.type === 'file' ? ((v as { name?: string } | undefined)?.name ?? '-') : Array.isArray(v) ? v.join(', ') : v == null || v === '' ? '-' : String(v);
                        return (
                            <div key={f.key} className="flex justify-between gap-4 py-3 text-sm">
                                <dt className="text-slate-500">{f.label}</dt>
                                <dd className="text-right font-semibold">{text}</dd>
                            </div>
                        );
                    })}
                </dl>
            </Section>
        );
    }

    return (
        <form onSubmit={submit}>
            <Section n={n} title="Lengkapi Data" hint="Diminta panitia setelah pendaftaran Anda disetujui. Anda masih bisa memperbaikinya nanti.">
                {followup.fields.map((f) => {
                    const v = form.data.answers[f.key];
                    const saved = followup.values[f.key] as { name?: string } | undefined;
                    const msg = fileErr[f.key] ?? errs[`answers.${f.key}`];
                    return (
                        <div key={f.key}>
                            <label className={lbl}>{f.label} {f.required && '*'}</label>
                            {f.type === 'file' ? (
                                <div>
                                    <input
                                        type="file"
                                        accept={FILE_ACCEPT}
                                        className={box}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            const file = e.target.files?.[0] ?? null;
                                            if (file && file.size > 5 * 1024 * 1024) {
                                                setFileErr((m) => ({ ...m, [f.key]: 'Ukuran berkas maksimal 5 MB.' }));
                                                e.target.value = '';
                                                setA(f.key, null);
                                                return;
                                            }
                                            setFileErr((m) => { const x = { ...m }; delete x[f.key]; return x; });
                                            setA(f.key, file);
                                        }}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">{saved?.name ? `Berkas tersimpan: ${saved.name}. Pilih berkas baru hanya jika ingin menggantinya. ` : ''}JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.</p>
                                </div>
                            ) : f.type === 'textarea' ? (
                                <textarea rows={4} className={box} value={(v as string) ?? ''} onChange={(e) => setA(f.key, e.target.value)} />
                            ) : f.type === 'select' ? (
                                <select className={box} value={(v as string) ?? ''} onChange={(e) => setA(f.key, e.target.value)}>
                                    <option value="">Pilih...</option>
                                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : f.type === 'checkbox' ? (
                                <div className="space-y-2">
                                    {f.options.map((o) => (
                                        <label key={o} className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={((v as string[] | undefined) ?? []).includes(o)} onChange={() => toggleA(f.key, o)} /> {o}
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className={box} value={(v as string) ?? ''} onChange={(e) => setA(f.key, e.target.value)} />
                            )}
                            {msg && <p className="mt-1 text-xs font-semibold text-rose-600">{msg}</p>}
                        </div>
                    );
                })}
                <button type="submit" disabled={form.processing} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow hover:opacity-90 disabled:opacity-60">
                    {form.processing ? 'Menyimpan...' : followup.completed ? 'Perbarui Data' : 'Kirim Data'}
                </button>
            </Section>
        </form>
    );
}

export default function EventDaftar(p: Props) {
    const { event, isTeam, fee, bank, categories, fields, steps, activeStep, closed, registration, justSent, done, followup, user, backUrl } = p;
    const phone = usePhone();
    const single = categories.length === 1 ? String(categories[0].id) : '';
    const form = useForm<FormData>({
        contact_name: user.name ?? '',
        contact_phone: '',
        contact_email: user.email ?? '',
        school: '',
        participant_category_id: single,
        teams: [{ name: '', category_id: single }],
        answers: {},
        bukti: null,
        consent: false,
    });
    const [fileErr, setFileErr] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const errs = form.errors as unknown as Record<string, string | undefined>;
    const err = (k: string) => { const m = fileErr[k] ?? errs[k]; return m ? <p className="mt-1 text-xs font-semibold text-rose-600">{m}</p> : null; };
    const set = <K extends keyof FormData>(k: K, v: FormData[K]) => form.setData(k, v as never);
    const setAnswer = (k: string, v: Answer) => form.setData('answers', { ...form.data.answers, [k]: v });
    const toggle = (k: string, opt: string) => {
        const cur = (form.data.answers[k] as string[] | undefined) ?? [];
        setAnswer(k, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
    };
    const setTeam = (i: number, t: Partial<TeamRow>) => set('teams', form.data.teams.map((x, j) => (j === i ? { ...x, ...t } : x)));
    const pick = (k: string, apply: (f: File | null) => void) => (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file && file.size > 5 * 1024 * 1024) {
            setFileErr((m) => ({ ...m, [k]: 'Ukuran berkas maksimal 5 MB.' }));
            e.target.value = '';
            apply(null);
            return;
        }
        setFileErr((m) => { const n = { ...m }; delete n[k]; return n; });
        apply(file);
    };
    const submit = (e: FormEvent) => { e.preventDefault(); form.post(`/events/${event.id}/daftar`, { preserveScroll: true, forceFormData: true }); };
    const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* abaikan */ } };

    const count = isTeam ? form.data.teams.length : 1;
    const total = fee * count;
    const d = form.data;
    const identOk = !!d.contact_name.trim() && !!d.contact_phone.trim() && !!d.contact_email.trim() && (!isTeam || !!d.school.trim());
    const teamsOk = d.teams.every((t) => !!t.name.trim() && (categories.length < 2 || !!t.category_id));
    const when = event.starts_at ? new Date(event.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

    let n = 0;
    const next = () => ++n;

    const head = (
        <div className={`${card} daftar-head p-6 sm:p-8`}>
            <div className="flex items-center gap-5">
                {event.poster ? (
                    <img src={event.poster} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow" />
                ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white"><ClipboardList className="h-7 w-7" /></span>
                )}
                <div>
                    <div className="dh-kicker text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Formulir pendaftaran</div>
                    <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{event.title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{[when, event.location].filter(Boolean).join(' · ')}</p>
                </div>
            </div>
            <Steps steps={steps} active={activeStep} done={done} />
        </div>
    );

    const status = (() => {
        if (!registration) return null;
        const r = registration;
        const ui = r.status === 'terdaftar'
            ? { Icon: CheckCircle2, color: 'text-emerald-600', title: done ? 'Pendaftaran selesai' : 'Pendaftaran disetujui', text: isTeam ? 'Panitia sudah menyetujui pendaftaran Anda. Data anggota tiap tim akan diminta pada tahap berikutnya.' : (followup ? (followup.completed ? 'Data Anda sudah lengkap. Sampai jumpa di acara!' : 'Anda sudah terdaftar. Panitia meminta data tambahan, silakan lengkapi di bawah ini.') : 'Anda sudah terdaftar. Sampai jumpa di acara!') }
            : r.status === 'ditolak'
                ? { Icon: XCircle, color: 'text-rose-600', title: 'Pendaftaran ditolak', text: r.note ? `Alasan dari panitia: ${r.note}` : 'Hubungi panitia untuk informasi lebih lanjut.' }
                : { Icon: Clock, color: 'text-amber-500', title: justSent ? 'Pendaftaran terkirim' : 'Menunggu verifikasi panitia', text: 'Panitia akan memeriksa data' + (fee > 0 ? ' dan bukti transfer' : '') + ' Anda. Buka halaman ini lagi untuk melihat statusnya.' };
        return (
            <div className={`${card} p-8 text-center`}>
                <ui.Icon className={`mx-auto h-14 w-14 ${ui.color}`} />
                <h2 className="mt-4 text-2xl font-extrabold">{ui.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{ui.text}</p>
                <div className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-sm dark:bg-white/5">
                    <div className="flex justify-between"><span className="text-slate-500">Dikirim</span><span className="font-semibold">{r.at}</span></div>
                    {r.category && <div className="flex justify-between"><span className="text-slate-500">Kategori</span><span className="font-semibold">{r.category}</span></div>}
                    {r.teams.length > 0 && (
                        <div>
                            <div className="text-slate-500">Tim</div>
                            {r.teams.map((t, i) => <div key={i} className="font-semibold">{t.name}{t.category ? <span className="font-normal text-slate-500"> ({t.category})</span> : null}</div>)}
                        </div>
                    )}
                    {fee > 0 && <div className="flex justify-between"><span className="text-slate-500">Total tagihan</span><span className="font-extrabold text-blue-600">{rupiah(r.amount)}</span></div>}
                </div>
                {r.message && r.status !== 'ditolak' && <p className="mx-auto mt-4 max-w-md whitespace-pre-line rounded-2xl bg-blue-50 p-4 text-left text-sm dark:bg-white/5">{r.message}</p>}
                <Link href={backUrl} className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Kembali ke halaman event</Link>
            </div>
        );
    })();

    const statusFull = status ? (
        <div className="space-y-6">
            {status}
            {followup && registration?.status === 'terdaftar' ? <FollowupForm eventId={event.id} n={steps.length} followup={followup} /> : null}
        </div>
    ) : null;

    return (
        <div data-mobile-daftar={phone ? '' : undefined} className={'relative min-h-screen overflow-x-hidden ' + (phone ? PAGE : '')}>
            {phone && (
                <>
                    <style>{DAFTAR_CSS}</style>
                    <AppBar title="Pendaftaran" back={backUrl} />
                </>
            )}
            <Head title={`Daftar ${event.title}`} />
            {!phone && <PageBackground />}
            {!phone && <SiteNavbar hideMenu />}
            <main className={'relative z-10 mx-auto w-full max-w-7xl ' + (phone ? 'space-y-3 px-3 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))]' : 'space-y-6 px-6 pb-16 pt-28')}>
                {!phone && (
                    <Link href={backUrl} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600">← Kembali ke Detail Event</Link>
                )}
                {head}

                {statusFull ? (
                    statusFull
                ) : closed ? (
                    <div className={`${card} p-8 text-center`}>
                        <Lock className="mx-auto h-10 w-10 text-slate-400" />
                        <p className="mt-3 text-lg font-extrabold">{closed}</p>
                    </div>
                ) : (
                    <form onSubmit={submit} className="daftar-form grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="space-y-6">
                            <Section n={next()} title={isTeam ? 'Identitas Pendaftar' : 'Identitas Peserta'} hint={isTeam ? 'Panitia menghubungi nomor dan email ini bila ada yang perlu dikonfirmasi.' : 'Pastikan nomor dan email aktif.'}>
                                {isTeam && (
                                    <div>
                                        <label className={lbl}>Nama sekolah / organisasi *</label>
                                        <input className={box} value={d.school} onChange={(e) => set('school', e.target.value)} maxLength={120} placeholder="Contoh: SMAN 1 Ciamis" />
                                        {err('school')}
                                    </div>
                                )}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className={lbl}>{isTeam ? 'Nama penanggung jawab' : 'Nama lengkap'} *</label>
                                        <input className={box} value={d.contact_name} onChange={(e) => set('contact_name', e.target.value)} maxLength={120} />
                                        {err('contact_name')}
                                    </div>
                                    <div>
                                        <label className={lbl}>{isTeam ? 'No. HP penanggung jawab' : 'Nomor WhatsApp'} *</label>
                                        <input type="tel" className={box} value={d.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} maxLength={25} placeholder="08xxxxxxxxxx" />
                                        {err('contact_phone')}
                                    </div>
                                </div>
                                <div>
                                    <label className={lbl}>{isTeam ? 'Email aktif penanggung jawab' : 'Email'} *</label>
                                    <input autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email" type="email" className={box} value={d.contact_email} onChange={(e) => set('contact_email', e.target.value)} maxLength={150} />
                                    {err('contact_email')}
                                </div>
                                {!isTeam && (
                                    <div>
                                        <label className={lbl}>Sekolah / instansi</label>
                                        <input className={box} value={d.school} onChange={(e) => set('school', e.target.value)} maxLength={120} />
                                        {err('school')}
                                    </div>
                                )}
                                {!isTeam && categories.length > 1 && (
                                    <div>
                                        <label className={lbl}>Kategori *</label>
                                        <select className={box} value={d.participant_category_id} onChange={(e) => set('participant_category_id', e.target.value)}>
                                            <option value="">Pilih kategori...</option>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                        {err('participant_category_id')}
                                    </div>
                                )}
                            </Section>

                            {isTeam && (
                                <Section
                                    n={next()}
                                    title="Tim yang Didaftarkan"
                                    hint="Cukup nama tim dan kategorinya. Data anggota diisi pada tahap berikutnya."
                                    action={
                                        <button type="button" onClick={() => set('teams', [...d.teams, { name: '', category_id: single }])} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-400/30 dark:hover:bg-white/5">
                                            <Plus className="h-4 w-4" /> Tim
                                        </button>
                                    }
                                >
                                    {err('teams')}
                                    {d.teams.map((t, i) => (
                                        <div key={i} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Tim {i + 1}</span>
                                                {d.teams.length > 1 && (
                                                    <button type="button" onClick={() => set('teams', d.teams.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" aria-label="Hapus tim"><Trash2 className="h-4 w-4" /></button>
                                                )}
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className={lbl}>Nama tim *</label>
                                                    <input className={box} value={t.name} onChange={(e) => setTeam(i, { name: e.target.value })} maxLength={120} />
                                                    {err(`teams.${i}.name`)}
                                                </div>
                                                {categories.length > 1 && (
                                                    <div>
                                                        <label className={lbl}>Kategori *</label>
                                                        <select className={box} value={t.category_id} onChange={(e) => setTeam(i, { category_id: e.target.value })}>
                                                            <option value="">Pilih kategori...</option>
                                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                        </select>
                                                        {err(`teams.${i}.category_id`)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </Section>
                            )}

                            {!isTeam && fields.length > 0 && (
                                <Section n={next()} title="Data Peserta" hint="Pertanyaan tambahan dari panitia.">
                                    {fields.map((f) => {
                                        const k = `answers.${f.key}`;
                                        const v = d.answers[f.key];
                                        return (
                                            <div key={f.key}>
                                                <label className={lbl}>{f.label} {f.required && '*'}</label>
                                                {f.type === 'file' ? (
                                                    <div>
                                                        <input type="file" accept={FILE_ACCEPT} className={box} onChange={pick(k, (file) => setAnswer(f.key, file))} />
                                                        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.</p>
                                                    </div>
                                                ) : f.type === 'textarea' ? (
                                                    <textarea rows={4} className={box} value={(v as string) ?? ''} onChange={(e) => setAnswer(f.key, e.target.value)} />
                                                ) : f.type === 'select' ? (
                                                    <select className={box} value={(v as string) ?? ''} onChange={(e) => setAnswer(f.key, e.target.value)}>
                                                        <option value="">Pilih...</option>
                                                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                ) : f.type === 'checkbox' ? (
                                                    <div className="space-y-2">
                                                        {f.options.map((o) => (
                                                            <label key={o} className="flex items-center gap-2 text-sm">
                                                                <input type="checkbox" checked={((v as string[] | undefined) ?? []).includes(o)} onChange={() => toggle(f.key, o)} /> {o}
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} className={box} value={(v as string) ?? ''} onChange={(e) => setAnswer(f.key, e.target.value)} />
                                                )}
                                                {err(k)}
                                            </div>
                                        );
                                    })}
                                </Section>
                            )}

                            {fee > 0 && (
                                <Section n={next()} title="Pembayaran" hint="Transfer sesuai total tagihan, lalu unggah bukti transfernya.">
                                    {bank ? (
                                        <div className="rounded-2xl bg-blue-50 p-4 text-sm dark:bg-white/5">
                                            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Transfer ke</div>
                                            <div className="mt-1 text-lg font-extrabold">{bank.name}</div>
                                            <div className="mt-1 flex items-center gap-2 font-mono text-base font-bold">
                                                {bank.number}
                                                <button type="button" onClick={() => copy(bank.number)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2 py-1 font-sans text-xs font-bold text-blue-700 hover:bg-white">
                                                    <Copy className="h-3 w-3" /> {copied ? 'Tersalin' : 'Salin'}
                                                </button>
                                            </div>
                                            {bank.holder && <div className="mt-1 text-slate-600 dark:text-slate-300">a.n. {bank.holder}</div>}
                                            <div className="mt-3 border-t border-blue-100 pt-3">Jumlah transfer: <span className="font-extrabold text-blue-700">{rupiah(total)}</span></div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">Total tagihan {rupiah(total)}. Hubungi panitia untuk informasi rekening.</p>
                                    )}
                                    <div>
                                        <label className={lbl}>Bukti transfer *</label>
                                        <FileDrop file={d.bukti} accept={FILE_ACCEPT} onChange={pick('bukti', (file) => set('bukti', file))} onClear={() => set('bukti', null)} invalid={!!form.errors.bukti} title="Klik untuk unggah bukti transfer" hint="JPG, PNG, WEBP, atau PDF" />
                                        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.</p>
                                        {err('bukti')}
                                    </div>
                                </Section>
                            )}
                        </div>

                        <aside className="lg:sticky lg:top-28 lg:self-start">
                            <div className={card}>
                                <div className="border-b border-slate-100 p-5 text-lg font-extrabold dark:border-white/10">Ringkasan</div>
                                <div className="space-y-3 p-5 text-sm">
                                    <div className="flex justify-between"><span className="text-slate-500">{isTeam ? 'Tim didaftarkan' : 'Peserta'}</span><span className="font-bold">{count} {isTeam ? 'tim' : 'orang'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">{isTeam ? 'Biaya per tim' : 'Biaya pendaftaran'}</span><span className="font-bold">{fee > 0 ? rupiah(fee) : 'Gratis'}</span></div>
                                    <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3 dark:border-white/10">
                                        <span className="font-bold">Total tagihan</span>
                                        <span className="text-xl font-extrabold text-blue-600">{fee > 0 ? rupiah(total) : 'Gratis'}</span>
                                    </div>
                                    <ul className="space-y-2 border-t border-dashed border-slate-200 pt-3 dark:border-white/10">
                                        {[
                                            [isTeam ? 'Identitas pendaftar' : 'Identitas peserta', identOk],
                                            ...(isTeam ? [['Nama & kategori tiap tim', teamsOk] as [string, boolean]] : []),
                                            ...(fee > 0 ? [['Bukti transfer', !!d.bukti] as [string, boolean]] : []),
                                        ].map(([t, ok]) => (
                                            <li key={String(t)} className="flex items-center gap-2">
                                                <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${ok ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}>✓</span>
                                                <span className={ok ? 'font-semibold' : 'text-slate-500'}>{String(t)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-3 border-t border-slate-100 p-5 dark:border-white/10">
                                    <label className="flex items-start gap-2 text-sm">
                                        <input type="checkbox" className="mt-1" checked={d.consent} onChange={(e) => set('consent', e.target.checked)} />
                                        <span>Saya setuju data saya digunakan penyelenggara untuk keperluan event ini.</span>
                                    </label>
                                    {err('consent')}
                                    {err('form')}
                                    <button type="submit" disabled={form.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-bold text-white shadow hover:opacity-90 disabled:opacity-60">
                                        <ShieldCheck className="h-4 w-4" /> {form.processing ? 'Mengirim...' : 'Kirim Pendaftaran'}
                                    </button>
                                    <p className="text-center text-xs text-slate-500">
                                        {isTeam ? 'Data anggota belum diminta sekarang. Anda mengisinya setelah panitia menyetujui pendaftaran ini.' : fee > 0 ? 'Panitia akan memverifikasi bukti transfer Anda.' : 'Anda langsung terdaftar setelah mengirim.'}
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </form>
                )}
            </main>
            {!phone && <Footer />}
        </div>
    );
}
