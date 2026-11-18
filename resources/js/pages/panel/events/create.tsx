import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, CornerDownRight, Loader2, MapPin, Pencil, Phone, Tag, Ticket, Users, type LucideIcon } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import UserLayout from '@/components/user/user-layout';

type Pkg = {
    id: number;
    slug: string;
    name: string;
    event_type: string;
    is_series?: boolean;
    max_participant_categories: number | null;
    can_ticket: boolean;
    can_team: boolean;
    price_label: string;
    description: string | null;
    payment_type: string;
    price: number | null;
    included_sub_events: number;
    extra_sub_event_price: number | null;
    assessment_addon_price: number | null;
    judge_addon_price: number | null;
    has_judging: boolean;
    features: string[];
};
type Detail = {
    title: string; category: string; location: string; starts_at: string; ends_at: string;
    description: string; poster: File | null; juknis: File | null;
    participant_quota: string; participant_categories: { name: string; quota: string; competition_name: string; min_age: string; max_age: string; requirements: string; prizes: { rank: string; prize: string }[] }[]; competition_type: string; team_size: string; team_slots: string[]; team_per_row: string; team_leaders: string; registration_method: string; registration_fee: string; bank_name: string; bank_account_number: string; bank_account_name: string; ticket_types: TicketType[];
    contact_name: string; contact_phone: string; contact_email: string; contact_position: string;
};
type Props = { institution: { name: string }; packages: Pkg[]; categories: Record<string, string>; selected_package_id: number | null };
type Errs = Record<string, string>;
type Bounds = { min: string; max: string };

const input =
    'h-12 w-full rounded-xl border border-slate-200 bg-white/90 px-4 text-[15px] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-indigo-500/20';
const label = 'mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200';
const card = 'rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60';
const box = 'rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5';
const help = 'mt-1.5 text-xs text-slate-500 dark:text-slate-400';
const fmt = (d: string) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');
const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');

type TicketType = { name: string; price: string; quota: string; valid_from: string; valid_until: string; max_per_order: string };
const newTicket = (): TicketType => ({ name: 'Reguler', price: '', quota: '', valid_from: '', valid_until: '', max_per_order: '10' });

const todayStr = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };
const saleStart = (end: string) => (end && todayStr() > end ? end : todayStr());

const blank = (): Detail => ({
    title: '', category: '', location: '', starts_at: '', ends_at: '', description: '', poster: null, juknis: null,
    participant_quota: '', participant_categories: [], competition_type: '', team_size: '', team_slots: [], team_per_row: '3', team_leaders: '1', registration_method: '', registration_fee: '', bank_name: '', bank_account_number: '', bank_account_name: '', ticket_types: [],
    contact_name: '', contact_phone: '', contact_email: '', contact_position: '',
});
const blanks = (n: number) => Array.from({ length: n }, blank);
const isSeriesPkg = (p: Pkg) => p.is_series === true || p.event_type === 'series';
const initialSubs = (p: Pkg | null | undefined) => (p && isSeriesPkg(p) ? blanks(Math.max(1, p.included_sub_events)) : []);
const canAddon = (p: Pkg) => p.assessment_addon_price !== null && !p.has_judging;
const canJudge = (_p: Pkg) => false; // juri digabung ke add-on penilaian juri
const hasOptions = (p: Pkg) => p.extra_sub_event_price !== null || canAddon(p) || canJudge(p);
const maxCats = (p?: Pkg) => p?.max_participant_categories ?? 100;

const freeEvents = (p: Pkg) => p.included_sub_events + (isSeriesPkg(p) ? 0 : 1);

function cost(p: Pkg, subCount: number, addon: boolean, judge: boolean) {
    const base = p.payment_type === 'upfront' ? (p.price ?? 0) : 0;
    const extra = subCount === 0 ? 0 : Math.max(0, subCount - freeEvents(p));
    const sub = p.extra_sub_event_price ? extra * p.extra_sub_event_price : 0;
    const ad = addon && canAddon(p) ? (p.assessment_addon_price ?? 0) : 0;
    const aj = judge && canJudge(p) ? (p.judge_addon_price ?? 0) : 0;
    return { base, extra, sub, ad, aj, total: base + sub + ad + aj };
}

/* ---------- validasi di browser (server tetap memeriksa ulang) ---------- */
const vUtama = (d: Detail): Errs => {
    const e: Errs = {};
    if (!d.title.trim()) e.title = 'Nama event wajib diisi.';
    if (!d.starts_at) e.starts_at = 'Tanggal mulai wajib diisi.';
    if (!d.ends_at) e.ends_at = 'Tanggal selesai wajib diisi.';
    else if (d.starts_at && d.ends_at < d.starts_at) e.ends_at = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    return e;
};
const vInfo = (d: Detail, pre: string, b?: Bounds): Errs => {
    const e: Errs = {};
    if (!d.title.trim()) e[pre + 'title'] = 'Nama event wajib diisi.';
    if (!d.category) e[pre + 'category'] = 'Pilih kategori event.';
    if (!d.location.trim()) e[pre + 'location'] = 'Lokasi wajib diisi.';
    if (!d.starts_at) e[pre + 'starts_at'] = 'Tanggal mulai wajib diisi.';
    else if (b && d.starts_at < b.min) e[pre + 'starts_at'] = 'Tidak boleh sebelum event utama dimulai.';
    if (!d.ends_at) e[pre + 'ends_at'] = 'Tanggal selesai wajib diisi.';
    else if (d.starts_at && d.ends_at < d.starts_at) e[pre + 'ends_at'] = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
    else if (b && d.ends_at > b.max) e[pre + 'ends_at'] = 'Tidak boleh melewati event utama selesai.';
    return e;
};
const isComp = (c?: string) => ['perlombaan', 'olahraga'].includes(c ?? '');
const newCat = (name: string) => ({
    name, quota: '', competition_name: '', min_age: '', max_age: '', requirements: '',
    prizes: [{ rank: 'Juara 1', prize: '' }, { rank: 'Juara 2', prize: '' }, { rank: 'Juara 3', prize: '' }],
});
const vPeserta = (d: Detail, pre: string): Errs => {
    const e: Errs = {};
    if (d.participant_categories.length < 1) e[pre + 'participant_categories'] = 'Pilih minimal 1 kategori peserta.';
    d.participant_categories.forEach((c, i) => {
        if (!/^\d+$/.test(c.quota) || Number(c.quota) < 1) e[`${pre}participant_categories.${i}.quota`] = 'Isi kuota (minimal 1).';
        if (isComp(d.category)) {
            if (!(c.competition_name ?? '').trim()) e[`${pre}participant_categories.${i}.competition_name`] = 'Isi nama perlombaan/pertandingan.';
            if (c.min_age && c.max_age && Number(c.max_age) < Number(c.min_age)) e[`${pre}participant_categories.${i}.max_age`] = 'Usia maksimal tidak boleh lebih kecil dari usia minimal.';
        }
    });
    if (isComp(d.category)) {
        if (!d.competition_type) e[pre + 'competition_type'] = 'Pilih perorangan atau tim.';
        if (d.competition_type === 'team' && (!/^\d+$/.test(d.team_size) || Number(d.team_size) < 2)) e[pre + 'team_size'] = 'Isi jumlah peserta per tim (minimal 2).';
    }
    if (isComp(d.category) && d.competition_type === 'team') {
        if (!(Number(d.team_per_row) >= 1)) e[pre + 'team_per_row'] = 'Isi peserta per baris (minimal 1).';
        if (d.team_leaders === '' || Number(d.team_leaders) >= Number(d.team_size)) e[pre + 'team_leaders'] = 'Jumlah kotak ketua harus lebih kecil dari jumlah peserta per tim.';
    }
    if (!d.registration_method) e[pre + 'registration_method'] = 'Pilih metode pendaftaran.';
    if (d.registration_method === 'ticket') {
        if (d.ticket_types.length === 0) e[pre + 'ticket_types'] = 'Aktifkan pendaftaran tiket: tambahkan minimal satu jenis tiket.';
        d.ticket_types.forEach((t, i) => {
            const k = pre + `ticket_types.${i}.`;
            if (!t.name.trim()) e[k + 'name'] = 'Nama tiket wajib diisi.';
            if (t.price === '') e[k + 'price'] = 'Harga tiket wajib diisi (isi 0 jika gratis).';
            if (!t.quota || Number(t.quota) < 1) e[k + 'quota'] = 'Kuota tiket minimal 1.';
            if (!t.valid_from) e[k + 'valid_from'] = 'Tanggal mulai berlaku wajib diisi.';
            if (!t.valid_until) e[k + 'valid_until'] = 'Tanggal akhir berlaku wajib diisi.';
            else if (t.valid_from && t.valid_until < t.valid_from) e[k + 'valid_until'] = 'Tanggal akhir tidak boleh sebelum tanggal mulai.';
            if (!t.max_per_order || Number(t.max_per_order) < 1 || Number(t.max_per_order) > 10) e[k + 'max_per_order'] = 'Maksimal per pesanan 1 sampai 10.';
        });
    }
    if (d.registration_fee && !/^\d+$/.test(d.registration_fee)) e[pre + 'registration_fee'] = 'Biaya pendaftaran harus berupa angka.';
    if (d.registration_method === 'transfer_manual') {
        if (!d.bank_name.trim()) e[pre + 'bank_name'] = 'Nama bank wajib diisi.';
        if (!/^[0-9 -]{5,}$/.test(d.bank_account_number.trim())) e[pre + 'bank_account_number'] = 'Isi nomor rekening yang valid.';
        if (!d.bank_account_name.trim()) e[pre + 'bank_account_name'] = 'Nama pemilik rekening wajib diisi.';
    }
    return e;
};
const regKey = /(registration_method|registration_fee|ticket_types|bank_)/;
const vDaftar = (d: Detail & { subs: Detail[] }): Errs => {
    const e: Errs = {};
    if (!d.registration_method) { e.registration_method = 'Pilih cara pendaftaran peserta untuk rangkaian ini.'; return e; }
    d.subs.forEach((s, i) => {
        const x = vPeserta({ ...s, registration_method: d.registration_method }, `subs.${i}.`);
        Object.entries(x).forEach(([k, v]) => { if (regKey.test(k) && !/valid_(from|until)$/.test(k)) e[k] = v; });
    });
    return e;
};
const vPj = (d: Detail, pre: string): Errs => {
    const e: Errs = {};
    if (!d.contact_name.trim()) e[pre + 'contact_name'] = 'Nama penanggung jawab wajib diisi.';
    if (!d.contact_phone.trim()) e[pre + 'contact_phone'] = 'Nomor kontak wajib diisi.';
    if (d.contact_email && !/^\S+@\S+\.\S+$/.test(d.contact_email)) e[pre + 'contact_email'] = 'Format email tidak valid.';
    return e;
};

