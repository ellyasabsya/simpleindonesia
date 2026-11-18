import RegistrationIdList from '@/components/panel/registration-id-list';
import PanelLayout from '@/components/panel/panel-layout';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Check, Download, Paperclip, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import RegistrationInfoCard from '@/components/panel/registration-info-card';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'file';
type Field = { key: string; label: string; type: FieldType; required: boolean; options: string[]; archived?: boolean; stage?: 'register' | 'after' };
type Item = { key?: string; label: string; type: FieldType; required: boolean; optionsText: string; stage: 'register' | 'after' };
type Row = {
    id: number; name: string; email: string; phone: string | null; school: string | null; category: string | null;
    status: string; amount: number; proof: boolean; note: string | null; at: string; followup_done: boolean;
    teams: { name: string; category: string | null }[]; answers: Record<string, unknown>;
};
type Props = {
    eventId: number; fields: Field[]; message: string; quota: number | null; used: number; fee: number; isTeam: boolean;
    rows: Row[]; link: string; published: boolean;
};

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
    terdaftar: { label: 'Disetujui', style: 'bg-emerald-100 text-emerald-800' },
    ditolak: { label: 'Ditolak', style: 'bg-rose-100 text-rose-800' },
};
const needsOptions = (t: FieldType) => t === 'select' || t === 'checkbox';
const toItems = (fs: Field[]): Item[] =>
    fs.filter((f) => !f.archived).map((f) => ({ key: f.key, label: f.label, type: f.type, required: f.required, optionsText: (f.options ?? []).join('\n'), stage: f.stage === 'after' ? 'after' : 'register' }));
const rupiah = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

const card = 'rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const field = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';
const iconBtn = 'rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-white/10';

