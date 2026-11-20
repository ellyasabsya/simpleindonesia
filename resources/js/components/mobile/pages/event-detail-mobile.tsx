import { Link, router, useForm } from '@inertiajs/react';
import { Building2, CalendarCheck, CalendarDays, Check, ChevronLeft, Clock, FileText, Flag, Info, Layers, Mail, MapPin, MessageCircle, Phone, Share2, Tag, Ticket, Trash2, Trophy, Users } from 'lucide-react';
import type { ComponentType, FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { feeRange } from '@/lib/fee-label';
import Button from '../kit/button';
import EmptyState from '../kit/empty-state';
import { Row, Section } from '../kit/section';
import { usePlatform } from '../use-platform';

type Icon = ComponentType<{ className?: string }>;
type StatusKey = 'selesai' | 'segera' | 'berlangsung';
type Contact = { name?: string; position?: string; phone?: string; email?: string } | null;

type Child = {
    id: number;
    title: string;
    category: string | null;
    location: string | null;
    starts_at: string | null;
    ends_at: string | null;
    juknis: string | null;
    registration_fee: number;
    registration_fee_min?: number;
    registration_fee_max?: number;
    ticket_price?: number | null;
    ticket_open?: boolean;
    ticket_left?: number | null;
    description?: string | null;
    contact?: Contact;
    registration_method?: 'ticket' | 'transfer_manual' | null;
    slug: string;
    poster: string | null;
    quota: number;
    registered: number;
};
type CommentItem = { id: number; body: string; author: string; created_at: string; mine: boolean; reported: boolean };
type Detail = {
    id: number;
    title: string;
    poster: string | null;
    category: string | null;
    organizer: string | null;
    location: string | null;
    starts_at: string | null;
    ends_at: string | null;
    status: { key: StatusKey; label: string };
    description: string | null;
    registration_fee: number;
    registration_fee_min?: number;
    registration_fee_max?: number;
    registration_method: 'ticket' | 'transfer_manual' | null;
    juknis: string | null;
    contact: Contact;
    children: Child[];
    comments: CommentItem[];
    fee_from?: boolean;
    parent?: { title: string; slug: string } | null;
    siblings?: { id: number; title: string; slug: string }[];
};
type Participants = {
    registered: number;
    approved: number;
    branches: {
        id: string;
        title: string;
        subtitle: string | null;
        quota: number;
        registered: number;
        approved: number;
        names: { name: string; school: string | null }[];
        info?: { min_age: number | null; max_age: number | null; requirements: string | null; prizes: { rank: string; prize: string }[] };
    }[];
};
type Cta = { label: string; Icon: Icon; href: string };
type Tab = 'kegiatan' | 'info' | 'hadiah' | 'peserta' | 'kontak';

type Props = {
    event: Detail;
    parts?: Participants;
    hasHadiah: boolean;
    cta: Cta;
    statusText: string;
    statusDot: string;
    share: () => void;
    copied: boolean;
};

const longDate = (s: string) => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${s}T00:00:00`));
const shortDate = (s: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${s}T00:00:00`));
const stamp = (iso: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
const mapUrl = (loc: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
const money = (n: number) => (n > 0 ? `Rp${new Intl.NumberFormat('id-ID').format(n)}` : 'Gratis');
const waLink = (phone: string) => {
    const d = phone.replace(/\D/g, '');
    return `https://wa.me/${d.startsWith('0') ? `62${d.slice(1)}` : d}`;
};
function dayCount(start: string | null, end: string | null) {
    if (!start) return null;
    if (!end) return 1;
    const diff = Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000);
    return Math.max(diff, 0) + 1;
}

function useStyle() {
    const ios = usePlatform() === 'ios';
    return {
        ios,
        muted: ios ? 'text-black/50 dark:text-white/50' : 'text-[#49454f] dark:text-[#cac4d0]',
        accent: ios ? 'text-[#007AFF] dark:text-[#0A84FF]' : 'text-[#6750A4] dark:text-[#d0bcff]',
        surface: ios ? 'rounded-[12px] bg-white dark:bg-[#1c1c1e]' : 'rounded-[20px] bg-[#f3edf7] dark:bg-[#211f26]',
        field: ios ? 'rounded-[10px] bg-black/[0.06] dark:bg-white/10' : 'rounded-2xl bg-[#ece6f0] dark:bg-[#2b2930]',
    };
}

/** Baris informasi yang boleh turun ke baris berikutnya (nilai panjang seperti alamat tidak terpotong). */
function InfoRow({ icon: Icon, tint, label, value, href }: { icon: Icon; tint: string; label: string; value: ReactNode; href?: string }) {
    const { ios, muted } = useStyle();
    const cls = `flex w-full items-center gap-3 px-4 py-2.5 text-left ${ios ? 'min-h-11 text-[17px] text-black dark:text-white' : 'min-h-14 gap-4 text-base text-[#1d1b20] dark:text-[#e6e0e9]'}`;
    const lead = ios ? (
        <span style={{ backgroundColor: tint }} className="flex size-[30px] shrink-0 items-center justify-center rounded-[7px] text-white">
            <Icon className="size-[18px]" />
        </span>
    ) : (
        <span style={{ backgroundColor: `${tint}22`, color: tint }} className="flex size-10 shrink-0 items-center justify-center rounded-full">
            <Icon className="size-5" />
        </span>
    );
    const body = (
        <>
            {lead}
            <span className="min-w-0 flex-1">
                <span className={`block text-xs ${muted}`}>{label}</span>
                <span className="block break-words">{value}</span>
            </span>
        </>
    );
    return href ? (
        <a href={href} className={cls}>
            {body}
        </a>
    ) : (
        <div className={cls}>{body}</div>
    );
}

function Poster({ src, title }: { src: string | null; title: string }) {
    return src ? (
        <img src={src} alt="" loading="lazy" className="h-[60px] w-12 shrink-0 rounded-lg object-cover object-top" />
    ) : (
        <span className="flex h-[60px] w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">{initials(title)}</span>
    );
}

function Chips<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    const { ios } = useStyle();
    const chip = (active: boolean) =>
        `inline-flex shrink-0 items-center whitespace-nowrap transition active:opacity-60 ${
            ios
                ? `h-8 rounded-full px-4 text-[15px] ${active ? 'bg-[#007AFF] text-white dark:bg-[#0A84FF]' : 'bg-black/[0.06] text-black dark:bg-white/10 dark:text-white'}`
                : `h-8 rounded-lg px-3 text-sm font-medium ${active ? 'bg-[#e8def8] text-[#1d192b] dark:bg-[#4a4458] dark:text-[#e8def8]' : 'border border-[#79747e] text-[#1d1b20] dark:border-[#938f99] dark:text-[#e6e0e9]'}`
        }`;
    return (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {options.map((o) => (
                <button key={o.value} type="button" onClick={() => onChange(o.value)} className={chip(o.value === value)}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}

const PER_PAGE = 8;

function KegiatanMobile({ event }: { event: Detail }) {
    const { user } = useAuth();
    const { ios, muted, field } = useStyle();
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('');
    const [limit, setLimit] = useState(PER_PAGE);
    const linkChildren = !event.children.some((c) => c.ticket_price != null);
    const cats = Array.from(new Set(event.children.map((c) => c.category).filter((x): x is string => !!x)));
    const list = event.children.filter((c) => (!cat || c.category === cat) && `${c.title} ${c.location ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
    const shown = list.slice(0, limit);

    return (
        <div className="space-y-4">
            <p className={`px-1 text-sm ${muted}`}>Event ini terdiri dari {event.children.length} kegiatan. Tiket semua kegiatan dibeli sekaligus lewat tombol di atas.</p>
            {event.children.length > 6 && (
                <input
                    type="search"
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setLimit(PER_PAGE);
                    }}
                    placeholder="Cari kegiatan atau lokasi"
                    className={`w-full px-3 text-[17px] outline-none ${field} ${ios ? 'h-10' : 'h-12'}`}
                />
            )}
            {cats.length > 1 && (
                <Chips
                    value={cat}
                    onChange={(v) => {
                        setCat(v);
                        setLimit(PER_PAGE);
                    }}
                    options={[{ value: '', label: `Semua · ${event.children.length}` }, ...cats.map((c) => ({ value: c, label: `${c} · ${event.children.filter((x) => x.category === c).length}` }))]}
                />
            )}
            {list.length === 0 ? (
                <EmptyState icon={Layers} title="Tidak ada kegiatan" text="Tidak ada kegiatan yang cocok." />
            ) : (
                <Section footer={`Menampilkan ${shown.length} dari ${list.length} kegiatan`}>
                    {shown.map((c) => {
                        const price = c.ticket_price ?? c.registration_fee;
                        const left = c.ticket_left != null ? `sisa ${c.ticket_left} tiket` : c.quota > 0 ? `sisa ${Math.max(0, c.quota - c.registered)} slot` : null;
                        const daftar = !c.ticket_open && c.registration_method === 'transfer_manual';
                        const date = c.starts_at ? `${shortDate(c.starts_at)}${c.ends_at && c.ends_at !== c.starts_at ? ` – ${shortDate(c.ends_at)}` : ''}` : null;
                        return (
                            <div key={c.id}>
                                <Row
                                    leading={<Poster src={c.poster} title={c.title} />}
                                    label={c.title}
                                    sub={
                                        <>
                                            {date && <span className="block truncate">{date}</span>}
                                            {c.location && <span className="block truncate">{c.location}</span>}
                                            <span className="block truncate">
                                                {money(price)}
                                                {left ? ` · ${left}` : ''}
                                            </span>
                                        </>
                                    }
                                    href={linkChildren ? `/events/${c.slug}` : undefined}
                                />
                                {(daftar || c.juknis) && (
                                    <div className="flex gap-2 px-4 pb-3">
                                        {daftar && (
                                            <div className="flex-1">
                                                <Button full onClick={() => (window.location.href = user ? `/events/${c.id}/daftar` : `/events/${c.id}/masuk`)}>
                                                    Daftar
                                                </Button>
                                            </div>
                                        )}
                                        {c.juknis && (
                                            <div className="flex-1">
                                                <Button full variant="tonal" onClick={() => window.open(c.juknis ?? '', '_blank')}>
                                                    Juknis
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </Section>
            )}
            {shown.length < list.length && (
                <Button full variant="tonal" onClick={() => setLimit((n) => n + PER_PAGE)}>
                    Tampilkan lebih banyak
                </Button>
            )}
        </div>
    );
}

function HadiahMobile({ data }: { data?: Participants }) {
    const { muted } = useStyle();
    const rows = (data?.branches ?? []).filter((b) => b.info);
    const age = (a: number | null, b: number | null) => (a != null && b != null ? `${a}–${b} tahun` : a != null ? `Minimal ${a} tahun` : b != null ? `Maksimal ${b} tahun` : null);
    return (
        <div className="space-y-5">
            {rows.map((b) => {
                const i = b.info!;
                const ageText = age(i.min_age, i.max_age);
                return (
                    <Section key={b.id} title={b.title}>
                        {i.prizes.length > 0 ? (
                            i.prizes.map((p, k) => <Row key={k} icon={Trophy} tint="#FF9500" label={p.rank} value={p.prize || undefined} />)
                        ) : (
                            <Row icon={Trophy} tint="#FF9500" label="Memperebutkan Juara 1, 2, dan 3" />
                        )}
                        {ageText && <Row icon={Users} tint="#5856D6" label="Usia" value={ageText} />}
                        {i.requirements && <p className={`px-4 py-3 text-sm whitespace-pre-line ${muted}`}>{i.requirements}</p>}
                    </Section>
                );
            })}
        </div>
    );
}

function PesertaMobile({ data }: { data?: Participants }) {
    const { muted } = useStyle();
    const branches = data?.branches ?? [];
    if (branches.length === 0) return <EmptyState icon={Users} title="Belum ada data" text="Kuota peserta belum diatur untuk event ini." />;
    return (
        <div className="space-y-5">
            {branches.map((b) => {
                const pct = b.quota > 0 ? Math.min(100, Math.round((b.registered / b.quota) * 100)) : 0;
                return (
                    <Section key={b.id} title={b.title} footer={b.quota > 0 ? `${pct}% terisi · ${b.approved} disetujui · sisa ${Math.max(0, b.quota - b.registered)} slot` : undefined}>
                        <div className="px-4 py-3">
                            <div className="flex items-baseline justify-between text-sm">
                                <span className={muted}>{b.subtitle ?? 'Peserta'}</span>
                                <span className="font-semibold">
                                    {b.registered}
                                    {b.quota > 0 ? ` / ${b.quota}` : ''}
                                </span>
                            </div>
                            {b.quota > 0 && (
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                    <div className="h-full rounded-full bg-[#34C759]" style={{ width: `${pct}%` }} />
                                </div>
                            )}
                        </div>
                        {b.names.map((p, i) => (
                            <Row
                                key={i}
                                leading={<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-xs font-semibold text-white">{initials(p.name)}</span>}
                                label={p.name}
                                sub={p.school ?? undefined}
                            />
                        ))}
                    </Section>
                );
            })}
            <p className={`px-1 text-xs ${muted}`}>Hanya nama dan asal sekolah peserta yang disetujui yang ditampilkan.</p>
        </div>
    );
}

function ContactRows({ contact }: { contact: NonNullable<Contact> }) {
    return (
        <>
            {(contact.name || contact.position) && <Row icon={Users} tint="#5856D6" label={contact.name ?? contact.position ?? ''} sub={contact.name ? contact.position : undefined} />}
            {contact.phone && <Row icon={Phone} tint="#007AFF" label="Telepon" value={contact.phone} href={`tel:${contact.phone}`} external />}
            {contact.phone && <Row icon={MessageCircle} tint="#25D366" label="WhatsApp" value="Kirim pesan" href={waLink(contact.phone)} external />}
            {contact.email && <Row icon={Mail} tint="#FF9500" label="Email" value={contact.email} href={`mailto:${contact.email}`} external />}
        </>
    );
}

function KontakMobile({ event }: { event: Detail }) {
    const withContact = event.children.filter((c) => c.contact);
    if (!event.contact && withContact.length === 0) return <EmptyState icon={Phone} title="Belum ada kontak" text="Kontak panitia belum tersedia." />;
    return (
        <div className="space-y-5">
            {event.contact && (
                <Section>
                    <ContactRows contact={event.contact} />
                </Section>
            )}
            {withContact.map((c) => (
                <Section key={c.id} title={c.title}>
                    <ContactRows contact={c.contact!} />
                </Section>
            ))}
        </div>
    );
}

function CommentsMobile({ event }: { event: Detail }) {
    const { user } = useAuth();
    const { ios, muted, field } = useStyle();
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(`/events/${event.id}/komentar`, { preserveScroll: true, onSuccess: () => reset() });
    };
    const remove = (id: number) => {
        if (confirm('Hapus komentar ini?')) router.delete(`/komentar/${id}`, { preserveScroll: true });
    };
    const report = (id: number) => {
        if (confirm('Laporkan komentar ini ke admin?')) router.post(`/komentar/${id}/lapor`, {}, { preserveScroll: true });
    };

    return (
        <div className="space-y-3">
            <h2 className={ios ? 'px-4 text-[13px] text-black/50 uppercase dark:text-white/50' : 'px-4 text-sm font-medium text-[#6750A4] dark:text-[#d0bcff]'}>Komentar</h2>
            {user ? (
                <form onSubmit={submit} className="space-y-2">
                    <textarea
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        maxLength={1000}
                        rows={3}
                        placeholder="Tulis komentar..."
                        className={`w-full resize-none p-3 text-[17px] outline-none ${field}`}
                    />
                    {errors.body && <p className="text-sm text-[#FF3B30]">{errors.body}</p>}
                    <div className="flex items-center justify-between">
                        <span className={`text-xs ${muted}`}>{data.body.length}/1000</span>
                        <Button onClick={() => !processing && data.body.trim() !== '' && post(`/events/${event.id}/komentar`, { preserveScroll: true, onSuccess: () => reset() })}>Kirim</Button>
                    </div>
                </form>
            ) : (
                <Section>
                    <Row icon={Info} tint="#007AFF" label="Masuk untuk menulis komentar" href="/login" />
                </Section>
            )}
            {event.comments.length === 0 ? (
                <p className={`px-4 py-2 text-sm ${muted}`}>Belum ada komentar. Jadilah yang pertama.</p>
            ) : (
                <Section>
                    {event.comments.map((c) => (
                        <div key={c.id} className="flex gap-3 px-4 py-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-xs font-semibold text-white">{initials(c.author)}</span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold">{c.author}</span>
                                    <span className={`text-xs ${muted}`}>{stamp(c.created_at)}</span>
                                    {!c.mine && user && (
                                        <button type="button" onClick={() => report(c.id)} disabled={c.reported} className="ml-auto inline-flex items-center gap-1 text-xs text-[#FF9500] disabled:opacity-60">
                                            <Flag className="size-3.5" />
                                            {c.reported ? 'Dilaporkan' : 'Lapor'}
                                        </button>
                                    )}
                                    {c.mine && (
                                        <button type="button" onClick={() => remove(c.id)} aria-label="Hapus komentar" className="ml-auto text-[#FF3B30]">
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="mt-1 text-[15px] leading-snug break-words whitespace-pre-line">{c.body}</p>
                            </div>
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
}

/** Detail event untuk HP: poster, ringkasan, tombol utama, lalu tab dalam bentuk daftar bergrup. */
export default function EventDetailMobile({ event, parts, hasHadiah, cta, statusText, statusDot, share, copied }: Props) {
    const { ios, muted, accent, surface } = useStyle();
    const [tabRaw, setTab] = useState<Tab>(event.children.length > 0 ? 'kegiatan' : 'info');
    const tab = tabRaw === 'hadiah' && !hasHadiah ? 'info' : tabRaw;
    const single = !event.ends_at || event.ends_at === event.starts_at;
    const days = dayCount(event.starts_at, event.ends_at);

    const go = () => {
        if (cta.href.startsWith('#')) setTab('kegiatan');
        else window.location.href = cta.href;
    };

    const tabs: { value: Tab; label: string }[] = [
        ...(event.children.length > 0 ? [{ value: 'kegiatan' as Tab, label: `Kegiatan · ${event.children.length}` }] : []),
        { value: 'info', label: 'Informasi' },
        ...(hasHadiah ? [{ value: 'hadiah' as Tab, label: 'Hadiah' }] : []),
        { value: 'peserta', label: 'Peserta' },
        { value: 'kontak', label: 'Kontak' },
    ];

    return (
        <div className="space-y-5">
            <Link href="/events" className={`inline-flex items-center gap-0.5 text-[17px] ${accent}`}>
                <ChevronLeft className="size-5" />
                Semua Event
            </Link>

            {event.parent && (
                <Section title="Rangkaian">
                    <Row icon={Layers} tint="#5856D6" label={event.parent.title} sub="Bagian dari rangkaian" href={`/events/${event.parent.slug}`} />
                    {(event.siblings?.length ?? 0) > 1 &&
                        event.siblings!.map((x) => <Row key={x.id} label={x.title} value={x.id === event.id ? 'Dilihat' : undefined} href={x.id === event.id ? undefined : `/events/${x.slug}`} />)}
                </Section>
            )}

            <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[14px] bg-black/5 shadow-md dark:bg-white/10">
                <div className="aspect-[4/5] w-full">
                    {event.poster ? (
                        <img src={event.poster} alt={event.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
                            <span className="text-6xl font-bold text-white/90">{initials(event.title)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="inline-flex items-center gap-2 font-semibold">
                        <span className={`size-2 rounded-full ${statusDot}`} />
                        {statusText}
                    </span>
                    {event.category && <span className={accent}>{event.category}</span>}
                </div>
                <h1 className={`mt-2 text-[26px] leading-tight break-words ${ios ? 'font-bold' : 'font-medium'}`}>{event.title}</h1>
                {event.organizer && <p className={`mt-1 text-sm ${muted}`}>oleh {event.organizer}</p>}
            </div>

            <div className="space-y-2">
                {event.status.key === 'selesai' ? (
                    <div className={`flex h-[50px] items-center justify-center gap-2 text-[17px] font-semibold ${muted} ${surface}`}>
                        <Ticket className="size-[18px]" />
                        Event Sudah Selesai
                    </div>
                ) : (
                    <Button full icon={cta.Icon} onClick={go}>
                        {cta.label}
                    </Button>
                )}
                <Button full variant="tonal" icon={copied ? Check : Share2} onClick={share}>
                    {copied ? 'Tertaut' : 'Bagikan'}
                </Button>
            </div>

            <Section>
                {event.starts_at && (
                    <InfoRow icon={CalendarDays} tint="#007AFF" label="Tanggal" value={<>{longDate(event.starts_at)}{!single && event.ends_at ? <span className={`block text-sm ${muted}`}>s.d. {longDate(event.ends_at)}</span> : null}</>} />
                )}
                {event.location && <InfoRow icon={MapPin} tint="#FF3B30" label="Lokasi · ketuk untuk buka peta" value={event.location} href={mapUrl(event.location)} />}
                {event.organizer && <InfoRow icon={Building2} tint="#FF9500" label="Penyelenggara" value={event.organizer} />}
                <InfoRow icon={Ticket} tint="#34C759" label="Biaya pendaftaran" value={feeRange(event.registration_fee_min ?? event.registration_fee, event.registration_fee_max ?? event.registration_fee)} />
            </Section>

            <Chips<Tab> options={tabs} value={tab} onChange={setTab} />

            {tab === 'kegiatan' && <KegiatanMobile event={event} />}
            {tab === 'hadiah' && <HadiahMobile data={parts} />}
            {tab === 'peserta' && <PesertaMobile data={parts} />}
            {tab === 'kontak' && <KontakMobile event={event} />}
            {tab === 'info' && (
                <div className="space-y-5">
                    <Section title="Tentang event">
                        <p className={`px-4 py-3 text-[15px] leading-relaxed break-words whitespace-pre-line ${event.description ? '' : muted}`}>{event.description ?? 'Deskripsi belum tersedia.'}</p>
                    </Section>
                    {event.juknis && (
                        <Section>
                            <Row icon={FileText} tint="#5856D6" label="Juknis" value="Buka PDF" href={event.juknis} external />
                        </Section>
                    )}
                    <Section title="Waktu & tempat">
                        {event.ends_at && <InfoRow icon={CalendarCheck} tint="#34C759" label="Selesai" value={longDate(event.ends_at)} />}
                        {days && <InfoRow icon={Clock} tint="#AF52DE" label="Durasi" value={days === 1 ? '1 hari' : `${days} hari`} />}
                        {event.category && <InfoRow icon={Tag} tint="#32ADE6" label="Kategori" value={event.category} />}
                    </Section>
                </div>
            )}

            <CommentsMobile event={event} />
        </div>
    );
}
