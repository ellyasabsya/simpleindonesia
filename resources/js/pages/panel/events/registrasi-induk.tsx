import PanelLayout from '@/components/panel/panel-layout';
import RegistrasiIndukMobile from '@/components/mobile/pages/registrasi-induk-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Download, Layers, Paperclip, ScanLine, Plus, Search, Ticket, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'file';
type Field = { key: string; label: string; type: FieldType; required: boolean; options: string[]; archived?: boolean; stage?: 'register' | 'after' };
type Item = { key?: string; label: string; type: FieldType; required: boolean; optionsText: string; stage: 'register' | 'after' };
type Sub = {
    id: number; title: string; ticket: boolean; fee: number; published: boolean; isTeam: boolean; quota: number | null;
    fields: Field[]; message: string; count: number; summary: { orders: number; sold: number; pending: number };
};
type Row = {
    kind: 'form' | 'tiket'; id: number | null; sub_id: number; sub: string; reg_id: string | null; name: string; email: string; phone: string | null;
    school: string | null; category: string | null; status: string; amount: number; proof: boolean; note: string | null; at: string; followup_done: boolean;
    teams: { name: string; category: string | null }[]; answers: Record<string, unknown>;
    order: string | null; buyer: string | null; type: string | null; code: string | null; contact: string | null; support: string | null;
};
type Props = { subs: Sub[]; rows: Row[] };

const PER_PAGE = 25;
const TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Teks pendek' },
    { value: 'textarea', label: 'Teks panjang' },
    { value: 'number', label: 'Angka' },
    { value: 'select', label: 'Pilihan (dropdown)' },
    { value: 'checkbox', label: 'Pilihan ganda (centang)' },
    { value: 'date', label: 'Tanggal' },
    { value: 'file', label: 'Unggah file / foto' },
];
const STATUS: Record<string, { label: string; style: string }> = {
    menunggu: { label: 'Menunggu verifikasi', style: 'bg-amber-100 text-amber-800' },
    terdaftar: { label: 'Terdaftar', style: 'bg-emerald-100 text-emerald-800' },
    ditolak: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800' },
    batal: { label: 'Dibatalkan', style: 'bg-slate-200 text-slate-700' },
};
const needsOptions = (t: FieldType) => t === 'select' || t === 'checkbox';
const toItems = (fs: Field[]): Item[] =>
    fs.filter((f) => !f.archived).map((f) => ({ key: f.key, label: f.label, type: f.type, required: f.required, optionsText: (f.options ?? []).join('\n'), stage: f.stage === 'after' ? 'after' : 'register' }));
const rupiah = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';
const iconBtn = 'rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10';
const th = 'px-3 py-3';
const pill = 'whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-white/10 dark:text-indigo-200';

