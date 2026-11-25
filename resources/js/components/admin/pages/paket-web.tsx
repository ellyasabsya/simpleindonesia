import { router, useForm } from '@inertiajs/react';
import { Package as PackageIcon, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import AdminLayout from '@/components/admin/admin-layout';

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
    extra_sub_event_price: number | null;
    assessment_addon_price: number | null;
    certificate_addon_price: number | null;
};

const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const input =
    'h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800 dark:focus:ring-indigo-500/20';
const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300';

const empty = {
    name: '',
    payment_type: 'free',
    share_percent: '' as string | number,
    price: '' as string | number,
    modules: [] as string[],
    features: [] as string[],
    description: '',
    is_active: true,
    extra_sub_event_price: '' as string | number,
    assessment_addon_price: '' as string | number,
    certificate_addon_price: '' as string | number,
};

function priceParts(p: Pkg): { main: string; note: string } {
    if (p.payment_type === 'revenue_share') return { main: `${p.share_percent}%`, note: 'bagi hasil' };
    if (p.payment_type === 'upfront') return { main: rp(p.price ?? 0), note: 'bayar di muka' };
    return { main: 'Gratis', note: '' };
}

function AddonField({ title, hint, suffix, value, onChange, error }: {
    title: string;
    hint: string;
    suffix?: string;
    value: string | number;
    onChange: (v: string) => void;
    error?: string;
}) {
    const off = value === '' || value === null;
    return (
        <div className={`flex flex-col rounded-2xl border p-4 transition ${off ? 'border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5' : 'border-indigo-200 bg-white shadow-sm dark:border-indigo-400/30 dark:bg-slate-800'}`}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${off ? 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'}`}>
                    {off ? 'Tidak tersedia' : 'Aktif'}
                </span>
            </div>
            <p className="mt-1 min-h-[2rem] text-xs text-slate-500 dark:text-slate-400">{hint}</p>
            <div className="relative mt-3">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rp</span>
                <input
                    type="number"
                    min={0}
                    step={1000}
                    value={value}
                    placeholder="Kosong = tidak tersedia"
                    onChange={(e) => onChange(e.target.value)}
                    style={{ paddingLeft: 40 }}
                    className={input + ' [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'}
                />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">
                    {off ? '' : rp(Number(value)) + (suffix ?? '')}
                </span>
                {!off && (
                    <button type="button" onClick={() => onChange('')} className="font-bold text-rose-600 hover:underline dark:text-rose-300">
                        Nonaktifkan
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>
    );
}

export default function AdminPaket({ packages, catalog }: { packages: Pkg[]; catalog: Catalog }) {
    const [editing, setEditing] = useState<Pkg | null>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const form = useForm(empty);
    const { data, setData, errors, processing } = form;

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
            extra_sub_event_price: p.extra_sub_event_price ?? '',
            assessment_addon_price: p.assessment_addon_price ?? '',
            certificate_addon_price: p.certificate_addon_price ?? '',
        });
        form.clearErrors();
        setOpen(true);
    };

    const toggle = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

    const toggleModule = (key: string) => {
        const modules = toggle(data.modules, key);
        // Buang fitur milik modul yang baru dimatikan
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

    const example = (() => {
        const pct = Number(data.share_percent) || 0;
        const share = Math.round((1_000_000 * pct) / 100);
        return { share, rest: 1_000_000 - share };
    })();

    return (
        <AdminLayout title="Manajemen Paket">
            <div className="w-full space-y-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-600 to-violet-600 px-7 py-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
                    <div className="relative flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]">
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Package Configuration
                            </span>
                            <h2 className="mt-3 text-2xl font-extrabold">Manajemen Paket</h2>
                            <p className="mt-1 max-w-2xl text-sm text-white/80">
                                Atur paket penyelenggara: harga, modul layanan, dan fitur yang muncul di dashboard event.
                            </p>
                        </div>
                        <button type="button" onClick={openCreate}
                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-800 shadow-md transition hover:shadow-lg">
                            <Plus className="h-4 w-4" /> Paket baru
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {list.length} paket
                        </span>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama paket"
                                className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5" />
                        </div>
                    </div>

                    {list.length === 0 ? (
                        <div className="flex flex-col items-center px-4 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                                <PackageIcon className="h-7 w-7" />
                            </div>
                            <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">
                                {packages.length === 0 ? 'Belum ada paket.' : 'Tidak ada paket yang cocok.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px] text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5">
                                    <tr>
                                        {['Paket', 'Harga', 'Modul', 'Fitur', 'Status', 'Aksi'].map((h) => (
                                            <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 ${h === 'Aksi' ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {list.map((p) => {
                                        const price = priceParts(p);
                                        const topModule = p.modules[p.modules.length - 1];
                                        return (
                                            <tr key={p.id} className={p.is_active ? '' : 'opacity-60'}>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                                                    {p.description && <p className="line-clamp-1 text-xs text-slate-500">{p.description}</p>}
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <span className="font-extrabold tabular-nums text-indigo-700 dark:text-indigo-300">{price.main}</span>
                                                    {price.note && <span className="ml-2 text-xs text-slate-500">{price.note}</span>}
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    {topModule ? (
                                                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-100">
                                                            {catalog.modules[topModule]?.icon} {catalog.modules[topModule]?.label ?? topModule}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 align-middle text-slate-600 dark:text-slate-300">{p.features.length} fitur</td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                                                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 align-middle">
                                                    <div className="flex justify-end gap-2">
                                                        <button type="button" onClick={() => openEdit(p)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-white">
                                                            <Pencil className="h-4 w-4" /> Edit
                                                        </button>
                                                        <button type="button" onClick={() => remove(p)} aria-label="Hapus paket"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <form
                        onSubmit={submit}
                        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between rounded-t-3xl border-b border-slate-200/70 bg-gradient-to-r from-indigo-50 via-blue-50 to-violet-50 p-6 dark:border-white/10 dark:from-indigo-500/10 dark:via-transparent dark:to-violet-500/10">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Package Configuration</p>
                                <h3 className="mt-1 text-lg font-extrabold">{editing ? 'Edit Paket' : 'Paket Baru'}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Atur identitas, harga paket, dan modul layanan.</p>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-6 overflow-y-auto p-6">
                            <div>
                                <label className={label}>Nama paket *</label>
                                <input className={input} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Contoh: Ticketing" />
                                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={label}>Jenis pembayaran *</label>
                                    <select className={input} value={data.payment_type} onChange={(e) => setData('payment_type', e.target.value)}>
                                        {Object.entries(catalog.payment_types).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                {data.payment_type === 'revenue_share' && (
                                    <div>
                                        <label className={label}>Persentase bagi hasil (%) *</label>
                                        <input className={input} type="number" min={0} max={100} step="0.1" value={data.share_percent} onChange={(e) => setData('share_percent', e.target.value)} />
                                        {errors.share_percent && <p className="mt-1 text-xs text-rose-500">{errors.share_percent}</p>}
                                    </div>
                                )}
                                {data.payment_type === 'upfront' && (
                                    <div>
                                        <label className={label}>Harga paket (Rp) *</label>
                                        <input className={input} type="number" min={0} value={data.price} onChange={(e) => setData('price', e.target.value)} />
                                        {errors.price && <p className="mt-1 text-xs text-rose-500">{errors.price}</p>}
                                    </div>
                                )}
                            </div>

                            {data.payment_type === 'revenue_share' && (
                                <p className="-mt-3 text-sm text-slate-600 dark:text-slate-300">
                                    Contoh: penjualan Rp1.000.000 → bagian SIMPLE <b className="text-indigo-700 dark:text-indigo-300">{rp(example.share)}</b>, penyelenggara menerima{' '}
                                    <b className="text-indigo-700 dark:text-indigo-300">{rp(example.rest)}</b>. Biaya layanan dibayar pembeli terpisah.
                                </p>
                            )}

                            <div>
                                <div className="mb-2 flex items-end justify-between">
                                    <label className={label + ' mb-0'}>Modul layanan</label>
                                    <span className="text-xs text-slate-400">{data.modules.length} dipilih</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(catalog.modules).map(([k, m]) => {
                                        const on = data.modules.includes(k);
                                        return (
                                            <label key={k} className={`cursor-pointer rounded-xl border p-3.5 transition ${on ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-500/20' : 'border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-white/5'}`}>
                                                <span className="flex items-center gap-2.5 font-bold">
                                                    <input type="checkbox" checked={on} onChange={() => toggleModule(k)} className="h-4 w-4 accent-indigo-700" />
                                                    <span>{m.icon}</span> {m.label}
                                                </span>
                                                <span className="mt-1 block pl-7 text-xs text-slate-500 dark:text-slate-400">{m.description}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <label className={label + ' mb-0'}>Fitur paket</label>
                                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">{data.features.length} fitur dipilih</span>
                                </div>
                                {visibleGroups.map((g) => {
                                    const keys = groupKeys(g);
                                    if (keys.length === 0) return null;
                                    const count = keys.filter((k) => data.features.includes(k)).length;
                                    return (
                                        <div key={g} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/5">
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="font-bold">
                                                    {catalog.groups[g]} <span className="ml-1 text-xs font-medium text-slate-400">{count}/{keys.length}</span>
                                                </p>
                                                <button type="button" onClick={() => setGroup(g, count !== keys.length)} className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                    {count === keys.length ? 'Kosongkan' : 'Pilih semua'}
                                                </button>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {keys.map((k) => {
                                                    const on = data.features.includes(k);
                                                    return (
                                                        <label key={k} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${on ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-500/20' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800'}`}>
                                                            <input type="checkbox" checked={on} onChange={() => setData('features', toggle(data.features, k))} className="h-4 w-4 accent-indigo-700" />
                                                            <span className="flex-1">{catalog.features[k].label}</span>
                                                            {catalog.features[k].menu && (
                                                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">{catalog.features[k].menu}</span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Fitur yang tidak dicentang tidak termasuk dalam paket. Kelompok Ticketing, Voting, dan Lomba muncul mengikuti modul yang dicentang.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-white/5">
                                <div className="mb-4">
                                    <p className="font-bold">Add-on &amp; biaya tambahan</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Isi harga untuk mengaktifkan. Kosongkan jika tidak tersedia di paket ini.</p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <AddonField title="Sub-event tambahan" hint="Biaya per kegiatan di luar kuota paket." suffix=" / kegiatan"
                                        value={data.extra_sub_event_price} onChange={(v) => setData('extra_sub_event_price', v)} error={errors.extra_sub_event_price} />
                                    <AddonField title="Sistem penilaian" hint="Add-on sekali bayar untuk fitur penilaian." 
                                        value={data.assessment_addon_price} onChange={(v) => setData('assessment_addon_price', v)} error={errors.assessment_addon_price} />
                                    <AddonField title="Sertifikat otomatis" hint="Add-on sekali bayar untuk penerbitan sertifikat otomatis."
                                        value={data.certificate_addon_price} onChange={(v) => setData('certificate_addon_price', v)} error={errors.certificate_addon_price} />
                                </div>
                            </div>

                            <div>
                                <label className={label}>Deskripsi</label>
                                <textarea rows={3} maxLength={500} value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/90 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-slate-800" />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                                <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="h-4 w-4 accent-indigo-700" />
                                Paket aktif (bisa dipilih penyelenggara)
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200/70 p-5 dark:border-white/10">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
                                Batal
                            </button>
                            <button disabled={processing} className="rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60">
                                {editing ? 'Simpan Perubahan' : 'Buat Paket'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
