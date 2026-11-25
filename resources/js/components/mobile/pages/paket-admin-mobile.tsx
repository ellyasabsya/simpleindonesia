import { router, useForm } from '@inertiajs/react';
import { Package as PackageIcon, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { CARD, MUTED } from '../kit/soft';

type Module = { label: string; description: string; icon: string };
type Feature = { label: string; group: string; menu: string | null };
type Catalog = {
    modules: Record<string, Module>;
    groups: Record<string, string>;
    features: Record<string, Feature>;
    payment_types: Record<string, string>;
};
type Pkg = {
    id: number;
    name: string;
    slug: string;
    payment_type: string;
    share_percent: number | null;
    price: number | null;
    modules: string[];
    features: string[];
    description: string | null;
    is_active: boolean;
};

const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const INPUT = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5';
const LABEL = 'mb-1.5 block text-xs font-semibold ' + MUTED;

const empty = {
    name: '',
    payment_type: 'free',
    share_percent: '' as string | number,
    price: '' as string | number,
    modules: [] as string[],
    features: [] as string[],
    description: '',
    is_active: true,
};

function priceParts(p: Pkg): { main: string; note: string } {
    if (p.payment_type === 'revenue_share') return { main: `${p.share_percent}%`, note: 'bagi hasil' };
    if (p.payment_type === 'upfront') return { main: rp(p.price ?? 0), note: 'bayar di muka' };
    return { main: 'Gratis', note: '' };
}

export default function PaketAdminMobile({ packages, catalog }: { packages: Pkg[]; catalog: Catalog }) {
    const [editing, setEditing] = useState<Pkg | null>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const form = useForm(empty);
    const { data, setData, errors, processing } = form;

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const q = search.trim().toLowerCase();
    const list = packages.filter((p) => !q || `${p.name} ${p.description ?? ''}`.toLowerCase().includes(q));

    const openCreate = () => {
        setEditing(null);
        form.setData(empty);
        form.clearErrors();
        setOpen(true);
    };

    const openEdit = (p: Pkg) => {
        setEditing(p);
        form.setData({
            name: p.name,
            payment_type: p.payment_type,
            share_percent: p.share_percent ?? '',
            price: p.price ?? '',
            modules: p.modules,
            features: p.features.filter((f) => catalog.features[f]),
            description: p.description ?? '',
            is_active: p.is_active,
        });
        form.clearErrors();
        setOpen(true);
    };

    const toggle = (arr: string[], key: string) => (arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key]);

    const toggleModule = (key: string) => {
        const modules = toggle(data.modules, key);
        const features = data.features.filter((f) => {
            const g = catalog.features[f]?.group;
            if (!g) return false;
            return g === 'umum' || modules.includes(g);
        });
        setData({ ...data, modules, features });
    };

    const visibleGroups = ['umum', ...Object.keys(catalog.groups).filter((g) => g !== 'umum' && data.modules.includes(g))];
    const groupKeys = (g: string) => Object.entries(catalog.features).filter(([, f]) => f.group === g).map(([k]) => k);
    const setGroup = (g: string, on: boolean) => {
        const keys = groupKeys(g);
        const rest = data.features.filter((f) => !keys.includes(f));
        setData('features', on ? [...rest, ...keys] : rest);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) form.patch(`/admin/paket/${editing.id}`, opts);
        else form.post('/admin/paket', opts);
    };

    const remove = (p: Pkg) => {
        if (confirm(`Hapus paket "${p.name}"?`)) router.delete(`/admin/paket/${p.id}`, { preserveScroll: true });
    };

    const pct = Number(data.share_percent) || 0;
    const exShare = Math.round((1_000_000 * pct) / 100);
    const exRest = 1_000_000 - exShare;

    return (
        <div className="space-y-3 pb-24">
            <section className="rounded-2xl bg-indigo-600 px-4 py-3 text-white">
                <h2 className="text-base font-semibold">Manajemen Paket</h2>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/80">Atur paket penyelenggara: harga, modul layanan, dan fitur yang muncul di dashboard event.</p>
                <button type="button" onClick={openCreate} className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-indigo-800">
                    <Plus className="h-4 w-4" /> Paket baru
                </button>
            </section>

            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama paket"
                    className="h-10 w-full rounded-full border border-slate-200 bg-white pr-3 pl-9 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5"
                />
            </div>

            <p className={'px-1 text-xs font-semibold ' + MUTED}>{list.length} paket</p>

            {list.length === 0 ? (
                <div className={'flex flex-col items-center rounded-2xl px-4 py-8 text-center ' + CARD}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                        <PackageIcon className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">{packages.length === 0 ? 'Belum ada paket.' : 'Tidak ada paket yang cocok.'}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {list.map((p) => {
                        const price = priceParts(p);
                        const topModule = p.modules[p.modules.length - 1];
                        return (
                            <div key={p.id} className={'space-y-2 rounded-2xl p-3 ' + CARD + (p.is_active ? '' : ' opacity-70')}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[15px] leading-snug font-semibold break-words">{p.name}</div>
                                        {p.description && <div className={'line-clamp-2 text-xs ' + MUTED}>{p.description}</div>}
                                    </div>
                                    <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ' + (p.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300')}>
                                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-base font-semibold text-indigo-600 tabular-nums dark:text-indigo-300">{price.main}</span>
                                    {price.note && <span className={'text-xs ' + MUTED}>{price.note}</span>}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {topModule && (
                                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-100">
                                            {catalog.modules[topModule]?.icon} {catalog.modules[topModule]?.label ?? topModule}
                                        </span>
                                    )}
                                    <span className={MUTED}>{p.features.length} fitur</span>
                                </div>
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <button type="button" onClick={() => openEdit(p)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-white">
                                        <Pencil className="h-4 w-4" /> Edit
                                    </button>
                                    <button type="button" onClick={() => remove(p)} aria-label="Hapus paket" className="flex size-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {open &&
                createPortal(
                    <div className="fixed inset-0 z-[80]">
                        <div onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-900/50" />
                        <form
                            onSubmit={submit}
                            role="dialog"
                            aria-label={editing ? 'Edit Paket' : 'Paket Baru'}
                            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[32px] bg-[#f4f6fc] text-slate-900 shadow-2xl dark:bg-[#0a0c1a] dark:text-white"
                        >
                            <div className="flex justify-center pt-3">
                                <span className="h-1 w-9 rounded-full bg-slate-300 dark:bg-white/25" />
                            </div>
                            <div className="flex items-start justify-between px-5 pt-3 pb-2">
                                <div>
                                    <h3 className="text-[17px] font-semibold tracking-tight">{editing ? 'Edit Paket' : 'Paket Baru'}</h3>
                                    <p className={'text-xs ' + MUTED}>Atur identitas, harga paket, dan modul layanan.</p>
                                </div>
                                <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="flex size-9 items-center justify-center rounded-full bg-slate-900/[0.06] dark:bg-white/10">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-5 overflow-y-auto px-5 pt-2 pb-4">
                                <div>
                                    <label className={LABEL}>Nama paket *</label>
                                    <input className={INPUT} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Contoh: Ticketing" />
                                    {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className={LABEL}>Jenis pembayaran *</label>
                                    <select className={INPUT} value={data.payment_type} onChange={(e) => setData('payment_type', e.target.value)}>
                                        {Object.entries(catalog.payment_types).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                {data.payment_type === 'revenue_share' && (
                                    <div>
                                        <label className={LABEL}>Persentase bagi hasil (%) *</label>
                                        <input className={INPUT} type="number" inputMode="decimal" min={0} max={100} step="0.1" value={data.share_percent} onChange={(e) => setData('share_percent', e.target.value)} />
                                        {errors.share_percent && <p className="mt-1 text-xs text-rose-500">{errors.share_percent}</p>}
                                        <p className={'mt-2 text-[13px] leading-snug ' + MUTED}>
                                            Contoh: penjualan Rp1.000.000 → bagian SIMPLE <b className="text-indigo-700 dark:text-indigo-300">{rp(exShare)}</b>, penyelenggara menerima{' '}
                                            <b className="text-indigo-700 dark:text-indigo-300">{rp(exRest)}</b>. Biaya layanan dibayar pembeli terpisah.
                                        </p>
                                    </div>
                                )}
                                {data.payment_type === 'upfront' && (
                                    <div>
                                        <label className={LABEL}>Harga paket (Rp) *</label>
                                        <input className={INPUT} type="number" inputMode="numeric" min={0} value={data.price} onChange={(e) => setData('price', e.target.value)} />
                                        {errors.price && <p className="mt-1 text-xs text-rose-500">{errors.price}</p>}
                                    </div>
                                )}

                                <div>
                                    <div className="mb-2 flex items-end justify-between">
                                        <label className={LABEL + ' !mb-0'}>Modul layanan</label>
                                        <span className={'text-xs ' + MUTED}>{data.modules.length} dipilih</span>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.entries(catalog.modules).map(([k, m]) => {
                                            const on = data.modules.includes(k);
                                            return (
                                                <label key={k} className={'block rounded-2xl border p-3 ' + (on ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-500/20' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5')}>
                                                    <span className="flex items-center gap-2.5 text-[14px] font-semibold">
                                                        <input type="checkbox" checked={on} onChange={() => toggleModule(k)} className="h-4 w-4 accent-indigo-700" />
                                                        <span>{m.icon}</span> {m.label}
                                                    </span>
                                                    <span className={'mt-1 block pl-7 text-xs ' + MUTED}>{m.description}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-end justify-between">
                                        <label className={LABEL + ' !mb-0'}>Fitur paket</label>
                                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{data.features.length} dipilih</span>
                                    </div>
                                    {visibleGroups.map((g) => {
                                        const keys = groupKeys(g);
                                        if (keys.length === 0) return null;
                                        const count = keys.filter((k) => data.features.includes(k)).length;
                                        return (
                                            <div key={g} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-[14px] font-semibold">
                                                        {catalog.groups[g]} <span className={'ml-1 text-xs font-medium ' + MUTED}>{count}/{keys.length}</span>
                                                    </p>
                                                    <button type="button" onClick={() => setGroup(g, count !== keys.length)} className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                        {count === keys.length ? 'Kosongkan' : 'Pilih semua'}
                                                    </button>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {keys.map((k) => {
                                                        const on = data.features.includes(k);
                                                        return (
                                                            <label key={k} className={'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[13px] font-semibold ' + (on ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-500/20' : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5')}>
                                                                <input type="checkbox" checked={on} onChange={() => setData('features', toggle(data.features, k))} className="h-4 w-4 accent-indigo-700" />
                                                                <span className="min-w-0 flex-1">{catalog.features[k].label}</span>
                                                                {catalog.features[k].menu && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">{catalog.features[k].menu}</span>}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <p className={'text-xs ' + MUTED}>Fitur yang tidak dicentang tidak termasuk dalam paket. Kelompok Ticketing, Voting, dan Lomba muncul mengikuti modul yang dicentang.</p>
                                </div>

                                <div>
                                    <label className={LABEL}>Deskripsi</label>
                                    <textarea rows={3} maxLength={500} value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5" />
                                </div>

                                <label className="flex items-center gap-3 text-[14px] font-semibold">
                                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 accent-indigo-700" />
                                    Paket aktif (bisa dipilih penyelenggara)
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-slate-900/[0.07] px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10">
                                <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full bg-slate-900/[0.06] text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="h-11 rounded-full bg-indigo-600 text-sm font-semibold text-white disabled:opacity-60">
                                    {editing ? 'Simpan' : 'Buat Paket'}
                                </button>
                            </div>
                        </form>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