export default function RegistrasiInduk({ subs, rows }: Props) {
    const [sub, setSub] = useState('');
    const [tab, setTab] = useState<'data' | 'form'>('data');
    const [q, setQ] = useState('');
    const [st, setSt] = useState('');
    const [tp, setTp] = useState('');
    const [cat, setCat] = useState('');
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<Item[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const phone = usePhone();

    const cur = subs.find((s) => String(s.id) === sub) ?? null;
    const mode: 'all' | 'ticket' | 'form' = !cur ? 'all' : cur.ticket ? 'ticket' : 'form';
    const parentId = usePage().url.match(/\/panel\/event\/(\d+)/)?.[1] ?? '';
    const scanId = cur ? String(cur.id) : parentId;

    const scoped = useMemo(() => rows.filter((r) => !sub || String(r.sub_id) === sub), [rows, sub]);
    const count = (s: string) => scoped.filter((r) => r.status === s).length;
    const open = (rs: Row[]) => rs.filter((r) => r.status !== 'ditolak' && r.status !== 'batal').length;
    const statuses = useMemo(() => Array.from(new Set(scoped.map((r) => r.status))), [scoped]);
    const catLabel = (r: Row) => {
        const c = r.category ?? '';
        if (!c) return '';
        const i = c.lastIndexOf(' - ');
        return r.kind === 'tiket' && i >= 0 ? c.slice(i + 3).trim() : c;
    };
    const cats = useMemo(() => {
        const m = new Map<string, number>();
        scoped.forEach((r) => { const l = catLabel(r); if (l) m.set(l, (m.get(l) ?? 0) + 1); });
        return Array.from(m, ([name, n]) => ({ name, n }));
    }, [scoped]);
    const catSel = cats.some((c) => c.name === cat) ? cat : '';
    const ticketTypes = useMemo(() => Array.from(new Set(scoped.map((r) => r.type).filter(Boolean) as string[])), [scoped]);

    const list = useMemo(() => {
        const k = q.trim().toLowerCase();
        return scoped.filter((r) =>
            (!st || r.status === st) &&
            (!tp || r.type === tp) &&
            (!catSel || catLabel(r) === catSel) &&
            (!k || [r.reg_id ?? '', r.name, r.email, r.phone ?? '', r.school ?? '', r.sub, r.category ?? '', r.buyer ?? '', r.order ?? '', r.code ?? '', ...r.teams.map((t) => t.name)].some((v) => v.toLowerCase().includes(k))),
        );
    }, [scoped, q, st, tp, catSel]);

    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const pg = Math.min(page, pages);
    const view = list.slice((pg - 1) * PER_PAGE, pg * PER_PAGE);
    const from = list.length === 0 ? 0 : (pg - 1) * PER_PAGE + 1;
    const to = Math.min(pg * PER_PAGE, list.length);

    const shown = cur && !cur.ticket && !cur.isTeam ? cur.fields : [];
    const hasAfter = !!cur && cur.fields.some((f) => !f.archived && f.stage === 'after');
    const cell = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v));
    const showAnswer = (r: Row, k: string) => {
        const v = r.answers[k];
        if (v && typeof v === 'object' && !Array.isArray(v) && (v as { file?: boolean }).file) {
            return (
                <a href={`/panel/event/${r.sub_id}/registrasi/berkas/${r.id}/${k}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-700 underline">
                    <Paperclip className="h-3.5 w-3.5" />{(v as { name: string }).name}
                </a>
            );
        }
        return cell(v);
    };

    const chip = (on: boolean) =>
        `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`;

    const pickSub = (v: string) => {
        setSub(v); setSt(''); setTp(''); setQ(''); setPage(1); setTab('data'); setErrors([]); setSaved(false);
        setItems(toItems(subs.find((s) => String(s.id) === v)?.fields ?? []));
    };

    const patch = (i: number, p: Partial<Item>) => { setSaved(false); setItems((a) => a.map((x, j) => (j === i ? { ...x, ...p } : x))); };
    const move = (i: number, d: number) => { setSaved(false); setItems((a) => { const j = i + d; if (j < 0 || j >= a.length) return a; const c = [...a]; [c[i], c[j]] = [c[j], c[i]]; return c; }); };
    const add = () => { setSaved(false); setItems((a) => [...a, { label: '', type: 'text', required: false, optionsText: '', stage: 'register' }]); };
    const remove = (i: number) => { setSaved(false); setItems((a) => a.filter((_, j) => j !== i)); };

    const save = () => {
        if (!cur || cur.ticket) return;
        setErrors([]);
        setSaved(false);
        router.put(
            `/panel/event/${cur.id}/registrasi/form`,
            {
                message: cur.message,
                fields: items.map((f) => ({
                    key: f.key ?? null,
                    stage: f.stage,
                    label: f.label.trim(),
                    type: f.type,
                    required: f.required,
                    options: needsOptions(f.type) ? f.optionsText.split('\n').map((s) => s.trim()).filter(Boolean) : [],
                })),
            },
            {
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: (p) => {
                    const next = (p.props as unknown as Props).subs.find((s) => s.id === cur.id);
                    setItems(toItems(next?.fields ?? []));
                    setSaved(true);
                },
                onError: (e) => setErrors(Object.values(e)),
            },
        );
    };

    const review = (r: Row, status: 'terdaftar' | 'ditolak') => {
        let note: string | null = null;
        if (status === 'ditolak') {
            note = window.prompt('Alasan penolakan (akan terlihat oleh pendaftar):');
            if (note === null) return;
            if (!note.trim()) { window.alert('Alasan penolakan wajib diisi.'); return; }
        }
        router.patch(`/panel/event/${r.sub_id}/registrasi/pendaftar/${r.id}/status`, { status, note }, { preserveScroll: true });
    };

    const stat = (t: string, v: string, s: string) => (
        <div className={`${card} p-5`}>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t}</div>
            <div className="mt-2 text-3xl font-extrabold">{v}</div>
            <div className="mt-1 text-xs text-slate-500">{s}</div>
        </div>
    );
    const badge = (s: string) => {
        const x = STATUS[s] ?? { label: s || '-', style: 'bg-slate-200 text-slate-700' };
        return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${x.style}`}>{x.label}</span>;
    };

    const unpublished = subs.filter((s) => !s.published);

    return (
        <PanelLayout title="Registrasi">
            <div className="space-y-5">
                {phone && (
                    <RegistrasiIndukMobile
                        mode={mode} cur={cur} subs={subs} rows={rows} scoped={scoped} list={list} view={view} scanId={scanId}
                        sub={sub} pickSub={pickSub} tab={tab} setTab={setTab}
                        q={q} setQ={(v) => { setQ(v); setPage(1); }}
                        st={st} setSt={(v) => { setSt(v); setPage(1); }}
                        tp={tp} setTp={(v) => { setTp(v); setPage(1); }}
                        catSel={catSel} setCat={(v) => { setCat(v); setPage(1); }} cats={cats}
                        statuses={statuses} ticketTypes={ticketTypes}
                        pg={pg} pages={pages} setPage={setPage}
                        openAll={open(rows)} openScoped={open(scoped)} menunggu={count('menunggu')} terdaftar={count('terdaftar')}
                        unpublished={unpublished} shown={shown} hasAfter={hasAfter} catLabel={catLabel}
                        answer={showAnswer} review={review}
                        onDelete={(r) => { if (confirm(`Hapus pendaftar ${r.name}? Data dan berkasnya ikut terhapus.`)) router.delete(`/panel/event/${r.sub_id}/registrasi/pendaftar/${r.id}`, { preserveScroll: true }); }}
                    />
                )}
                <div className={phone ? 'hidden' : 'space-y-5'}>
                <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                            {mode === 'ticket' ? <Ticket className="h-6 w-6" /> : <Layers className="h-6 w-6" />}
                        </span>
                        <div>
                            <h2 className="text-xl font-extrabold">
                                {mode === 'all' && 'Registrasi semua sub-event'}
                                {mode === 'ticket' && `Pendaftaran lewat pembelian tiket · ${cur?.title}`}
                                {mode === 'form' && `Pendaftaran transfer manual · ${cur?.title}`}
                            </h2>
                            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                {mode === 'all' && 'Pendaftar dari seluruh sub-event. Pilih satu sub-event di bawah untuk mengelolanya sesuai metode pendaftarannya: tiket atau transfer manual.'}
                                {mode === 'ticket' && 'Pada sub-event ini peserta tidak mengisi formulir. Mereka terdaftar saat membeli tiket, dan setiap pemegang tiket di bawah adalah peserta.'}
                                {mode === 'form' && (cur && cur.fee > 0 ? `Biaya pendaftaran ${rupiah(cur.fee)}. Peserta mengisi formulir dan mengunggah bukti transfer, lalu panitia memverifikasi.` : 'Peserta mengisi formulir pendaftaran, lalu panitia memverifikasi.')}
                            </p>
                            {mode === 'form' && cur && !cur.published && <p className="mt-2 text-xs font-semibold text-amber-700">Sub-event belum terbit, jadi form publik belum bisa dibuka.</p>}
                            {mode === 'all' && unpublished.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">Belum terbit: {unpublished.map((s) => s.title).join(', ')}.</p>}
                        </div>
                    </div>
                    {mode === 'ticket' && cur && (
                        <Link href={`/panel/event/${cur.id}/tiket`} className="rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">Atur jenis & harga tiket</Link>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {mode === 'all' && <>{stat('Pendaftar', String(open(scoped)), 'dari semua sub-event')}{stat('Menunggu verifikasi', String(count('menunggu')), 'perlu ditinjau')}{stat('Terdaftar', String(count('terdaftar')), 'sudah terdaftar')}</>}
                    {mode === 'ticket' && cur && <>{stat('Pesanan', String(cur.summary.orders), 'Total pesanan tiket')}{stat('Tiket terjual', String(cur.summary.sold), 'Pembayaran lunas')}{stat('Menunggu verifikasi', String(cur.summary.pending), 'Belum disetujui admin')}</>}
                    {mode === 'form' && cur && <>{stat(cur.isTeam ? 'Tim terdaftar' : 'Pendaftar', String(cur.count), cur.quota ? `dari kuota ${cur.quota}` : 'tanpa batas kuota')}{stat('Menunggu verifikasi', String(count('menunggu')), 'perlu ditinjau')}{stat('Disetujui', String(count('terdaftar')), 'sudah terdaftar')}</>}
                </div>

                {mode === 'form' && (
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setTab('data')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'data' ? 'bg-indigo-900 text-white' : 'border border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'}`}>Pendaftar ({scoped.length})</button>
                        <button type="button" onClick={() => setTab('form')} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === 'form' ? 'bg-indigo-900 text-white' : 'border border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'}`}>Susun form</button>
                    </div>
                )}

                {(mode !== 'form' || tab === 'data') && (
                    <div className={`${card} overflow-hidden`}>
                        <div className="space-y-4 p-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="mr-auto text-lg font-extrabold">Daftar peserta <span className="text-sm font-semibold text-slate-500">({list.length})</span></h3>
                                <div className="relative min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={mode === 'ticket' ? 'Cari ID, nama, pembeli, kode' : 'Cari ID, nama, sekolah, sub-event'} className={`${field} w-full pl-9`} />
                                </div>
                                {mode === 'ticket' && (
                                    <select value={tp} onChange={(e) => { setTp(e.target.value); setPage(1); }} className={field}>
                                        <option value="">Semua jenis tiket</option>
                                        {ticketTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                )}
                                <select value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }} className={field}>
                                    <option value="">Semua status</option>
                                    {statuses.map((s) => <option key={s} value={s}>{STATUS[s]?.label ?? s}</option>)}
                                </select>
                                {mode === 'form' && cur && (
                                    <a href={`/panel/event/${cur.id}/registrasi/export`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800"><Download className="h-4 w-4" /> Ekspor CSV</a>
                                )}
                                <a href={`/panel/event/${scanId}/checkin`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><ScanLine className="h-4 w-4" /> Buka scanner</a>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => pickSub('')} className={chip(sub === '')}>Semua sub-event · {open(rows)}</button>
                                {subs.map((c) => (
                                    <button key={c.id} type="button" onClick={() => pickSub(String(c.id))} className={chip(sub === String(c.id))}>{c.title} · {c.count}</button>
                                ))}
                            </div>
                            {cats.length > 1 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="mr-1 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Kategori</span>
                                    <button type="button" onClick={() => { setCat(''); setPage(1); }} className={chip(catSel === '')}>Semua kategori · {scoped.length}</button>
                                    {cats.map((c) => (
                                        <button key={c.name} type="button" onClick={() => { setCat(c.name); setPage(1); }} className={chip(catSel === c.name)}>{c.name} · {c.n}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {view.length === 0 ? (
                            <p className="border-t border-slate-200 px-5 py-12 text-center text-sm font-semibold text-slate-500 dark:border-white/10">
                                {rows.length === 0 ? 'Belum ada pendaftar di sub-event mana pun.' : scoped.length === 0 ? (mode === 'ticket' ? 'Belum ada pembelian tiket.' : 'Belum ada pendaftar.') : 'Tidak ada data yang cocok.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto border-t border-slate-200 dark:border-white/10">
                                {mode === 'all' && (
                                    <table className="w-full min-w-[820px] text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-white/5">
                                            <tr className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                <th className="w-[210px] px-5 py-3">ID Peserta</th><th className={th}>Peserta</th><th className={th}>Sub-event</th><th className={th}>Jenis / kategori</th><th className={th}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                            {view.map((r, i) => (
                                                <tr key={`${r.sub_id}-${r.kind}-${r.id ?? r.reg_id ?? i}-${i}`} className="align-middle">
                                                    <td className="px-5 py-3 font-mono text-[13px] font-bold text-indigo-700 dark:text-indigo-300">{r.reg_id ?? <span className="font-sans font-semibold text-slate-400">-</span>}</td>
                                                    <td className="px-3 py-3 font-extrabold">{r.name}</td>
                                                    <td className="px-3 py-3 font-semibold">{r.sub}</td>
                                                    <td className="px-3 py-3">{r.category ? <span className={pill}>{catLabel(r)}</span> : r.teams.length > 0 ? `${r.teams.length} tim` : ''}</td>
                                                    <td className="px-3 py-3">{badge(r.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {mode === 'ticket' && (
                                    <table className="w-full min-w-[860px] text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-white/5">
                                            <tr className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                <th className="w-[210px] px-5 py-3">ID Peserta</th><th className={th}>Peserta</th><th className={th}>Jenis</th><th className={th}>Pembeli</th><th className={th}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                            {view.map((r, i) => (
                                                <tr key={`${r.order}-${i}`} className="align-top">
                                                    <td className="px-5 py-3.5 font-mono text-[13px] font-bold text-indigo-700 dark:text-indigo-300">{r.reg_id ?? <span className="font-sans font-semibold text-slate-400">-</span>}</td>
                                                    <td className="px-3 py-3.5">
                                                        <div className="font-extrabold">{r.name}</div>
                                                        <div className="text-xs text-slate-500">{r.code ?? `Pesanan ${r.order}`}</div>
                                                        {r.contact && <div className="text-xs text-slate-500">{r.contact}</div>}
                                                        {r.support && <div className="text-xs font-semibold text-indigo-700">Mendukung: {r.support}</div>}
                                                    </td>
                                                    <td className="px-3 py-3.5"><span className={pill}>{r.type}</span></td>
                                                    <td className="px-3 py-3.5"><div className="font-semibold">{r.buyer}</div><div className="text-xs text-slate-500">{r.email}</div></td>
                                                    <td className="px-3 py-3.5">{badge(r.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {mode === 'form' && cur && (
                                    <table className="w-full min-w-[900px] text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-white/5">
                                            <tr className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                <th className="px-5 py-3">{cur.isTeam ? 'Penanggung jawab' : 'Peserta'}</th>
                                                <th className={th}>Sekolah / instansi</th>
                                                <th className={th}>{cur.isTeam ? 'Tim' : 'Kategori'}</th>
                                                {cur.fee > 0 && <th className={th}>Tagihan</th>}
                                                {cur.fee > 0 && <th className={th}>Bukti</th>}
                                                <th className={th}>Status</th>
                                                <th className={th}>Waktu</th>
                                                {shown.map((f) => <th key={f.key} className={th}>{f.label}{f.archived ? ' (arsip)' : ''}</th>)}
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                            {view.map((r) => (
                                                <tr key={r.id} className="align-top">
                                                    <td className="px-5 py-3"><div className="font-semibold">{r.name}</div><div className="text-xs text-slate-500">{r.email}</div><div className="text-xs text-slate-500">{r.phone}</div></td>
                                                    <td className="px-3 py-3">{r.school ?? ''}</td>
                                                    <td className="px-3 py-3">{cur.isTeam ? r.teams.map((t, j) => <div key={j}>{t.name}{t.category ? <span className="text-xs text-slate-500"> ({t.category})</span> : null}</div>) : r.category ?? ''}</td>
                                                    {cur.fee > 0 && <td className="whitespace-nowrap px-3 py-3">{rupiah(r.amount)}</td>}
                                                    {cur.fee > 0 && (
                                                        <td className="px-3 py-3">
                                                            {r.proof ? <a href={`/panel/event/${r.sub_id}/registrasi/bukti/${r.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-700 underline"><Paperclip className="h-3.5 w-3.5" />Lihat</a> : '-'}
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-3">
                                                        {badge(r.status)}
                                                        {r.status === 'ditolak' && r.note && <div className="mt-1 max-w-[200px] text-xs text-slate-500">{r.note}</div>}
                                                        {r.status === 'terdaftar' && !cur.isTeam && hasAfter && <div className="mt-1 text-xs text-slate-500">{r.followup_done ? 'Data lengkap' : 'Menunggu data lanjutan'}</div>}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-3">{r.at}</td>
                                                    {shown.map((f) => <td key={f.key} className="px-3 py-3">{showAnswer(r, f.key)}</td>)}
                                                    <td className="whitespace-nowrap px-3 py-2">
                                                        {r.status !== 'terdaftar' && <button type="button" className={`${iconBtn} text-emerald-700`} aria-label="Setujui" title="Setujui" onClick={() => review(r, 'terdaftar')}><Check className="h-4 w-4" /></button>}
                                                        {r.status !== 'ditolak' && <button type="button" className={`${iconBtn} text-amber-700`} aria-label="Tolak" title="Tolak" onClick={() => review(r, 'ditolak')}><X className="h-4 w-4" /></button>}
                                                        <button type="button" className={`${iconBtn} text-rose-600`} aria-label="Hapus pendaftar" title="Hapus" onClick={() => { if (confirm(`Hapus pendaftar ${r.name}? Data dan berkasnya ikut terhapus.`)) router.delete(`/panel/event/${r.sub_id}/registrasi/pendaftar/${r.id}`, { preserveScroll: true }); }}><Trash2 className="h-4 w-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {list.length > PER_PAGE && (
                            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-xs font-semibold text-slate-500 dark:border-white/10">
                                <span>{from}-{to} dari {list.length}</span>
                                <div className="flex items-center gap-2">
                                    <button type="button" disabled={pg <= 1} onClick={() => setPage(pg - 1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"><ChevronLeft className="h-4 w-4" /></button>
                                    <span>Halaman {pg} / {pages}</span>
                                    <button type="button" disabled={pg >= pages} onClick={() => setPage(pg + 1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"><ChevronRight className="h-4 w-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                </div>

                {mode === 'form' && tab === 'form' && cur && (
                    <div className="space-y-4">
                        {items.map((f, i) => (
                            <div key={f.key ?? `new-${i}`} className={`${card} space-y-3 p-5`}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input value={f.label} onChange={(e) => patch(i, { label: e.target.value })} placeholder="Label kolom, misalnya Nama sekolah" maxLength={120} className={`${field} min-w-0 flex-1`} />
                                    <select value={f.type} onChange={(e) => patch(i, { type: e.target.value as FieldType })} className={field}>
                                        {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    {!cur.isTeam && (
                                        <select value={f.stage} onChange={(e) => patch(i, { stage: e.target.value as 'register' | 'after' })} className={field}>
                                            <option value="register">Diisi saat daftar</option>
                                            <option value="after">Diisi setelah disetujui</option>
                                        </select>
                                    )}
                                    <label className="flex items-center gap-2 text-sm font-semibold">
                                        <input type="checkbox" checked={f.required} onChange={(e) => patch(i, { required: e.target.checked })} /> Wajib
                                    </label>
                                    <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Naik"><ArrowUp className="h-4 w-4" /></button>
                                    <button type="button" className={iconBtn} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Turun"><ArrowDown className="h-4 w-4" /></button>
                                    <button type="button" className={`${iconBtn} text-rose-600`} onClick={() => remove(i)} aria-label="Hapus"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                {needsOptions(f.type) && (
                                    <textarea value={f.optionsText} onChange={(e) => patch(i, { optionsText: e.target.value })} rows={3} placeholder={'Satu pilihan per baris\nContoh:\nSD\nSMP\nSMA'} className={`${field} w-full`} />
                                )}
                                {f.type === 'file' && <p className="text-xs text-slate-500">Pendaftar bisa mengunggah JPG, PNG, WEBP, atau PDF, maksimal 5 MB per berkas. Berkas tersimpan privat dan hanya bisa dibuka dari tab Pendaftar.</p>}
                            </div>
                        ))}

                        <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/40 dark:text-indigo-300 dark:hover:bg-white/5">
                            <Plus className="h-4 w-4" /> Tambah kolom
                        </button>

                        {errors.length > 0 && (
                            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                                {errors.map((e, i) => <div key={i}>{e}</div>)}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan form'}</button>
                            {saved && <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"><Check className="h-4 w-4" /> Tersimpan</span>}
                        </div>
                    </div>
                )}
            </div>
        </PanelLayout>
    );
}
