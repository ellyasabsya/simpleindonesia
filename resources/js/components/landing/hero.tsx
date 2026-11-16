import { useAuth } from '@/lib/auth';
import { Link, usePage } from '@inertiajs/react';
import { goTo } from '@/lib/scroll';
import { ArrowRight, CalendarDays, MapPin, Megaphone, Star, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { events as sampleEvents } from '@/data/events';

function FloatingCard({
    icon: Icon,
    title,
    subtitle,
    color,
    className,
}: {
    icon: typeof Star;
    title: string;
    subtitle: string;
    color: string;
    className: string;
}) {
    return (
        <div
            className={`absolute z-10 hidden w-44 items-center gap-3 rounded-2xl border border-white/60 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex dark:border-white/10 dark:bg-slate-800/95 ${className}`}
        >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${color}`}>
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-tight text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
        </div>
    );
}

type SlideEvent = { title: string; poster: string; category: string; location: string; date: string };

type HomeEvent = {
    id: number;
    title: string;
    poster: string | null;
    category: string | null;
    location: string | null;
    starts_at: string | null;
    ends_at: string | null;
};

const fmtDay = (d: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${d}T00:00:00`));

function slideDate(start: string | null, end: string | null): string {
    if (!start && !end) return '';
    if (!start || !end || start === end) return fmtDay((start ?? end)!);
    return `${fmtDay(start)} – ${fmtDay(end)}`;
}

function PhoneCarousel() {
    const [index, setIndex] = useState(0);
    const real = usePage<{ heroEvents?: HomeEvent[] }>().props.heroEvents ?? [];
    const events: SlideEvent[] = real.length
        ? real.map((e) => ({
              title: e.title,
              poster: e.poster ?? '',
              category: e.category ?? '',
              location: e.location ?? '',
              date: slideDate(e.starts_at, e.ends_at),
          }))
        : sampleEvents;
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const timer = setInterval(() => setIndex((i) => (i + 1) % events.length), 4000);
        return () => clearInterval(timer);
    }, [paused, events.length]);

    return (
        <div
            className="relative w-[270px] overflow-hidden rounded-[2.8rem] border-[10px] border-slate-900 bg-white shadow-2xl shadow-indigo-900/30 dark:border-slate-700 dark:bg-slate-900"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />

            <div className="overflow-hidden">
                <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                >
                    {events.map((event) => (
                        <div key={event.title} className="w-full shrink-0">
                            {/* Poster rasio 4:5 */}
                            <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-indigo-900 via-blue-700 to-purple-600">
                                <img
                                    src={event.poster}
                                    alt={event.title}
                                    className={`absolute inset-0 h-full w-full object-cover ${event.poster ? '' : 'hidden'}`}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <span className="absolute left-3 top-9 rounded-full bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
                                    {event.category}
                                </span>
                            </div>

                            <div className="space-y-1.5 px-4 pb-3 pt-3">
                                <p className="text-base font-black leading-tight text-slate-900 dark:text-white">
                                    {event.title}
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                    {event.location}
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
                                    {event.date}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-4 pb-4">
                <div className="mb-3 flex justify-center gap-1.5">
                    {events.map((event, i) => (
                        <button
                            key={event.title}
                            aria-label={`Tampilkan ${event.title}`}
                            onClick={() => setIndex(i)}
                            className={`h-1.5 rounded-full transition-all ${
                                i === index ? 'w-5 bg-indigo-700 dark:bg-indigo-400' : 'w-1.5 bg-slate-300 dark:bg-slate-600'
                            }`}
                        />
                    ))}
                </div>
                <div className="rounded-xl bg-indigo-900 py-2.5 text-center text-sm font-bold text-white dark:bg-indigo-500">
                    Beli Tiket
                </div>
            </div>
        </div>
    );
}

export default function Hero() {
    const { user, dashboardUrl } = useAuth();
    return (
        <section
            id="hero"
            className="relative overflow-hidden pt-20"
        >

            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_1.15fr] lg:py-24">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-indigo-900 shadow-sm dark:bg-white/10 dark:text-white">
                        <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        Beranda
                    </span>

                    <h1 className="mt-8 text-5xl font-black leading-[1.1] text-slate-900 md:text-7xl dark:text-white">
                        Kelola Event Lebih{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
                            Cerdas
                        </span>
                    </h1>

                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                        Platform all-in-one untuk mengatur pendaftaran peserta, penilaian juri, dan publikasi event
                        seminar, festival, serta perlombaan Anda.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href={user ? dashboardUrl : "/register"}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-900 to-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-600/30 transition hover:scale-[1.02]"
                        >
                            {user ? "Buka Dashboard" : "Mulai Sekarang"} <ArrowRight className="h-5 w-5" />
                        </Link>
                        <a
                            href="#event" onClick={(e) => goTo(e, "event")}
                            className="rounded-2xl bg-white px-8 py-4 font-bold text-slate-900 shadow transition hover:bg-slate-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            Pelajari Fitur
                        </a>
                    </div>

                    <p className="mt-10 inline-block rounded-full bg-white px-6 py-3 text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
                        Dipercaya oleh <b>500+</b> Organizer
                    </p>
                </div>

                {/* Sisi kanan: HP di tengah, kartu di kiri dan kanan agar tidak menutupi poster */}
                <div className="relative mx-auto flex min-h-[560px] w-full max-w-[640px] items-center justify-center">
                    <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-600/30" />

                    <PhoneCarousel />

                    <FloatingCard
                        icon={UserPlus}
                        title="Pendaftaran Peserta"
                        subtitle="Terkumpul rapi"
                        color="bg-blue-600"
                        className="float-a left-0 top-16"
                    />
                    <FloatingCard
                        icon={Star}
                        title="Penilaian Juri"
                        subtitle="Skor langsung masuk"
                        color="bg-purple-500"
                        className="float-b right-0 top-[42%]"
                    />
                    <FloatingCard
                        icon={Megaphone}
                        title="Publikasi Event"
                        subtitle="Tayang setelah diperiksa"
                        color="bg-orange-500"
                        className="float-c bottom-14 left-0"
                    />
                </div>
            </div>
        </section>
    );
}
