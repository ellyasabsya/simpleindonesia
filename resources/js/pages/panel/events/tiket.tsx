import PanelLayout from '@/components/panel/panel-layout';
import { router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import TiketPanelMobile from '@/components/mobile/pages/tiket-panel-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import TiketTransaksi from '@/components/panel/tiket-transaksi';
import TiketRingkasan from '@/components/panel/tiket-ringkasan';

type T = {
    id: number; name: string; price: number; quota: number; valid_from: string; valid_until: string; valid_days: number; valid_date?: string | null;
    custom_sale: boolean; require_holder_details: boolean; max_per_order: number;
    support_enabled: boolean; support_options: string[]; support_ranking: { name: string; votes: number }[];
    sold: number; remaining: number; revenue: number; locked: boolean;
    sub_id?: number; sub?: string; audience?: 'peserta' | 'umum';
};
type Sub = { id: number; title: string; open: boolean };
type Props = { eventId: number; salesOpen: boolean; manual?: boolean; audienceChoice?: boolean; feePercent: number; types: T[]; subs?: Sub[]; isParent?: boolean };

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const lbl = 'text-[11px] font-extrabold uppercase tracking-wider sm:text-xs text-slate-600 dark:text-slate-300';
const inp = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 sm:mt-1.5 sm:rounded-2xl text-base sm:px-4 sm:py-2.5 sm:text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 disabled:bg-slate-100 disabled:text-slate-500 dark:border-white/10 dark:bg-white/5';
const btn = 'rounded-2xl bg-indigo-900 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-extrabold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50';

const SHEET_CSS = `
@media (max-width:767px){
[data-sheet=tiket] form{border-radius:28px 28px 0 0;background:#f4f6fc;max-height:88dvh}
.dark [data-sheet=tiket] form{background:#0a0c1a}
[data-sheet=tiket] form::before{content:"";display:block;width:36px;height:4px;border-radius:9999px;margin:10px auto 0;background:rgba(15,23,42,.18);flex-shrink:0}
.dark [data-sheet=tiket] form::before{background:rgba(255,255,255,.25)}
[data-sheet=tiket] form>div:first-of-type{border:0;padding:10px 20px 8px}
[data-sheet=tiket] form>div:first-of-type h3{font-size:17px;font-weight:600;letter-spacing:-.01em}
[data-sheet=tiket] form>div:nth-of-type(2){padding:2px 14px 10px}
[data-sheet=tiket] .uppercase{font-size:12px;font-weight:600;letter-spacing:0;text-transform:none;color:#475569}
.dark [data-sheet=tiket] .uppercase{color:#cbd5e1}
[data-sheet=tiket] input:not([type=checkbox]),[data-sheet=tiket] select{height:40px;border:0;border-radius:12px;background:rgba(15,23,42,.05);padding:0 12px;font-size:16px;box-shadow:none}
.dark [data-sheet=tiket] input:not([type=checkbox]),.dark [data-sheet=tiket] select{background:rgba(255,255,255,.08)}
[data-sheet=tiket] input:focus,[data-sheet=tiket] select:focus{box-shadow:0 0 0 3px rgba(99,102,241,.25)}
[data-sheet=tiket] label>span.block{display:none}
[data-sheet=tiket] span.rounded-full.bg-indigo-700{width:22px;height:22px;font-size:11px}
[data-sheet=tiket] h4{font-size:14px;font-weight:600}
[data-sheet=tiket] div.rounded-2xl.border,[data-sheet=tiket] div.divide-y{border:0;border-radius:18px;background:#fff;box-shadow:0 0 0 1px rgba(15,23,42,.07)}
.dark [data-sheet=tiket] div.rounded-2xl.border,.dark [data-sheet=tiket] div.divide-y{background:rgba(255,255,255,.04);box-shadow:0 0 0 1px rgba(255,255,255,.1)}
[data-sheet=tiket] button.rounded-2xl.border{border-radius:14px;padding:10px 12px}
[data-sheet=tiket] form>div:last-child{padding:10px 16px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(15,23,42,.07);background:#f4f6fc}
.dark [data-sheet=tiket] form>div:last-child{background:#0a0c1a;border-color:rgba(255,255,255,.1)}
[data-sheet=tiket] form>div:last-child>div{width:100%;gap:8px}
[data-sheet=tiket] form>div:last-child button{height:40px;border-radius:9999px;padding:0 20px;font-size:14px;font-weight:500}
[data-sheet=tiket] form>div:last-child button[type=submit]{flex:1;background:#4f46e5;color:#fff}
[data-sheet=tiket] form>div:last-child button[type=button]{background:rgba(15,23,42,.06);border:0}
.dark [data-sheet=tiket] form>div:last-child button[type=button]{background:rgba(255,255,255,.1)}
[data-sheet=tiket] form>div:last-child p{font-size:11px;max-width:none}
body:has([data-sheet=tiket]) .afab{display:none!important}
}
`;

function Switch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/20'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
        </button>
    );
}
function Step({ n, t }: { n: number; t: string }) {
    return <div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-xs font-extrabold text-white sm:h-8 sm:w-8 sm:text-sm">{n}</span><h4 className="text-sm font-extrabold sm:text-base">{t}</h4></div>;
}

function SupportEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const items = value.split('\n').map((o) => o.trim()).filter(Boolean);
    const [draft, setDraft] = useState('');
    const push = (raw: string[]) => {
        const next = [...items];
        for (const r of raw.map((x) => x.trim()).filter(Boolean)) {
            if (next.length >= 50) break;
            if (!next.some((i) => i.toLowerCase() === r.toLowerCase())) next.push(r.slice(0, 60));
        }
        onChange(next.join('\n'));
    };
    const add = () => { push([draft]); setDraft(''); };
    const remove = (i: number) => onChange(items.filter((_, j) => j !== i).join('\n'));
    const ok = items.length >= 2;

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between">
                <span className={lbl}>Daftar pilihan</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{items.length} pilihan</span>
            </div>

            <div className="mt-2 flex gap-2">
                <input
                    value={draft}
                    maxLength={60}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    onPaste={(e) => {
                        const t = e.clipboardData.getData('text');
                        if (t.includes('\n')) { e.preventDefault(); push(t.split('\n')); setDraft(''); }
                    }}
                    placeholder="Ketik nama pilihan, lalu tekan Enter"
                    className={`${inp} !mt-0 flex-1`}
                />
                <button type="button" onClick={add} disabled={draft.trim() === ''} className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-700 px-4 text-sm font-extrabold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" /> Tambah</button>
            </div>

            {items.length === 0 ? (
                <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10">Belum ada pilihan. Contoh: nama peserta, tim, atau kategori.</div>
            ) : (
                <ol className="mt-3 space-y-2">
                    {items.map((o, i) => (
                        <li key={o} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-800">{i + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">{o}</span>
                            <button type="button" aria-label={`Hapus ${o}`} onClick={() => remove(i)} className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                        </li>
                    ))}
                </ol>
            )}

            <p className={`mt-2 text-xs ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{ok ? 'Satu tiket = satu dukungan untuk pilihan yang dipilih pembeli.' : 'Tambahkan minimal 2 pilihan agar tiket bisa disimpan.'}</p>
        </div>
    );
}

export default function Tiket({ eventId, salesOpen, manual, audienceChoice, feePercent, types, subs: subList, isParent: parentMode }: Props) {
    const pg = usePage().props as any;
    const evStart: string = pg.event?.starts_at ?? '';
    const evEnd: string = pg.event?.ends_at ?? '';
    const today = new Date().toISOString().slice(0, 10);
    const span = evStart && evEnd ? Math.max(1, Math.round((Date.parse(evEnd) - Date.parse(evStart)) / 86400000) + 1) : 1;
    const dayList = (() => { const a = evStart.slice(0, 10); const b = evEnd.slice(0, 10); const out: string[] = []; if (!a || !b || b < a) return out; for (let x = new Date(a + 'T00:00:00Z'); out.length < 31 && x.toISOString().slice(0, 10) <= b; x = new Date(x.getTime() + 86400000)) out.push(x.toISOString().slice(0, 10)); return out; })();
    const dayName = (v: string) => new Date(v + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

    const blank = { audience: 'peserta' as 'peserta' | 'umum', name: '', price: '', quota: '', valid_days: String(span), valid_date: '', custom_sale: false, valid_from: today, valid_until: evEnd || today, require_holder_details: true, max_per_order: '1', support_enabled: false, support_options: '' };
    const [editing, setEditing] = useState<T | 'new' | null>(null);
    const form = useForm<typeof blank>(blank);
    const phone = usePhone();
    useEffect(() => {
        if (!editing) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [editing]);

    const subs = subList ?? [];
    const isParent = !!parentMode;
    const [filter, setFilter] = useState(0);
    const [tab, setTab] = useState<'jenis' | 'transaksi'>('jenis');
    const tabBar = (
        <div className="flex gap-2">
            {([['jenis', 'Jenis tiket'], ['transaksi', 'Transaksi']] as const).map(([k, label]) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={`inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${tab === k ? 'bg-indigo-900 text-white shadow' : 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}>{label}</button>
            ))}
        </div>
    );
    const [q, setQ] = useState('');
    const [targetSub, setTargetSub] = useState<number>(subs[0]?.id ?? eventId);
    const baseOf = (id: number) => `/panel/event/${id}/tiket`;
    const base = baseOf(isParent ? targetSub : eventId);
    const locked = editing !== null && editing !== 'new' && editing.locked;
    const d = form.data;
    const free = d.price !== '' && Number(d.price) === 0;
    const complete = d.name.trim() !== '' && d.price !== '' && d.quota !== '' && d.valid_days !== '' && (!d.custom_sale || (d.valid_from !== '' && d.valid_until !== '')) && (!d.support_enabled || d.support_options.split('\n').map((o) => o.trim()).filter(Boolean).length >= 2);

    const openNew = () => { form.clearErrors(); form.setData(blank); setTargetSub(filter || subs[0]?.id || eventId); setEditing('new'); };
    const openEdit = (t: T) => {
        form.clearErrors();
        form.setData({ audience: t.audience ?? 'peserta', name: t.name, price: String(t.price), quota: String(t.quota), valid_days: String(t.valid_days), valid_date: t.valid_date ?? '', custom_sale: t.custom_sale, valid_from: t.valid_from, valid_until: t.valid_until, require_holder_details: t.require_holder_details, max_per_order: String(t.max_per_order), support_enabled: t.support_enabled, support_options: t.support_options.join('\n') });
        setTargetSub(t.sub_id ?? eventId); setEditing(t);
    };
    const close = () => { setEditing(null); form.clearErrors(); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((x) => ({ ...x, valid_date: (audienceChoice === false || x.audience === 'umum') && x.valid_date ? x.valid_date : null, valid_days: !(audienceChoice === false || x.audience === 'umum') && x.valid_date ? String(span) : x.valid_days, valid_from: x.custom_sale ? x.valid_from : null, valid_until: x.custom_sale ? x.valid_until : null, support_options: x.support_enabled ? x.support_options.split('\n').map((o) => o.trim()).filter(Boolean) : [] }) as any);
        const opts = { preserveScroll: true, onSuccess: close };
        if (editing === 'new') form.post(`${base}/jenis`, opts);
        else if (editing) form.put(`${base}/jenis/${editing.id}`, opts);
    };

    const toggle = () => router.post(`${base}/jual`, { open: !salesOpen }, { preserveScroll: true });
    const setAll = (open: boolean) => {
        const todo = subs.filter((x) => x.open !== open);
        const next = () => { const x = todo.shift(); if (!x) return; router.post(`${baseOf(x.id)}/jual`, { open }, { preserveScroll: true, onFinish: next }); };
        next();
    };
    const chip = (on: boolean) =>
        `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`;
    const remove = (t: T) => { if (confirm(`Hapus jenis tiket "${t.name}"?`)) router.delete(`${baseOf(t.sub_id ?? eventId)}/jenis/${t.id}`, { preserveScroll: true }); };

    const err = (k: keyof typeof blank) => form.errors[k] && <p className="mt-1 text-xs text-rose-600">{form.errors[k]}</p>;
    const shown = isParent && filter ? types.filter((t) => t.sub_id === filter) : types;
    const totalSold = shown.reduce((a, t) => a + t.sold, 0);
    const totalRevenue = shown.reduce((a, t) => a + t.revenue, 0);
    const listed = q.trim() ? shown.filter((t) => ((t.name ?? '') + ' ' + (t.sub ?? '')).toLowerCase().includes(q.trim().toLowerCase())) : shown;

    return (
        <PanelLayout title="Tiket">
            {phone && <div className="mb-3"><TiketRingkasan base={baseOf(eventId)} /></div>}
            {phone && <div className="mb-3">{tabBar}</div>}
            {phone && tab === 'transaksi' && <TiketTransaksi base={baseOf(eventId)} isParent={isParent} />}
            {phone && tab === 'jenis' && (
                <TiketPanelMobile
                    salesOpen={salesOpen} manual={!!manual} isParent={isParent} audienceChoice={audienceChoice !== false} feePercent={feePercent}
                    subs={subs} all={types} shown={shown} totalSold={totalSold} totalRevenue={totalRevenue}
                    filter={filter} setFilter={setFilter} onToggle={toggle}
                    onToggleSub={(id, v) => router.post(`${baseOf(id)}/jual`, { open: v }, { preserveScroll: true })}
                    onSetAll={setAll} onNew={openNew} onEdit={openEdit} onDelete={remove}
                />
            )}
            <div className={phone ? 'hidden' : 'space-y-5'}>

                {manual ? null : isParent ? (
                    <div className={`${card} p-6`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-extrabold">Penjualan tiket {subs.length > 0 && subs.every((x) => x.open) ? <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-1 align-middle text-xs font-bold text-emerald-800">Dibuka</span> : subs.some((x) => x.open) ? <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 align-middle text-xs font-bold text-amber-800">Sebagian dibuka</span> : <span className="ml-2 rounded-full bg-slate-200 px-2.5 py-1 align-middle text-xs font-bold text-slate-700">Ditutup</span>}</h2>
                                <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Atur penjualan tiap sub-event, atau buka dan tutup semuanya sekaligus.</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setAll(true)} disabled={subs.every((x) => x.open)} className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">Buka semua</button>
                                <button type="button" onClick={() => setAll(false)} disabled={subs.every((x) => !x.open)} className="rounded-2xl bg-slate-800 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Tutup semua</button>
                            </div>
                        </div>
                        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
                            {subs.map((x) => (
                                <div key={x.id} className="flex items-center justify-between gap-4 px-4 py-3">
                                    <span className="text-sm font-bold">{x.title}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-slate-500">{x.open ? 'Dibuka' : 'Ditutup'}</span>
                                        <Switch on={x.open} onChange={(v) => router.post(`${baseOf(x.id)}/jual`, { open: v }, { preserveScroll: true })} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
                    <div>
                        <h2 className="text-xl font-extrabold">Penjualan tiket {salesOpen ? <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-1 align-middle text-xs font-bold text-emerald-800">Dibuka</span> : <span className="ml-2 rounded-full bg-slate-200 px-2.5 py-1 align-middle text-xs font-bold text-slate-700">Ditutup</span>}</h2>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{salesOpen ? 'Pengunjung bisa membeli tiket sekarang. Tutup penjualan kalau kuota habis atau acara sudah dekat.' : 'Pengunjung tidak bisa membeli tiket. Buka kembali kapan saja.'}</p>
                    </div>
                    <button type="button" role="switch" aria-checked={salesOpen} onClick={toggle} className={`relative h-8 w-14 rounded-full transition ${salesOpen ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'}`}>
                        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${salesOpen ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>)}

                <TiketRingkasan base={baseOf(eventId)} />
                {tab === 'transaksi' && (
                    <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-4">{tabBar}</div>
                        <TiketTransaksi base={baseOf(eventId)} isParent={isParent} />
                    </div>
                )}
                {tab === 'jenis' && (<>

                <div className={`${card} p-6`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {tabBar}
                        <button type="button" onClick={openNew} className={`${btn} inline-flex items-center gap-2 !py-2.5`}><Plus className="h-4 w-4" /> Tambah jenis</button>
                    </div>
                    {isParent && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setFilter(0)} className={chip(filter === 0)}>Semua sub-event · {types.length}</button>
                            {subs.map((x) => (
                                <button key={x.id} type="button" onClick={() => setFilter(x.id)} className={chip(filter === x.id)}>{x.title} · {types.filter((t) => t.sub_id === x.id).length}</button>
                            ))}
                        </div>
                    )}
                    {shown.length > 6 && (
                        <div className="relative mt-4 max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari jenis tiket" className={`${inp} !mt-0 pl-9`} />
                        </div>
                    )}
                    {listed.length === 0 && (
                        <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10">{shown.length === 0 ? 'Belum ada jenis tiket.' : 'Tidak ada jenis tiket yang cocok.'}</div>
                    )}
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {listed.map((t) => {
                            const pct = t.quota > 0 ? Math.min(100, Math.round((t.sold / t.quota) * 100)) : 0;
                            const habis = t.remaining <= 0;
                            const bar = habis ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500';
                            const sisaCls = habis ? 'font-bold text-rose-600 dark:text-rose-300' : pct >= 80 ? 'font-bold text-amber-700 dark:text-amber-300' : 'font-semibold text-slate-700 dark:text-slate-200';
                            return (
                                <div key={t.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            {isParent && t.sub && <div className="mb-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">{t.sub}</div>}
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="min-w-0 truncate text-sm font-extrabold" title={t.name}>{t.name}</h4>
                                                {audienceChoice !== false && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${t.audience === 'umum' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>{t.audience === 'umum' ? 'Umum' : 'Peserta'}</span>}
                                                {t.locked && <span title="Harga terkunci karena sudah ada pesanan" className="shrink-0 text-slate-400"><Lock className="h-3.5 w-3.5" /></span>}
                                            </div>
                                            <div className="mt-0.5 text-lg font-extrabold leading-tight text-indigo-600 dark:text-indigo-300">{t.price === 0 ? 'Gratis' : rp(t.price)}</div>
                                        </div>
                                        <div className="flex shrink-0 gap-0.5 opacity-60 transition group-hover:opacity-100 focus-within:opacity-100">
                                            <button type="button" aria-label="Ubah" title="Ubah" onClick={() => openEdit(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                                            <button type="button" aria-label="Hapus" disabled={t.locked} title={t.locked ? 'Sudah ada pesanan' : 'Hapus'} onClick={() => remove(t)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>

                                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} /></div>
                                    <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                        <span>Terpakai {t.sold} dari {t.quota}</span>
                                        <span className={sisaCls}>{habis ? 'Habis' : `Sisa ${t.remaining}`}</span>
                                    </div>

                                    <details className="mt-2 border-t border-slate-100 pt-2 dark:border-white/10">
                                        <summary className="cursor-pointer select-none text-[11px] font-bold text-indigo-700 hover:underline dark:text-indigo-300">Detail tiket</summary>
                                        <dl className="mt-1.5 space-y-1 text-[11px] text-slate-500">
                                            <div className="flex justify-between gap-3"><dt>Masa berlaku</dt><dd className="text-right font-semibold text-slate-700 dark:text-slate-200">{t.valid_date ? 'Hanya ' + dayName(t.valid_date) : t.valid_days + ' hari sejak tanggal event'}</dd></div>
                                            <div className="flex justify-between gap-3"><dt>Jadwal jual</dt><dd className="text-right font-semibold text-slate-700 dark:text-slate-200">{t.custom_sale ? `${t.valid_from} s/d ${t.valid_until}` : 'Mengikuti penjualan event'}</dd></div>
                                            <div className="flex justify-between gap-3"><dt>Data pemegang</dt><dd className="text-right font-semibold text-slate-700 dark:text-slate-200">{t.require_holder_details ? 'Nama, email, telepon' : 'Nama saja'}</dd></div>
                                            {t.audience !== 'peserta' && <div className="flex justify-between gap-3"><dt>Maks. per pesanan</dt><dd className="text-right font-semibold text-slate-700 dark:text-slate-200">{t.max_per_order} tiket</dd></div>}
                                            <div className="flex justify-between gap-3"><dt>Penjualan lunas</dt><dd className="text-right font-semibold text-slate-700 dark:text-slate-200">{rp(t.revenue)}</dd></div>
                                        </dl>
                                    </details>

                                    {t.support_enabled && (
                                        <details className="mt-1.5">
                                            <summary className="cursor-pointer select-none text-[11px] font-bold text-indigo-700 hover:underline dark:text-indigo-300">Pendukung terbanyak ({t.support_ranking.length})</summary>
                                            <ol className="mt-1.5 space-y-1 rounded-xl bg-indigo-50 p-2.5 text-[11px] dark:bg-indigo-500/10">
                                                {t.support_ranking.map((r, i) => (
                                                    <li key={r.name} className="flex justify-between gap-3"><span className="min-w-0 truncate font-semibold">{i + 1}. {r.name}</span><span className="shrink-0">{r.votes} dukungan</span></li>
                                                ))}
                                            </ol>
                                        </details>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                </>)}

                {!manual && <p className="rounded-2xl bg-sky-50 p-4 text-xs text-sky-900 dark:bg-sky-500/10 dark:text-sky-200">Biaya layanan {feePercent}% dibayar pembeli di atas harga tiket dan tidak mengurangi hak lembaga. Tiket gratis tidak dikenai biaya layanan dan tidak butuh verifikasi pembayaran.</p>}
            </div>

            {editing && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/70 p-0 sm:items-center sm:p-4" data-sheet="tiket" onClick={close}>
                    <style>{SHEET_CSS}</style>
                    <form onSubmit={submit} className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-5 dark:border-white/10">
                            <div>
                                <h3 className="text-base font-extrabold sm:text-xl">{editing === 'new' ? 'Buat jenis tiket baru' : `Ubah ${editing.name}`}</h3>
                                <p className="hidden text-sm text-slate-500 sm:block">Lengkapi pengaturan tiket untuk event ini.</p>
                            </div>
                            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 sm:inline-block dark:bg-white/10 dark:text-slate-300">{editing === 'new' ? 'Tiket baru' : 'Ubah tiket'}</span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:space-y-7 sm:px-6 sm:py-6">
                            <section className="space-y-3 sm:space-y-4">
                                <Step n={1} t="Dasar tiket" />
                                {isParent && (
                                    <label className="block"><span className={lbl}>Sub-event</span>
                                        <select value={targetSub} disabled={editing !== 'new'} onChange={(e) => setTargetSub(Number(e.target.value))} className={`${inp} max-md:!h-10 max-md:!text-base`}>
                                            {subs.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                                        </select>
                                        <span className="mt-1 block text-[11px] text-slate-500 sm:text-xs">{editing === 'new' ? 'Tiket akan dibuat untuk sub-event ini.' : 'Sub-event tidak bisa dipindah.'}</span>
                                    </label>
                                )}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                                    <label className="col-span-2 block sm:col-span-1"><span className={lbl}>Nama jenis tiket</span>
                                        <input value={d.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Reguler, VIP, Early Bird" className={`${inp} max-md:!h-10 max-md:!text-base`} />
                                        <span className="mt-1 block text-[11px] text-slate-500 sm:text-xs">Nama yang dilihat pembeli.</span>{err('name')}
                                    </label>
                                    <label className="block"><span className={lbl}>Harga tiket (Rp)</span>
                                        <input type="number" inputMode="numeric" min={0} disabled={locked} value={d.price} onChange={(e) => form.setData('price', e.target.value)} placeholder="0 untuk gratis" className={`${inp} max-md:!h-10 max-md:!text-base`} />
                                        <span className="mt-1 block text-[11px] text-slate-500 sm:text-xs">{locked ? 'Terkunci, sudah ada pesanan.' : 'Isi 0 untuk tiket gratis.'}</span>{err('price')}
                                    </label>
                                    <label className="block"><span className={lbl}>Kuota tiket</span>
                                        <input type="number" inputMode="numeric" min={1} value={d.quota} onChange={(e) => form.setData('quota', e.target.value)} placeholder="100" className={`${inp} max-md:!h-10 max-md:!text-base`} />
                                        <span className="mt-1 block text-[11px] text-slate-500 sm:text-xs">Jumlah maksimum tiket yang bisa terjual.</span>{err('quota')}
                                    </label>
                                </div>
                                {audienceChoice === false && (
                                    <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Tiket ini untuk pengunjung. Peserta mendaftar lewat formulir pendaftaran.</p>
                                )}
                                {audienceChoice !== false && (
                                    <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-white/10">
                                        <div className="text-sm font-semibold md:text-base md:font-extrabold">Tiket ini untuk</div>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            {([['peserta', 'Peserta', 'Masuk Registrasi dan dinilai juri.'], ['umum', 'Umum', 'Penonton atau pengunjung, tidak masuk Registrasi dan penilaian.']] as const).map(([v, t, s]) => (
                                                <button key={v} type="button" disabled={locked} onClick={() => form.setData('audience', v)} className={`rounded-2xl border p-2.5 text-left transition md:p-3 disabled:cursor-not-allowed disabled:opacity-60 ${d.audience === v ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10'}`}>
                                                    <div className="text-sm font-semibold md:font-extrabold">{t}</div>
                                                    <div className="text-[11px] leading-snug text-slate-500 md:text-xs">{s}</div>
                                                </button>
                                            ))}
                                        </div>
                                        {locked && <p className="mt-2 text-xs text-slate-500">Terkunci, sudah ada pesanan.</p>}
                                        {err('audience')}
                                    </div>
                                )}
                                {free && <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Tiket ini gratis dan tidak dikenakan biaya pembelian.</p>}
                            </section>

                            <section className="space-y-3 border-t border-slate-100 pt-4 sm:space-y-4 sm:pt-6 dark:border-white/10">
                                <Step n={2} t="Jadwal dan masa berlaku" />
                                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                                    <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-white/10">
                                        <div className="text-sm font-semibold md:text-base md:font-extrabold">Masa berlaku tiket</div>
                                        <div className="relative mt-2">
                                            <input type="number" inputMode="numeric" min={1} max={365} disabled={!!d.valid_date} value={d.valid_days} onChange={(e) => form.setData('valid_days', e.target.value)} className={`${inp} !mt-0 pr-14 max-md:!h-10 max-md:!text-base`} />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">hari</span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">{d.valid_date ? 'Otomatis 1 hari, sesuai hari yang dipilih.' : 'Dihitung sejak tanggal event.'}</p>{err('valid_days')}
                                        {!parentMode && dayList.length > 1 && (audienceChoice === false || d.audience === 'umum') && (
                                            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
                                                <span className={lbl}>Berlaku pada hari</span>
                                                <select value={d.valid_date} disabled={locked} onChange={(e) => { const v = e.target.value; form.setData((p: any) => ({ ...p, valid_date: v, valid_days: v ? '1' : String(span), ...(v && p.custom_sale && p.valid_until > v ? { valid_until: v } : {}) })); }} className={`${inp} max-md:!h-10 max-md:!text-base`}>
                                                    <option value="">Semua hari kegiatan</option>
                                                    {dayList.map((x, n) => <option key={x} value={x}>{`Hari ${n + 1}: ${dayName(x)}`}</option>)}
                                                </select>
                                                <p className="mt-1 text-xs text-slate-500">{d.valid_date ? 'Tiket hanya sah di hari ini. Kuota dihitung per jenis tiket.' : 'Event beberapa hari? Buat satu jenis tiket per hari, misalnya "Reguler - Hari 1".'}</p>{err('valid_date')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-white/10">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold md:text-base md:font-extrabold">Jadwal jual khusus tiket ini</div>
                                                <p className="mt-1 text-xs text-slate-500">Jika dimatikan: tiket mengikuti jadwal penjualan event.</p>
                                            </div>
                                            <Switch on={d.custom_sale} onChange={(v) => form.setData('custom_sale', v)} />
                                        </div>
                                        {d.custom_sale && (
                                            <div className="mt-3 grid gap-2">
                                                <label className="block"><span className={lbl}>Mulai jual</span><input type="date" value={d.valid_from} onChange={(e) => form.setData('valid_from', e.target.value)} className={`${inp} max-md:!h-10 max-md:!text-base`} />{err('valid_from')}</label>
                                                <label className="block"><span className={lbl}>Akhir jual</span><input type="date" value={d.valid_until} onChange={(e) => form.setData('valid_until', e.target.value)} className={`${inp} max-md:!h-10 max-md:!text-base`} />{err('valid_until')}</label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-3 border-t border-slate-100 pt-4 sm:space-y-4 sm:pt-6 dark:border-white/10">
                                <Step n={3} t="Data pembeli" />
                                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
                                    <div className="flex items-center justify-between gap-3 p-3 sm:gap-4 sm:p-4">
                                        <div><div className="text-sm font-semibold md:text-base md:font-extrabold">Wajibkan data diri pemegang tiket</div><p className="text-xs text-slate-500">Pembeli mengisi nama, email, dan telepon setiap pemegang tiket.</p></div>
                                        <Switch on={d.require_holder_details} onChange={(v) => form.setData('require_holder_details', v)} />
                                    </div>
{d.audience !== 'peserta' && (
                                    <div className="flex items-center justify-between gap-3 p-3 sm:gap-4 sm:p-4">
                                        <div><div className="text-sm font-semibold md:text-base md:font-extrabold">Maksimal tiket per pesanan</div><p className="text-xs text-slate-500">Batas 1 sampai 10 tiket.</p></div>
                                        <input type="number" inputMode="numeric" min={1} max={10} value={d.max_per_order} onChange={(e) => form.setData('max_per_order', e.target.value)} className={`${inp} !mt-0 w-24 text-center max-md:!h-10 max-md:!text-base`} />
                                    </div>
)}
                                </div>
                                {d.audience !== 'peserta' && err('max_per_order')}
                                <div className="rounded-2xl border border-slate-200 p-3 sm:p-4 dark:border-white/10">
                                    <div className="flex items-center justify-between gap-4">
                                        <div><div className="text-sm font-semibold md:text-base md:font-extrabold">Aktifkan pilihan dukungan</div><p className="text-xs text-slate-500">Pembeli wajib memilih satu pilihan yang didukung. Cocok untuk event pendukung terbanyak.</p></div>
                                        <Switch on={d.support_enabled} onChange={(v) => form.setData('support_enabled', v)} />
                                    </div>
                                    {d.support_enabled && (
                                        <>
                                            <SupportEditor value={d.support_options} onChange={(v) => form.setData('support_options', v)} />
                                            {err('support_options')}
                                        </>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 pl-4 pr-20 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4 dark:border-white/10">
                            <div className="flex gap-2">
                                <button type="submit" disabled={!complete || form.processing} className={`${btn} max-md:!h-10 max-md:!py-0`}>{form.processing ? 'Menyimpan…' : editing === 'new' ? 'Tambahkan jenis tiket' : 'Simpan perubahan'}</button>
                                <button type="button" onClick={close} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold max-md:h-10 max-md:py-0 sm:px-5 sm:py-3 dark:border-white/10">Batal</button>
                            </div>
                            {!complete && <p className="max-w-xs text-xs text-slate-500">Lengkapi dulu: nama tiket, harga (isi 0 untuk gratis), kuota, dan masa berlaku.</p>}
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </PanelLayout>
    );
}
