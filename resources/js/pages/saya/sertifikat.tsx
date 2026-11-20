import { Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Award, ChevronRight, Search } from 'lucide-react';
import SertifikatMobile from '@/components/mobile/pages/sertifikat-mobile';
import UserLayout from '@/components/user/user-layout';

type Item = {
    id: number; event: string; label: string; category: string; number: string;
    name: string; year: number | null; date: string | null; valid: boolean; url: string;
};

type Props = {
    items: Item[]; total: number; owned: number; years: number[];
    types: Record<string, string>;
    f: { cari: string; tahun: number; jenis: string };
    filtered: boolean; page: number; pages: number;
    prevUrl: string | null; nextUrl: string | null;
};

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-500/30';
const pagerBtn = 'inline-flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20';
const pagerOff = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-400 opacity-50 dark:text-slate-500';

export default function Sertifikat({ items, total, owned, years, types, f, filtered, page, pages, prevUrl, nextUrl }: Props) {
    const [cari, setCari] = useState(f.cari ?? '');
    const [tahun, setTahun] = useState(f.tahun ? String(f.tahun) : '');
    const [jenis, setJenis] = useState(f.jenis ?? '');
    const typeList = Object.entries(types ?? {});

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const q: Record<string, string> = {};
        if (cari.trim()) q.cari = cari.trim();
        if (tahun) q.tahun = tahun;
        if (jenis) q.jenis = jenis;
        router.get('/sertifikat-saya', q, { preserveScroll: true });
    };

    return (
        <UserLayout title="Sertifikat Saya">
            <div className="md:hidden">
                <SertifikatMobile items={items} total={total} owned={owned} years={years} types={types} f={f} filtered={filtered} page={page} pages={pages} prevUrl={prevUrl} nextUrl={nextUrl} />
            </div>
            <div className="hidden md:contents">
            <div className="w-full space-y-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-300">
                    <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold">Sertifikat saya</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-300">{owned} sertifikat atas akun Anda.</p>
                </div>

                {owned > 0 && (
                    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_9rem_12rem_auto]">
                        <input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari event, nomor, atau nama" maxLength={100} className={field + ' sm:col-auto'} />
                        <select value={tahun} onChange={(e) => setTahun(e.target.value)} aria-label="Tahun" className={field}>
                            <option value="">Semua tahun</option>
                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={jenis} onChange={(e) => setJenis(e.target.value)} aria-label="Jenis sertifikat" className={field}>
                            <option value="">Semua jenis</option>
                            {typeList.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/20 transition hover:brightness-110">
                            <Search className="h-4 w-4" /> Cari
                        </button>
                    </form>
                )}

                {filtered && (
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                        {total} hasil. <Link href="/sertifikat-saya" className="font-bold text-indigo-600 hover:underline dark:text-indigo-300">Hapus filter</Link>
                    </p>
                )}

                {items.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-white/10">
                        <Award className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 font-bold">{owned === 0 ? 'Belum ada sertifikat' : 'Tidak ada hasil'}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                            {owned === 0
                                ? 'Sertifikat dari event yang Anda ikuti akan muncul di sini.'
                                : 'Tidak ada sertifikat yang cocok dengan pencarian atau filter Anda.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((it) => (
                            <a
                                key={it.id}
                                href={it.url}
                                className="group flex items-center gap-4 rounded-2xl border border-white/70 bg-white p-4 shadow-lg shadow-indigo-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-900/20 dark:border-white/10 dark:bg-slate-900"
                            >
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                                    <Award className="h-6 w-6" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-lg font-extrabold leading-tight">{it.event}</span>
                                    <span className="block truncate text-sm text-slate-500 dark:text-slate-300">
                                        {it.label} &middot; {it.number}{it.date ? ' · ' + it.date : ''}
                                    </span>
                                </span>
                                <span className={'shrink-0 rounded-full px-3 py-1 text-xs font-bold ' + (it.valid
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300')}>
                                    {it.valid ? 'Berlaku' : 'Tidak berlaku'}
                                </span>
                                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                            </a>
                        ))}
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-sm text-slate-500 dark:text-slate-300">
                        {prevUrl ? <Link href={prevUrl} className={pagerBtn}><ArrowLeft className="h-4 w-4" /> Sebelumnya</Link> : <span className={pagerOff}><ArrowLeft className="h-4 w-4" /> Sebelumnya</span>}
                        <span>Halaman {page} dari {pages}</span>
                        {nextUrl ? <Link href={nextUrl} className={pagerBtn}>Berikutnya <ArrowRight className="h-4 w-4" /></Link> : <span className={pagerOff}>Berikutnya <ArrowRight className="h-4 w-4" /></span>}
                    </div>
                )}
            </div>
        </div>
        </UserLayout>
    );
}
