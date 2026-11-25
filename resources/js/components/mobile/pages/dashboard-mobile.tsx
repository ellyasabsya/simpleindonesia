import { Link, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { Bell, Cake, CalendarCheck, CalendarDays, Check, Copy, Gavel, History, Mail, MapPin, Pencil, Phone, QrCode, ScanLine, Sparkles, Ticket, UserPlus, Users, Vote } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Pager } from '@/lib/pager';
import { SocialChips } from '@/lib/socials';
import Button from '../kit/button';
import EmptyState from '../kit/empty-state';
import Segmented from '../kit/segmented';
import Sheet from '../kit/sheet';
import { Row, Section } from '../kit/section';
import { CARD, MUTED } from '../kit/soft';

type Tab = 'riwayat' | 'teman' | 'undangan';
type Role = 'peserta' | 'penyelenggara' | 'juri';

const ROLE = {
    peserta: { label: 'Peserta', icon: CalendarCheck, tint: '#E11D48' },
    penyelenggara: { label: 'Penyelenggara', icon: CalendarDays, tint: '#4F46E5' },
    juri: { label: 'Juri', icon: Gavel, tint: '#D97706' },
} as const;

const QUICK = [
    { label: 'Event', sub: 'Jelajahi semua event', href: '/events', icon: CalendarDays, tint: '#4F46E5' },
    { label: 'Event saya', sub: 'Event yang Anda ikuti', href: '/event-saya', icon: CalendarCheck, tint: '#E11D48' },
    { label: 'Tiket saya', sub: 'Tiket yang Anda beli', href: '/tiket', icon: Ticket, tint: '#D97706' },
    { label: 'Voting', sub: 'Berikan suara favorit', href: '/voting', icon: Vote, tint: '#059669' },
];

const INFO_TINT: Record<string, string> = { Email: '#4F46E5', Telepon: '#059669', Kota: '#DC2626', Lahir: '#D97706' };
const KINDS: Record<string, string> = { juri: 'Undangan menjadi juri', event: 'Undangan event', teman: 'Permintaan pertemanan', lembaga: 'Undangan bergabung ke lembaga' };
const KIND_ICON: Record<string, typeof Bell> = { juri: Gavel, teman: UserPlus, event: CalendarDays, lembaga: CalendarDays };
const KIND_TINT: Record<string, string> = { juri: '#D97706', teman: '#059669', event: '#4F46E5', lembaga: '#4F46E5' };

function Avatar({ name, src, size }: { name: string; src?: string | null; size: number }) {
    const ini = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    const style = { width: size, height: size };
    return src ? (
        <img src={src} alt={name} style={style} className="shrink-0 rounded-full object-cover" />
    ) : (
        <span style={{ ...style, fontSize: size * 0.38 }} className="flex shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
            {ini}
        </span>
    );
}

