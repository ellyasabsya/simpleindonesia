import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Package as PackageIcon, Percent } from 'lucide-react';
import Footer from '@/components/landing/footer';
import PackageCardView, { cardCss, type PackageCard } from '@/components/landing/package-card';
import PageBackground from '@/components/page-background';

const chip =
    'inline-flex items-center gap-2.5 rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100';

export default function Paket() {
    const { packages = [] } = usePage<{ packages?: PackageCard[] }>().props;
    const hasShare = packages.some((p) => p.price.note === 'bagi hasil');

    return (
        <>
            <Head title="Semua Paket - SIMPLE" />
            <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
                <PageBackground />
                <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-700 to-blue-600 text-lg font-extrabold text-white shadow-md">S</span>
                        <span className="text-2xl font-extrabold tracking-[0.25em] text-indigo-900 dark:text-white">SIMPLE</span>
                    </Link>
                    <Link href="/dashboard" className="rounded-full bg-indigo-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 hover:bg-indigo-800">
                        Dashboard
                    </Link>
                </header>
                <div className="relative z-10">
                    <style>{cardCss}</style>
                    <main className="mx-auto max-w-7xl px-6 pb-24 pt-4">
                        <div className="grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,48rem)_1fr]">
                            <div className="flex lg:justify-start">
                                <Link
                                    href="/"
                                    className="group inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-bold text-indigo-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 dark:text-white"
                                >
                                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                                    Kembali
                                </Link>
                            </div>

                            <div className="text-center">
                                <p className="text-xs font-bold uppercase tracking-[0.5em] text-pink-500">Paket SIMPLE</p>
                                <h1 className="title-gradient mt-4 text-5xl font-extrabold tracking-tight md:text-7xl">Semua Paket</h1>
                                <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-slate-300">
                                    Bandingkan seluruh pilihan paket untuk event Anda, mulai dari tampil di beranda, ticketing, voting, sampai operasional lengkap.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
                                <span className={chip}>
                                    <PackageIcon className="h-5 w-5 text-orange-500" />
                                    {packages.length} paket
                                </span>
                                {hasShare && (
                                    <span className={chip}>
                                        <Percent className="h-5 w-5 text-orange-500" />
                                        Bagi hasil tersedia
                                    </span>
                                )}
                            </div>
                        </div>

                        {packages.length === 0 ? (
                            <p className="mt-16 rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                                Paket belum tersedia.
                            </p>
                        ) : (
                            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {packages.map((p, i) => (
                                    <PackageCardView key={p.id} p={p} index={i} />
                                ))}
                            </div>
                        )}
                    </main>
                    <Footer />
                </div>
            </div>
        </>
    );
}
