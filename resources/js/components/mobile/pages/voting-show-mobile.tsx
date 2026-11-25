import { Calendar, Clock, Crown, MapPin, MessageSquare, Minus, Plus, Search, Trophy, User, Volume2, VolumeX, Zap } from 'lucide-react';
import AppBar from '../app-bar';
import AppBarButton from '../app-bar-button';
import Button from '../kit/button';
import { Row, Section } from '../kit/section';
import Segmented from '../kit/segmented';
import Sheet from '../kit/sheet';
import { CARD, FIELD, MUTED, PRESS } from '../kit/soft';
import Screen from '../screen';

const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);
const nf = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const dlong = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const HIDE_CHAT = 'body:has([data-mobile-vote]) .afab{display:none !important}';
const input = 'h-12 w-full rounded-2xl px-4 text-base outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/25 ' + FIELD;
const eyebrow = 'text-[11px] font-semibold tracking-[0.2em] text-indigo-700 uppercase dark:text-indigo-300';

function Thumb({ p, size }: { p: any; size: number }) {
    return p.photo ? (
        <img src={p.photo} alt={p.name} style={{ width: size, height: size }} className="shrink-0 rounded-2xl object-cover" />
    ) : (
        <span style={{ width: size, height: size }} className={'flex shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-indigo-700 dark:text-indigo-300 ' + FIELD}>
            {p.name.charAt(0).toUpperCase()}
        </span>
    );
}

function Cd({ c }: { c: any }) {
    if (c.over) return <p className="text-[15px] font-semibold text-rose-600 dark:text-rose-400">Voting sudah ditutup</p>;
    return (
        <div className="grid grid-cols-4 gap-2">
            {[['Hari', c.d], ['Jam', c.h], ['Menit', c.m], ['Detik', c.s]].map(([l, v]) => (
                <div key={l as string} className={'rounded-2xl py-2.5 text-center ' + FIELD}>
                    <div className="text-xl font-semibold tabular-nums">{String(v).padStart(2, '0')}</div>
                    <div className={'text-[11px] ' + MUTED}>{l}</div>
                </div>
            ))}
        </div>
    );
}