/** Halaman profil peserta untuk HP: daftar bergrup native, tanpa banner dan kartu ala web. */
export default function DashboardMobile(p: any) {
    const [sheet, setSheet] = useState<null | 'qr' | 'scan'>(null);
    const [scanned, setScanned] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const { user, name, isJudge, judgeTasks, lembagaReady, shareUrl, joined, pct, info, tab, setTab, filter, setFilter, count, friendList, invites, years, hp, fp, ip, answer, fmt, renderScanner } = p;

    const closeSheet = () => {
        setSheet(null);
        setScanned(null);
    };
    const copy = () => {
        navigator.clipboard?.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const surface = 'rounded-3xl ' + CARD;
    const accent = 'text-indigo-700 dark:text-indigo-300';
    const muted = MUTED;

    const stats: { key: Role | 'teman'; label: string; n: number }[] = [
        { key: 'peserta', label: 'Peserta', n: count('peserta') },
        { key: 'penyelenggara', label: 'Penyelenggara', n: count('penyelenggara') },
        { key: 'juri', label: 'Juri', n: count('juri') },
        { key: 'teman', label: 'Teman', n: friendList.length },
    ];
    const pickStat = (k: Role | 'teman') => {
        if (k === 'teman') return setTab('teman');
        setTab('riwayat');
        setFilter(filter === k ? 'semua' : k);
    };

    return (
        <div className="space-y-6 pb-4">
            <div className="flex flex-col items-center text-center">
                <Avatar name={name} src={user.avatar} size={88} />
                <h1 className="mt-3 text-[22px] leading-tight font-semibold tracking-tight">{name}</h1>
                {user.username && <p className={`text-sm ${muted}`}>@{user.username}</p>}
                {user.bio ? (
                    <p className={`mt-2 max-w-xs text-[13px] leading-relaxed ${muted}`}>{user.bio}</p>
                ) : (
                    <Link href="/profil/edit" className={`mt-2 text-sm ${accent}`}>
                        Belum ada bio. Ceritakan siapa Anda
                    </Link>
                )}
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <SocialChips socials={user.socials} />
                </div>
                {joined && <p className={`mt-2 text-xs ${muted}`}>Bergabung {joined}</p>}
            </div>

            <div className={`grid grid-cols-4 py-3 ${surface}`}>
                {stats.map((s) => {
                    const on = tab === 'riwayat' && filter === s.key;
                    return (
                        <button key={s.key} type="button" onClick={() => pickStat(s.key)} className="flex flex-col items-center gap-0.5 active:opacity-60">
                            <span className={`text-[17px] font-semibold ${on ? accent : ''}`}>{s.n}</span>
                            <span className={`text-[11px] ${on ? accent : muted}`}>{s.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2">
                <Button full href="/profil/edit" icon={Pencil}>
                    Edit profil
                </Button>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Button full variant="tonal" icon={QrCode} onClick={() => setSheet('qr')}>
                            Kartu QR
                        </Button>
                    </div>
                    <div className="flex-1">
                        <Button full variant="tonal" icon={ScanLine} onClick={() => setSheet('scan')}>
                            Pindai
                        </Button>
                    </div>
                </div>
            </div>

            {isJudge && (
                <Section>
                    <Row icon={Gavel} tint="#D97706" label={judgeTasks > 0 ? 'Mulai menilai' : 'Panel juri'} sub={judgeTasks > 0 ? `${judgeTasks} tugas penilaian` : undefined} href="/juri-saya" badge={judgeTasks} />
                </Section>
            )}

            <Section title="Menu">
                {QUICK.map((q) => (
                    <Row key={q.label} icon={q.icon} tint={q.tint} label={q.label} sub={q.sub} href={q.href} />
                ))}
            </Section>

            <Section title="Data diri" footer={pct < 100 ? `Profil ${pct}% lengkap` : undefined}>
                {info.map((i: any) => (
                    <Row key={i.label} icon={i.icon} tint={INFO_TINT[i.label] ?? '#64748B'} label={i.label} value={i.value || 'Tambah'} href={i.value ? undefined : '/profil/edit'} />
                ))}
            </Section>

            <div className="space-y-4">
                <Segmented<Tab>
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: 'riwayat', label: 'Riwayat' },
                        { value: 'teman', label: 'Teman' },
                        { value: 'undangan', label: 'Undangan', badge: invites.length },
                    ]}
                />

                {tab === 'riwayat' && (
                    <div className="space-y-5">
                        {filter !== 'semua' && (
                            <Section>
                                <Row icon={History} tint="#64748B" label={`Filter: ${ROLE[filter as Role].label}`} value="Hapus" onClick={() => setFilter('semua')} />
                            </Section>
                        )}
                        {hp.rows.length === 0 ? (
                            <EmptyState
                                icon={History}
                                title="Belum ada riwayat"
                                text="Event yang Anda ikuti, selenggarakan, atau nilai akan muncul di sini."
                                action={
                                    <Button variant="tonal" href={lembagaReady ? '/panel/ajukan' : '/lembaga/daftar'}>
                                        Ajukan event
                                    </Button>
                                }
                            />
                        ) : (
                            years.map((y: string) => (
                                <Section key={y} title={y}>
                                    {hp.rows
                                        .filter((i: any) => i.date.startsWith(y))
                                        .map((i: any) => {
                                            const r = ROLE[i.role as Role];
                                            return (
                                                <Row
                                                    key={`${i.role}-${i.id}`}
                                                    icon={r.icon}
                                                    tint={r.tint}
                                                    label={i.title}
                                                    sub={[i.subtitle, fmt(i.date)].filter(Boolean).join(' · ')}
                                                    value={i.status}
                                                    href={i.href}
                                                />
                                            );
                                        })}
                                </Section>
                            ))
                        )}
                        <Pager {...hp} />
                    </div>
                )}

                {tab === 'teman' && (
                    <div className="space-y-4">
                        {friendList.length === 0 ? (
                            <EmptyState icon={Users} title="Belum ada teman" text="Pindai QR teman atau tunjukkan QR Anda untuk mulai terhubung." />
                        ) : (
                            <Section>
                                {fp.rows.map((f: any) => (
                                    <Row
                                        key={f.id}
                                        leading={<Avatar name={f.name} src={f.avatar} size={40} />}
                                        label={f.name}
                                        sub={[f.username ? `@${f.username}` : null, f.city].filter(Boolean).join(' · ')}
                                        href={f.username ? `/u/${f.username}` : undefined}
                                    />
                                ))}
                            </Section>
                        )}
                        <Pager {...fp} />
                    </div>
                )}

                {tab === 'undangan' && (
                    <div className="space-y-4">
                        {invites.length === 0 ? (
                            <EmptyState icon={Bell} title="Tidak ada undangan" text="Undangan juri, event, dan pertemanan akan masuk ke sini." />
                        ) : (
                            ip.rows.map((i: any) => (
                                <Section key={i.id} title={KINDS[i.kind]}>
                                    <Row icon={KIND_ICON[i.kind] ?? CalendarDays} tint={KIND_TINT[i.kind] ?? '#4F46E5'} label={i.from} sub={[i.title, i.date ? fmt(i.date) : null].filter(Boolean).join(' · ')} />
                                    <div className="flex gap-2 p-3">
                                        <div className="flex-1">
                                            <Button full variant="tonal" onClick={() => answer(i, false)}>
                                                Tolak
                                            </Button>
                                        </div>
                                        <div className="flex-1">
                                            <Button full icon={Check} onClick={() => answer(i, true)}>
                                                Terima
                                            </Button>
                                        </div>
                                    </div>
                                </Section>
                            ))
                        )}
                        <Pager {...ip} />
                    </div>
                )}
            </div>

            <Section footer="Daftarkan lembaga, ajukan event, tayang setelah diperiksa admin.">
                <Row icon={Sparkles} tint="#7C3AED" label="Punya acara? Buat event sendiri" value={undefined} href={lembagaReady ? '/panel' : '/lembaga/daftar'} sub={lembagaReady ? 'Buka panel lembaga' : 'Daftar lembaga'} />
            </Section>

            <Sheet open={sheet === 'qr'} onClose={closeSheet} title="Kartu QR saya">
                <div className="flex flex-col items-center gap-3 pb-2">
                    <Avatar name={name} src={user.avatar} size={56} />
                    <p className="text-[17px] font-semibold">{name}</p>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <QRCodeSVG value={shareUrl} size={200} level="M" />
                    </div>
                    <p className={`text-center text-xs ${muted}`}>Minta teman memindai kode ini untuk terhubung.</p>
                    <div className="w-full">
                        <Button full variant="tonal" icon={copied ? Check : Copy} onClick={copy}>
                            {copied ? 'Tersalin' : 'Salin tautan profil'}
                        </Button>
                    </div>
                </div>
            </Sheet>

            <Sheet open={sheet === 'scan'} onClose={closeSheet} title="Pindai QR teman">
                {scanned ? (
                    <div className="space-y-4 text-center">
                        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                            <Check className="size-6" />
                        </span>
                        <p className="font-semibold">Kode terbaca</p>
                        <p className={`break-all rounded-xl p-3 text-xs ${surface} ${muted}`}>{scanned}</p>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Button full variant="tonal" onClick={() => setScanned(null)}>
                                    Ulang
                                </Button>
                            </div>
                            <div className="flex-1">
                                <Button full icon={UserPlus} onClick={() => router.post('/teman', { code: scanned }, { onSuccess: closeSheet })}>
                                    Tambah
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    (renderScanner(setScanned) as ReactNode)
                )}
            </Sheet>
        </div>
    );
}
