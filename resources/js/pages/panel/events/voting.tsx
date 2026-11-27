import { Receipt as StatReceipt, Users as StatUsers, Vote as StatVote, Wallet as StatWallet } from 'lucide-react';
import PanelLayout from '@/components/panel/panel-layout';
import { router, useForm, usePage } from '@inertiajs/react';
import { Camera, Check, Eye, Gift, Layers, Link2, MessageSquare, Pencil, Plus, Receipt, Trash2, Trophy, Users, Wallet, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import VotingPanelMobile from '@/components/mobile/pages/voting-panel-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import VotingTransaksi, { useVotingStats } from '@/components/panel/voting-transaksi';

type Settings = {
    enabled: boolean; price_per_vote: number; min_votes: number; message_enabled: boolean; message_max: number;
    sound_min_votes: number; show_sender: boolean; show_ranking: boolean; show_votes: boolean; vote_start: string | null; vote_end: string | null;
};
type Cat = { id: number; name: string; opens_at: string | null; closes_at: string | null };
type Part = { id: number; category_id: number | null; name: string; description: string | null; active: boolean; photo: string | null; upload_url: string };
type GiftT = { id: number; emoji: string; name: string; votes: number; price: number; active: boolean };
type Props = { eventId: number; eventEnd: string; settings: Settings; categories: Cat[]; participants: Part[]; gifts: GiftT[] };

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const lbl = 'text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300';
const inp = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base sm:px-4 sm:py-2.5 sm:text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 disabled:bg-slate-100 dark:border-white/10 dark:bg-white/5';
const btn = 'rounded-2xl bg-indigo-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50';
const EMOJIS = ['🔥', '🐻', '🚀', '🦁', '💎', '👑', '⭐', '❤️', '🎉', '🏆', '⚡', '🌟'];

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/20'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
        </button>
    );
}

function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0"><div className="font-extrabold">{title}</div><p className="text-xs text-slate-500">{desc}</p></div>
            {children}
        </div>
    );
}

function Modal({ title, sub, onClose, onSubmit, footer, children }: { title: string; sub: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; footer: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
            <form onSubmit={onSubmit} className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-5 dark:border-white/10">
                    <div><h3 className="text-xl font-bold">{title}</h3><p className="text-sm text-slate-500">{sub}</p></div>
                    <button type="button" aria-label="Tutup" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{children}</div>
                <div className="flex gap-2 border-t border-slate-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4 dark:border-white/10">{footer}</div>
            </form>
        </div>
    );
}

function Preview({ s, names }: { s: { show_sender: boolean; show_ranking: boolean; show_votes: boolean; message_enabled: boolean }; names: string[] }) {
    const base = names.length >= 3 ? names.slice(0, 3) : ['Tim Garuda', 'Tim Elang', 'Tim Rajawali'];
    const votes = [1240, 980, 655];
    return (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-800 p-3 text-white sm:rounded-3xl sm:p-5">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-200"><Eye className="h-4 w-4" /> Pratinjau halaman penonton</div>
            <div className="mt-4 space-y-2">
                {s.show_ranking ? base.map((n, i) => (
                    <div key={n} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">{i + 1}</span>
                        <span className="flex-1 truncate text-sm font-bold">{n}</span>
                        {s.show_votes && <span className="text-sm font-extrabold text-amber-300">{new Intl.NumberFormat('id-ID').format(votes[i])}</span>}
                    </div>
                )) : <div className="rounded-2xl bg-white/10 px-4 py-5 text-center text-sm text-indigo-100">Peringkat disembunyikan dari penonton.</div>}
            </div>
            <div className="mt-4 text-xs font-extrabold uppercase tracking-wider text-indigo-200">Dukungan langsung</div>
            <div className="mt-2 rounded-2xl bg-white/10 px-3 py-2.5 text-sm">
                <span className="font-extrabold">{s.show_sender ? 'Rina S.' : 'Anonim'}</span> mengirim 🔥 untuk {base[0]}
                {s.message_enabled && <div className="mt-1 text-xs text-indigo-100">“Semangat terus!”</div>}
            </div>
        </div>
    );
}

function PhotoPicker({ current, file, removed, onFile, onRemove }: { current: string | null; file: File | null; removed: boolean; onFile: (f: File | null) => void; onRemove: () => void }) {
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    const shown = preview ?? (removed ? null : current);
    return (
        <div>
            <span className={lbl}>Foto peserta</span>
            <div className="mt-2 flex items-center gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                    {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <Camera className="h-8 w-8 text-slate-300" />}
                </div>
                <div className="space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-extrabold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10">
                        <Camera className="h-4 w-4" /> {shown ? 'Ganti foto' : 'Pilih foto'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 3 * 1024 * 1024) { alert('Ukuran foto maksimal 3 MB.'); return; }
                            onFile(f);
                        }} />
                    </label>
                    {shown && <button type="button" onClick={onRemove} className="block text-xs font-extrabold text-rose-600 hover:underline">Hapus foto</button>}
                    <p className="text-xs text-slate-500">JPG, PNG, atau WebP, maksimal 3 MB. Boleh dikosongkan, peserta bisa unggah sendiri lewat link.</p>
                </div>
            </div>
        </div>
    );
}

