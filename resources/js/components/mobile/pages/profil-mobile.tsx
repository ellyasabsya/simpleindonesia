import { router } from '@inertiajs/react';
import { CalendarDays, Check, MapPin, Pencil, UserPlus, Users } from 'lucide-react';
import { SocialChips } from '@/lib/socials';
import Button from '../kit/button';
import { CARD, FIELD, MUTED } from '../kit/soft';

type P = { name: string; username: string; avatar?: string | null; bio?: string | null; city?: string | null; socials?: Record<string, string> };
type Props = { person: P; isMe: boolean; isFriend: boolean; since: string | null; joined: string | null; friendsCount: number };

const chip = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ' + FIELD;

/** Profil orang lain untuk HP: sama dengan gaya halaman Profil sendiri. Dibungkus UserLayout oleh halamannya. */
export default function ProfilMobile({ person, isMe, isFriend, since, joined, friendsCount }: Props) {
    const ini = person.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

    return (
        <div className="space-y-5 pb-4">
            <div className="flex flex-col items-center text-center">
                {person.avatar ? (
                    <img src={person.avatar} alt={person.name} className="size-[88px] rounded-full object-cover" />
                ) : (
                    <span className="flex size-[88px] items-center justify-center rounded-full bg-indigo-600 text-[32px] font-semibold text-white">{ini}</span>
                )}
                <h1 className="mt-3 text-[22px] leading-tight font-semibold tracking-tight">{person.name}</h1>
                <p className={'text-sm ' + MUTED}>@{person.username}</p>
                {person.bio && <p className={'mt-2 max-w-xs text-[13px] leading-relaxed ' + MUTED}>{person.bio}</p>}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {person.city && (
                        <span className={chip}>
                            <MapPin className="size-3.5 text-indigo-600 dark:text-indigo-300" />
                            {person.city}
                        </span>
                    )}
                    {joined && (
                        <span className={chip}>
                            <CalendarDays className="size-3.5 text-indigo-600 dark:text-indigo-300" />
                            Bergabung {joined}
                        </span>
                    )}
                    <span className={chip}>
                        <Users className="size-3.5 text-indigo-600 dark:text-indigo-300" />
                        {friendsCount} teman
                    </span>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <SocialChips socials={person.socials} />
                </div>
            </div>

            {isMe ? (
                <Button full href="/profil/edit" icon={Pencil}>
                    Edit profil
                </Button>
            ) : isFriend ? (
                <p className={'flex items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 ' + CARD}>
                    <Check className="size-4" />
                    Teman{since ? ' sejak ' + since : ''}
                </p>
            ) : (
                <Button full icon={UserPlus} onClick={() => router.post('/teman', { code: person.username }, { preserveScroll: true })}>
                    Tambah teman
                </Button>
            )}
        </div>
    );
}
