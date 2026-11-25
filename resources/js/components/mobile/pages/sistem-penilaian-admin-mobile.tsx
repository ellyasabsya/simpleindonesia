import { router } from '@inertiajs/react';
import { CheckSquare, Lock, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CARD, MUTED } from '../kit/soft';

type Hook = { key: string; label: string; description: string; enabled: boolean };
type Sys = { key: string; name: string; description: string; tag: string; version: number; active: boolean; used: number; hooks: Hook[] };
type Row = { label: string; key: string; description: string; touched: boolean };

const INPUT = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5';
const AREA = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5';
const LABEL = 'mb-1.5 block text-xs font-semibold ' + MUTED;
const GHOST = 'h-11 rounded-full bg-slate-900/[0.06] text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200';
const PRIMARY = 'h-11 rounded-full bg-indigo-600 text-sm font-semibold text-white disabled:opacity-50';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^[0-9_]+/, '').slice(0, 30);
const emptyRow = (): Row => ({ label: '', key: '', description: '', touched: false });

function keyError(key: string, taken: string[], others: string[]): string {
    if (key === '') return '';
    if (!/^[a-z][a-z0-9_]{1,29}$/.test(key)) return 'Huruf kecil, angka, dan garis bawah, diawali huruf (2 sampai 30 karakter).';
    if (taken.includes(key)) return 'Kode ini sudah dipakai. Cantolan harus baru.';
    if (others.includes(key)) return 'Kode kembar dengan cantolan lain di sistem ini.';
    return '';
}

function Sheet({ title, onClose, footer, children }: { title: string; onClose: () => void; footer: ReactNode; children: ReactNode }) {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[80]">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/50" />
            <div role="dialog" aria-label={title} className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[32px] bg-[#f4f6fc] text-slate-900 shadow-2xl dark:bg-[#0a0c1a] dark:text-white">
                <div className="flex justify-center pt-3">
                    <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                </div>
                <div className="flex items-center justify-between px-5 pt-3 pb-2">
                    <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
                    <button type="button" onClick={onClose} aria-label="Tutup" className="flex size-9 items-center justify-center rounded-full bg-slate-900/[0.06] dark:bg-white/10">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-4 overflow-y-auto px-5 pt-2 pb-4">{children}</div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-900/[0.07] px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10">{footer}</div>
            </div>
        </div>,
        document.body,
    );
}

function HookFields({ row, onChange, error }: { row: Row; onChange: (r: Row) => void; error: string }) {
    return (
        <div className="space-y-3">
            <div>
                <label className={LABEL}>Nama cantolan</label>
                <input
                    value={row.label}
                    maxLength={80}
                    placeholder="mis. Skor Pertandingan"
                    className={INPUT}
                    onChange={(e) => onChange({ ...row, label: e.target.value, key: row.touched ? row.key : slug(e.target.value) })}
                />
            </div>
            <div>
                <label className={LABEL}>Kode cantolan</label>
                <input
                    value={row.key}
                    maxLength={30}
                    placeholder="mis. skor"
                    className={INPUT + ' font-mono ' + (error ? 'border-rose-400 dark:border-rose-400' : '')}
                    onChange={(e) => onChange({ ...row, key: e.target.value.toLowerCase(), touched: true })}
                />
            </div>
            <div>
                <label className={LABEL}>Keterangan</label>
                <input value={row.description} maxLength={200} placeholder="Tab atau aksi apa yang dikunci" className={INPUT} onChange={(e) => onChange({ ...row, description: e.target.value })} />
            </div>
            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>
    );
}