type Sched = { opens_at: string | null; closes_at: string | null };
const nowJkt = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 16).replace(' ', 'T');
function catStatus(c: Sched, maxEnd: string) {
    if (!c.opens_at || !c.closes_at) return { label: 'Belum dijadwalkan', cls: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' };
    const n = nowJkt();
    if (n < c.opens_at) return { label: 'Belum dibuka', cls: 'bg-amber-100 text-amber-800' };
    if (n > (c.closes_at < maxEnd ? c.closes_at : maxEnd)) return { label: 'Ditutup', cls: 'bg-rose-100 text-rose-700' };
    return { label: 'Dibuka', cls: 'bg-emerald-100 text-emerald-800' };
}

const inpSm = 'w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';
const ROW = 'items-center gap-2 md:grid-cols-[minmax(0,1.3fr)_8.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem]';
const tiny = 'mb-0.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 md:hidden';

function CategoryTable({ categories, participants, base, unassigned, maxEnd, onDelete }: { categories: Cat[]; participants: Part[]; base: string; unassigned: number; maxEnd: string; onDelete: (c: Cat) => void }) {
    const [rows, setRows] = useState<Record<number, { o: string; z: string }>>({});
    const [all, setAll] = useState({ o: '', z: '' });
    const [err, setErr] = useState('');
    const [saving, setSaving] = useState(false);
    const endLabel = new Date(maxEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const val = (c: Cat) => rows[c.id] ?? { o: c.opens_at ?? '', z: c.closes_at ?? '' };
    const set = (c: Cat, patch: Partial<{ o: string; z: string }>) => setRows((r) => ({ ...r, [c.id]: { ...val(c), ...patch } }));
    const over = (c: Cat) => { const v = val(c); return (v.o !== '' && v.o > maxEnd) || (v.z !== '' && v.z > maxEnd); };
    const isBad = (c: Cat) => { const v = val(c); return over(c) || (v.o !== '' && v.z !== '' && v.z <= v.o); };
    const changed = categories.filter((c) => { const v = val(c); return v.o !== (c.opens_at ?? '') || v.z !== (c.closes_at ?? ''); });
    const anyBad = categories.some(isBad);
    const allBad = (all.o !== '' && all.z !== '' && all.z <= all.o) || (all.o !== '' && all.o > maxEnd) || (all.z !== '' && all.z > maxEnd);
    const apply = () => setRows(Object.fromEntries(categories.map((c) => [c.id, { o: all.o, z: all.z }])));
    const save = () => {
        setSaving(true); setErr('');
        router.put(`${base}/jadwal`, { items: changed.map((c) => ({ id: c.id, opens_at: val(c).o || null, closes_at: val(c).z || null })) }, {
            preserveScroll: true,
            onSuccess: () => setRows({}),
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan jadwal.')),
            onFinish: () => setSaving(false),
        });
    };
    return (
        <div className="mt-4">
            <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="mr-auto self-center text-xs font-bold text-slate-600 dark:text-slate-300">Samakan jadwal semua kategori<span className="block font-medium text-slate-500">Paling lambat sampai {endLabel}</span></span>
                <label className="block"><span className={lbl}>Buka</span><input type="datetime-local" max={maxEnd} style={{ minHeight: '2.25rem' }} value={all.o} onChange={(e) => setAll((a) => ({ ...a, o: e.target.value }))} className={`${inpSm} mt-1`} /></label>
                <label className="block"><span className={lbl}>Tutup</span><input type="datetime-local" max={maxEnd} style={{ minHeight: '2.25rem' }} value={all.z} onChange={(e) => setAll((a) => ({ ...a, z: e.target.value }))} className={`${inpSm} mt-1`} /></label>
                <button type="button" onClick={apply} disabled={!all.o || !all.z || allBad} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/10">Terapkan</button>
            </div>

            <div className={`mt-3 hidden px-3 md:grid ${ROW}`}>
                <span className={lbl}>Kategori</span><span className={lbl}>Status</span><span className={lbl}>Buka</span><span className={lbl}>Tutup</span><span />
            </div>
            <div className="mt-1 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                {categories.map((c) => {
                    const v = val(c);
                    const bad = isBad(c);
                    const dirty = changed.includes(c);
                    const st = catStatus(c, maxEnd);
                    const n = participants.filter((p) => p.category_id === c.id).length;
                    return (
                        <div key={c.id} className={`rounded-2xl border bg-white p-3 dark:bg-white/5 ${bad ? 'border-rose-300' : dirty ? 'border-amber-300' : 'border-slate-200 dark:border-white/10'}`}>
                            <div className={`grid ${ROW}`}>
                                <div className="min-w-0"><div className="truncate font-extrabold">{c.name}</div><div className="text-xs text-slate-500">{n} peserta</div></div>
                                <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                                <label className="block"><span className={tiny}>Buka</span><input aria-label={`Buka ${c.name}`} type="datetime-local" max={maxEnd} style={{ minHeight: '2.25rem' }} value={v.o} onChange={(e) => set(c, { o: e.target.value })} className={inpSm} /></label>
                                <label className="block"><span className={tiny}>Tutup</span><input aria-label={`Tutup ${c.name}`} type="datetime-local" max={maxEnd} style={{ minHeight: '2.25rem' }} value={v.z} onChange={(e) => set(c, { z: e.target.value })} className={inpSm} /></label>
                                <button type="button" aria-label={`Hapus ${c.name}`} onClick={() => onDelete(c)} className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                            </div>
                            {bad && <p className="mt-1.5 text-xs font-bold text-rose-600">{over(c) ? `Jam buka dan tutup tidak boleh melewati akhir event (${endLabel}).` : 'Jam tutup harus setelah jam buka.'}</p>}
                        </div>
                    );
                })}
            </div>

            {(changed.length > 0 || err) && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white">
                    <span className="text-sm font-bold">{err || `${changed.length} kategori berubah, belum disimpan.`}</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setRows({}); setErr(''); }} className="rounded-xl px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10">Batalkan</button>
                        <button type="button" onClick={save} disabled={saving || anyBad || changed.length === 0} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-400 disabled:opacity-40">{saving ? 'Menyimpan…' : 'Simpan jadwal'}</button>
                    </div>
                </div>
            )}
            {unassigned > 0 && <p className="mt-3 text-xs font-bold text-amber-700">{unassigned} peserta aktif belum punya kategori, jadi belum bisa divote.</p>}
        </div>
    );
}

