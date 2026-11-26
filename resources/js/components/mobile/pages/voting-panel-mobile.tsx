import { Camera, Check, Link2, Plus, Trash2, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { CARD, FIELD, GROUP, MUTED, PRESS } from '../kit/soft';

type Cat = { id: number; name: string; opens_at: string | null; closes_at: string | null };
type Part = { id: number; category_id: number | null; name: string; description: string | null; active: boolean; photo: string | null; upload_url: string };
type GiftT = { id: number; emoji: string; name: string; votes: number; price: number; active: boolean };
type D = {
    price_per_vote: string; min_votes: string; message_enabled: boolean; message_max: string; sound_min_votes: string;
    show_sender: boolean; show_ranking: boolean; show_votes: boolean;
};
type Tab = 'peserta' | 'harga' | 'pesan' | 'tampilan';
type Filter = 'all' | 'none' | number;

type Props = {
    enabled: boolean;
    eventEnd: string;
    base: string;
    unassigned: number;
    unscheduled: number;
    schedOk: boolean;
    pricePerVote: number;
    activeParts: number;
    noPhoto: number;
    categories: Cat[];
    participants: Part[];
    gifts: GiftT[];
    tab: Tab; setTab: (t: Tab) => void;
    filter: Filter; setFilter: (f: Filter) => void;
    shown: Part[];
    catName: (id: number | null) => string | undefined;
    catDraft: string; setCatDraft: (v: string) => void; catErr: string;
    addCat: () => void; delCat: (c: Cat) => void;
    copied: string; copy: (text: string, key: string) => void; copyAll: () => void;
    onNewP: () => void; onEditP: (p: Part) => void; onDelP: (p: Part) => void;
    onNewG: () => void; onEditG: (g: GiftT) => void; onDelG: (g: GiftT) => void; onToggleG: (g: GiftT) => void;
    d: D;
    setD: <K extends keyof D>(k: K, v: D[K]) => void;
    se: Record<string, string | undefined>;
    dirty: boolean; valid: boolean; saving: boolean; onSave: () => void;
    preview: ReactNode;
};

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const OK = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
const WARN = 'bg-amber-500/10 text-amber-800 dark:text-amber-200';
const OFF = 'bg-slate-500/10 text-slate-600 dark:text-slate-300';
const IND = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';
const badge = (label: string, cls: string) => <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ' + cls}>{label}</span>;
const lbl = 'text-[11px] font-semibold ' + MUTED;
const inp = 'mt-1 h-10 w-full rounded-xl px-3 text-base outline-none ' + FIELD;
const sel = 'h-10 min-w-0 rounded-xl px-3 text-base ' + FIELD;
const tabCls = (on: boolean) =>
    'inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-full px-2 text-xs font-medium ' + PRESS + ' ' +
    (on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : FIELD + ' text-slate-800 dark:text-slate-100');
const iconBtn = 'flex size-9 shrink-0 items-center justify-center rounded-full ' + FIELD + ' ' + PRESS;
const delBtn = 'flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 ' + PRESS;

function Sw({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={'relative h-7 w-12 shrink-0 rounded-full transition ' + (on ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-white/20')}>
            <span className={'absolute top-1 size-5 rounded-full bg-white shadow transition-all ' + (on ? 'left-6' : 'left-1')} />
        </button>
    );
}

function Row({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="min-w-0">
                <span className="block text-sm leading-tight font-medium">{title}</span>
                <span className={'block text-[11px] leading-snug ' + MUTED}>{desc}</span>
            </span>
            {children}
        </div>
    );
}

const nowJkt = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16);
const dtInp = 'mt-1 h-10 w-full min-w-0 rounded-xl px-2 text-sm outline-none ' + FIELD;
const BAD = 'bg-rose-500/10 text-rose-700 dark:text-rose-300';

function CategorySchedule({ categories, base, maxEnd, unassigned }: { categories: Cat[]; base: string; maxEnd: string; unassigned: number }) {
    type V = { o: string; z: string };
    const [rows, setRows] = useState<Record<number, V>>({});
    const [all, setAll] = useState<V>({ o: '', z: '' });
    const [err, setErr] = useState('');
    const [saving, setSaving] = useState(false);
    const endLabel = new Date(maxEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const val = (c: Cat): V => rows[c.id] ?? { o: c.opens_at ?? '', z: c.closes_at ?? '' };
    const set = (c: Cat, patch: Partial<V>) => setRows((r) => ({ ...r, [c.id]: { ...val(c), ...patch } }));
    const over = (x: V) => (x.o !== '' && x.o > maxEnd) || (x.z !== '' && x.z > maxEnd);
    const bad = (x: V) => over(x) || (x.o !== '' && x.z !== '' && x.z <= x.o);
    const changed = categories.filter((c) => { const x = val(c); return x.o !== (c.opens_at ?? '') || x.z !== (c.closes_at ?? ''); });
    const anyBad = categories.some((c) => bad(val(c)));
    const status = (c: Cat): [string, string] => {
        if (!c.opens_at || !c.closes_at) return ['Belum dijadwalkan', OFF];
        const n = nowJkt();
        if (n < c.opens_at) return ['Belum dibuka', WARN];
        if (n > (c.closes_at < maxEnd ? c.closes_at : maxEnd)) return ['Ditutup', BAD];
        return ['Dibuka', OK];
    };
    const apply = () => setRows(Object.fromEntries(categories.map((c) => [c.id, { o: all.o, z: all.z }])));
    const save = () => {
        setSaving(true); setErr('');
        router.put(base + '/jadwal', { items: changed.map((c) => ({ id: c.id, opens_at: val(c).o || null, closes_at: val(c).z || null })) }, {
            preserveScroll: true,
            onSuccess: () => setRows({}),
            onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan jadwal.')),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
            <h2 className="text-sm font-semibold">Jadwal voting per kategori</h2>
            <p className={'text-[11px] leading-snug ' + MUTED}>Paling lambat sampai {endLabel}. Majukan jam tutup untuk menghentikan voting.</p>

            <div className="space-y-1.5 rounded-xl p-2.5 bg-slate-500/5">
                <p className="text-[11px] font-semibold">Samakan jadwal semua kategori</p>
                <div className="grid grid-cols-2 gap-2">
                    <label className="block"><span className={lbl}>Buka</span><input type="datetime-local" max={maxEnd} value={all.o} onChange={(e) => setAll((a) => ({ ...a, o: e.target.value }))} className={dtInp} /></label>
                    <label className="block"><span className={lbl}>Tutup</span><input type="datetime-local" max={maxEnd} value={all.z} onChange={(e) => setAll((a) => ({ ...a, z: e.target.value }))} className={dtInp} /></label>
                </div>
                <button type="button" onClick={apply} disabled={!all.o || !all.z || bad(all)} className={'h-9 w-full rounded-full text-xs font-medium disabled:opacity-40 ' + FIELD + ' ' + PRESS}>Terapkan ke semua</button>
            </div>

            <div className="space-y-2">
                {categories.map((c) => {
                    const x = val(c);
                    const b = bad(x);
                    const [label, cls] = status(c);
                    return (
                        <div key={c.id} className={'space-y-1.5 rounded-xl p-2.5 ' + FIELD + (b ? ' ring-1 ring-rose-400' : '')}>
                            <div className="flex items-center justify-between gap-2">
                                <span className="min-w-0 truncate text-sm font-semibold">{c.name}</span>
                                {badge(label, cls)}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block"><span className={lbl}>Buka</span><input aria-label={'Buka ' + c.name} type="datetime-local" max={maxEnd} value={x.o} onChange={(e) => set(c, { o: e.target.value })} className={dtInp} /></label>
                                <label className="block"><span className={lbl}>Tutup</span><input aria-label={'Tutup ' + c.name} type="datetime-local" max={maxEnd} value={x.z} onChange={(e) => set(c, { z: e.target.value })} className={dtInp} /></label>
                            </div>
                            {b && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{over(x) ? 'Jam buka dan tutup tidak boleh melewati akhir event (' + endLabel + ').' : 'Jam tutup harus setelah jam buka.'}</p>}
                        </div>
                    );
                })}
            </div>

            {unassigned > 0 && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{unassigned} peserta aktif belum punya kategori, jadi belum bisa divote.</p>}

            {(changed.length > 0 || err) && (
                <div className="space-y-2 rounded-xl bg-slate-900 p-3 text-white">
                    <p className="text-xs font-medium">{err || changed.length + ' kategori berubah, belum disimpan.'}</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setRows({}); setErr(''); }} className="h-10 flex-1 rounded-full text-sm font-medium text-white/80">Batalkan</button>
                        <button type="button" onClick={save} disabled={saving || anyBad || changed.length === 0} className="h-10 flex-1 rounded-full bg-indigo-500 text-sm font-medium text-white disabled:opacity-40">{saving ? 'Menyimpan...' : 'Simpan jadwal'}</button>
                    </div>
                </div>
            )}
        </section>
    );
}

/** Voting HP (ringkas): status, ringkasan, tab Peserta, Harga & Gift, Pesan, Tampilan. */
export default function VotingPanelMobile(p: Props) {
    const { d } = p;
    const tabs: [Tab, string, string][] = [['peserta', 'Peserta', 'Kategori dan peserta'], ['harga', 'Harga', 'Harga dan gift'], ['pesan', 'Pesan', 'Pesan dan efek'], ['tampilan', 'Tampilan', 'Tampilan publik']];
    const stats: [string, string][] = [['Kategori', String(p.categories.length)], ['Peserta', String(p.activeParts)], ['Gift', String(p.gifts.filter((g) => g.active).length)], ['Per vote', rp(p.pricePerVote)]];
    const num = (k: 'price_per_vote' | 'min_votes' | 'message_max' | 'sound_min_votes', min: number, extra = '') => (
        <input type="number" inputMode="numeric" min={min} value={d[k]} onChange={(e) => p.setD(k, e.target.value)} className={extra || inp} />
    );

    return (
        <div className="space-y-3 pb-24">
            <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">Voting {p.enabled ? badge('Aktif', OK) : badge('Belum aktif', OFF)}</h2>
                </div>
                <details>
                    <summary className="cursor-pointer text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Keterangan</summary>
                    <p className={'mt-1 text-xs leading-snug ' + MUTED}>{p.enabled ? 'Voting berjalan otomatis sesuai jadwal tiap kategori.' : 'Voting aktif otomatis begitu peserta dan jadwal tiap kategori lengkap.'}</p>
                </details>
                <div className="grid grid-cols-2 gap-1.5">
                    {([
                        [p.activeParts >= 2, 'Min. 2 peserta (' + p.activeParts + ')'],
                        [p.activeParts > 0 && p.noPhoto === 0, p.activeParts === 0 ? 'Foto peserta' : p.noPhoto === 0 ? 'Semua punya foto' : p.noPhoto + ' belum ada foto'],
                        [p.activeParts > 0 && p.unassigned === 0, p.activeParts === 0 ? 'Kategori peserta' : p.unassigned === 0 ? 'Semua berkategori' : p.unassigned + ' belum berkategori'],
                        [p.schedOk, p.categories.length === 0 ? 'Jadwal kategori' : p.schedOk ? 'Jadwal lengkap' : p.unscheduled + ' belum dijadwalkan'],
                    ] as [boolean, string][]).map(([ok, t]) => (
                        <span key={t} className={'truncate rounded-full px-2.5 py-1 text-center text-[11px] font-medium ' + (ok ? OK : WARN)}>{(ok ? '✓ ' : '• ') + t}</span>
                    ))}
                </div>
                <div className="grid grid-cols-4 divide-x divide-slate-900/[0.07] dark:divide-white/10">
                    {stats.map(([l, n]) => (
                        <div key={l} className="min-w-0 px-1 text-center">
                            <p className="truncate text-base leading-tight font-semibold">{n}</p>
                            <p className={'text-[11px] ' + MUTED}>{l}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-1.5">
                    {tabs.map(([k, l, full]) => <button key={k} type="button" aria-label={full} onClick={() => p.setTab(k)} className={tabCls(p.tab === k)}>{l}</button>)}
                </div>
            </section>

            {p.tab === 'peserta' && (
                <>
                    <section className={'space-y-2 rounded-2xl p-3 ' + CARD}>
                        <h2 className="text-sm font-semibold">Kategori voting</h2>
                        <details>
                            <summary className="cursor-pointer text-[11px] font-medium text-indigo-700 dark:text-indigo-300">Keterangan</summary>
                            <p className={'mt-1 text-xs leading-snug ' + MUTED}>Kelompokkan peserta, misalnya Solo, Duet, atau Regu. Atur jam buka dan tutup voting untuk tiap kategori. Voting aktif otomatis saat peserta dan jadwal lengkap. Jam tutup tidak bisa melewati akhir event.</p>
                        </details>
                        <div className="flex flex-wrap gap-1.5">
                            {p.categories.length === 0 && <span className={'text-xs ' + MUTED}>Belum ada kategori.</span>}
                            {p.categories.map((c) => (
                                <span key={c.id} className={'inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-xs font-medium ' + IND}>
                                    {c.name}
                                    <button type="button" aria-label={'Hapus ' + c.name} onClick={() => p.delCat(c)} className="flex size-7 items-center justify-center rounded-full"><X className="size-3.5" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={p.catDraft} maxLength={60} onChange={(e) => p.setCatDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); p.addCat(); } }} placeholder="Nama kategori" className={'h-10 min-w-0 flex-1 rounded-xl px-3 text-base outline-none ' + FIELD} />
                            <button type="button" onClick={p.addCat} disabled={p.catDraft.trim() === ''} className={'flex h-10 shrink-0 items-center gap-1 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-indigo-500 ' + PRESS}><Plus className="size-4" /> Tambah</button>
                        </div>
                        {p.catErr && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{p.catErr}</p>}
                    </section>

                    {p.categories.length > 0 && <CategorySchedule categories={p.categories} base={p.base} maxEnd={p.eventEnd} unassigned={p.unassigned} />}

                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="mr-auto px-1 text-sm font-semibold">Peserta ({p.participants.length})</h2>
                            <button type="button" onClick={p.copyAll} disabled={p.participants.length === 0} className={'flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium disabled:opacity-40 ' + FIELD + ' ' + PRESS}>{p.copied === 'all' ? <Check className="size-4 text-emerald-600" /> : <Link2 className="size-4" />} {p.copied === 'all' ? 'Tersalin' : 'Salin link'}</button>
                            <button type="button" onClick={p.onNewP} className={'flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white dark:bg-indigo-500 ' + PRESS}><Plus className="size-4" /> Tambah</button>
                        </div>
                        <select value={String(p.filter)} onChange={(e) => p.setFilter(e.target.value === 'all' || e.target.value === 'none' ? e.target.value : Number(e.target.value))} className={sel + ' w-full'}>
                            <option value="all">Semua ({p.participants.length})</option>
                            {p.categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({p.participants.filter((x) => x.category_id === c.id).length})</option>)}
                            <option value="none">Tanpa kategori ({p.participants.filter((x) => x.category_id === null).length})</option>
                        </select>
                        {p.shown.length === 0 ? (
                            <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>Belum ada peserta di sini. Ketuk Tambah.</div>
                        ) : (
                            <div className={GROUP}>
                                {p.shown.map((x) => (
                                    <div key={x.id} className={'flex items-center gap-2.5 px-3 py-2 ' + (x.active ? '' : 'opacity-60')}>
                                        {x.photo ? <img loading="lazy" decoding="async" src={x.photo} alt={x.name} className="size-10 shrink-0 rounded-xl object-cover" /> : <span className={'flex size-10 shrink-0 items-center justify-center rounded-xl ' + FIELD}><Camera className="size-4 text-slate-400" /></span>}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm leading-tight font-semibold">{x.name}</span>
                                            <span className={'block truncate text-[11px] ' + MUTED}>{x.description || 'Tanpa deskripsi'}</span>
                                            <span className="mt-0.5 flex flex-wrap gap-1">
                                                {p.catName(x.category_id) && badge(p.catName(x.category_id) as string, IND)}
                                                {!x.active && badge('Nonaktif', OFF)}
                                                {!x.photo && badge('Belum ada foto', WARN)}
                                            </span>
                                        </span>
                                        <button type="button" aria-label="Salin link foto" onClick={() => p.copy(x.upload_url, 'p' + x.id)} className={iconBtn + ' text-indigo-600 dark:text-indigo-300'}>{p.copied === 'p' + x.id ? <Check className="size-4 text-emerald-600" /> : <Link2 className="size-4" />}</button>
                                        <button type="button" aria-label="Ubah" onClick={() => p.onEditP(x)} className={iconBtn}><span className="text-[11px] font-medium">Ubah</span></button>
                                        <button type="button" aria-label="Hapus" onClick={() => p.onDelP(x)} className={delBtn}><Trash2 className="size-4" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {p.tab === 'harga' && (
                <>
                    <section className={'space-y-2.5 rounded-2xl p-3 ' + CARD}>
                        <h2 className="text-sm font-semibold">Harga vote</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block"><span className={lbl}>Harga per vote (Rp)</span>{num('price_per_vote', 1)}
                                <span className={'block text-[11px] ' + MUTED}>{Number(d.price_per_vote) >= 1 ? '10 vote = ' + rp(Number(d.price_per_vote) * 10) : 'Isi minimal Rp1.'}</span>
                                {p.se.price_per_vote && <span className="text-xs text-rose-600">{p.se.price_per_vote}</span>}
                            </label>
                            <label className="block"><span className={lbl}>Min. vote per transaksi</span>{num('min_votes', 1)}
                                {p.se.min_votes && <span className="text-xs text-rose-600">{p.se.min_votes}</span>}
                            </label>
                        </div>
                    </section>

                    <section className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h2 className="mr-auto px-1 text-sm font-semibold">Gift power-up ({p.gifts.length})</h2>
                            <button type="button" onClick={p.onNewG} className={'flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white dark:bg-indigo-500 ' + PRESS}><Plus className="size-4" /> Tambah</button>
                        </div>
                        <p className={'px-1 text-[11px] leading-snug ' + MUTED}>Paket vote siap pilih. Gift tersimpan langsung, tanpa tombol Simpan pengaturan.</p>
                        {p.gifts.length === 0 ? (
                            <div className={'rounded-2xl px-4 py-8 text-center text-[13px] ' + FIELD + ' ' + MUTED}>Belum ada gift. Tambahkan paket seperti +10, +50, atau +100 vote.</div>
                        ) : (
                            <div className={GROUP}>
                                {p.gifts.map((g) => (
                                    <div key={g.id} className={'flex items-center gap-2.5 px-3 py-2 ' + (g.active ? '' : 'opacity-60')}>
                                        <span className={'flex size-10 shrink-0 items-center justify-center rounded-xl text-2xl ' + FIELD}>{g.emoji}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm leading-tight font-semibold">{g.name}</span>
                                            <span className={'block text-[11px] ' + MUTED}>+{g.votes} vote · {rp(g.price)}</span>
                                        </span>
                                        <span className="flex shrink-0 gap-1">
                                            <button type="button" onClick={() => p.onToggleG(g)} className={'h-10 rounded-full px-2.5 text-[11px] font-medium ' + FIELD + ' ' + PRESS}>{g.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                                            <button type="button" onClick={() => p.onEditG(g)} className={'h-10 rounded-full px-2.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 ' + FIELD + ' ' + PRESS}>Ubah</button>
                                            <button type="button" aria-label="Hapus" onClick={() => p.onDelG(g)} className={delBtn}><Trash2 className="size-4" /></button>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {p.tab === 'pesan' && (
                <section className="space-y-2">
                    <h2 className="px-1 text-sm font-semibold">Pesan dukungan dan efek suara</h2>
                    <div className={GROUP + ' divide-y divide-slate-900/[0.07] dark:divide-white/10'}>
                        <Row title="Aktifkan pesan dukungan" desc="Pembeli boleh menulis pesan singkat di daftar dukungan langsung."><Sw on={d.message_enabled} label="Pesan dukungan" onChange={(v) => p.setD('message_enabled', v)} /></Row>
                        <Row title="Batas karakter pesan" desc="Antara 1 sampai 200 karakter.">
                            <input type="number" inputMode="numeric" min={1} max={200} disabled={!d.message_enabled} value={d.message_max} onChange={(e) => p.setD('message_max', e.target.value)} className={'h-10 w-20 shrink-0 rounded-xl px-2 text-center text-base outline-none disabled:opacity-50 ' + FIELD} />
                        </Row>
                        <Row title="Minimal vote agar pesan dibacakan suara" desc="Pesan dibacakan hanya jika nilainya sebesar ini atau lebih. Isi 0 untuk mematikan suara.">
                            <input type="number" inputMode="numeric" min={0} value={d.sound_min_votes} onChange={(e) => p.setD('sound_min_votes', e.target.value)} className={'h-10 w-20 shrink-0 rounded-xl px-2 text-center text-base outline-none ' + FIELD} />
                        </Row>
                    </div>
                    {(p.se.message_max || p.se.sound_min_votes) && <p className="px-1 text-xs text-rose-600">{p.se.message_max ?? p.se.sound_min_votes}</p>}
                </section>
            )}

            {p.tab === 'tampilan' && (
                <section className="space-y-2">
                    <h2 className="px-1 text-sm font-semibold">Tampilan publik</h2>
                    <div className={GROUP + ' divide-y divide-slate-900/[0.07] dark:divide-white/10'}>
                        <Row title="Tampilkan nama pengirim" desc="Jika dimatikan: pengirim tampil sebagai Anonim."><Sw on={d.show_sender} label="Nama pengirim" onChange={(v) => p.setD('show_sender', v)} /></Row>
                        <Row title="Tampilkan peringkat" desc="Penonton bisa melihat urutan peserta."><Sw on={d.show_ranking} label="Peringkat" onChange={(v) => p.setD('show_ranking', v)} /></Row>
                        <Row title="Tampilkan jumlah vote" desc="Jika dimatikan: hanya peringkat yang terlihat."><Sw on={d.show_votes} label="Jumlah vote" onChange={(v) => p.setD('show_votes', v)} /></Row>
                    </div>
                    {p.preview}
                </section>
            )}

            {p.tab !== 'peserta' && (
                <section className={'flex items-center gap-3 rounded-2xl p-3 ' + CARD}>
                    <p className={'min-w-0 flex-1 text-[11px] font-medium ' + (p.dirty ? 'text-amber-700 dark:text-amber-300' : MUTED)}>{p.dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua pengaturan tersimpan.'}</p>
                    <button type="button" onClick={p.onSave} disabled={!p.dirty || !p.valid || p.saving} className={'h-10 shrink-0 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-indigo-500 ' + PRESS}>{p.saving ? 'Menyimpan...' : 'Simpan'}</button>
                </section>
            )}
        </div>
    );
}
