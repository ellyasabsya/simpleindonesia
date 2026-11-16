import { Link } from '@inertiajs/react';
import { ArrowRight, Check, Crown, Megaphone, Rocket, ThumbsUp, Ticket } from 'lucide-react';
import type { ComponentType } from 'react';

export type PackageCard = {
    id: number;
    name: string;
    slug: string;
    tagline: string | null;
    price: { main: string; note: string };
    specs: [string, string][];
    extends: string | null;
    features: string[];
    featured: boolean;
    join_url: string;
};

type Theme = {
    icon: ComponentType<{ className?: string }>;
    badge: string;
    desc: string;
    card: string;
    iconBox: string;
    pill: string;
    eyebrow: string;
    bar: string;
    check: string;
    btn: string;
};

const themes: Record<string, Theme> = {
    iklan: {
        icon: Megaphone,
        badge: 'Iklan',
        desc: 'Tampilkan event Anda di halaman utama dan kelola pendaftarannya.',
        card: 'border-emerald-200/80 from-emerald-50/80 dark:border-emerald-400/20 dark:from-emerald-500/10',
        iconBox: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
        pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20',
        eyebrow: 'text-emerald-600 dark:text-emerald-300',
        bar: 'bg-emerald-400',
        check: 'bg-emerald-500',
        btn: 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-400/40',
    },
    starter: {
        icon: Rocket,
        badge: 'Starter',
        desc: 'Untuk program kecil yang butuh check-in QR dan laporan gabungan.',
        card: 'border-sky-200/80 from-sky-50/80 dark:border-sky-400/20 dark:from-sky-500/10',
        iconBox: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
        pill: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/20',
        eyebrow: 'text-sky-600 dark:text-sky-300',
        bar: 'bg-sky-400',
        check: 'bg-sky-500',
        btn: 'bg-sky-600 hover:bg-sky-500 hover:shadow-sky-400/40',
    },
    professional: {
        icon: Crown,
        badge: 'Professional',
        desc: 'Operasional lengkap untuk series kegiatan, dari tiket sampai penilaian juri.',
        card: 'border-amber-300/80 from-amber-50/90 dark:border-amber-400/30 dark:from-amber-500/10',
        iconBox: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
        pill: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20',
        eyebrow: 'text-amber-600 dark:text-amber-300',
        bar: 'bg-amber-400',
        check: 'bg-amber-500',
        btn: 'bg-amber-600 hover:bg-amber-500 hover:shadow-amber-400/40',
    },
    ticketing: {
        icon: Ticket,
        badge: 'Ticketing',
        desc: 'Jual tiket online tanpa biaya di muka, bayar lewat bagi hasil.',
        card: 'border-indigo-200/80 from-indigo-50/80 dark:border-indigo-400/20 dark:from-indigo-500/10',
        iconBox: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
        pill: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/20',
        eyebrow: 'text-indigo-600 dark:text-indigo-300',
        bar: 'bg-indigo-400',
        check: 'bg-indigo-500',
        btn: 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-400/40',
    },
    'ticketing-voting': {
        icon: ThumbsUp,
        badge: 'Ticketing + Voting',
        desc: 'Tiket dan voting penonton dalam satu paket, bayar lewat bagi hasil.',
        card: 'border-violet-200/80 from-violet-50/80 dark:border-violet-400/20 dark:from-violet-500/10',
        iconBox: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
        pill: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/20',
        eyebrow: 'text-violet-600 dark:text-violet-300',
        bar: 'bg-violet-400',
        check: 'bg-violet-500',
        btn: 'bg-violet-600 hover:bg-violet-500 hover:shadow-violet-400/40',
    },
};

export const cardCss = `
@keyframes sp-rise{from{opacity:0;transform:translateY(26px) scale(.97)}to{opacity:1;transform:none}}
.sp-rise{animation:sp-rise .7s cubic-bezier(.2,.8,.2,1) both}
@media (prefers-reduced-motion:reduce){.sp-rise{animation:none!important}.sp-hide{opacity:1!important}}
`;

export default function PackageCardView({ p, index, show = true, maxFeatures = Infinity }: { p: PackageCard; index: number; show?: boolean; maxFeatures?: number }) {
    const t = themes[p.slug] ?? themes.ticketing;
    const Icon = t.icon;

    return (
        <article
            style={show ? { animationDelay: `${index * 110}ms` } : undefined}
            className={`${show ? 'sp-rise' : 'sp-hide opacity-0'} group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br via-white/80 to-white/90 p-4 shadow-sm backdrop-blur transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl dark:via-slate-900/60 dark:to-slate-900/70 ${t.card} ${
                p.featured ? 'ring-4 ring-amber-100 dark:ring-amber-500/10' : ''
            }`}
        >
            {p.featured && (
                <span className="absolute right-[-40px] top-6 w-40 rotate-45 bg-amber-500 py-1 text-center text-[10px] font-extrabold tracking-[0.2em] text-white shadow">
                    ★ POPULER
                </span>
            )}

            <div className="flex items-start justify-between gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${t.iconBox}`}>
                    <Icon className="h-4 w-4" />
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ${t.pill} ${p.featured ? 'mr-10' : ''}`}>
                    {t.badge}
                </span>
            </div>

            {p.tagline && <p className={`mt-2.5 text-[10px] font-bold uppercase tracking-[0.25em] ${t.eyebrow}`}>{p.tagline}</p>}
            <h3 className="mt-0.5 text-lg font-extrabold">Paket {p.name}</h3>

            <div className="mt-2 flex gap-3">
                <span className={`w-1 shrink-0 rounded-full ${t.bar}`} />
                <div>
                    <p className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{p.price.main}</span>
                        {p.price.note && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{p.price.note}</span>}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t.desc}</p>
                </div>
            </div>

            <div className="my-3 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent dark:via-white/15" />

            <dl className="grid grid-cols-2 gap-1.5">
                {p.specs.map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white/60 px-2.5 py-1.5 dark:bg-white/5 [&:last-child:nth-child(odd)]:col-span-2">
                        <dt className="text-[11px] text-slate-500 dark:text-slate-400">{k}</dt>
                        <dd className="text-xs font-bold text-slate-800 dark:text-slate-100">{v}</dd>
                    </div>
                ))}
            </dl>

            <ul className="mb-3 mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                {p.extends && <li className="col-span-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Semua fitur {p.extends}, ditambah:</li>}
                {p.features.length > maxFeatures && (
                    <li className="order-last col-span-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        +{p.features.length - maxFeatures} fitur lainnya
                    </li>
                )}
                {p.features.slice(0, maxFeatures).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${t.check}`}>
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                        {f}
                    </li>
                ))}
            </ul>

            <Link
                href={p.join_url}
                className={`group/btn mt-auto flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition duration-300 hover:shadow-lg active:scale-[.98] ${t.btn}`}
            >
                Mulai Sekarang
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </Link>
        </article>
    );
}
