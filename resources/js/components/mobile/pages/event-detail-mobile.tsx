// indigo-detail v1
import { Link, router, useForm } from '@inertiajs/react';
import { Building2, CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, FileText, Flag, Info, Layers, Mail, MapPin, MessageCircle, Phone, Share2, Tag, Ticket, Trash2, Trophy, Users } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { feeRange } from '@/lib/fee-label';
import Button from '../kit/button';
import EmptyState from '../kit/empty-state';
import Segments from '../kit/segments';
import { CARD as SOFT_CARD, FIELD, MUTED, PAGE, PRESS } from '../kit/soft';

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
const initials = (n: string) =>
    n
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');
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

const CARD = 'overflow-hidden rounded-3xl ' + SOFT_CARD;
const TONES = {
    indigo: FIELD + ' text-indigo-700 dark:text-indigo-300',
    sky: FIELD + ' text-sky-700 dark:text-sky-300',
    rose: FIELD + ' text-rose-600 dark:text-rose-300',
    amber: FIELD + ' text-amber-700 dark:text-amber-300',
    emerald: FIELD + ' text-emerald-700 dark:text-emerald-300',
    violet: FIELD + ' text-violet-700 dark:text-violet-300',
};
type Tone = keyof typeof TONES;

/** Kelompok baris: judul kecil, kartu putih berpembatas tipis, catatan kaki opsional. */
function Group({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
    return (
        <section>
            {title && <h2 className="mb-2 px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">{title}</h2>}
            <div className={CARD + ' divide-y divide-slate-900/[0.07] dark:divide-white/10'}>{children}</div>
            {footer && <p className={'mt-2 px-1 text-xs ' + MUTED}>{footer}</p>}
        </section>
    );
}

type LineProps = { icon?: Icon; tone?: Tone; leading?: ReactNode; label: string; value?: ReactNode; sub?: ReactNode; href?: string; external?: boolean };

/** Satu baris informasi. Bertautan bila ada href; nilai panjang boleh turun baris. */
function Line({ icon: Ic, tone = 'indigo', leading, label, value, sub, href, external }: LineProps) {
    const lead =
        leading ??
        (Ic ? (
            <span className={'flex size-9 shrink-0 items-center justify-center rounded-xl ' + TONES[tone]}>
                <Ic className="size-[18px]" />
            </span>
        ) : null);
    const body = (
        <>
            {lead}
            <span className="min-w-0 flex-1">
                {value !== undefined && <span className={'block text-xs ' + MUTED}>{label}</span>}
                <span className="block text-[15px] leading-snug font-medium break-words text-slate-900 dark:text-white">{value !== undefined ? value : label}</span>
                {sub && <span className={'mt-0.5 block text-xs ' + MUTED}>{sub}</span>}
            </span>
            {href && <ChevronRight className={'size-5 shrink-0 ' + MUTED} />}
        </>
    );
    const cls = 'flex w-full items-center gap-3 px-4 py-2.5 text-left ' + (href ? PRESS : '');
    if (!href) return <div className={cls}>{body}</div>;
    if (external || /^(https?:|tel:|mailto:)/.test(href))
        return (
            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={cls}>
                {body}
            </a>
        );
    return (
        <Link href={href} className={cls}>
            {body}
        </Link>
    );
}

function Poster({ src, title }: { src: string | null; title: string }) {
    return src ? (
        <img src={src} alt="" loading="lazy" className="h-[60px] w-12 shrink-0 rounded-xl object-cover object-top" />
    ) : (
        <span className="flex h-[60px] w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white">{initials(title)}</span>
    );
}

function Avatar({ name, size = 'size-10' }: { name: string; size?: string }) {
    return <span className={'flex shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white ' + size}>{initials(name)}</span>;
}

const PER_PAGE = 8;

function KegiatanMobile({ event }: { event: Detail }) {
    const { user } = useAuth();
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('');
    const [limit, setLimit] = useState(PER_PAGE);
    const linkChildren = !event.children.some((c) => c.ticket_price != null);
    const cats = Array.from(new Set(event.children.map((c) => c.category).filter((x): x is string => !!x)));
    const list = event.children.filter((c) => (!cat || c.category === cat) && `${c.title} ${c.location ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
    const shown = list.slice(0, limit);
    const catItems = [{ key: '', label: `Semua · ${event.children.length}` }, ...cats.map((c) => ({ key: c, label: `${c} · ${event.children.filter((x) => x.category === c).length}` }))];

    return (
        <div className="space-y-4">
            <p className={'px-1 text-sm ' + MUTED}>Event ini terdiri dari {event.children.length} kegiatan. Tiket semua kegiatan dibeli sekaligus lewat tombol di bawah.</p>
            {event.children.length > 6 && (
                <input
                    type="search"
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setLimit(PER_PAGE);
                    }}
                    placeholder="Cari kegiatan atau lokasi"
                    className={'h-11 w-full rounded-full px-5 text-[15px] outline-none ' + FIELD}
                />
            )}
            {cats.length > 1 && (
                <div className="-mx-5">
                    <Segments
                        items={catItems}
                        value={cat}
                        onChange={(v) => {
                            setCat(v);
                            setLimit(PER_PAGE);
                        }}
                    />
                </div>
            )}
            {list.length === 0 ? (
                <EmptyState icon={Layers} title="Tidak ada kegiatan" text="Tidak ada kegiatan yang cocok." />
            ) : (
                <Group footer={`Menampilkan ${shown.length} dari ${list.length} kegiatan`}>
                    {shown.map((c) => {
                        const price = c.ticket_price ?? c.registration_fee;
                        const left = c.ticket_left != null ? `sisa ${c.ticket_left} tiket` : c.quota > 0 ? `sisa ${Math.max(0, c.quota - c.registered)} slot` : null;
                        const daftar = !c.ticket_open && c.registration_method === 'transfer_manual';
                        const date = c.starts_at ? `${shortDate(c.starts_at)}${c.ends_at && c.ends_at !== c.starts_at ? ` – ${shortDate(c.ends_at)}` : ''}` : null;
                        return (
                            <div key={c.id}>
                                <Line
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
                </Group>
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
    const rows = (data?.branches ?? []).filter((b) => b.info);
    const age = (a: number | null, b: number | null) => (a != null && b != null ? `${a}–${b} tahun` : a != null ? `Minimal ${a} tahun` : b != null ? `Maksimal ${b} tahun` : null);
    return (
        <div className="space-y-5">
            {rows.map((b) => {
                const i = b.info!;
                const ageText = age(i.min_age, i.max_age);
                return (
                    <Group key={b.id} title={b.title}>
                        {i.prizes.length > 0 ? (
                            i.prizes.map((p, k) => <Line key={k} icon={Trophy} tone="amber" label={p.rank} value={p.prize || p.rank} />)
                        ) : (
                            <Line icon={Trophy} tone="amber" label="Memperebutkan Juara 1, 2, dan 3" />
                        )}
                        {ageText && <Line icon={Users} tone="violet" label="Usia" value={ageText} />}
                        {i.requirements && <p className={'px-4 py-3 text-sm whitespace-pre-line ' + MUTED}>{i.requirements}</p>}
                    </Group>
                );
            })}
        </div>
    );
}

function PesertaMobile({ data }: { data?: Participants }) {
    const branches = data?.branches ?? [];
    if (branches.length === 0) return <EmptyState icon={Users} title="Belum ada data" text="Kuota peserta belum diatur untuk event ini." />;
    return (
        <div className="space-y-5">
            {branches.map((b) => {
                const pct = b.quota > 0 ? Math.min(100, Math.round((b.registered / b.quota) * 100)) : 0;
                return (
                    <Group key={b.id} title={b.title} footer={b.quota > 0 ? `${pct}% terisi · ${b.approved} disetujui · sisa ${Math.max(0, b.quota - b.registered)} slot` : undefined}>
                        <div className="px-4 py-3.5">
                            <div className="flex items-baseline justify-between text-sm">
                                <span className={MUTED}>{b.subtitle ?? 'Peserta'}</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {b.registered}
                                    {b.quota > 0 ? ` / ${b.quota}` : ''}
                                </span>
                            </div>
                            {b.quota > 0 && (
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                                </div>
                            )}
                        </div>
                        {b.names.map((p, i) => (
                            <Line key={i} leading={<Avatar name={p.name} />} label={p.name} sub={p.school ?? undefined} />
                        ))}
                    </Group>
                );
            })}
            <p className={'px-1 text-xs ' + MUTED}>Hanya nama dan asal sekolah peserta yang disetujui yang ditampilkan.</p>
        </div>
    );
}

function ContactRows({ contact }: { contact: NonNullable<Contact> }) {
    return (
        <>
            {(contact.name || contact.position) && <Line icon={Users} tone="violet" label={contact.name ?? contact.position ?? ''} sub={contact.name ? contact.position : undefined} />}
            {contact.phone && <Line icon={Phone} tone="sky" label="Telepon" value={contact.phone} href={`tel:${contact.phone}`} />}
            {contact.phone && <Line icon={MessageCircle} tone="emerald" label="WhatsApp" value="Kirim pesan" href={waLink(contact.phone)} external />}
            {contact.email && <Line icon={Mail} tone="amber" label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
        </>
    );
}

function KontakMobile({ event }: { event: Detail }) {
    const withContact = event.children.filter((c) => c.contact);
    if (!event.contact && withContact.length === 0) return <EmptyState icon={Phone} title="Belum ada kontak" text="Kontak panitia belum tersedia." />;
    return (
        <div className="space-y-5">
            {event.contact && (
                <Group>
                    <ContactRows contact={event.contact} />
                </Group>
            )}
            {withContact.map((c) => (
                <Group key={c.id} title={c.title}>
                    <ContactRows contact={c.contact!} />
                </Group>
            ))}
        </div>
    );
}

function CommentsMobile({ event }: { event: Detail }) {
    const { user } = useAuth();
    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    const submit = () => {
        if (processing || data.body.trim() === '') return;
        post(`/events/${event.id}/komentar`, { preserveScroll: true, onSuccess: () => reset() });
    };
    const remove = (id: number) => {
        if (confirm('Hapus komentar ini?')) router.delete(`/komentar/${id}`, { preserveScroll: true });
    };
    const report = (id: number) => {
        if (confirm('Laporkan komentar ini ke admin?')) router.post(`/komentar/${id}/lapor`, {}, { preserveScroll: true });
    };

    return (
        <section className="space-y-3">
            <h2 className="px-1 text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300">Komentar · {event.comments.length}</h2>
            {user ? (
                <div className="space-y-2">
                    <textarea
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        maxLength={1000}
                        rows={3}
                        placeholder="Tulis komentar..."
                        className={'w-full resize-none rounded-3xl p-4 text-[15px] outline-none ' + FIELD}
                    />
                    {errors.body && <p className="px-1 text-sm text-rose-600 dark:text-rose-400">{errors.body}</p>}
                    <div className="flex items-center justify-between px-1">
                        <span className={'text-xs ' + MUTED}>{data.body.length}/1000</span>
                        <Button onClick={submit}>Kirim</Button>
                    </div>
                </div>
            ) : (
                <Group>
                    <Line icon={Info} tone="sky" label="Masuk untuk menulis komentar" href="/login" />
                </Group>
            )}
            {event.comments.length === 0 ? (
                <p className={'px-1 py-2 text-sm ' + MUTED}>Belum ada komentar. Jadilah yang pertama.</p>
            ) : (
                <Group>
                    {event.comments.map((c) => (
                        <div key={c.id} className="flex gap-3 px-4 py-3.5">
                            <Avatar name={c.author} size="size-9" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.author}</span>
                                    <span className={'shrink-0 text-xs ' + MUTED}>{stamp(c.created_at)}</span>
                                    {!c.mine && user && (
                                        <button type="button" onClick={() => report(c.id)} disabled={c.reported} className={'ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-amber-600 disabled:opacity-60 dark:text-amber-400 ' + PRESS}>
                                            <Flag className="size-3.5" />
                                            {c.reported ? 'Dilaporkan' : 'Lapor'}
                                        </button>
                                    )}
                                    {c.mine && (
                                        <button type="button" onClick={() => remove(c.id)} aria-label="Hapus komentar" className={'ml-auto shrink-0 text-rose-600 dark:text-rose-400 ' + PRESS}>
                                            <Trash2 className="size-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="mt-1 text-[15px] leading-snug break-words whitespace-pre-line text-slate-800 dark:text-slate-100">{c.body}</p>
                            </div>
                        </div>
                    ))}
                </Group>
            )}
        </section>
    );
}

/** Detail event untuk HP: poster penuh, ringkasan, tab berupa segmen, lalu daftar bergrup. Tombol utama menempel di bawah. */
export default function EventDetailMobile({ event, parts, hasHadiah, cta, statusText, statusDot, share, copied }: Props) {
    const [tabRaw, setTab] = useState<Tab>(event.children.length > 0 ? 'kegiatan' : 'info');
    const tab = tabRaw === 'hadiah' && !hasHadiah ? 'info' : tabRaw;
    const single = !event.ends_at || event.ends_at === event.starts_at;
    const days = dayCount(event.starts_at, event.ends_at);
    const fee = feeRange(event.registration_fee_min ?? event.registration_fee, event.registration_fee_max ?? event.registration_fee);

    const go = () => {
        if (cta.href.startsWith('#')) setTab('kegiatan');
        else window.location.href = cta.href;
    };

    const tabs: { key: Tab; label: string }[] = [
        ...(event.children.length > 0 ? [{ key: 'kegiatan' as Tab, label: `Kegiatan · ${event.children.length}` }] : []),
        { key: 'info', label: 'Informasi' },
        ...(hasHadiah ? [{ key: 'hadiah' as Tab, label: 'Hadiah' }] : []),
        { key: 'peserta', label: 'Peserta' },
        { key: 'kontak', label: 'Kontak' },
    ];

    const circle = 'pointer-events-auto flex size-11 items-center justify-center rounded-full bg-black/35 text-white ' + PRESS;

    return (
        <div className={'min-h-dvh text-slate-900 dark:text-white ' + PAGE}>
            <div data-detail-hero className={'sticky top-0 z-0 w-full overflow-hidden bg-slate-300 dark:bg-slate-800 ' + (event.poster ? 'aspect-[4/5] max-h-[62dvh]' : 'h-[190px]')}>
                {event.poster ? (
                    <img src={event.poster} alt={event.title} className="absolute inset-0 size-full object-cover object-top" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-700 to-indigo-500">
                        <span className="text-5xl font-semibold text-white/90">{initials(event.title)}</span>
                    </div>
                )}
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />

            </div>

            <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
                <Link href="/events" aria-label="Kembali" className={circle}>
                    <ChevronLeft className="size-6" />
                </Link>
                <button type="button" onClick={share} aria-label="Bagikan" className={circle}>
                    {copied ? <Check className="size-5" /> : <Share2 className="size-5" />}
                </button>
            </div>

            <div className={'relative z-10 -mt-7 space-y-4 rounded-t-[32px] px-5 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] ' + PAGE}>
                <header className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 ' + FIELD}>
                            <span className={'size-2 rounded-full ' + statusDot} />
                            {statusText}
                        </span>
                        {event.category && <span className="rounded-full bg-indigo-600/10 px-3 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">{event.category}</span>}
                    </div>
                    <h1 className="text-[22px] leading-tight font-semibold tracking-tight break-words text-slate-900 dark:text-white">{event.title}</h1>
                    {event.organizer && <p className={'text-sm ' + MUTED}>oleh {event.organizer}</p>}
                </header>

                {event.parent && (
                    <Group title="Rangkaian">
                        <Line icon={Layers} tone="violet" label={event.parent.title} sub="Bagian dari rangkaian" href={`/events/${event.parent.slug}`} />
                        {(event.siblings?.length ?? 0) > 1 &&
                            event.siblings!.map((x) => (
                                <Line key={x.id} label={x.title} sub={x.id === event.id ? 'Sedang dilihat' : undefined} href={x.id === event.id ? undefined : `/events/${x.slug}`} />
                            ))}
                    </Group>
                )}

                <Group>
                    {event.starts_at && (
                        <Line
                            icon={CalendarDays}
                            tone="sky"
                            label="Tanggal"
                            value={
                                <>
                                    {longDate(event.starts_at)}
                                    {!single && event.ends_at ? <span className={'block text-sm font-normal ' + MUTED}>s.d. {longDate(event.ends_at)}</span> : null}
                                </>
                            }
                        />
                    )}
                    {event.location && <Line icon={MapPin} tone="rose" label="Lokasi · ketuk untuk buka peta" value={event.location} href={mapUrl(event.location)} external />}
                    {event.organizer && <Line icon={Building2} tone="amber" label="Penyelenggara" value={event.organizer} />}
                    <Line icon={Ticket} tone="emerald" label="Biaya pendaftaran" value={fee} />
                </Group>

                <div className="-mx-5">
                    <Segments items={tabs} value={tab} onChange={setTab} />
                </div>

                {tab === 'kegiatan' && <KegiatanMobile event={event} />}
                {tab === 'hadiah' && <HadiahMobile data={parts} />}
                {tab === 'peserta' && <PesertaMobile data={parts} />}
                {tab === 'kontak' && <KontakMobile event={event} />}
                {tab === 'info' && (
                    <div className="space-y-5">
                        <Group title="Tentang event">
                            <p className={'px-4 py-3.5 text-[15px] leading-relaxed break-words whitespace-pre-line ' + (event.description ? 'text-slate-800 dark:text-slate-100' : MUTED)}>{event.description ?? 'Deskripsi belum tersedia.'}</p>
                        </Group>
                        {event.juknis && (
                            <Group>
                                <Line icon={FileText} tone="violet" label="Juknis" value="Buka PDF" href={event.juknis} external />
                            </Group>
                        )}
                        {(event.ends_at || days || event.category) && (
                            <Group title="Waktu & kategori">
                                {event.ends_at && <Line icon={CalendarCheck} tone="emerald" label="Selesai" value={longDate(event.ends_at)} />}
                                {days && <Line icon={Clock} tone="violet" label="Durasi" value={days === 1 ? '1 hari' : `${days} hari`} />}
                                {event.category && <Line icon={Tag} tone="sky" label="Kategori" value={event.category} />}
                            </Group>
                        )}
                    </div>
                )}

                <CommentsMobile event={event} />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-900/[0.07] bg-white px-5 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#0a0c1a]">
                <div className="mx-auto flex max-w-md items-center gap-4">
                    <div className="min-w-0 flex-1">
                        <p className={'text-[11px] ' + MUTED}>Biaya</p>
                        <p className="truncate text-[17px] leading-tight font-semibold">{fee}</p>
                    </div>
                    <div className="flex shrink-0 justify-end">
                        {event.status.key !== 'selesai' && event.registration_state && event.registration_state !== 'buka' ? (
                            <div className={'flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold ' + MUTED + ' ' + FIELD}>
                                <cta.Icon className="size-[18px]" />
                                {event.registration_state === 'ditutup'
                                    ? `${cta.label === 'Daftar' ? 'Pendaftaran' : 'Penjualan tiket'} ditutup`
                                    : `Dibuka ${event.registration_opens ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${event.registration_opens}T00:00:00`)) : 'segera'}`}
                            </div>
                        ) : event.status.key === 'selesai' ? (
                            <div className={'flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold ' + MUTED + ' ' + FIELD}>
                                <Ticket className="size-[18px]" />
                                Event Sudah Selesai
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={go}
                                className={'flex h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-medium whitespace-nowrap text-white dark:bg-indigo-500 ' + PRESS}
                            >
                                <cta.Icon className="size-[18px] shrink-0" />
                                {cta.label}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