/** Arena voting HP. Semua data dan logika datang dari halaman; di sini hanya tampilan. */
export default function VotingShowMobile(a: any) {
    const { event, period, settings, categories, live, tab, setTab, cat, setCat, q, setQ, canBuy, started, cd, sound, toggleSound, list, scope, scopeVotes, title, hasNone, onBuy } = a;
    const ranked = settings.show_ranking && !q;
    const chip = (on: boolean) =>
        'inline-flex h-10 shrink-0 items-center rounded-xl px-3.5 text-sm font-semibold ' + PRESS + ' ' +
        (on ? 'bg-gradient-to-b from-indigo-400 to-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-indigo-100 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10');

    return (
        <div data-mobile-vote="">
            <style>{HIDE_CHAT}</style>
            <Screen
                bar={
                    <AppBar
                        title="Arena voting"
                        back="/voting"
                        actions={
                            <AppBarButton onClick={toggleSound} label="Suara">
                                {sound ? <Volume2 /> : <VolumeX />}
                            </AppBarButton>
                        }
                    />
                }
            >
                <Segmented<'home' | 'arena'> value={tab} onChange={setTab} options={[{ value: 'home', label: 'Home' }, { value: 'arena', label: 'Arena' }]} />

                {tab === 'home' && (
                    <div className="space-y-5">
                        <div className="overflow-hidden rounded-3xl bg-slate-200 dark:bg-neutral-800">
                            {event.poster ? <img src={event.poster} alt={event.title} className="w-full" /> : <div className="flex aspect-[4/5] items-center justify-center text-slate-400"><Trophy className="size-10" strokeWidth={1.5} /></div>}
                        </div>
                        <header className="space-y-2 px-1">
                            <div className="flex flex-wrap gap-2 text-xs font-medium">
                                <span className={'rounded-full px-3 py-1 ' + (canBuy ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : FIELD + ' ' + MUTED)}>{canBuy ? 'Buka' : started ? 'Ditutup' : 'Belum dimulai'}</span>
                                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-700 dark:text-indigo-300">{rp(settings.price)} / vote</span>
                            </div>
                            <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{event.title}</h1>
                            {event.description && <p className={'text-[13px] leading-relaxed whitespace-pre-line ' + MUTED}>{event.description}</p>}
                        </header>
                        <Section>
                            <Row icon={Calendar} tint="#4F46E5" label="Tanggal event" value={dlong(event.date)} />
                            <Row icon={MapPin} tint="#DC2626" label="Lokasi" value={event.location ?? '-'} />
                            <Row icon={User} tint="#059669" label="Penyelenggara" value={event.organizer ?? '-'} />
                            <Row icon={Clock} tint="#D97706" label="Periode" sub={(period.start ? dlong(period.start) + ' – ' : 'Sekarang – ') + dlong(period.end)} />
                        </Section>
                        <div className={'space-y-3 rounded-3xl p-4 ' + CARD}>
                            <p className={eyebrow}>Voting berakhir dalam</p>
                            <Cd c={cd} />
                        </div>
                        <Button full onClick={() => setTab('arena')}>Masuk arena &amp; vote</Button>
                    </div>
                )}

                {tab === 'arena' && (
                    <div className="space-y-4">
                        <div className={'space-y-3 rounded-3xl p-4 ' + CARD}>
                            <p className={eyebrow}>Kategori voting</p>
                            <h2 className="text-[20px] leading-tight font-semibold">{title}</h2>
                            <p className={'text-xs ' + MUTED}>{scope.length} kontestan{scopeVotes !== null ? ' · ' + nf(scopeVotes) + ' vote' : ''}</p>
                            <Cd c={cd} />
                        </div>

                        {categories.length > 0 && (
                            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
                                <button type="button" onClick={() => setCat('all')} className={chip(cat === 'all')}>Semua</button>
                                {categories.map((c: any) => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={chip(cat === c.id)}>{c.name}</button>)}
                                {hasNone && <button type="button" onClick={() => setCat('none')} className={chip(cat === 'none')}>Lainnya</button>}
                            </div>
                        )}

                        {live.feed[0] && (
                            <p className={'flex items-start gap-2.5 rounded-3xl p-4 text-[13px] ' + CARD}>
                                <Zap className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                                <span className="min-w-0">
                                    <b>{live.feed[0].sender}</b> mendukung <b className="text-indigo-700 dark:text-indigo-300">{live.feed[0].participant}</b>
                                    {live.feed[0].votes !== null && <span className="ml-1.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold">{nf(live.feed[0].votes)} suara</span>}
                                    {live.feed[0].message && <span className={'block ' + MUTED}>“{live.feed[0].message}”</span>}
                                </span>
                            </p>
                        )}

                        <label className={'flex h-12 items-center gap-3 rounded-2xl px-4 ' + FIELD}>
                            <Search className="size-[18px] shrink-0 text-indigo-500 dark:text-indigo-300" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari peserta voting" className="w-full bg-transparent text-base outline-none placeholder:text-slate-400" />
                        </label>

                        {list.length === 0 ? (
                            <p className={'rounded-3xl p-8 text-center text-sm ' + CARD + ' ' + MUTED}>Peserta tidak ditemukan.</p>
                        ) : (
                            <div className={'divide-y divide-slate-900/[0.07] overflow-hidden rounded-3xl dark:divide-white/10 ' + CARD}>
                                {list.map((p: any, i: number) => (
                                    <div key={p.id} className="flex items-center gap-3 p-3.5">
                                        {ranked && (
                                            <span className={'flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ' + (i === 0 ? 'bg-indigo-600 text-white dark:bg-indigo-500' : FIELD + ' ' + MUTED)}>
                                                {i === 0 ? <Crown className="size-4" /> : i + 1}
                                            </span>
                                        )}
                                        <Thumb p={p} size={48} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[15px] font-semibold">{p.name}</p>
                                            {p.votes !== null && <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{nf(p.votes)} vote</p>}
                                        </div>
                                        <button type="button" disabled={!canBuy} onClick={() => onBuy(p)} className={'h-10 shrink-0 rounded-full bg-indigo-600 px-4 text-[13px] font-medium text-white disabled:opacity-40 dark:bg-indigo-500 ' + PRESS}>Beli vote</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {settings.show_sender && (
                            <Section title="Pendukung teratas">
                                {live.supporters.length === 0 ? (
                                    <p className={'p-4 text-sm ' + MUTED}>Belum ada pendukung.</p>
                                ) : (
                                    live.supporters.map((s: any, i: number) => (
                                        <Row key={i} icon={Crown} tint={i === 0 ? '#D97706' : '#64748B'} label={s.name} sub={'dari ' + s.orders + ' pembelian'} value={s.votes !== null ? nf(s.votes) + ' vote' : undefined} />
                                    ))
                                )}
                            </Section>
                        )}

                        <Section title="Vote masuk">
                            {live.feed.length === 0 ? (
                                <p className={'p-4 text-sm ' + MUTED}>Belum ada vote masuk.</p>
                            ) : (
                                live.feed.map((f: any) => (
                                    <Row key={f.id} icon={MessageSquare} tint="#4F46E5" label={f.sender + ' → ' + f.participant} sub={f.message ? '“' + f.message + '”' : undefined} value={f.votes !== null ? '+' + nf(f.votes) : undefined} />
                                ))
                            )}
                        </Section>
                    </div>
                )}
            </Screen>
        </div>
    );
}

/** Lembar beli vote HP. State dan pembayaran tetap dimiliki BuyModal. */
export function BuySheetMobile(b: any) {
    const { p, rank, s, gifts, online, event, fee_percent, d, form, gift, votes, base, fee, total, done, paying, pendingCode, payMsg, err, ok, setVotes, submit, pay, onClose, max } = b;

    return (
        <div data-mobile-vote="">
            <style>{HIDE_CHAT}</style>
            <Sheet open onClose={onClose} title="Beli vote">
                {done ? (
                    <div className="space-y-3 py-6 text-center">
                        <p className="text-[17px] font-semibold">Terima kasih</p>
                        <p className={'text-sm ' + MUTED}>{done}</p>
                        <Button full onClick={onClose}>Kembali ke arena</Button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <div className={'flex items-center gap-3 rounded-3xl p-3.5 ' + CARD}>
                            <Thumb p={p} size={56} />
                            <div className="min-w-0 flex-1">
                                <p className={eyebrow}>Dukung</p>
                                <p className="truncate text-[16px] font-semibold">{p.name}</p>
                                <p className={'truncate text-xs ' + MUTED}>{event.title}</p>
                            </div>
                            {rank > 0 && <span className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white dark:bg-indigo-500">#{rank}</span>}
                        </div>

                        {!online && <p className="rounded-2xl bg-amber-500/10 p-3 text-[13px] font-medium text-amber-900 dark:text-amber-200">Voting sedang dijeda. Pembayaran online belum tersedia.</p>}

                        <div>
                            <label className={'mb-1.5 block px-1 text-[13px] font-medium ' + MUTED}>Nama pengirim *</label>
                            <input value={d.buyer_name} maxLength={80} onChange={(e) => form.setData('buyer_name', e.target.value)} placeholder="Nama (tampil di daftar dukungan)" className={input} />
                            {err.buyer_name && <p className="mt-1 px-1 text-sm text-rose-600 dark:text-rose-400">{err.buyer_name}</p>}
                        </div>

                        {s.message_enabled && (
                            <div>
                                <label className={'mb-1.5 block px-1 text-[13px] font-medium ' + MUTED}>Pesan dukungan (opsional)</label>
                                <textarea value={d.message} rows={3} maxLength={s.message_max} onChange={(e) => form.setData('message', e.target.value)} placeholder={'Contoh: Semangat terus untuk ' + p.name + '!'} className={'w-full resize-none rounded-2xl px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/25 ' + FIELD} />
                                <p className={'mt-1 px-1 text-xs ' + MUTED}>{d.message.length}/{s.message_max} karakter</p>
                            </div>
                        )}

                        {gifts.length > 0 && (
                            <div>
                                <p className={'mb-1.5 px-1 text-[13px] font-medium ' + MUTED}>Pilih gift</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {gifts.map((g: any) => (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => form.setData({ ...d, gift_id: d.gift_id === g.id ? null : g.id, votes: String(g.votes) })}
                                            className={'rounded-2xl px-1 py-3 text-center ' + PRESS + ' ' + (d.gift_id === g.id ? 'bg-indigo-500/10 ring-2 ring-indigo-500' : CARD)}
                                        >
                                            <div className="text-2xl">{g.emoji}</div>
                                            <div className="mt-1 truncate text-[11px] font-medium">{g.name}</div>
                                            <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">+{nf(g.votes)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <p className={'mb-1.5 px-1 text-[13px] font-medium ' + MUTED}>Jumlah vote</p>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setVotes(votes - 1)} disabled={votes <= s.min_votes} className={'flex size-12 shrink-0 items-center justify-center rounded-2xl disabled:opacity-40 ' + FIELD}><Minus className="size-5" /></button>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={s.min_votes}
                                    max={max}
                                    value={gift ? String(gift.votes) : d.votes}
                                    onChange={(e) => form.setData({ ...d, gift_id: null, votes: e.target.value.replace(/\D/g, '') })}
                                    onBlur={() => !gift && setVotes(Number(d.votes) || s.min_votes)}
                                    className={input + ' text-center text-lg font-semibold'}
                                />
                                <button type="button" onClick={() => setVotes(votes + 1)} disabled={votes >= max} className={'flex size-12 shrink-0 items-center justify-center rounded-2xl disabled:opacity-40 ' + FIELD}><Plus className="size-5" /></button>
                            </div>
                            <p className={'mt-1 px-1 text-xs ' + MUTED}>Minimal {nf(s.min_votes)}, maksimal {nf(max)} vote per pembelian.</p>
                            {err.votes && <p className="mt-1 px-1 text-sm text-rose-600 dark:text-rose-400">{err.votes}</p>}
                        </div>

                        {payMsg && <p className="rounded-2xl bg-amber-500/10 p-3 text-[13px] font-medium text-amber-900 dark:text-amber-200">{payMsg}</p>}
                        {(err.participant_id || err.gift_id) && <p className="rounded-2xl bg-rose-500/10 p-3 text-[13px] font-medium text-rose-700 dark:text-rose-300">{err.participant_id ?? err.gift_id}</p>}

                        <div className="sticky bottom-0 -mx-4 space-y-3 border-t border-slate-900/[0.07] bg-[#f4f6fc] px-4 pt-3 pb-1 dark:border-white/10 dark:bg-[#0a0c1a]">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className={'text-[11px] ' + MUTED}>Total · {nf(votes)} vote</p>
                                    <p className="text-[22px] leading-tight font-semibold text-indigo-700 dark:text-indigo-300">{rp(total)}</p>
                                </div>
                                <p className={'text-right text-[11px] ' + MUTED}>Vote {rp(base)}<br />+ layanan {fee_percent}% {rp(fee)}</p>
                            </div>
                            {pendingCode ? (
                                <button type="button" onClick={() => void pay(pendingCode)} disabled={paying} className={'h-12 w-full rounded-full bg-amber-500 text-sm font-medium text-black disabled:opacity-60 ' + PRESS}>{paying ? 'Membuka...' : 'Lanjutkan pembayaran'}</button>
                            ) : (
                                <button type="submit" disabled={!ok || !online || form.processing || paying} className={'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 text-sm font-medium text-white disabled:opacity-40 dark:bg-indigo-500 ' + PRESS}>
                                    <Zap className="size-4" /> {form.processing || paying ? 'Menyiapkan...' : 'Beli vote'}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </Sheet>
        </div>
    );
}