export default function Voting({ eventId, eventEnd, settings, categories, participants, gifts }: Props) {
    const base = `/panel/event/${eventId}/voting`;
    const phone = usePhone();
    const { stats, setStats } = useVotingStats(base);
    const [tab, setTab] = useState<'peserta' | 'harga' | 'pesan' | 'tampilan' | 'transaksi'>('peserta');
    const [filter, setFilter] = useState<'all' | 'none' | number>('all');
    const [catDraft, setCatDraft] = useState('');
    const [catErr, setCatErr] = useState('');

    const sf = useForm({
        price_per_vote: String(settings.price_per_vote), min_votes: String(settings.min_votes),
        message_enabled: settings.message_enabled, message_max: String(settings.message_max), sound_min_votes: String(settings.sound_min_votes),
        show_sender: settings.show_sender, show_ranking: settings.show_ranking, show_votes: settings.show_votes,
    });
    const d = sf.data;
    const se = sf.errors as Record<string, string | undefined>;
    const sValid = Number(d.price_per_vote) >= 1 && Number(d.min_votes) >= 1 && Number(d.message_max) >= 1 && Number(d.message_max) <= 200 && d.sound_min_votes !== '';
    const saveSettings = () => sf.put(`${base}/pengaturan`, { preserveScroll: true, onSuccess: () => sf.setDefaults() });

    const activeParts = participants.filter((p) => p.active).length;
    const noPhoto = participants.filter((p) => p.active && !p.photo).length;
    const unassigned = participants.filter((p) => p.active && p.category_id === null).length;
    const unscheduled = categories.filter((c) => participants.some((p) => p.active && p.category_id === c.id) && !(c.opens_at && c.closes_at)).length;
    const schedOk = categories.length > 0 && unscheduled === 0;
    const [copied, setCopied] = useState('');
    const copy = (text: string, key: string) => { navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1600); }); };
    const copyAll = () => copy(participants.filter((p) => p.active).map((p) => `${p.name}: ${p.upload_url}`).join('\n'), 'all');
    const resetLink = (p: Part) => { if (confirm(`Buat link baru untuk "${p.name}"? Link lama tidak akan berlaku lagi.`)) router.post(`${base}/peserta/${p.id}/link`, {}, { preserveScroll: true }); };

    const addCat = () => {
        if (catDraft.trim() === '') return;
        router.post(`${base}/kategori`, { name: catDraft }, { preserveScroll: true, onSuccess: () => { setCatDraft(''); setCatErr(''); }, onError: (e) => setCatErr(e.name ?? 'Gagal menambah kategori.') });
    };
    const delCat = (c: Cat) => { if (confirm(`Hapus kategori "${c.name}"? Pesertanya pindah ke Tanpa kategori.`)) router.delete(`${base}/kategori/${c.id}`, { preserveScroll: true }); };

    // Peserta
    const [pm, setPm] = useState<Part | 'new' | null>(null);
    const pf = useForm({ name: '', description: '', category_id: '', active: true, photo: null as File | null, remove_photo: false });
    const pe = pf.errors as Record<string, string | undefined>;
    const openNewP = () => { pf.clearErrors(); pf.setData({ name: '', description: '', category_id: typeof filter === 'number' ? String(filter) : '', active: true, photo: null, remove_photo: false }); setPm('new'); };
    const openEditP = (p: Part) => { pf.clearErrors(); pf.setData({ name: p.name, description: p.description ?? '', category_id: p.category_id ? String(p.category_id) : '', active: p.active, photo: null, remove_photo: false }); setPm(p); };
    const submitP = (e: React.FormEvent) => {
        e.preventDefault();
        pf.transform((x) => ({ ...x, category_id: x.category_id === '' ? null : Number(x.category_id) }) as any);
        const o = { preserveScroll: true, forceFormData: true, onSuccess: () => setPm(null) };
        if (pm === 'new') pf.post(`${base}/peserta`, o); else if (pm) pf.put(`${base}/peserta/${pm.id}`, o);
    };
    const delP = (p: Part) => { if (confirm(`Hapus peserta "${p.name}"?`)) router.delete(`${base}/peserta/${p.id}`, { preserveScroll: true }); };

    // Gift
    const [gm, setGm] = useState<GiftT | 'new' | null>(null);
    const [priceTouched, setPriceTouched] = useState(false);
    const gf = useForm({ emoji: '🔥', name: '', votes: '', price: '', active: true });
    const ge = gf.errors as Record<string, string | undefined>;
    const openNewG = () => { gf.clearErrors(); gf.setData({ emoji: '🔥', name: '', votes: '', price: '', active: true }); setPriceTouched(false); setGm('new'); };
    const openEditG = (g: GiftT) => { gf.clearErrors(); gf.setData({ emoji: g.emoji, name: g.name, votes: String(g.votes), price: String(g.price), active: g.active }); setPriceTouched(true); setGm(g); };
    const setVotes = (v: string) => gf.setData((x) => ({ ...x, votes: v, price: priceTouched ? x.price : v === '' ? '' : String(Number(v) * settings.price_per_vote) }));
    const gValid = gf.data.emoji !== '' && gf.data.name.trim() !== '' && Number(gf.data.votes) >= 1 && gf.data.price !== '';
    const submitG = (e: React.FormEvent) => {
        e.preventDefault();
        const o = { preserveScroll: true, onSuccess: () => setGm(null) };
        if (gm === 'new') gf.post(`${base}/gift`, o); else if (gm) gf.put(`${base}/gift/${gm.id}`, o);
    };
    const delG = (g: GiftT) => { if (confirm(`Hapus gift "${g.name}"?`)) router.delete(`${base}/gift/${g.id}`, { preserveScroll: true }); };

    const shown = participants.filter((p) => filter === 'all' ? true : filter === 'none' ? p.category_id === null : p.category_id === filter);
    const catName = (id: number | null) => categories.find((c) => c.id === id)?.name;
    const tabs = [
        { k: 'peserta', t: 'Kategori & Peserta', i: Users },
        { k: 'harga', t: 'Harga & Gift', i: Wallet },
        { k: 'pesan', t: 'Pesan & Efek', i: MessageSquare },
        { k: 'tampilan', t: 'Tampilan', i: Eye },
        { k: 'transaksi', t: 'Transaksi', i: Receipt },
    ] as const;
    const chip = (on: boolean) => `rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${on ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200'}`;

    const reqs = [
        { ok: activeParts >= 2, bad: `Minimal 2 peserta aktif (sekarang ${activeParts})` },
        { ok: activeParts > 0 && noPhoto === 0, bad: activeParts === 0 ? 'Belum ada peserta' : `${noPhoto} peserta belum punya foto` },
        { ok: unassigned === 0 && activeParts > 0, bad: activeParts === 0 ? 'Belum ada peserta' : `${unassigned} peserta belum punya kategori` },
        { ok: schedOk, bad: categories.length === 0 ? 'Buat kategori dan atur jadwalnya' : `${unscheduled} kategori belum dijadwalkan` },
    ];
    const reqDone = reqs.filter((x) => x.ok).length;
    const reqTodo = Array.from(new Set(reqs.filter((x) => !x.ok).map((x) => x.bad)));
    return (
        <PanelLayout title="Voting">
            {phone && (
                <VotingPanelMobile
                    enabled={settings.enabled} pricePerVote={settings.price_per_vote}
                    eventEnd={eventEnd} base={base} unassigned={unassigned} unscheduled={unscheduled} schedOk={schedOk}
                    activeParts={activeParts} noPhoto={noPhoto}
                    categories={categories} participants={participants} gifts={gifts}
                    tab={tab} setTab={setTab} filter={filter} setFilter={setFilter} shown={shown} catName={catName}
                    catDraft={catDraft} setCatDraft={setCatDraft} catErr={catErr} addCat={addCat} delCat={delCat}
                    copied={copied} copy={copy} copyAll={copyAll}
                    onNewP={openNewP} onEditP={openEditP} onDelP={delP}
                    onNewG={openNewG} onEditG={openEditG} onDelG={delG}
                    onToggleG={(g) => router.post(`${base}/gift/${g.id}/toggle`, {}, { preserveScroll: true })}
                    d={d} setD={(k, v) => sf.setData(k as any, v as any)} se={se}
                    dirty={sf.isDirty} valid={sValid} saving={sf.processing} onSave={saveSettings}
                    preview={<Preview s={d} names={participants.filter((p) => p.active).map((p) => p.name)} />}
                />
            )}
            <div className={phone ? 'hidden' : 'space-y-7'}>

                <div className={`${card} p-6 sm:p-8`}>
                    <h2 className="flex flex-wrap items-center gap-3 text-xl font-bold">
                        Voting
                        {settings.enabled
                            ? <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Aktif</span>
                            : <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Belum aktif</span>}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{settings.enabled ? 'Voting berjalan otomatis sesuai jadwal tiap kategori.' : 'Voting aktif otomatis begitu peserta dan jadwal tiap kategori lengkap.'}</p>

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        {[
                            { l: 'Pendapatan event', v: stats ? rp(stats.net) : '…', sub: stats ? `Harga ${rp(settings.price_per_vote)} per vote` : '', Icon: StatWallet, soft: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300' },
                            { l: 'Transaksi lunas', v: stats ? new Intl.NumberFormat('id-ID').format(stats.orders) : '…', sub: stats && stats.pending > 0 ? `${stats.pending} menunggu bayar` : '', Icon: StatReceipt, soft: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300' },
                            { l: 'Vote terjual', v: stats ? new Intl.NumberFormat('id-ID').format(stats.votes) : '…', sub: '', Icon: StatVote, soft: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300' },
                            { l: 'Peserta aktif', v: String(activeParts), sub: `${categories.length} kategori`, Icon: StatUsers, soft: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-300' },
                        ].map((x) => (
                            <div key={x.l} title={x.sub || undefined} className={`group relative min-w-0 overflow-hidden rounded-2xl px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${x.soft}`}>
                                <x.Icon className={`absolute -bottom-4 -right-3 h-24 w-24 opacity-10 transition group-hover:scale-110 ${x.text}`} />
                                <div className="relative">
                                    <div className={`break-words text-2xl font-extrabold sm:text-3xl ${x.text}`}>{x.v}</div>
                                    <div className={`mt-1.5 text-sm font-bold ${x.text}`}>{x.l}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${reqTodo.length === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {reqTodo.length === 0 && <Check className="h-4 w-4" />}
                            {reqDone} dari {reqs.length} syarat terpenuhi
                        </span>
                        {reqTodo.map((t) => <span key={t} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{t}</span>)}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {tabs.map(({ k, t }) => (
                        <button key={k} type="button" onClick={() => setTab(k)} className={`inline-flex shrink-0 items-center rounded-2xl px-4 py-2.5 text-sm font-extrabold transition ${tab === k ? 'bg-indigo-900 text-white shadow' : 'border border-slate-200 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}>{t}</button>
                    ))}
                </div>

                <div className="space-y-7">
                {tab === 'peserta' && (
                    <>
                        <div className={`${card} p-6`}>
                            <h3 className="flex items-center gap-2 text-xl font-bold"><Layers className="h-5 w-5 text-indigo-600" /> Kategori voting</h3>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Kelompokkan peserta, misalnya Solo, Duet, atau Regu. Atur jam buka dan tutup voting untuk tiap kategori. Voting aktif otomatis saat peserta dan jadwal lengkap. Majukan jam tutup untuk menghentikan voting. Jam tutup tidak bisa melewati akhir event.</p>
                            {categories.length === 0
                                ? <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10">Belum ada kategori. Tambahkan kategori di bawah, lalu atur jadwalnya.</div>
                                : <CategoryTable categories={categories} participants={participants} base={base} unassigned={unassigned} maxEnd={eventEnd} onDelete={delCat} />}
                            <div className="mt-3 flex gap-2">
                                <input value={catDraft} maxLength={60} onChange={(e) => setCatDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCat(); } }} placeholder="Nama kategori, lalu Enter" className={`${inp} !mt-0 flex-1`} />
                                <button type="button" onClick={addCat} disabled={catDraft.trim() === ''} className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-700 px-4 text-sm font-extrabold text-white hover:bg-indigo-600 disabled:opacity-40"><Plus className="h-4 w-4" /> Tambah</button>
                            </div>
                            {catErr && <p className="mt-1 text-xs text-rose-600">{catErr}</p>}
                        </div>

                        <div className={`${card} p-6`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="flex items-center gap-2 text-xl font-bold"><Trophy className="h-5 w-5 text-indigo-600" /> Peserta voting</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={copyAll} disabled={participants.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:bg-white/5">{copied === 'all' ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />} {copied === 'all' ? 'Tersalin' : 'Salin semua link foto'}</button>
                                    <button type="button" onClick={openNewP} className={`${btn} inline-flex items-center gap-2 !py-2.5`}><Plus className="h-4 w-4" /> Tambah peserta</button>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button type="button" onClick={() => setFilter('all')} className={chip(filter === 'all')}>Semua ({participants.length})</button>
                                {categories.map((c) => <button key={c.id} type="button" onClick={() => setFilter(c.id)} className={chip(filter === c.id)}>{c.name} ({participants.filter((p) => p.category_id === c.id).length})</button>)}
                                <button type="button" onClick={() => setFilter('none')} className={chip(filter === 'none')}>Tanpa kategori ({participants.filter((p) => p.category_id === null).length})</button>
                            </div>
                            {shown.length === 0 ? (
                                <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10">Belum ada peserta di sini. Klik “Tambah peserta”.</div>
                            ) : (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {shown.map((p) => (
                                        <div key={p.id} className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${p.active ? '' : 'opacity-60'}`}>
                                            {p.photo ? <img src={p.photo} alt={p.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 dark:bg-white/10"><Camera className="h-6 w-6" /></span>}
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-extrabold">{p.name}</div>
                                                <div className="truncate text-xs text-slate-500">{p.description || 'Tanpa deskripsi'}</div>
                                                <div className="mt-1 flex gap-1.5 text-[11px] font-bold">
                                                    {catName(p.category_id) && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-800">{catName(p.category_id)}</span>}
                                                    {!p.active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">Nonaktif</span>}
                                                    {!p.photo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Belum ada foto</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button type="button" aria-label="Salin link foto" title="Salin link unggah foto" onClick={() => copy(p.upload_url, `p${p.id}`)} onDoubleClick={() => resetLink(p)} className="flex h-9 w-9 items-center justify-center rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10">{copied === `p${p.id}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}</button>
                                                <button type="button" aria-label="Ubah" onClick={() => openEditP(p)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><Pencil className="h-4 w-4" /></button>
                                                <button type="button" aria-label="Hapus" onClick={() => delP(p)} className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {tab === 'harga' && (
                    <>
                        <div className={`${card} p-6`}>
                            <h3 className="text-xl font-bold">Harga vote</h3>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label className="block"><span className={lbl}>Harga per 1 vote (Rp)</span>
                                    <input type="number" inputMode="numeric" min={1} value={d.price_per_vote} onChange={(e) => sf.setData('price_per_vote', e.target.value)} className={inp} />
                                    <span className="mt-1 block text-xs text-slate-500">{Number(d.price_per_vote) >= 1 ? `10 vote = ${rp(Number(d.price_per_vote) * 10)}` : 'Isi minimal Rp1.'}</span>{se.price_per_vote && <span className="text-xs text-rose-600">{se.price_per_vote}</span>}
                                </label>
                                <label className="block"><span className={lbl}>Minimal vote per transaksi</span>
                                    <input type="number" inputMode="numeric" min={1} value={d.min_votes} onChange={(e) => sf.setData('min_votes', e.target.value)} className={inp} />
                                    <span className="mt-1 block text-xs text-slate-500">Pembeli tidak bisa membeli di bawah jumlah ini.</span>{se.min_votes && <span className="text-xs text-rose-600">{se.min_votes}</span>}
                                </label>
                            </div>
                        </div>

                        <div className={`${card} p-6`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="flex items-center gap-2 text-xl font-bold"><Gift className="h-5 w-5 text-indigo-600" /> Gift power-up</h3>
                                    <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">Paket vote siap pilih. Pembeli cukup tap gift untuk mengisi jumlah otomatis. Gift tersimpan langsung, tanpa tombol Simpan pengaturan.</p>
                                </div>
                                <button type="button" onClick={openNewG} className={`${btn} inline-flex items-center gap-2 !py-2.5`}><Plus className="h-4 w-4" /> Tambah gift</button>
                            </div>
                            {gifts.length === 0 ? (
                                <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10">Belum ada gift. Tambahkan paket seperti +10, +50, atau +100 vote.</div>
                            ) : (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {gifts.map((g) => (
                                        <div key={g.id} className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${g.active ? '' : 'opacity-60'}`}>
                                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-white/10">{g.emoji}</span>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-extrabold">{g.name}</div>
                                                <div className="text-xs text-slate-500">+{g.votes} vote · {rp(g.price)}</div>
                                                <div className="mt-1 flex gap-3 text-xs font-extrabold">
                                                    <button type="button" onClick={() => router.post(`${base}/gift/${g.id}/toggle`, {}, { preserveScroll: true })} className="text-slate-600 hover:underline">{g.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                                                    <button type="button" onClick={() => openEditG(g)} className="text-indigo-600 hover:underline">Ubah</button>
                                                    <button type="button" onClick={() => delG(g)} className="text-rose-600 hover:underline">Hapus</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {tab === 'pesan' && (
                    <div className={`${card} p-6`}>
                        <h3 className="text-xl font-bold">Pesan dukungan dan efek suara</h3>
                        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
                            <SettingRow title="Aktifkan pesan dukungan" desc="Pembeli boleh menulis pesan singkat yang tampil di daftar dukungan langsung."><Switch on={d.message_enabled} onChange={(v) => sf.setData('message_enabled', v)} /></SettingRow>
                            <SettingRow title="Batas karakter pesan" desc="Antara 1 sampai 200 karakter."><input type="number" inputMode="numeric" min={1} max={200} disabled={!d.message_enabled} value={d.message_max} onChange={(e) => sf.setData('message_max', e.target.value)} className={`${inp} !mt-0 w-28 text-center`} /></SettingRow>
                            <SettingRow title="Minimal vote agar pesan dibacakan suara" desc="Pesan dukungan dibacakan dengan suara hanya jika nilainya sebesar ini atau lebih. Isi 0 untuk mematikan suara."><input type="number" inputMode="numeric" min={0} value={d.sound_min_votes} onChange={(e) => sf.setData('sound_min_votes', e.target.value)} className={`${inp} !mt-0 w-28 text-center`} /></SettingRow>
                        </div>
                        {(se.message_max || se.sound_min_votes) && <p className="mt-2 text-xs text-rose-600">{se.message_max ?? se.sound_min_votes}</p>}
                    </div>
                )}

                {tab === 'tampilan' && (
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className={`${card} p-6`}>
                            <h3 className="text-xl font-bold">Tampilan publik</h3>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Apa yang boleh dilihat penonton di halaman voting.</p>
                            <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
                                <SettingRow title="Tampilkan nama pengirim" desc="Jika dimatikan: pengirim tampil sebagai Anonim."><Switch on={d.show_sender} onChange={(v) => sf.setData('show_sender', v)} /></SettingRow>
                                <SettingRow title="Tampilkan peringkat" desc="Penonton bisa melihat urutan peserta."><Switch on={d.show_ranking} onChange={(v) => sf.setData('show_ranking', v)} /></SettingRow>
                                <SettingRow title="Tampilkan jumlah vote" desc="Jika dimatikan: hanya peringkat yang terlihat."><Switch on={d.show_votes} onChange={(v) => sf.setData('show_votes', v)} /></SettingRow>
                            </div>
                        </div>
                        <Preview s={d} names={participants.filter((p) => p.active).map((p) => p.name)} />
                    </div>
                )}

                {tab === 'transaksi' && (
                    <div className={`${card} p-4 sm:p-6`}>
                        <VotingTransaksi base={base} onStats={setStats} />
                    </div>
                )}

                {tab !== 'peserta' && tab !== 'transaksi' && (
                    <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}>
                        <p className={`text-sm font-semibold ${sf.isDirty ? 'text-amber-700' : 'text-slate-500'}`}>{sf.isDirty ? 'Ada perubahan yang belum disimpan.' : 'Semua pengaturan tersimpan.'}</p>
                        <button type="button" onClick={saveSettings} disabled={!sf.isDirty || !sValid || sf.processing} className={btn}>{sf.processing ? 'Menyimpan…' : 'Simpan pengaturan'}</button>
                    </div>
                )}
                </div>
            </div>

            {pm && (
                <Modal title={pm === 'new' ? 'Tambah peserta' : `Ubah ${pm.name}`} sub="Peserta yang bisa didukung penonton." onClose={() => setPm(null)} onSubmit={submitP}
                    footer={<><button type="submit" disabled={pf.data.name.trim() === '' || pf.processing} className={btn}>{pf.processing ? 'Menyimpan…' : pm === 'new' ? 'Tambahkan peserta' : 'Simpan perubahan'}</button><button type="button" onClick={() => setPm(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10">Batal</button></>}>
                    <PhotoPicker current={pm !== 'new' ? pm.photo : null} file={pf.data.photo} removed={pf.data.remove_photo} onFile={(f) => pf.setData((x) => ({ ...x, photo: f, remove_photo: false }))} onRemove={() => pf.setData((x) => ({ ...x, photo: null, remove_photo: true }))} />
                    {pe.photo && <span className="block text-xs text-rose-600">{pe.photo}</span>}
                    {pm !== 'new' && (
                        <div className="rounded-2xl bg-indigo-50 p-3 text-xs text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200">
                            <div className="font-extrabold">Link unggah foto untuk peserta ini</div>
                            <div className="mt-1 break-all">{pm.upload_url}</div>
                            <div className="mt-2 flex gap-3 font-extrabold">
                                <button type="button" onClick={() => copy(pm.upload_url, 'modal')} className="hover:underline">{copied === 'modal' ? 'Tersalin ✓' : 'Salin link'}</button>
                                <button type="button" onClick={() => resetLink(pm)} className="text-rose-600 hover:underline">Buat link baru</button>
                            </div>
                        </div>
                    )}
                    <label className="block"><span className={lbl}>Nama peserta atau regu</span><input value={pf.data.name} maxLength={80} onChange={(e) => pf.setData('name', e.target.value)} placeholder="Tim Garuda" className={inp} />{pe.name && <span className="text-xs text-rose-600">{pe.name}</span>}</label>
                    <label className="block"><span className={lbl}>Deskripsi singkat (opsional)</span><input value={pf.data.description} maxLength={160} onChange={(e) => pf.setData('description', e.target.value)} placeholder="Asal sekolah atau slogan" className={inp} />{pe.description && <span className="text-xs text-rose-600">{pe.description}</span>}</label>
                    <label className="block"><span className={lbl}>Kategori</span>
                        <select value={pf.data.category_id} onChange={(e) => pf.setData('category_id', e.target.value)} className={inp}><option value="">Tanpa kategori</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{pe.category_id && <span className="text-xs text-rose-600">{pe.category_id}</span>}
                    </label>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div><div className="font-extrabold">Peserta aktif</div><p className="text-xs text-slate-500">Peserta nonaktif tidak tampil di halaman voting.</p></div><Switch on={pf.data.active} onChange={(v) => pf.setData('active', v)} /></div>
                </Modal>
            )}

            {gm && (
                <Modal title={gm === 'new' ? 'Tambah gift' : `Ubah ${gm.name}`} sub="Paket vote yang tinggal di-tap pembeli." onClose={() => setGm(null)} onSubmit={submitG}
                    footer={<><button type="submit" disabled={!gValid || gf.processing} className={btn}>{gf.processing ? 'Menyimpan…' : gm === 'new' ? 'Tambahkan gift' : 'Simpan perubahan'}</button><button type="button" onClick={() => setGm(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10">Batal</button></>}>
                    <div><span className={lbl}>Emoji</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {EMOJIS.map((e) => <button key={e} type="button" onClick={() => gf.setData('emoji', e)} className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition ${gf.data.emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10'}`}>{e}</button>)}
                        </div>{ge.emoji && <span className="text-xs text-rose-600">{ge.emoji}</span>}
                    </div>
                    <label className="block"><span className={lbl}>Nama gift</span><input value={gf.data.name} maxLength={40} onChange={(e) => gf.setData('name', e.target.value)} placeholder="Api, Roket, Singa" className={inp} />{ge.name && <span className="text-xs text-rose-600">{ge.name}</span>}</label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block"><span className={lbl}>Jumlah vote</span><input type="number" inputMode="numeric" min={1} value={gf.data.votes} onChange={(e) => setVotes(e.target.value)} placeholder="10" className={inp} />{ge.votes && <span className="text-xs text-rose-600">{ge.votes}</span>}</label>
                        <label className="block"><span className={lbl}>Harga (Rp)</span><input type="number" inputMode="numeric" min={0} value={gf.data.price} onChange={(e) => { setPriceTouched(true); gf.setData('price', e.target.value); }} placeholder="10000" className={inp} />{ge.price && <span className="text-xs text-rose-600">{ge.price}</span>}</label>
                    </div>
                    <p className="text-xs text-slate-500">Harga terisi otomatis dari jumlah vote × {rp(settings.price_per_vote)}. Ubah kalau gift ini punya harga paket khusus.</p>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div><div className="font-extrabold">Gift aktif</div><p className="text-xs text-slate-500">Gift nonaktif tidak tampil untuk pembeli.</p></div><Switch on={gf.data.active} onChange={(v) => gf.setData('active', v)} /></div>
                </Modal>
            )}
        </PanelLayout>
    );
}