/* ---------- komponen bagian form ---------- */
const capFirst = (v: string) => v.replace(/^(\s*)(\p{Ll})/u, (_m, a: string, b: string) => a + b.toUpperCase());
const capSentences = (v: string) => v.replace(/(^\s*|[.!?]\s+|\n\s*)(\p{Ll})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
function capInput(e: { target: HTMLInputElement | HTMLTextAreaElement }, apply: (v: string) => void, sentences = false) {
    const el = e.target;
    const pos = el.selectionStart;
    const v = sentences ? capSentences(el.value) : capFirst(el.value);
    apply(v);
    if (v !== el.value && pos !== null) {
        requestAnimationFrame(() => { try { el.setSelectionRange(pos, pos); } catch { /* abaikan */ } });
    }
}

const Err = ({ m }: { m?: string }) => (m ? <p className="mt-1.5 text-sm text-rose-500">{m}</p> : null);

type Sec = { d: Detail; set: (p: Partial<Detail>) => void; pre: string; err: (k: string) => string | undefined };

function FormSect({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-extrabold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{n}</span>
                <div>
                    <h3 className="text-sm font-bold">{title}</h3>
                    {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

function PosterInput({ file, onChange, error }: { file: File | null; onChange: (f: File | null) => void; error?: string }) {
    const [url, setUrl] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    useEffect(() => {
        if (!file) { setUrl(null); return; }
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);
    const pick = (f: File | null) => {
        if (f && f.size > 4 * 1024 * 1024) {
            setLocalError('Ukuran poster maksimal 4 MB.');
            onChange(null);
            return;
        }
        setLocalError(null);
        onChange(f);
    };
    return (
        <div>
            <label className={label}>Poster (4:5, maks. 4 MB)</label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex aspect-[4/5] w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-indigo-900 via-blue-700 to-purple-600 text-xs text-white/70">
                    {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : '4:5'}
                </div>
                <label className="flex min-h-[8rem] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white/70 p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50/60 sm:h-[200px] dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => { pick(e.target.files?.[0] ?? null); e.target.value = ''; }} />
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </span>
                    <span className="block max-w-full truncate text-sm font-bold">{file ? file.name : 'Pilih poster'}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{file ? 'Klik untuk mengganti' : 'JPG, PNG, atau WEBP · rasio 4:5'}</span>
                    {file && (
                        <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); setLocalError(null); }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
                            Hapus
                        </button>
                    )}
                </label>
            </div>
            <Err m={localError ?? error} />
        </div>
    );
}

function JuknisInput({ file, onChange, error }: { file: File | null; onChange: (f: File | null) => void; error?: string }) {
    const [localError, setLocalError] = useState<string | null>(null);
    const pick = (f: File | null) => {
        if (f && f.size > 5 * 1024 * 1024) {
            setLocalError('Ukuran file maksimal 5 MB.');
            onChange(null);
            return;
        }
        setLocalError(null);
        onChange(f);
    };
    const size = file ? (file.size >= 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`) : '';
    return (
        <div>
            <label className={label}>Juknis (opsional)</label>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-white/70 p-4 transition hover:border-indigo-400 hover:bg-indigo-50/60 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10">
                <input type="file" accept="application/pdf" className="hidden"
                    onChange={(e) => { pick(e.target.files?.[0] ?? null); e.target.value = ''; }} />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-white">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M9 13h6M9 17h6" />
                    </svg>
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{file ? file.name : 'Pilih file PDF juknis'}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{file ? size : 'Petunjuk teknis · PDF · maks. 5 MB'}</span>
                </span>
                {file ? (
                    <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
                        Hapus
                    </button>
                ) : (
                    <span className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 dark:bg-indigo-500/20 dark:text-white">Pilih File</span>
                )}
            </label>
            <Err m={localError ?? error} />
        </div>
    );
}

function Schedule({ d, set, pre, err, bounds, withJuknis }: Sec & { bounds?: Bounds; withJuknis?: boolean }) {
    return (
        <>
            <FormSect n={2} title="Waktu & deskripsi" hint="Kapan event berlangsung dan apa yang akan dilakukan.">
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={label}>Tanggal mulai *</label>
                            <input type="date" className={input} min={bounds?.min} max={bounds?.max} value={d.starts_at} onChange={(e) => set({ starts_at: e.target.value })} />
                            <Err m={err(pre + 'starts_at')} />
                        </div>
                        <div>
                            <label className={label}>Tanggal selesai *</label>
                            <input type="date" className={input} min={d.starts_at || bounds?.min} max={bounds?.max} value={d.ends_at} onChange={(e) => set({ ends_at: e.target.value })} />
                            <Err m={err(pre + 'ends_at')} />
                        </div>
                    </div>
                    <div>
                        <label className={label}>Deskripsi</label>
                        <textarea rows={6} maxLength={2000} value={d.description} onChange={(e) => capInput(e, (v) => set({ description: v }), true)}
                            placeholder="Ceritakan tentang event ini: tujuan, susunan acara, dan siapa yang cocok ikut."
                            className="w-full rounded-xl border border-slate-200 bg-white/90 p-4 text-[15px] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800" />
                        <p className={help}>{d.description.length}/2000 karakter</p>
                        <Err m={err(pre + 'description')} />
                    </div>
                </div>
            </FormSect>
            <FormSect n={3} title="Media & dokumen" hint="Poster tampil di halaman event. Juknis bersifat opsional.">
                <div className="space-y-5">
                    <PosterInput file={d.poster} onChange={(f) => set({ poster: f })} error={err(pre + 'poster')} />
                    {withJuknis && <JuknisInput file={d.juknis} onChange={(f) => set({ juknis: f })} error={err(pre + 'juknis')} />}
                </div>
            </FormSect>
        </>
    );
}

function UtamaSection(props: Sec) {
    const { d, set, pre, err } = props;
    return (
        <div className="space-y-5">
            <div>
                <label className={label}>Nama event utama *</label>
                <input className={input} value={d.title} onChange={(e) => capInput(e, (v) => set({ title: v }))} placeholder="Contoh: Festival Batam Bernyanyi 2026" />
                <Err m={err(pre + 'title')} />
            </div>
            <Schedule {...props} />
        </div>
    );
}

function InfoSection(props: Sec & { categories: Record<string, string>; bounds?: Bounds }) {
    const { d, set, pre, err, categories } = props;
    return (
        <div className="space-y-5">
            <FormSect n={1} title="Detail event" hint="Nama, kategori, dan tempat pelaksanaan.">
                <div className="space-y-4">
                    <div>
                        <label className={label}>Nama event *</label>
                        <input className={input} value={d.title} onChange={(e) => capInput(e, (v) => set({ title: v }))} placeholder="Contoh: Seminar Kewirausahaan" />
                        <Err m={err(pre + 'title')} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className={label}>Kategori event *</label>
                            <select className={input} value={d.category} onChange={(e) => set({ category: e.target.value })}>
                                <option value="">Pilih kategori</option>
                                {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                            <Err m={err(pre + 'category')} />
                        </div>
                        <div>
                            <label className={label}>Lokasi *</label>
                            <input className={input} value={d.location} onChange={(e) => set({ location: e.target.value })} maxLength={150} placeholder="Contoh: Universitas Batam, Jl. Uniba No. 5, Batam" />
                            <Err m={err(pre + 'location')} />
                        </div>
                    </div>
                    <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />Tulis nama tempat, alamat, dan kota agar peserta mudah menemukan lokasi lewat Google Maps.</p>
                </div>
            </FormSect>
            <Schedule {...props} withJuknis />
        </div>
    );
}

const PRESET_CATEGORIES = ['TK', 'SD', 'SMP', 'SMA', 'Mahasiswa', 'Umum'];
const totalQuota = (d: Detail) => d.participant_categories.reduce((a, c) => a + (parseInt(c.quota, 10) || 0), 0);

type CatRow = Detail['participant_categories'][number];

function CompFields({ c, i, patch, err, pre, kind }: { c: CatRow; i: number; patch: (i: number, p: Partial<CatRow>) => void; err: (k: string) => any; pre: string; kind: string }) {
    const inp = 'h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800';
    const prizes = c.prizes ?? [];
    const setPrize = (j: number, p: Partial<{ rank: string; prize: string }>) => patch(i, { prizes: prizes.map((x, k) => (k === j ? { ...x, ...p } : x)) });
    const base = `${pre}participant_categories.${i}.`;
    return (
        <div className="w-full basis-full space-y-4 border-t border-slate-200/70 pt-4 dark:border-white/10">
            <div>
                <label className={label}>Nama {kind} *</label>
                <input className={inp} maxLength={120} value={c.competition_name ?? ''} onChange={(e) => patch(i, { competition_name: e.target.value })}
                    placeholder={kind === 'pertandingan' ? 'Contoh: Futsal Putra' : 'Contoh: Lomba Menyanyi Solo'} />
                <Err m={err(base + 'competition_name')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={label}>Usia minimal (opsional)</label>
                    <input inputMode="numeric" className={inp} value={c.min_age ?? ''} onChange={(e) => patch(i, { min_age: e.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="Tanpa batas" />
                    <Err m={err(base + 'min_age')} />
                </div>
                <div>
                    <label className={label}>Usia maksimal (opsional)</label>
                    <input inputMode="numeric" className={inp} value={c.max_age ?? ''} onChange={(e) => patch(i, { max_age: e.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="Tanpa batas" />
                    <Err m={err(base + 'max_age')} />
                </div>
            </div>
            <div>
                <label className={label}>Syarat tambahan (opsional)</label>
                <textarea rows={3} maxLength={1000} className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800"
                    value={c.requirements ?? ''} onChange={(e) => patch(i, { requirements: e.target.value })}
                    placeholder="Contoh: Peserta membawa kartu pelajar, karya orisinal, dan belum pernah dipublikasikan." />
                <Err m={err(base + 'requirements')} />
            </div>
            <div>
                <b className="block text-[15px]">Hadiah &amp; Juara <span className="font-normal text-slate-500">(opsional)</span></b>
                <p className={help}>Isi hadiah kalau ada. Kalau dikosongkan, halaman event hanya menampilkan peringkat juara.</p>
                <div className="mt-3 space-y-2.5">
                    {prizes.map((p, j) => (
                        <div key={j} className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_2.75rem]">
                            <input className={`${inp} w-full min-w-0`} maxLength={40} value={p.rank} onChange={(e) => setPrize(j, { rank: e.target.value })} placeholder="Juara 1" />
                            <input className={`${inp} order-3 col-span-2 w-full min-w-0 sm:order-none sm:col-span-1`} maxLength={150} value={p.prize} onChange={(e) => setPrize(j, { prize: e.target.value })} placeholder="Contoh: Rp1.500.000 + piala + sertifikat" />
                            <button type="button" aria-label="Hapus hadiah" onClick={() => patch(i, { prizes: prizes.filter((_, k) => k !== j) })}
                                className="order-2 h-11 w-11 shrink-0 rounded-xl border border-slate-200 text-slate-500 sm:order-none hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10">×</button>
                        </div>
                    ))}
                </div>
                {prizes.length < 10 && (
                    <button type="button" onClick={() => patch(i, { prizes: [...prizes, { rank: `Juara ${prizes.length + 1}`, prize: '' }] })}
                        className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 dark:border-white/10 dark:bg-white/10 dark:text-cyan-200">+ Tambah penghargaan</button>
                )}
            </div>
        </div>
    );
}

function PesertaSection({ d, set, pre, err, max, canTicket = true, canTeam = true, ticketOnly = false, fixedMethod, hideRegistration = false }: Sec & { max: number; canTicket?: boolean; canTeam?: boolean; ticketOnly?: boolean; fixedMethod?: string; hideRegistration?: boolean }) {
    const [draft, setDraft] = useState('');
    const list = d.participant_categories;
    const idx = (v: string) => list.findIndex((x) => x.name.toLowerCase() === v.toLowerCase());
    const full = list.length >= max;
    const comp = isComp(d.category);
    const isTeam = comp && d.competition_type === 'team';
    const unit = isTeam ? 'tim' : 'orang';
    const teamN = Math.min(parseInt(d.team_size, 10) || 0, 100);
    const perRow = Math.max(parseInt(d.team_per_row, 10) || 1, 1);
    const leaderN = Math.min(parseInt(d.team_leaders, 10) || 0, teamN);
    const memberN = Math.max(teamN - leaderN, 0);
    const buildSlots = (n: number, l: number) => Array.from({ length: n }, (_, i) => (i < l ? (l > 1 ? `Ketua ${i + 1}` : 'Ketua') : `Peserta ${i - l + 1}`));
    const updateTeam = (p: { size?: string; row?: string; lead?: string }) => {
        const size = p.size ?? d.team_size;
        const row = p.row ?? d.team_per_row;
        const lead = p.lead ?? d.team_leaders;
        const n = Math.min(parseInt(size, 10) || 0, 100);
        const l = Math.min(parseInt(lead, 10) || 0, n);
        set({ team_size: n ? String(n) : '', team_per_row: row, team_leaders: lead, team_slots: buildSlots(n, l) });
    };
    const add = (v: string) => {
        const name = v.trim();
        if (!name || full || idx(name) >= 0) return;
        set({ participant_categories: [...list, newCat(name)] });
    };
    const remove = (i: number) => set({ participant_categories: list.filter((_, j) => j !== i) });
    const setQuota = (i: number, v: string) => set({ participant_categories: list.map((c, j) => (j === i ? { ...c, quota: v.replace(/\D/g, '') } : c)) });
    const patch = (i: number, p: Partial<(typeof list)[number]>) => set({ participant_categories: list.map((c, j) => (j === i ? { ...c, ...p } : c)) });
    const toggle = (v: string) => { const i = idx(v); if (i >= 0) remove(i); else add(v); };
    const options = [...PRESET_CATEGORIES, ...list.map((x) => x.name).filter((n) => !PRESET_CATEGORIES.some((p) => p.toLowerCase() === n.toLowerCase()))];
    return (
        <div className="space-y-5">
            {comp && (
                <div className={`${box} space-y-5 p-5`}>
                    <div>
                        <b className="block text-[15px]">Jenis perlombaan *</b>
                        <p className={help}>Pilih apakah peserta mendaftar sendiri atau sebagai tim.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[['individual', 'Perorangan', 'Peserta mendaftar sendiri-sendiri.'], ...(canTeam ? [['team', 'Tim', 'Peserta mendaftar sebagai satu tim.']] : [])].map(([v, t, sub]) => (
                            <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${d.competition_type === v ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}>
                                <input type="radio" className="mt-1 accent-indigo-700" checked={d.competition_type === v} onChange={() => set({ competition_type: v })} />
                                <span><b className="block text-sm">{t}</b><span className="text-xs text-slate-500 dark:text-slate-400">{sub}</span></span>
                            </label>
                        ))}
                    </div>
                    <Err m={err(pre + 'competition_type')} />
                    {!canTeam && <p className={help}>Perlombaan tim hanya tersedia di paket dengan fitur Manajemen Tim.</p>}

                    {isTeam && (
                        <div className="space-y-4 border-t border-slate-200/70 pt-4 dark:border-white/10">
                            <div className="grid gap-4 sm:grid-cols-3">
                                {([['team_size', 'Jumlah peserta per tim', 'Contoh: 6'], ['team_per_row', 'Peserta per baris', 'Contoh: 3'], ['team_leaders', 'Kotak ketua', 'Contoh: 1']] as const).map(([k, t, ph]) => (
                                    <div key={k}>
                                        <label className={label}>{t} *</label>
                                        <input inputMode="numeric" className="h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-[15px] outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800"
                                            value={d[k]} placeholder={ph}
                                            onChange={(ev) => { const v = ev.target.value.replace(/\D/g, ''); updateTeam(k === 'team_size' ? { size: v } : k === 'team_per_row' ? { row: v } : { lead: v }); }} />
                                        <Err m={err(pre + k)} />
                                    </div>
                                ))}
                            </div>
                            <p className={help}>Jumlah peserta per tim sudah termasuk kotak ketua.</p>
                            <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 text-center dark:border-white/10 dark:bg-white/5">
                                <b className="block text-sm">Preview Barisan</b>
                                {teamN > 0 ? (
                                    <>
                                        <div className="my-4 flex items-start justify-center gap-6">
                                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${perRow}, 2.75rem)` }}>
                                                {Array.from({ length: memberN }, (_, n) => (
                                                    <div key={n} title={`Peserta ${n + 1}`} className="h-11 w-11 rounded-xl bg-sky-400" />
                                                ))}
                                            </div>
                                            {leaderN > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {Array.from({ length: leaderN }, (_, n) => (
                                                        <div key={n} title="Ketua" className="h-11 w-11 rounded-xl bg-rose-500" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{memberN} peserta (biru) · {leaderN} ketua (merah) · {perRow} per baris</p>
                                    </>
                                ) : (
                                    <p className={`${help} mt-3`}>Isi jumlah peserta per tim untuk melihat susunan barisan.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={`${box} space-y-4 p-5`}>
                <div>
                    <b className="block text-[15px]">Kategori peserta *</b>
                    <p className={help}>
                        {max <= 10 ? `Paket ini maksimal ${max} kategori (${list.length} dipilih).` : 'Pilih kategori yang sesuai. Setiap kategori punya kuota sendiri dan jumlahnya tidak dibatasi.'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                    {options.map((o) => {
                        const on = idx(o) >= 0;
                        return (
                            <button key={o} type="button" onClick={() => toggle(o)} disabled={!on && full}
                                className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}>
                                {on && <Check className="h-4 w-4 shrink-0" />}
                                <span className="truncate">{o}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-2 border-t border-slate-200/70 pt-4 dark:border-white/10">
                    <input className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/90 px-3.5 text-sm outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800"
                        value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={60} disabled={full}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(draft); setDraft(''); } }}
                        placeholder="Tidak ada di daftar? Ketik nama kategori lalu tekan Tambah" />
                    <button type="button" onClick={() => { add(draft); setDraft(''); }} disabled={full}
                        className="h-11 shrink-0 rounded-xl bg-slate-800 px-6 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-white/20">Tambah</button>
                </div>
                {list.length === 0 && <Err m={err(pre + 'participant_categories')} />}
            </div>

            {list.length > 0 && (
                <div className={`${box} divide-y divide-slate-200/70 dark:divide-white/10`}>
                    {list.map((c, i) => (
                        <div key={c.name} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <span className="min-w-[6rem] flex-1 font-bold">{c.name}</span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <input inputMode="numeric" className="h-11 w-32 rounded-xl border border-slate-200 bg-white/90 px-3 text-right text-[15px] outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800"
                                        value={c.quota} onChange={(e) => setQuota(i, e.target.value)} placeholder="Kuota" />
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>
                                </div>
                                <Err m={err(`${pre}participant_categories.${i}.quota`)} />
                            </div>
                            <button type="button" onClick={() => remove(i)} className="text-sm font-bold text-rose-500">Hapus</button>
                            {comp && <CompFields c={c} i={i} patch={patch} err={err} pre={pre} kind={d.category === 'olahraga' ? 'pertandingan' : 'perlombaan'} />}
                        </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 font-extrabold">
                        <span>Total kuota event</span>
                        <span className="text-indigo-700 dark:text-indigo-300">{totalQuota(d).toLocaleString('id-ID')} {unit}</span>
                    </div>
                </div>
            )}

            {!hideRegistration && (
            <>
            {ticketOnly ? (
                <div className={`${box} p-4 text-sm`}><b className="block">Pendaftaran peserta: Tiket</b><span className="text-xs text-slate-500 dark:text-slate-400">Paket ini otomatis mencatat pendaftaran lewat tiket, tanpa transfer manual.</span></div>
            ) : (
            <div>
                <>
                <div className={`${box} mb-6 p-5`}>
                    <b className="block text-[15px]">Biaya pendaftaran</b>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Biaya per peserta. Kosongkan atau isi 0 kalau pendaftaran gratis.</span>
                    <div className="mt-3 flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 dark:border-white/10 dark:bg-slate-950/60">
                        <span className="border-r border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">Rp</span>
                        <input
                            inputMode="numeric"
                            value={d.registration_fee ? new Intl.NumberFormat('id-ID').format(Number(d.registration_fee)) : ''}
                            onChange={(e) => set({ registration_fee: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                            placeholder="0"
                            className="w-full bg-transparent px-4 py-3 text-sm outline-none dark:text-white"
                        />
                    </div>
                    <Err m={err(pre + 'registration_fee')} />
                </div>
                {fixedMethod ? (<div className={`${box} mb-3 p-4 text-sm`}><b className="block">Pendaftaran peserta: {fixedMethod === 'ticket' ? 'Tiket' : 'Transfer Manual'}</b><span className="text-xs text-slate-500 dark:text-slate-400">Mengikuti event utama. Satu rangkaian memakai satu metode pendaftaran.</span></div>) : (<label className={label}>Pendaftaran peserta *</label>)}</>
                <div className={fixedMethod ? 'hidden' : 'grid gap-3 sm:grid-cols-2'}>
                    {[['transfer_manual', 'Transfer Manual', 'Peserta transfer, panitia memverifikasi pembayaran.'], ...(canTicket ? [['ticket', 'Tiket', 'Peserta membeli tiket lewat platform.']] : [])].map(([v, t, sub]) => (
                        <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${d.registration_method === v ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}>
                            <input type="radio" className="mt-1 accent-indigo-700" checked={d.registration_method === v} onChange={() => set({ registration_method: v, ticket_types: v === 'ticket' && d.ticket_types.length === 0 ? [newTicket()] : d.ticket_types })} />
                            <span><b className="block text-sm">{t}</b><span className="text-xs text-slate-500 dark:text-slate-400">{sub}</span></span>
                        </label>
                    ))}
                </div>
                <Err m={err(pre + 'registration_method')} />
                {!canTicket && <p className={help}>Pendaftaran lewat tiket hanya tersedia di paket dengan fitur Tiket.</p>}
            </div>
            )}

            {d.registration_method === 'ticket' && (
                <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-white/10 dark:bg-indigo-500/10">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Aktifkan Pendaftaran Tiket <span className="text-red-500">*</span></h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Wajib diisi. Tanpa jenis tiket, pembeli tidak bisa mendaftar.</p>
                    </div>
                    {d.ticket_types.map((t, i) => {
                        const up = (patch: Partial<TicketType>) => set({ ticket_types: d.ticket_types.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                        const k = pre + `ticket_types.${i}.`;
                        const inp = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5';
                        return (
                            <div key={i} className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500">Jenis tiket #{i + 1}</span>
                                    {d.ticket_types.length > 1 && (
                                        <button type="button" onClick={() => set({ ticket_types: d.ticket_types.filter((_, j) => j !== i) })} className="text-xs font-bold text-red-600">Hapus</button>
                                    )}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold">Nama tiket *</label>
                                        <input className={inp} value={t.name} maxLength={60} placeholder="Contoh: Reguler, VIP" onChange={(e) => up({ name: e.target.value })} />
                                        <Err m={err(k + 'name')} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold">Harga (Rp) *</label>
                                        <input className={inp} inputMode="numeric" placeholder="0 jika gratis"
                                            value={t.price ? new Intl.NumberFormat('id-ID').format(Number(t.price)) : t.price}
                                            onChange={(e) => up({ price: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
                                        <Err m={err(k + 'price')} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold">Kuota tiket *</label>
                                        <input className={inp} inputMode="numeric" value={t.quota} onChange={(e) => up({ quota: e.target.value.replace(/\D/g, '').slice(0, 7) })} />
                                        <Err m={err(k + 'quota')} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold">Maksimal per pesanan (1-10) *</label>
                                        <input className={inp} inputMode="numeric" value={t.max_per_order} onChange={(e) => up({ max_per_order: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
                                        <Err m={err(k + 'max_per_order')} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold">Berlaku mulai *</label>
                                        <input type="date" className={inp} value={t.valid_from} onChange={(e) => up({ valid_from: e.target.value })} />
                                        <Err m={err(k + 'valid_from')} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold">Berlaku sampai *</label>
                                        <input type="date" className={inp} value={t.valid_until} onChange={(e) => up({ valid_until: e.target.value })} />
                                        <Err m={err(k + 'valid_until')} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <Err m={err(pre + 'ticket_types')} />
                    {d.ticket_types.length < 10 && (
                        <button type="button" onClick={() => set({ ticket_types: [...d.ticket_types, newTicket()] })} className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-200">+ Tambah jenis tiket</button>
                    )}
                </div>
            )}

            {d.registration_method === 'transfer_manual' && (
                <div className={`${box} space-y-4 p-4`}>
                    <div>
                        <b className="block text-sm">Rekening tujuan pembayaran</b>
                        <p className={help}>Peserta akan diminta transfer ke rekening ini, lalu panitia memverifikasi pembayarannya.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {([['bank_name', 'Nama bank', 'Contoh: BCA, Mandiri, BRI'], ['bank_account_number', 'Nomor rekening', 'Hanya angka'], ['bank_account_name', 'Atas nama', 'Nama pemilik rekening']] as const).map(([k, t, ph]) => (
                            <div key={k}>
                                <label className={label}>{t} *</label>
                                <input className="h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-[15px] outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800"
                                    inputMode={k === 'bank_account_number' ? 'numeric' : 'text'} maxLength={k === 'bank_account_number' ? 40 : 100}
                                    value={d[k]} placeholder={ph}
                                    onChange={(ev) => set({ [k]: k === 'bank_account_number' ? ev.target.value.replace(/[^0-9 -]/g, '') : ev.target.value })} />
                                <Err m={err(pre + k)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </>
            )}
        </div>
    );
}

function RegistrasiBlocks({ d, set, pre, err }: Sec) {
    const inp = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5';
    if (d.registration_method === 'ticket') {
        return (
            <div className="space-y-4">
                {d.ticket_types.map((t, i) => {
                    const up = (patch: Partial<TicketType>) => set({ ticket_types: d.ticket_types.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                    const k = pre + `ticket_types.${i}.`;
                    return (
                        <div key={i} className="grid gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 sm:grid-cols-2 dark:border-white/10 dark:bg-white/5">
                            <div>
                                <label className="mb-1 block text-xs font-bold">Nama tiket *</label>
                                <input className={inp} value={t.name} maxLength={60} placeholder="Contoh: Reguler, VIP" onChange={(e) => up({ name: e.target.value })} />
                                <Err m={err(k + 'name')} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold">Harga (Rp) *</label>
                                <input className={inp} inputMode="numeric" placeholder="0 jika gratis"
                                    value={t.price ? new Intl.NumberFormat('id-ID').format(Number(t.price)) : t.price}
                                    onChange={(e) => up({ price: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
                                <Err m={err(k + 'price')} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold">Kuota tiket *</label>
                                <input className={inp} inputMode="numeric" value={t.quota} onChange={(e) => up({ quota: e.target.value.replace(/\D/g, '').slice(0, 7) })} />
                                <Err m={err(k + 'quota')} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold">Maksimal per pesanan (1-10) *</label>
                                <input className={inp} inputMode="numeric" value={t.max_per_order} onChange={(e) => up({ max_per_order: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
                                <Err m={err(k + 'max_per_order')} />
                            </div>
                            <p className="text-xs text-slate-500 sm:col-span-2 dark:text-slate-400">Penjualan dibuka setelah event disetujui admin dan ditutup saat event selesai.</p>
                        </div>
                    );
                })}
                <Err m={err(pre + 'ticket_types')} />
            </div>
        );
    }
    if (d.registration_method === 'transfer_manual') {
        return (
            <div className="space-y-4">
                <div>
                    <label className={label}>Biaya pendaftaran per peserta</label>
                    <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-indigo-500 dark:border-white/10 dark:bg-slate-950/60">
                        <span className="border-r border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">Rp</span>
                        <input inputMode="numeric" placeholder="0 jika gratis" className="w-full bg-transparent px-4 py-3 text-sm outline-none dark:text-white"
                            value={d.registration_fee ? new Intl.NumberFormat('id-ID').format(Number(d.registration_fee)) : ''}
                            onChange={(e) => set({ registration_fee: e.target.value.replace(/\D/g, '').slice(0, 9) })} />
                    </div>
                    <Err m={err(pre + 'registration_fee')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {([['bank_name', 'Nama bank', 'Contoh: BCA, Mandiri, BRI'], ['bank_account_number', 'Nomor rekening', 'Hanya angka'], ['bank_account_name', 'Atas nama', 'Nama pemilik rekening']] as const).map(([k, t, ph]) => (
                        <div key={k}>
                            <label className={label}>{t} *</label>
                            <input className="h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3 text-[15px] outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800"
                                inputMode={k === 'bank_account_number' ? 'numeric' : 'text'} maxLength={k === 'bank_account_number' ? 40 : 100}
                                value={d[k]} placeholder={ph}
                                onChange={(ev) => set({ [k]: k === 'bank_account_number' ? ev.target.value.replace(/[^0-9 -]/g, '') : ev.target.value })} />
                            <Err m={err(pre + k)} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}

function PjSection({ d, set, pre, err }: Sec) {
    return (
        <div className="grid gap-5 sm:grid-cols-2">
            <div>
                <label className={label}>Nama penanggung jawab *</label>
                <input className={input} value={d.contact_name} onChange={(e) => set({ contact_name: e.target.value })} />
                <Err m={err(pre + 'contact_name')} />
            </div>
            <div>
                <label className={label}>Nomor kontak *</label>
                <input className={input} inputMode="tel" value={d.contact_phone} onChange={(e) => set({ contact_phone: e.target.value })} placeholder="08xxxxxxxxxx" />
                <Err m={err(pre + 'contact_phone')} />
            </div>
            <div>
                <label className={label}>Email (opsional)</label>
                <input type="email" className={input} value={d.contact_email} onChange={(e) => set({ contact_email: e.target.value })} />
                <Err m={err(pre + 'contact_email')} />
            </div>
            <div>
                <label className={label}>Jabatan (opsional)</label>
                <input className={input} value={d.contact_position} onChange={(e) => set({ contact_position: e.target.value })} placeholder="Contoh: Ketua Panitia" />
                <Err m={err(pre + 'contact_position')} />
            </div>
        </div>
    );
}

function PosterThumb({ file }: { file: File | null }) {
    const [url, setUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!file) { setUrl(null); return; }
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);
    return (
        <div className="w-full shrink-0 self-start overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-900 via-blue-700 to-purple-600 shadow-md sm:w-44">
            {url ? <img src={url} alt="Poster" className="block h-auto w-full" /> : <div className="flex aspect-[4/5] items-center justify-center text-xs font-semibold text-white/70">Tanpa poster</div>}
        </div>
    );
}

const Fact = ({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) => (
    <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200"><Icon className="h-4 w-4" /></span>
        <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
            <div className="break-words text-[15px] font-semibold">{children}</div>
        </div>
    </div>
);

function ReviewCard({ d, categories, badge, main, onEdit }: { d: Detail; categories: Record<string, string>; badge: string; main?: boolean; onEdit: () => void }) {
    const contact = [d.contact_name, d.contact_phone].filter(Boolean).join(' · ');
    const extra = [d.contact_position, d.contact_email].filter(Boolean).join(' · ');
    return (
        <div className={`${box} p-5`}>
            <div className="flex flex-col gap-5 sm:flex-row">
                <PosterThumb file={d.poster} />
                <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{badge}</span>
                            <h3 className="mt-2 break-words text-2xl font-extrabold">{d.title || '-'}</h3>
                        </div>
                        <button type="button" onClick={onEdit} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
                            <Pencil className="h-3.5 w-3.5" /> Ubah
                        </button>
                    </div>
                    {d.description && <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{d.description}</p>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Fact icon={CalendarDays} title="Tanggal">{fmt(d.starts_at)} – {fmt(d.ends_at)}</Fact>
                        {!main && <Fact icon={MapPin} title="Lokasi">{d.location || '-'}</Fact>}
                        {!main && <Fact icon={Tag} title="Kategori event">{categories[d.category] ?? '-'}</Fact>}
                        {!main && <Fact icon={Users} title="Kuota peserta">{totalQuota(d) || '-'} orang</Fact>}
                        {main && <Fact icon={Ticket} title="Pendaftaran peserta (semua event)">{d.registration_method === 'ticket' ? 'Tiket' : 'Transfer Manual'}</Fact>}
                        {!main && <Fact icon={Ticket} title="Pendaftaran">{d.registration_method === 'ticket' ? 'Tiket' : 'Transfer Manual'}</Fact>}
                        {!main && d.registration_method === 'ticket' && <Fact icon={Ticket} title="Tiket">{d.ticket_types.map((t) => `${t.name}: ${Number(t.price) > 0 ? rp(Number(t.price)) : 'Gratis'}`).join(' · ') || '-'}</Fact>}
                        {!main && d.registration_method !== 'ticket' && <Fact icon={Ticket} title="Biaya pendaftaran">{Number(d.registration_fee) > 0 ? `Rp${new Intl.NumberFormat('id-ID').format(Number(d.registration_fee))}` : 'Gratis'}</Fact>}
                        {!main && (
                            <Fact icon={Phone} title="Penanggung jawab">
                                {contact || '-'}
                                {extra && <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">{extra}</span>}
                            </Fact>
                        )}
                    </div>
                    {!main && d.participant_categories.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">Kategori peserta</p>
                            <div className="flex flex-wrap gap-2">
                                {d.participant_categories.map((c) => <span key={c.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-white/10">{c.competition_name ? `${c.competition_name} (${c.name})` : c.name} · {c.quota}</span>)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- halaman ---------- *//* ---------- halaman ---------- */
export default function CreateEvent({ packages, categories, selected_package_id, payment_methods = [], platform_bank = null }: Props & { payment_methods?: string[]; platform_bank?: { bank_name: string; bank_account_number: string; bank_account_holder: string } | null }) {
    const initial = packages.find((p) => p.id === selected_package_id) ?? null;
    const [step, setStep] = useState(initial && !hasOptions(initial) ? 1 : 0);
    const [local, setLocal] = useState<Errs>({});

    const { data, setData, post, processing, errors, transform } = useForm<Detail & { package_id: number | ''; assessment_addon: boolean; judge_addon: boolean; payment_method: string; payment_proof: File | null; subs: Detail[] }>({
        ...blank(),
        package_id: initial?.id ?? '',
        assessment_addon: false,
        judge_addon: false,
        payment_method: '',
        payment_proof: null,
        subs: initialSubs(initial),
    });
    const payMethod = payment_methods.length === 1 ? payment_methods[0] : data.payment_method;

    const pkg = packages.find((p) => p.id === data.package_id);
    const series = !!pkg && (isSeriesPkg(pkg) || data.subs.length > 0);
    const keys = series
        ? ['paket', 'utama', ...data.subs.map((_, i) => `sub:${i}`), 'daftar', 'tinjau']
        : ['paket', 'info', 'peserta', 'pj', 'tinjau'];
    const titleOf = (k: string) =>
        k.startsWith('sub:') ? `Event ${Number(k.slice(4)) + 1}` :
        ({ paket: 'Paket', info: 'Informasi Event', peserta: 'Peserta & Pendaftaran', pj: 'Penanggung Jawab', utama: 'Event Utama', daftar: 'Pendaftaran', tinjau: 'Tinjau' } as Record<string, string>)[k];
    const cur = keys[Math.min(step, keys.length - 1)];
    const last = step >= keys.length - 1;
    useEffect(() => {
        if (pkg?.payment_type !== 'revenue_share') return;
        if (data.registration_method !== 'ticket' || data.subs.some((x) => x.registration_method !== 'ticket')) {
            setData((d) => ({ ...d, registration_method: 'ticket', subs: d.subs.map((x) => ({ ...x, registration_method: 'ticket' })) }));
        }
    }, [pkg?.id, data.subs.length, data.registration_method]);
    useEffect(() => {
        if (!series) return;
        const m = data.registration_method;
        if (!m || data.subs.every((x) => x.registration_method === m && (m !== 'ticket' || x.ticket_types.length > 0))) return;
        setData((d) => ({
            ...d,
            subs: d.subs.map((x) => ({
                ...x,
                registration_method: m,
                ticket_types: m === 'ticket' && x.ticket_types.length === 0 ? [{ ...newTicket(), name: 'Pendaftaran', max_per_order: '1', quota: totalQuota(x) > 0 ? String(totalQuota(x)) : '', valid_from: saleStart(x.ends_at), valid_until: x.ends_at }] : x.ticket_types,
            })),
        }));
    }, [series, data.registration_method, data.subs.length]);
    const c = pkg ? cost(pkg, data.subs.length, data.assessment_addon, data.judge_addon) : null;
    const cap = maxCats(pkg);
    const bounds: Bounds = { min: data.starts_at, max: data.ends_at };

    const all: Errs = { ...(errors as Errs), ...local };
    const err = (k: string) => all[k] ?? all[Object.keys(all).find((x) => x.startsWith(k + '.')) ?? ''];

    const setMain = (patch: Partial<Detail>) => setData((d) => ({ ...d, ...patch }));
    const setSub = (i: number, patch: Partial<Detail>) => setData('subs', data.subs.map((s, j) => (j === i ? { ...s, ...patch } : s)));

    const choosePackage = (p: Pkg) => setData((d) => ({
        ...d,
        package_id: p.id,
        subs: initialSubs(p),
        assessment_addon: false,
        judge_addon: false,
        participant_categories: d.participant_categories.slice(0, maxCats(p)),
        registration_method: d.registration_method === 'ticket' && !p.can_ticket ? '' : d.registration_method,
        competition_type: d.competition_type === 'team' && !p.can_team ? '' : d.competition_type,
    }));
    // Isian = jumlah event TAMBAHAN di luar yang sudah termasuk paket.
    const setExtra = (raw: number) => {
        if (!pkg) return;
        const e = Math.max(0, Math.min(49, Number.isFinite(raw) ? raw : 0));
        const total = freeEvents(pkg) + e;
        const n = isSeriesPkg(pkg) ? total : e === 0 ? 0 : total;
        if (n < data.subs.length) {
            const lost = data.subs.slice(n).some((x) => x.title.trim());
            if (lost && !confirm('Event yang sudah terisi akan dihapus. Lanjutkan?')) return;
            setData('subs', data.subs.slice(0, n));
        } else {
            setData('subs', [...data.subs, ...blanks(n - data.subs.length)]);
        }
    };

    const validate = (key: string) => {
        let e: Errs = {};
        if (key === 'paket') { if (!data.package_id) e.package_id = 'Pilih paket event.'; }
        else if (key === 'utama') e = vUtama(data);
        else if (key === 'info') e = vInfo(data, '');
        else if (key === 'peserta') e = vPeserta(data, '');
        else if (key === 'pj') e = vPj(data, '');
        else if (key === 'daftar') e = vDaftar(data);
        else if (key.startsWith('sub:')) {
            const i = Number(key.slice(4));
            const s = data.subs[i];
            const pre = `subs.${i}.`;
            const pe = Object.fromEntries(Object.entries(vPeserta(s, pre)).filter(([k]) => !regKey.test(k)));
            e = { ...vInfo(s, pre, bounds), ...pe, ...vPj(s, pre) };
        }
        setLocal(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (!validate(cur)) return;
        if (cur === 'utama') {
            setData('subs', data.subs.map((s) => ({ ...s, starts_at: s.starts_at || data.starts_at, ends_at: s.ends_at || data.ends_at })));
        }
        setStep(step + 1);
    };
    const back = () => { setLocal({}); setStep(step - 1); };

    const stepOfField = (k: string) => {
        if (k === 'subs' || k === 'package_id' || k === 'assessment_addon' || k === 'judge_addon') return 'paket';
        const m = k.match(/^subs\.(\d+)\.(.*)$/);
        if (m) return regKey.test(m[2]) ? 'daftar' : `sub:${m[1]}`;
        if (series && k === 'registration_method') return 'daftar';
        if (series) return ['title', 'description', 'starts_at', 'ends_at', 'poster', 'juknis'].includes(k) ? 'utama' : 'tinjau';
        if (['title', 'category', 'location', 'starts_at', 'ends_at', 'description', 'poster', 'juknis'].includes(k)) return 'info';
        if (k.startsWith('participant_') || k === 'registration_method' || k === 'registration_fee' || k.includes('ticket_types')) return 'peserta';
        if (k.startsWith('contact_')) return 'pj';
        return 'tinjau';
    };
    const submit = () => {
        setLocal({});
        transform((d) => ({
            ...d,
            payment_method: payMethod,
            subs: d.subs.map((x) => (x.registration_method === 'ticket' ? { ...x, ticket_types: x.ticket_types.map((t) => ({ ...t, valid_from: saleStart(x.ends_at), valid_until: x.ends_at })) } : x)),
        }));
        post('/panel/ajukan', {
            forceFormData: true,
            onError: (errs) => {
                const idx = Math.min(...Object.keys(errs).map((k) => { const i = keys.indexOf(stepOfField(k)); return i < 0 ? keys.length - 1 : i; }));
                setStep(idx);
            },
        });
    };

    const h2 = 'text-2xl font-extrabold';
    const h3 = 'mb-4 text-lg font-extrabold';

    return (
        <UserLayout title="Ajukan Event" hasPanel>
            <section className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-extrabold">
                    Ajukan <span className="title-gradient">{series ? 'Rangkaian Event' : 'Event Baru'}</span>
                </h1>
                <Link href="/panel" className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-white dark:bg-white/10">
                    <ArrowLeft className="h-4 w-4" /> Panel Lembaga
                </Link>
            </section>

            <ol className="flex items-center py-1">
                {keys.map((k, i) => (
                    <li key={k} className="flex flex-1 items-center last:flex-none">
                        <span className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/80 text-slate-400 dark:bg-white/10'}`}>
                                {i < step ? <Check className="h-5 w-5" /> : i + 1}
                            </span>
                            <span className={`hidden text-sm font-bold lg:block ${i === step ? '' : 'text-slate-400'}`}>{titleOf(k)}</span>
                        </span>
                        {i < keys.length - 1 && <span className={`mx-3 h-1 flex-1 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`} />}
                    </li>
                ))}
            </ol>

            <div className={`${card} w-full`} key={cur}>
                {cur === 'paket' && (
                    <div className="space-y-5">
                        <div>
                            <h2 className={h2}>Pilih paket</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Paket menentukan fitur dan biaya event Anda. Fitur dan bagi hasil dikunci saat event diajukan.</p>
                        </div>
                        {packages.length === 0 && <p className="text-sm text-slate-500">Belum ada paket tersedia. Hubungi admin.</p>}
                        {/* pkg-card-v2 */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {packages.map((p, pi) => {
                                const on = data.package_id === p.id;
                                const th = PKG_THEMES[pi % PKG_THEMES.length];
                                const m = p.price_label.match(/^(Bayar di muka|Bagi hasil)\s+(.*)$/i);
                                const big = m ? m[2] : p.price_label;
                                const small = m ? m[1] : '';
                                const kind = isSeriesPkg(p) ? 'Rangkaian event' : p.extra_sub_event_price !== null ? 'Tunggal / rangkaian' : 'Event tunggal';
                                return (
                                    <label key={p.id} className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border-2 p-4 transition ${on ? th.on : th.off}`}>
                                        <input type="radio" name="package" checked={on} onChange={() => choosePackage(p)} className="sr-only" />
                                        <span className={`absolute inset-x-0 top-0 h-1.5 ${th.bar}`} />
                                        <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent dark:border-white/20'}`}>
                                            <Check className="h-4 w-4" />
                                        </span>
                                        <span className={`mt-1 w-fit rounded-full px-3 py-1 text-[11px] font-bold ${th.chip}`}>{kind}</span>
                                        <span className="mt-2 text-base font-bold">{p.name}</span>
                                        <span className="mt-2 block min-h-[3rem]">
                                            {small && <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">{small}</span>}
                                            <span className={`block text-2xl font-extrabold leading-tight ${th.price}`}>{big}</span>
                                        </span>
                                        {p.description && <span className="mt-1 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">{p.description}</span>}
                                        <span className="mt-auto pt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-300">{p.features.length} fitur</span>
                                    </label>
                                );
                            })}
                        </div>
                        <PackageCompare packages={packages} selectedId={data.package_id} />
                        <Err m={err('package_id')} />

                        {pkg && c && (
                            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-400/30 dark:bg-indigo-500/10">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Paket dipilih</p>
                                        <p className="text-2xl font-extrabold">{pkg.name}</p>
                                        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                            {data.subs.length === 0 ? 'Event tunggal' : `Rangkaian ${data.subs.length} event`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Biaya di muka</p>
                                        <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
                                            {pkg.payment_type === 'revenue_share' ? 'Rp0' : c.total === 0 ? 'Gratis' : rp(c.total)}
                                        </p>
                                        {pkg.payment_type === 'revenue_share' && <p className="text-xs text-slate-500">{pkg.price_label}</p>}
                                    </div>
                                </div>

                                <ul className="mt-4 grid gap-x-6 gap-y-2 border-t border-indigo-200 pt-4 sm:grid-cols-2 dark:border-white/10">
                                    {pkg.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}</li>))}
                                </ul>
                                {pkg.extra_sub_event_price !== null && (
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-indigo-200 pt-4 dark:border-white/10">
                                        <div>
                                            <p className="font-bold">Tambah event?</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {freeEvents(pkg)} event sudah termasuk. Tiap tambahan {rp(pkg.extra_sub_event_price)}.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button type="button" aria-label="Kurangi" disabled={c.extra === 0}
                                                onClick={() => setExtra(c.extra - 1)}
                                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-bold disabled:opacity-40 dark:border-white/20 dark:bg-slate-800">−</button>
                                            <span className="w-10 text-center text-2xl font-extrabold">{c.extra}</span>
                                            <button type="button" aria-label="Tambah" disabled={c.extra >= 49}
                                                onClick={() => setExtra(c.extra + 1)}
                                                className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white disabled:opacity-40">+</button>
                                        </div>
                                    </div>
                                )}

                                {canAddon(pkg) && (
                                    <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-indigo-200 pt-4 text-sm dark:border-white/10">
                                        <input type="checkbox" checked={data.assessment_addon} onChange={(e) => setData('assessment_addon', e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-700" />
                                        <span>
                                            <b>Tambah penilaian juri</b> (+{rp(pkg.assessment_addon_price ?? 0)})
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">Sistem penilaian dan akun juri untuk memberi nilai pada peserta.</span>
                                        </span>
                                    </label>
                                )}

                                {canJudge(pkg) && (
                                    <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-indigo-200 pt-4 text-sm dark:border-white/10">
                                        <input type="checkbox" checked={data.judge_addon} onChange={(e) => setData('judge_addon', e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-700" />
                                        <span>
                                            <b>Tambah juri</b> (+{rp(pkg.judge_addon_price ?? 0)})
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">Akun juri untuk memberi nilai pada peserta.</span>
                                        </span>
                                    </label>
                                )}
                                <Err m={err('subs')} />
                            </div>
                        )}

                        
                    </div>
                )}

                {cur === 'utama' && (
                    <div className="space-y-4">
                        <div>
                            <h2 className={h2}>Event utama</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ini judul dan periode pembungkus rangkaian, bukan event tersendiri. Kategori, lokasi, kuota, dan penanggung jawab diisi pada tiap event di langkah berikutnya. Cara pendaftaran dan tiket diatur di langkah terakhir, setelah semua event terisi.</p>
                        </div>
                        <UtamaSection d={data} set={setMain} pre="" err={err} />
                    </div>
                )}

                {cur === 'info' && (
                    <div className="space-y-4">
                        <h2 className={h2}>Informasi Event</h2>
                        <InfoSection d={data} set={setMain} pre="" err={err} categories={categories} />
                    </div>
                )}
                {cur === 'peserta' && (
                    <div className="space-y-4">
                        <h2 className={h2}>Peserta & Pendaftaran</h2>
                        <PesertaSection d={data} set={setMain} pre="" err={err} max={cap} ticketOnly={!!pkg && pkg.payment_type === 'revenue_share'} canTicket={pkg ? pkg.can_ticket : true} canTeam={pkg ? pkg.can_team : true} />
                    </div>
                )}
                {cur === 'pj' && (
                    <div className="space-y-4">
                        <h2 className={h2}>Penanggung Jawab</h2>
                        <PjSection d={data} set={setMain} pre="" err={err} />
                    </div>
                )}

                {cur.startsWith('sub:') && (() => {
                    const i = Number(cur.slice(4));
                    const s = data.subs[i];
                    const pre = `subs.${i}.`;
                    const set = (p: Partial<Detail>) => setSub(i, p);
                    return (
                        <div className="space-y-7">
                            <div>
                                <h2 className={h2}>Event {i + 1} dari {data.subs.length}</h2>
                                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <CornerDownRight className="h-4 w-4" /> Bagian dari {data.title || 'event utama'} ({fmt(data.starts_at)} – {fmt(data.ends_at)})
                                    {pkg && i >= freeEvents(pkg) && pkg.extra_sub_event_price !== null && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">+{rp(pkg.extra_sub_event_price)}</span>
                                    )}
                                </p>
                            </div>
                            <div><h3 className={h3}>Informasi Event</h3><InfoSection d={s} set={set} pre={pre} err={err} categories={categories} bounds={bounds} /></div>
                            <div className="border-t border-slate-200/70 pt-6 dark:border-white/10"><h3 className={h3}>Peserta & Pendaftaran</h3><PesertaSection d={s} set={set} pre={pre} err={err} max={cap} hideRegistration ticketOnly={!!pkg && pkg.payment_type === 'revenue_share'} canTicket={pkg ? pkg.can_ticket : true} canTeam={pkg ? pkg.can_team : true} /></div>
                            <div className="border-t border-slate-200/70 pt-6 dark:border-white/10"><h3 className={h3}>Penanggung Jawab</h3><PjSection d={s} set={set} pre={pre} err={err} /></div>
                        </div>
                    );
                })()}

                {cur === 'daftar' && (() => {
                    const forced = !!pkg && pkg.payment_type === 'revenue_share';
                    const canTicket = pkg ? pkg.can_ticket : true;
                    const opts: [string, string, string][] = [
                        ['transfer_manual', 'Transfer Manual', 'Peserta transfer, panitia memverifikasi pembayaran.'],
                        ...(canTicket ? [['ticket', 'Tiket', 'Peserta membeli tiket lewat platform.'] as [string, string, string]] : []),
                    ];
                    return (
                        <div className="space-y-6">
                            <div>
                                <h2 className={h2}>Pendaftaran peserta</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Semua event sudah terisi. Pilih cara peserta mendaftar. Pilihan ini berlaku untuk seluruh rangkaian dan tidak bisa dicampur.</p>
                            </div>
                            {forced ? (
                                <div className={`${box} p-4 text-sm`}><b className="block">Tiket</b><span className="text-xs text-slate-500 dark:text-slate-400">Paket ini otomatis mencatat pendaftaran lewat tiket.</span></div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {opts.map(([v, t, sub]) => (
                                        <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${data.registration_method === v ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20' : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}>
                                            <input type="radio" className="mt-1 accent-indigo-700" checked={data.registration_method === v} onChange={() => setMain({ registration_method: v })} />
                                            <span><b className="block text-sm">{t}</b><span className="text-xs text-slate-500 dark:text-slate-400">{sub}</span></span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            <Err m={err('registration_method')} />
                            {!canTicket && <p className={help}>Pendaftaran lewat tiket hanya tersedia di paket dengan fitur Tiket.</p>}
                            {data.registration_method === 'ticket' && (
                                <p className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-sm dark:border-white/10 dark:bg-indigo-500/10">Form tiket sudah dibuatkan otomatis untuk tiap event di bawah. Tinggal isi harga dan kuotanya.</p>
                            )}
                            {data.registration_method && data.subs.map((s, i) => (
                                <div key={i} className={`${box} space-y-4 p-5`}>
                                    <h3 className="text-lg font-extrabold">Event {i + 1}: {s.title || '-'}</h3>
                                    <RegistrasiBlocks d={s} set={(p) => setSub(i, p)} pre={`subs.${i}.`} err={err} />
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {cur === 'tinjau' && pkg && c && (
                    <div className="space-y-6">
                        <h2 className={h2}>Tinjau pengajuan</h2>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-600/20">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Paket</p>
                                <p className="text-xl font-extrabold">{pkg.name}</p>
                                <p className="text-sm text-white/80">{pkg.price_label}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Jenis</p>
                                <p className="text-lg font-extrabold">{series ? `Rangkaian ${data.subs.length} event` : 'Event tunggal'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Total di muka</p>
                                <p className="text-xl font-extrabold">{pkg.payment_type === 'revenue_share' || c.total === 0 ? 'Gratis' : rp(c.total)}</p>
                            </div>
                        </div>

                        {series ? (
                            <>
                                <ReviewCard d={data} categories={categories} badge="Event utama" main onEdit={() => setStep(keys.indexOf('utama'))} />
                                <div>
                                    <p className="mb-3 text-lg font-extrabold">Daftar event ({data.subs.length})</p>
                                    <div className="space-y-4 border-l-2 border-indigo-200 pl-5 dark:border-indigo-400/30">
                                        {data.subs.map((s, i) => (
                                            <ReviewCard key={i} d={s} categories={categories} badge={`Event ${i + 1}`} onEdit={() => setStep(keys.indexOf(`sub:${i}`))} />
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <ReviewCard d={data} categories={categories} badge="Event" onEdit={() => setStep(keys.indexOf('info'))} />
                        )}

                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 text-[15px] dark:border-indigo-400/30 dark:bg-indigo-500/10">
                            <p className="mb-2 font-extrabold">Rincian biaya</p>
                            {pkg.payment_type === 'revenue_share' ? (
                                <p>Tanpa biaya di muka. {pkg.price_label} dari penjualan.</p>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex justify-between"><span>Paket {pkg.name}{pkg.included_sub_events > 0 ? ` (termasuk ${pkg.included_sub_events} event)` : ''}</span><span>{c.base === 0 ? 'Gratis' : rp(c.base)}</span></div>
                                    {c.extra > 0 && <div className="flex justify-between"><span>Event tambahan ({c.extra} × {rp(pkg.extra_sub_event_price ?? 0)})</span><span>{rp(c.sub)}</span></div>}
                                    {c.ad > 0 && <div className="flex justify-between"><span>Add-on penilaian juri</span><span>{rp(c.ad)}</span></div>}
                                    {c.aj > 0 && <div className="flex justify-between"><span>Add-on juri</span><span>{rp(c.aj)}</span></div>}
                                    <div className="mt-2 flex justify-between border-t border-indigo-200 pt-2 font-extrabold dark:border-white/10"><span>Total di muka</span><span>{c.total === 0 ? 'Gratis' : rp(c.total)}</span></div>
                                </div>
                            )}
                        </div>
                        {pkg.payment_type !== 'revenue_share' && c.total > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 text-[15px] dark:border-white/10 dark:bg-white/5">
                                <p className="mb-3 font-extrabold">Metode pembayaran</p>
                                <div className={`grid gap-3 ${payment_methods.length > 1 ? 'md:grid-cols-2' : ''}`}>
                                    {payment_methods.map((m) => {
                                        const on = payMethod === m;
                                        return (
                                            <button
                                                type="button"
                                                key={m}
                                                onClick={() => setData('payment_method', m)}
                                                className={`rounded-xl border p-4 text-left transition ${on ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400/40 dark:bg-indigo-500/10' : 'border-slate-200 hover:border-indigo-300 dark:border-white/10'}`}
                                            >
                                                <b className="block">{m === 'midtrans' ? 'Midtrans (online)' : 'Transfer manual'}</b>
                                                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                                                    {m === 'midtrans' ? 'Bayar online, pembayaran terkonfirmasi otomatis.' : 'Transfer ke rekening SIMPLE, pembayaran diverifikasi admin.'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {payMethod === 'transfer_manual' && platform_bank && (
                                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
                                        <p className="font-bold">Rekening tujuan</p>
                                        <p>{platform_bank.bank_name} - {platform_bank.bank_account_number}</p>
                                        <p className="text-slate-500 dark:text-slate-400">a.n. {platform_bank.bank_account_holder}</p>
                                    </div>
                                )}
                                {payMethod === 'transfer_manual' && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-bold">Bukti pembayaran *</label>
                                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Transfer sesuai total di muka, lalu unggah bukti transfer (foto otomatis dikompres, PDF maks. 2 MB).</p>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                                            onChange={(e) => setData('payment_proof', e.target.files?.[0] ?? null)}
                                            className="block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-white/10 dark:bg-white/5"
                                        />
                                        {data.payment_proof && <p className="mt-1 text-xs text-emerald-600">Terpilih: {data.payment_proof.name}</p>}
                                        {errors.payment_proof && <p className="mt-2 text-sm text-rose-500">{errors.payment_proof}</p>}
                                    </div>
                                )}
                                {errors.payment_method && <p className="mt-3 text-sm text-rose-500">{errors.payment_method}</p>}
                            </div>
                        )}
                        <p className="text-sm text-slate-500 dark:text-slate-400">Semua pengajuan akan ditinjau dan dikonfirmasi admin sebelum event aktif.</p>
                        {Object.keys(errors).length > 0 && <p className="text-sm text-rose-500">Ada isian yang belum sesuai. Silakan periksa langkah yang ditandai.</p>}
                    </div>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-white/10">
                    <button onClick={back} disabled={step === 0} className="flex items-center gap-2 rounded-xl px-1 py-3 text-sm font-bold text-slate-600 hover:text-indigo-700 disabled:invisible dark:text-slate-300 dark:hover:text-white">
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                    {!last ? (
                        <button onClick={next} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
                            Lanjut <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button onClick={submit} disabled={processing} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-7 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60">
                            {processing && <Loader2 className="h-4 w-4 animate-spin" />} {series ? 'Ajukan Rangkaian' : 'Ajukan Event'}
                        </button>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}


function PackageCompare({ packages, selectedId }: { packages: { id: number | string; name: string; features: string[] }[]; selectedId?: unknown }) {
    const [open, setOpen] = useState(false);
    if (packages.length < 2) return null;
    const norm = (t: string) => t.trim().toLowerCase();
    const rows = Array.from(new Map(packages.flatMap((p) => p.features).map((f) => [norm(f), f.trim()] as const)).values());
    return (
        <div>
            <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300 dark:hover:bg-white/10">
                {open ? 'Sembunyikan perbandingan' : 'Bandingkan semua fitur'}
            </button>
            {open && (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/5">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10">
                                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Fitur</th>
                                {packages.map((p) => (
                                    <th key={p.id} className={`px-4 py-3 text-center text-sm font-bold ${p.id === selectedId ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{p.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((f) => (
                                <tr key={f} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                                    <td className="px-4 py-2.5">{f}</td>
                                    {packages.map((p) => (
                                        <td key={p.id} className={`px-4 py-2.5 text-center ${p.id === selectedId ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : ''}`}>
                                            {p.features.some((x) => norm(x) === norm(f)) ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <span className="text-slate-300 dark:text-white/20">–</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}


const PKG_THEMES = [
    { on: 'border-indigo-500 bg-gradient-to-b from-indigo-100 to-white shadow-lg shadow-indigo-500/20 dark:from-indigo-500/25 dark:to-transparent',
      off: 'border-indigo-200 bg-gradient-to-b from-indigo-50 to-white hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-indigo-400/20 dark:from-indigo-500/10 dark:to-transparent',
      bar: 'bg-gradient-to-r from-indigo-500 to-violet-500', chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200', price: 'text-indigo-700 dark:text-indigo-300' },
    { on: 'border-emerald-500 bg-gradient-to-b from-emerald-100 to-white shadow-lg shadow-emerald-500/20 dark:from-emerald-500/25 dark:to-transparent',
      off: 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-emerald-400/20 dark:from-emerald-500/10 dark:to-transparent',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200', price: 'text-emerald-700 dark:text-emerald-300' },
    { on: 'border-amber-500 bg-gradient-to-b from-amber-100 to-white shadow-lg shadow-amber-500/20 dark:from-amber-500/25 dark:to-transparent',
      off: 'border-amber-200 bg-gradient-to-b from-amber-50 to-white hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-amber-400/20 dark:from-amber-500/10 dark:to-transparent',
      bar: 'bg-gradient-to-r from-amber-400 to-orange-500', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200', price: 'text-amber-700 dark:text-amber-300' },
    { on: 'border-sky-500 bg-gradient-to-b from-sky-100 to-white shadow-lg shadow-sky-500/20 dark:from-sky-500/25 dark:to-transparent',
      off: 'border-sky-200 bg-gradient-to-b from-sky-50 to-white hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md dark:border-sky-400/20 dark:from-sky-500/10 dark:to-transparent',
      bar: 'bg-gradient-to-r from-sky-500 to-blue-500', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200', price: 'text-sky-700 dark:text-sky-300' },
    { on: 'border-rose-500 bg-gradient-to-b from-rose-100 to-white shadow-lg shadow-rose-500/20 dark:from-rose-500/25 dark:to-transparent',
      off: 'border-rose-200 bg-gradient-to-b from-rose-50 to-white hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md dark:border-rose-400/20 dark:from-rose-500/10 dark:to-transparent',
      bar: 'bg-gradient-to-r from-rose-500 to-pink-500', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200', price: 'text-rose-700 dark:text-rose-300' },
];