export default function RegistrasiForm({ eventId, fields, quota, used, fee, isTeam, rows, published }: Props) {
    const [tab, setTab] = useState<'data' | 'form'>('data');
    const [items, setItems] = useState<Item[]>(() => toItems(fields));
    const [errors, setErrors] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [q, setQ] = useState('');
    const [st, setSt] = useState('');

    const patch = (i: number, p: Partial<Item>) => { setSaved(false); setItems((a) => a.map((x, j) => (j === i ? { ...x, ...p } : x))); };
    const move = (i: number, d: number) => { setSaved(false); setItems((a) => { const j = i + d; if (j < 0 || j >= a.length) return a; const c = [...a]; [c[i], c[j]] = [c[j], c[i]]; return c; }); };
    const add = () => { setSaved(false); setItems((a) => [...a, { label: '', type: 'text', required: false, optionsText: '', stage: 'register' }]); };
    const remove = (i: number) => { setSaved(false); setItems((a) => a.filter((_, j) => j !== i)); };

    const save = () => {
        setErrors([]);
        setSaved(false);
        router.put(
            `/panel/event/${eventId}/registrasi/form`,
            {
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
                onSuccess: (page) => { setItems(toItems((page.props as unknown as Props).fields)); setSaved(true); },
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
        router.patch(`/panel/event/${eventId}/registrasi/pendaftar/${r.id}/status`, { status, note }, { preserveScroll: true });
    };


    const count = (s: string) => rows.filter((r) => r.status === s).length;
    const list = useMemo(() => {
        const k = q.trim().toLowerCase();
        return rows.filter((r) =>
            (!st || r.status === st) &&
            (!k || [r.name, r.email, r.phone ?? '', r.school ?? '', ...r.teams.map((t) => t.name)].some((v) => v.toLowerCase().includes(k))),
        );
    }, [rows, q, st]);

    const shown = isTeam ? [] : fields;
    const cell = (v: unknown) => (Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v));
    const show = (r: Row, k: string) => {
        const v = r.answers[k];
        if (v && typeof v === 'object' && !Array.isArray(v) && (v as { file?: boolean }).file) {
            return (
                <a href={`/panel/event/${eventId}/registrasi/berkas/${r.id}/${k}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-700 underline">
                    <Paperclip className="h-3.5 w-3.5" />{(v as { name: string }).name}
                </a>
            );
        }
        return cell(v);
    };
    const stat = (t: string, v: string, s: string) => (
        <div className={`${card} p-5`}>
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t}</div>
            <div className="mt-2 text-3xl font-extrabold">{v}</div>
            <div className="mt-1 text-xs text-slate-500">{s}</div>
        </div>
    );

    return (
        <PanelLayout title="Registrasi">
            <div className="space-y-5">
                <RegistrationInfoCard fee={fee} isTeam={isTeam} className={card}>
                    {!published && <p className="mt-2 text-xs font-semibold text-amber-700">Event belum terbit, jadi form publik belum bisa dibuka.</p>}
                </RegistrationInfoCard>

                <div className="grid gap-4 sm:grid-cols-3">
                    {stat(isTeam ? 'Tim terdaftar' : 'Pendaftar', String(used), quota ? `dari kuota ${quota}` : 'tanpa batas kuota')}
                    {stat('Menunggu verifikasi', String(count('menunggu')), 'perlu ditinjau')}
                    {stat('Disetujui', String(count('terdaftar')), 'sudah terdaftar')}
                </div>

                <div className="flex gap-2">
                    {([['data', `Pendaftar (${rows.length})`], ['form', 'Susun form']] as const).map(([k, t]) => (
                        <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === k ? 'bg-indigo-900 text-white' : 'border border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'}`}>{t}</button>
                    ))}
                </div>

                {tab === 'data' && (
                    <div className={`${card} p-5`}>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[200px] flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, sekolah, atau tim" className={`${field} w-full pl-9`} />
                            </div>
                            <select value={st} onChange={(e) => setSt(e.target.value)} className={field}>
                                <option value="">Semua status</option>
                                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <a href={`/panel/event/${eventId}/registrasi/export`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800"><Download className="h-4 w-4" /> Ekspor CSV</a>
                        </div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-white/10">
                                        <th className="py-2 pr-4">{isTeam ? 'Penanggung jawab' : 'Peserta'}</th>
                                        <th className="py-2 pr-4">Sekolah / instansi</th>
                                        <th className="py-2 pr-4">{isTeam ? 'Tim' : 'Kategori'}</th>
                                        {fee > 0 && <th className="py-2 pr-4">Tagihan</th>}
                                        {fee > 0 && <th className="py-2 pr-4">Bukti</th>}
                                        <th className="py-2 pr-4">Status</th>
                                        <th className="py-2 pr-4">Waktu</th>
                                        {shown.map((f) => <th key={f.key} className="py-2 pr-4">{f.label}{f.archived ? ' (arsip)' : ''}</th>)}
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((r) => {
                                        const s = STATUS[r.status] ?? { label: r.status, style: 'bg-slate-200 text-slate-700' };
                                        return (
                                            <tr key={r.id} className="border-b border-slate-100 align-top dark:border-white/5">
                                                <td className="py-2 pr-4"><div className="font-semibold">{r.name}</div><div className="text-xs text-slate-500">{r.email}</div><div className="text-xs text-slate-500">{r.phone}</div></td>
                                                <td className="py-2 pr-4">{r.school ?? ''}</td>
                                                <td className="py-2 pr-4">
                                                    {isTeam ? r.teams.map((t, i) => <div key={i}>{t.name}{t.category ? <span className="text-xs text-slate-500"> ({t.category})</span> : null}</div>) : r.category ?? ''}
                                                </td>
                                                {fee > 0 && <td className="whitespace-nowrap py-2 pr-4">{rupiah(r.amount)}</td>}
                                                {fee > 0 && (
                                                    <td className="py-2 pr-4">
                                                        {r.proof ? <a href={`/panel/event/${eventId}/registrasi/bukti/${r.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-700 underline"><Paperclip className="h-3.5 w-3.5" />Lihat</a> : '-'}
                                                    </td>
                                                )}
                                                <td className="py-2 pr-4">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.style}`}>{s.label}</span>
                                                    {r.status === 'ditolak' && r.note && <div className="mt-1 max-w-[200px] text-xs text-slate-500">{r.note}</div>}
                                                    {r.status === 'terdaftar' && !isTeam && fields.some((f) => !f.archived && f.stage === 'after') && <div className="mt-1 text-xs text-slate-500">{r.followup_done ? 'Data lengkap' : 'Menunggu data lanjutan'}</div>}
                                                </td>
                                                <td className="whitespace-nowrap py-2 pr-4">{r.at}</td>
                                                {shown.map((f) => <td key={f.key} className="py-2 pr-4">{show(r, f.key)}</td>)}
                                                <td className="whitespace-nowrap py-2">
                                                    {r.status !== 'terdaftar' && <button type="button" className={`${iconBtn} text-emerald-700`} aria-label="Setujui" title="Setujui" onClick={() => review(r, 'terdaftar')}><Check className="h-4 w-4" /></button>}
                                                    {r.status !== 'ditolak' && <button type="button" className={`${iconBtn} text-amber-700`} aria-label="Tolak" title="Tolak" onClick={() => review(r, 'ditolak')}><X className="h-4 w-4" /></button>}
                                                    <button type="button" className={`${iconBtn} text-rose-600`} aria-label="Hapus pendaftar" title="Hapus" onClick={() => { if (confirm(`Hapus pendaftar ${r.name}? Data dan berkasnya ikut terhapus.`)) router.delete(`/panel/event/${eventId}/registrasi/pendaftar/${r.id}`, { preserveScroll: true }); }}><Trash2 className="h-4 w-4" /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {list.length === 0 && <tr><td colSpan={10 + shown.length} className="py-8 text-center text-slate-500">Belum ada pendaftar.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'form' && (
                    <div className="space-y-4">

                        {items.map((f, i) => (
                            <div key={f.key ?? `new-${i}`} className={`${card} space-y-3 p-5`}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input value={f.label} onChange={(e) => patch(i, { label: e.target.value })} placeholder="Label kolom, misalnya Nama sekolah" maxLength={120} className={`${field} min-w-0 flex-1`} />
                                    <select value={f.type} onChange={(e) => patch(i, { type: e.target.value as FieldType })} className={field}>
                                        {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    {!isTeam && (
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
            <RegistrationIdList />
        </PanelLayout>
    );
}
