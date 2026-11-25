import { Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Check, MapPin, Pencil, UserPlus, Users } from 'lucide-react';
import ProfilMobile from '@/components/mobile/pages/profil-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import UserLayout from '@/components/user/user-layout';
import { SocialChips } from '@/lib/socials';

type P = { id: number; name: string; username: string; avatar?: string | null; bio?: string | null; city?: string | null; socials?: Record<string, string>; created_at?: string };
type Props = { person: P; isMe: boolean; isFriend: boolean; since?: string | null; friendsCount: number };
const d = (s: string, o: Intl.DateTimeFormatOptions) => new Date(s).toLocaleDateString('id-ID', o);

export default function Show({ person, isMe, isFriend, since, friendsCount }: Props) {
    const ini = person.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    const phone = usePhone();

    if (phone) {
        return (
            <UserLayout title={person.name} hasPanel>
                <ProfilMobile
                    person={person}
                    isMe={isMe}
                    isFriend={isFriend}
                    since={since ? d(since, { month: 'short', year: 'numeric' }) : null}
                    joined={person.created_at ? d(person.created_at, { month: 'long', year: 'numeric' }) : null}
                    friendsCount={friendsCount}
                />
            </UserLayout>
        );
    }

    return (
        <UserLayout title={person.name} hasPanel>
            <Link href="/dashboard" className="flex w-fit items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-white dark:bg-white/10"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
            <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
                <div className="relative h-28 bg-gradient-to-r from-indigo-900 via-blue-600 to-fuchsia-500 sm:h-32">
                    {person.avatar && <img src={person.avatar} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl" />}
                    <span className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
                </div>
                <div className="px-6 pb-7 sm:px-8">
                    <div className="relative z-10 -mt-14 flex flex-wrap items-end justify-between gap-4">
                        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-blue-600 to-violet-600 text-4xl font-extrabold text-white shadow-2xl ring-4 ring-white dark:ring-slate-900">
                            {person.avatar ? <img src={person.avatar} alt={person.name} className="h-full w-full object-cover" /> : ini}
                        </div>
                        {isMe ? (
                            <Link href="/profil/edit" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md"><Pencil className="h-4 w-4" /> Edit profil</Link>
                        ) : isFriend ? (
                            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-5 py-2.5 text-sm font-extrabold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"><Check className="h-4 w-4" /> Teman{since ? ` sejak ${d(since, { month: 'short', year: 'numeric' })}` : ''}</span>
                        ) : (
                            <button onClick={() => router.post('/teman', { code: person.username }, { preserveScroll: true })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md"><UserPlus className="h-4 w-4" /> Tambah teman</button>
                        )}
                    </div>
                    <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl"><span className="title-gradient">{person.name}</span></h1>
                    <p className="mt-0.5 text-sm font-semibold text-slate-500">@{person.username}</p>
                    {person.bio && <p className="mt-3 max-w-2xl leading-relaxed text-slate-600 dark:text-slate-300">{person.bio}</p>}
                    <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                        {person.city && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10"><MapPin className="h-3.5 w-3.5 text-rose-500" /> {person.city}</span>}
                        <SocialChips socials={person.socials} />
                        {person.created_at && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10"><CalendarDays className="h-3.5 w-3.5 text-indigo-500" /> Bergabung {d(person.created_at, { month: 'long', year: 'numeric' })}</span>}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/10"><Users className="h-3.5 w-3.5 text-emerald-600" /> {friendsCount} teman</span>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