function EditSheet({ s, usedKeys, onClose }: { s: Sys; usedKeys: string[]; onClose: () => void }) {
    const [name, setName] = useState(s.name);
    const [tag, setTag] = useState(s.tag);
    const [desc, setDesc] = useState(s.description);
    const [busy, setBusy] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [row, setRow] = useState<Row>(emptyRow());
    const [adding, setAdding] = useState(false);
    const [hookErr, setHookErr] = useState('');
    const on = s.hooks.filter((h) => h.enabled).length;
    const rowError = keyError(row.key, usedKeys, []);

    const save = () => {
        setErr('');
        router.patch(
            `/admin/penilaian/${s.key}`,
            { name, tag, description: desc },
            {
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: onClose,
                onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menyimpan.')),
            },
        );
    };

    const toggleHook = (key: string) => {
        const h = s.hooks.find((x) => x.key === key);
        if (h?.enabled && !confirm(`Matikan cantolan "${h.label}"?\n\nTab ini hilang di menu Penilaian dan aksinya ditolak server untuk semua event yang memakai ${s.name}${s.used > 0 ? ` (${s.used} event saat ini)` : ''}.`)) return;
        router.patch(`/admin/penilaian/${s.key}/cantolan/${key}`, {}, { preserveScroll: true, onStart: () => setBusy(key), onFinish: () => setBusy('') });
    };

    const addHook = () => {
        setHookErr('');
        router.post(`/admin/penilaian/${s.key}/cantolan`, { label: row.label, key: row.key, description: row.description } as any, {
            preserveScroll: true,
            onStart: () => setAdding(true),
            onFinish: () => setAdding(false),
            onSuccess: () => setRow(emptyRow()),
            onError: (e) => setHookErr(String(Object.values(e)[0] ?? 'Gagal menambah cantolan.')),
        });
    };

    const statusCls =
        on === s.hooks.length && on > 0
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200'
            : on === 0
              ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200';
    const statusMsg =
        s.hooks.length === 0
            ? 'Sistem ini belum punya cantolan.'
            : on === s.hooks.length
              ? 'Semua cantolan aktif. Sistem berjalan penuh.'
              : on === 0
                ? 'Semua cantolan mati. Sistem lumpuh dan pilihannya tidak muncul untuk panitia.'
                : `${s.hooks.length - on} dari ${s.hooks.length} cantolan mati. Sistem berjalan terbatas.`;

    return (
        <Sheet
            title="Detail / Edit sistem"
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className={GHOST}>
                        Tutup
                    </button>
                    <button type="button" disabled={saving || name.trim() === ''} onClick={save} className={PRIMARY}>
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </>
            }
        >
            {s.used > 0 && (
                <p className="rounded-2xl bg-amber-50 px-3.5 py-2.5 text-xs leading-snug font-semibold text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
                    Sudah dipakai {s.used} event, jadi rumus dan versi tidak bisa diubah. Nama, deskripsi, dan cantolan masih bisa.
                </p>
            )}
            <div>
                <label className={LABEL}>Nama sistem</label>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={INPUT} />
            </div>
            <div>
                <label className={LABEL}>Label</label>
                <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={60} className={INPUT} />
            </div>
            <div>
                <label className={LABEL}>Kode sistem</label>
                <div className={'flex h-11 items-center rounded-xl bg-slate-100 px-3.5 font-mono text-sm dark:bg-white/5 ' + MUTED}>{s.key}</div>
            </div>
            <div>
                <label className={LABEL}>Deskripsi</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} className={AREA} />
            </div>
            {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}

            <div className="space-y-2 border-t border-slate-900/[0.07] pt-4 dark:border-white/10">
                <p className={'text-xs font-semibold ' + MUTED}>Cantolan (tab di menu Penilaian)</p>
                <div className={'rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug font-semibold ' + statusCls}>{statusMsg}</div>
                <div className="space-y-1.5">
                    {s.hooks.map((h) => (
                        <label key={h.key} className={'flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5 ' + (busy === h.key ? 'opacity-60' : '')}>
                            <input type="checkbox" checked={h.enabled} disabled={!!busy} onChange={() => toggleHook(h.key)} className="h-5 w-5 shrink-0 accent-indigo-600" />
                            <span className="min-w-0 flex-1">
                                <span className={'block text-[14px] font-semibold ' + (h.enabled ? '' : 'text-slate-400 line-through')}>{h.label}</span>
                                <span className={'block text-xs leading-snug break-words ' + MUTED}>
                                    {h.description || 'Tanpa keterangan.'} <span className="font-mono text-[11px]">({h.key})</span>
                                </span>
                            </span>
                            <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ' + (h.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>
                                {h.enabled ? 'Aktif' : 'Mati'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 p-3.5 dark:border-white/15">
                <p className={'text-xs font-semibold ' + MUTED}>Tambah cantolan baru</p>
                <HookFields row={row} onChange={setRow} error={rowError} />
                {hookErr && <p className="text-xs font-semibold text-rose-600">{hookErr}</p>}
                <button type="button" disabled={adding || row.label.trim() === '' || row.key === '' || rowError !== ''} onClick={addHook} className={PRIMARY + ' w-full'}>
                    {adding ? 'Menambah...' : 'Tambah cantolan'}
                </button>
            </div>
        </Sheet>
    );
}

function AddSheet({ usedKeys, onClose }: { usedKeys: string[]; onClose: () => void }) {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [keyTouched, setKeyTouched] = useState(false);
    const [tag, setTag] = useState('');
    const [desc, setDesc] = useState('');
    const [rows, setRows] = useState<Row[]>([emptyRow()]);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const errors = rows.map((r, i) =>
        keyError(
            r.key,
            usedKeys,
            rows.filter((_, j) => j !== i).map((x) => x.key),
        ),
    );
    const valid = name.trim() !== '' && key.trim() !== '' && rows.every((r, i) => r.label.trim() !== '' && r.key !== '' && errors[i] === '');

    const submit = () => {
        setErr('');
        router.post(
            '/admin/penilaian',
            {
                name,
                system_key: key,
                tag,
                description: desc,
                hooks: rows.map((r) => ({ label: r.label, key: r.key, description: r.description })),
            } as any,
            {
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: onClose,
                onError: (e) => setErr(String(Object.values(e)[0] ?? 'Gagal menambah sistem.')),
            },
        );
    };

    return (
        <Sheet
            title="Tambah sistem penilaian"
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className={GHOST}>
                        Batal
                    </button>
                    <button type="button" disabled={busy || !valid} onClick={submit} className={PRIMARY}>
                        {busy ? 'Menyimpan...' : 'Tambah sistem'}
                    </button>
                </>
            }
        >
            <div>
                <label className={LABEL}>Nama sistem</label>
                <input
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (!keyTouched) setKey(slug(e.target.value));
                    }}
                    maxLength={120}
                    placeholder="mis. Penilaian Pertandingan"
                    className={INPUT}
                />
            </div>
            <div>
                <label className={LABEL}>Kode sistem</label>
                <input
                    value={key}
                    onChange={(e) => {
                        setKeyTouched(true);
                        setKey(e.target.value.toLowerCase());
                    }}
                    maxLength={30}
                    placeholder="mis. match"
                    className={INPUT + ' font-mono'}
                />
            </div>
            <div>
                <label className={LABEL}>Label</label>
                <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={60} placeholder="mis. Olahraga" className={INPUT} />
            </div>
            <div>
                <label className={LABEL}>Deskripsi</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} className={AREA} />
            </div>

            <div className="space-y-2">
                <p className={'text-xs font-semibold ' + MUTED}>Cantolan sistem ini</p>
                <p className={'text-xs leading-snug ' + MUTED}>Isi cantolan baru milik sistem ini. Cantolan yang sudah dipakai sistem lain tidak bisa dipakai lagi.</p>
                {rows.map((r, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Cantolan {i + 1}</span>
                            {rows.length > 1 && (
                                <button type="button" onClick={() => setRows((v) => v.filter((_, j) => j !== i))} aria-label="Hapus cantolan" className="flex size-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <HookFields row={r} error={errors[i]} onChange={(nr) => setRows((v) => v.map((x, j) => (j === i ? nr : x)))} />
                    </div>
                ))}
                {rows.length < 20 && (
                    <button type="button" onClick={() => setRows((v) => [...v, emptyRow()])} className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-dashed border-indigo-300 text-sm font-semibold text-indigo-700 dark:border-indigo-400/40 dark:text-indigo-200">
                        <Plus className="h-4 w-4" /> Tambah cantolan
                    </button>
                )}
            </div>

            <p className={'rounded-2xl bg-slate-100 px-3.5 py-2.5 text-xs leading-snug font-semibold dark:bg-white/5 ' + MUTED}>Sistem baru dibuat dalam keadaan nonaktif. Aktifkan lewat tombol Aktifkan di kartunya setelah siap.</p>
            {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
        </Sheet>
    );
}

function SystemCard({ s, onEdit }: { s: Sys; onEdit: () => void }) {
    const [busy, setBusy] = useState(false);
    const on = s.hooks.filter((h) => h.enabled).length;
    const hookTone = s.hooks.length > 0 && on === s.hooks.length ? 'text-emerald-600 dark:text-emerald-300' : on === 0 ? 'text-rose-600 dark:text-rose-300' : 'text-amber-600 dark:text-amber-300';

    const toggle = () => {
        const msg = s.active
            ? `Nonaktifkan "${s.name}"?\n\nPanitia tidak akan melihat pilihan ini di menu Penilaian.${s.used > 0 ? ` ${s.used} event yang sudah memakainya tetap berjalan.` : ''}`
            : `Aktifkan "${s.name}"? Panitia bisa memilihnya di menu Penilaian.`;
        if (!confirm(msg)) return;
        router.patch(`/admin/penilaian/${s.key}/aktif`, {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };

    return (
        <div className={'space-y-3 rounded-2xl p-3.5 ' + CARD + (s.active ? '' : ' opacity-80')}>
            <div className="flex items-start gap-3">
                <div className={'flex size-10 shrink-0 items-center justify-center rounded-xl text-white ' + (s.active ? 'bg-indigo-600' : 'bg-slate-400')}>
                    <CheckSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-300">{s.tag || 'Sistem penilaian'}</div>
                    <h3 className="text-[15px] leading-snug font-semibold break-words">{s.name}</h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={'rounded-full px-2.5 py-0.5 text-[11px] font-bold ' + (s.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300')}>
                        {s.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {s.used > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
                            <Lock className="h-3 w-3" /> Terkunci
                        </span>
                    )}
                </div>
            </div>

            <p className={'line-clamp-2 text-xs leading-snug ' + MUTED}>{s.description || 'Belum ada deskripsi.'}</p>

            <div className="grid grid-cols-3 divide-x divide-slate-900/[0.07] rounded-xl bg-slate-50 dark:divide-white/10 dark:bg-white/5">
                <div className="px-3 py-2">
                    <div className={'text-[10px] font-semibold ' + MUTED}>Versi</div>
                    <div className="text-base font-semibold tabular-nums">{s.version}</div>
                </div>
                <div className="px-3 py-2">
                    <div className={'text-[10px] font-semibold ' + MUTED}>Dipakai</div>
                    <div className="text-base font-semibold tabular-nums">{s.used}</div>
                </div>
                <div className="px-3 py-2">
                    <div className={'text-[10px] font-semibold ' + MUTED}>Cantolan</div>
                    <div className={'text-base font-semibold tabular-nums ' + hookTone}>
                        {on}/{s.hooks.length}
                    </div>
                </div>
            </div>

            {s.hooks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {s.hooks.map((h) => (
                        <span key={h.key} className={'rounded-full px-2.5 py-1 text-[11px] font-semibold ' + (h.enabled ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200' : 'bg-slate-100 text-slate-400 line-through dark:bg-white/5')}>
                            {h.label}
                        </span>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={onEdit} className="h-10 rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-white">
                    Detail / Edit
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={toggle}
                    className={'h-10 rounded-full border text-sm font-semibold disabled:opacity-50 ' + (s.active ? 'border-rose-200 text-rose-600 dark:border-rose-400/30 dark:text-rose-300' : 'border-emerald-200 text-emerald-600 dark:border-emerald-400/30 dark:text-emerald-300')}
                >
                    {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
            </div>
        </div>
    );
}

export default function SistemPenilaianAdminMobile({ systems, usedKeys }: { systems: Sys[]; usedKeys: string[] }) {
    const [editKey, setEditKey] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const editing = systems.find((x) => x.key === editKey) ?? null;

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Sistem Penilaian</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">Kelola metode penilaian yang dapat dipilih panitia pada Dashboard Event.</p>
                <button type="button" onClick={() => setAdding(true)} className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-indigo-800">
                    <Plus className="h-4 w-4" /> Tambah sistem
                </button>
            </section>

            {systems.length === 0 ? (
                <div className={'rounded-2xl px-4 py-8 text-center text-sm ' + CARD + ' ' + MUTED}>Belum ada sistem penilaian. Jalankan php artisan migrate.</div>
            ) : (
                <div className="space-y-2">
                    {systems.map((s) => (
                        <SystemCard key={s.key} s={s} onEdit={() => setEditKey(s.key)} />
                    ))}
                </div>
            )}

            {editing && <EditSheet key={editing.key} s={editing} usedKeys={usedKeys} onClose={() => setEditKey(null)} />}
            {adding && <AddSheet usedKeys={usedKeys} onClose={() => setAdding(false)} />}
        </div>
    );
}
