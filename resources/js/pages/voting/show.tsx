import { openPayScreen } from '@/lib/pay-screen';
import { useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Crown, Home, MapPin, MessageSquare, Search, Swords, Trophy, Upload, User, Volume2, VolumeX, X, Zap, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type P = { id: number; name: string; description: string | null; category_id: number | null; photo: string | null; votes: number | null };
type Feed = { id: number; sender: string; participant: string; votes: number | null; message: string | null };
type Live = { participants: P[]; total: number | null; feed: Feed[]; supporters: { name: string; votes: number | null; orders: number }[] };
type Gift = { id: number; emoji: string; name: string; votes: number; price: number };
type Props = {
    event: { id: number; title: string; description: string | null; location: string | null; date: string; organizer: string | null; poster: string | null };
    period: { start: string | null; end: string };
    settings: { price: number; min_votes: number; message_enabled: boolean; message_max: number; show_sender: boolean; show_ranking: boolean; show_votes: boolean };
    categories: { id: number; name: string }[]; gifts: Gift[]; bank: Record<string, string>; online: boolean; fee_percent: number; live: Live;
};

const rp = (n: number) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
const nf = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const dlong = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const panel = 'rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur';
const label = 'text-[11px] font-extrabold uppercase tracking-[0.25em] text-slate-400';
const field = 'mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60';

function useCountdown(end: string) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
    const diff = Math.max(0, new Date(end).getTime() - now);
    return { over: diff === 0, d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60 };
}

function Countdown({ end }: { end: string }) {
    const c = useCountdown(end);
    if (c.over) return <p className="mt-3 text-lg font-extrabold text-rose-300">Voting sudah ditutup</p>;
    return (
        <div className="mt-3 flex gap-2.5">
            {([['Hari', c.d], ['Jam', c.h], ['Menit', c.m], ['Detik', c.s]] as const).map(([l, v]) => (
                <div key={l} className="min-w-[4.2rem] rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
                    <div className="text-3xl font-black tabular-nums">{String(v).padStart(2, '0')}</div>
                    <div className="text-[10px] font-extrabold tracking-[0.25em] text-slate-400 uppercase">{l}</div>
                </div>
            ))}
        </div>
    );
}

function Avatar({ p, cls }: { p: P; cls: string }) {
    return p.photo ? <img src={p.photo} alt={p.name} className={`${cls} object-cover`} /> : <div className={`${cls} flex items-center justify-center bg-white/5 text-3xl font-black text-white/30`}>{p.name.charAt(0).toUpperCase()}</div>;
}

const MAX_VOTES = 9990;

function Sec({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2.5 text-[12px] font-extrabold tracking-[0.3em] text-white uppercase">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-fuchsia-500 to-cyan-400" />
            {children}
        </div>
    );
}

function BuyModal({ p, rank, props, onClose }: { p: P; rank: number; props: Props; onClose: () => void }) {
    const { settings: s, gifts, online, event, fee_percent } = props;
    const form = useForm<{ participant_id: number; gift_id: number | null; votes: string; buyer_name: string; message: string }>({
        participant_id: p.id, gift_id: null, votes: String(s.min_votes), buyer_name: '', message: '',
    });
    const d = form.data;
    const gift = gifts.find((g) => g.id === d.gift_id);
    const votes = gift ? gift.votes : Math.min(MAX_VOTES, Number(d.votes) || 0);
    const base = gift ? gift.price : votes * s.price;
    const fee = Math.round((base * fee_percent) / 100);
    const total = base + fee;
    const [done, setDone] = useState('');
    const [paying, setPaying] = useState(false);
    const [pendingCode, setPendingCode] = useState('');
    const [payMsg, setPayMsg] = useState('');

    const pay = (code: string) => {
        setPaying(true);
        setPayMsg('');
        setPendingCode(code);
        openPayScreen({
            tokenUrl: `/midtrans/vote-token/${code}`,
            syncUrl: `/midtrans/vote-sync/${code}`,
            onSuccess: () => { setPaying(false); setPendingCode(''); setDone('Pembayaran berhasil. Vote Anda sudah dihitung.'); },
            onPending: () => { setPaying(false); setPendingCode(''); setDone('Menunggu pembayaran Anda. Vote masuk setelah pembayaran terkonfirmasi.'); },
            onClose: () => { setPaying(false); setPayMsg('Pembayaran belum diselesaikan. Klik "Lanjutkan pembayaran" untuk membuka lagi.'); },
        });
    };

    const err = form.errors as Record<string, string | undefined>;
    const ok = votes >= (gift ? 1 : s.min_votes) && d.buyer_name.trim() !== '';
    const setVotes = (n: number) => form.setData({ ...d, gift_id: null, votes: String(Math.max(s.min_votes, Math.min(MAX_VOTES, n))) });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/voting/${event.id}/beli`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (pg: any) => {
                const f = (pg.props?.flash ?? {}) as { pay_online?: boolean; order_code?: string };
                if (f.pay_online && f.order_code) void pay(f.order_code);
                else setDone('Pesanan diterima.');
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <form onSubmit={submit} className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-cyan-300/20 bg-[#070b22] text-white shadow-2xl shadow-violet-900/40 sm:rounded-3xl">
                <div className="flex items-center gap-4 border-b border-white/10 px-6 py-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600"><Zap className="h-7 w-7" /></div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-extrabold tracking-[0.3em] text-cyan-300 uppercase">Power-up loadout</div>
                        <div className="truncate text-2xl font-black">Boost Vote Arena</div>
                        <div className="truncate text-sm text-slate-300">{event.title}</div>
                    </div>
                    <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-full border border-white/10 p-2.5 text-slate-300 hover:bg-white/10"><X className="h-5 w-5" /></button>
                </div>

                {done ? (
                    <div className="space-y-4 p-8 text-center">
                        <div className="text-5xl">🎉</div>
                        <p className="text-lg font-extrabold">Terima kasih</p>
                        <p className="text-sm text-slate-300">{done}</p>
                        <button type="button" onClick={onClose} className="rounded-2xl bg-gradient-to-r from-sky-500 to-violet-600 px-8 py-3 text-sm font-extrabold tracking-widest uppercase">Kembali ke arena</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                            <div className="flex items-center gap-4 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-950/80 to-indigo-950/60 p-3.5">
                                <Avatar p={p} cls="h-16 w-16 shrink-0 rounded-xl" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-extrabold tracking-[0.3em] text-cyan-300 uppercase">Target boost</div>
                                    <div className="truncate text-xl font-black uppercase">{p.name}</div>
                                </div>
                                {rank > 0 && <span className="rounded-2xl bg-amber-300 px-4 py-2.5 text-xl font-black text-black">#{rank}</span>}
                            </div>

                            {rank > 0 && (
                                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-400/40 bg-emerald-400/5 px-4 py-3.5 text-sm text-emerald-200">
                                    <Trophy className="h-5 w-5 shrink-0 text-amber-300" />
                                    {rank > 1 ? 'Tambah vote untuk naik peringkat.' : 'Tambah vote untuk mempertahankan posisi puncak.'}
                                </div>
                            )}

                            {!online && <p className="rounded-xl bg-amber-400/10 p-3 text-xs font-bold text-amber-300">Voting sedang dijeda sementara. Pembayaran online belum tersedia.</p>}

                            <div>
                                <Sec>Nama pengirim</Sec>
                                <div className="mt-3 flex items-center gap-2 text-[11px] font-extrabold tracking-[0.25em] text-slate-300 uppercase"><User className="h-4 w-4" /> Nama <span className="text-rose-400">*</span></div>
                                <input value={d.buyer_name} maxLength={80} onChange={(e) => form.setData('buyer_name', e.target.value)} placeholder="Nama lengkap (tampil di daftar dukungan langsung)" className={`${field} !mt-2`} />
                                {err.buyer_name && <span className="text-xs text-rose-400">{err.buyer_name}</span>}
                            </div>

                            {s.message_enabled && (
                                <>
                                    <div className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3.5 text-sm text-slate-100">
                                        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                                        Dukung favoritmu sekarang dan tampilkan pesan dukungan terbaikmu di live voting!
                                    </div>
                                    <div>
                                        <Sec>Pesan dukungan (opsional)</Sec>
                                        <textarea value={d.message} rows={3} maxLength={s.message_max} onChange={(e) => form.setData('message', e.target.value)} placeholder={`Contoh: Semangat terus untuk ${p.name}!`} className={`${field} !mt-3 resize-none`} />
                                        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                                            <span>Maks. {s.message_max} karakter, tampil di daftar dukungan langsung.</span>
                                            <b className="text-cyan-300">{d.message.length}/{s.message_max}</b>
                                        </div>
                                    </div>
                                </>
                            )}

                            {gifts.length > 0 && (
                                <div>
                                    <Sec>Pilih gift power-up</Sec>
                                    <div className="mt-3 grid grid-cols-4 gap-2.5">
                                        {gifts.map((g) => (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => form.setData({ ...d, gift_id: d.gift_id === g.id ? null : g.id, votes: String(g.votes) })}
                                                className={`rounded-2xl border px-1 py-3 text-center transition ${d.gift_id === g.id ? 'border-cyan-300 bg-cyan-300/10 ring-2 ring-cyan-300/30' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                            >
                                                <div className="text-3xl">{g.emoji}</div>
                                                <div className="mt-1.5 truncate text-[11px] font-extrabold tracking-widest uppercase">{g.name}</div>
                                                <div className="mt-1 text-base font-black text-amber-300">+{nf(g.votes)}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-400">Tap gift untuk mengisi jumlah otomatis, atau atur sendiri di bawah.</p>
                                </div>
                            )}

                            <div>
                                <Sec>Atur jumlah vote</Sec>
                                <div className="mt-3 flex items-stretch gap-3">
                                    <button type="button" onClick={() => setVotes(votes - 1)} disabled={votes <= s.min_votes} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 disabled:opacity-40"><Minus className="h-5 w-5" /></button>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={s.min_votes}
                                        max={MAX_VOTES}
                                        value={gift ? String(gift.votes) : d.votes}
                                        onChange={(e) => form.setData({ ...d, gift_id: null, votes: e.target.value.replace(/\D/g, '') })}
                                        onBlur={() => !gift && setVotes(Number(d.votes) || s.min_votes)}
                                        className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#050816] text-center text-2xl font-black outline-none focus:border-cyan-300/60"
                                    />
                                    <button type="button" onClick={() => setVotes(votes + 1)} disabled={votes >= MAX_VOTES} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 disabled:opacity-40"><Plus className="h-5 w-5" /></button>
                                </div>
                                <p className="mt-2 text-xs text-slate-400">Minimal <b className="text-cyan-300">{nf(s.min_votes)}</b>, maksimal <b className="text-cyan-300">{nf(MAX_VOTES)}</b> vote per pembelian.</p>
                                {err.votes && <span className="text-xs text-rose-400">{err.votes}</span>}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
                                <div className="flex items-center justify-between"><span className="text-slate-300">Harga / vote</span><b>{rp(votes > 0 ? Math.round(base / votes) : s.price)}</b></div>
                                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-slate-300">Total vote</span><b className="text-xl text-cyan-300">{rp(total)}</b></div>
                            </div>

                            {payMsg && <p className="rounded-xl bg-amber-400/10 p-3 text-xs font-bold text-amber-300">{payMsg}</p>}
                            {(err.participant_id || err.gift_id) && <p className="rounded-xl bg-rose-400/10 p-3 text-sm font-bold text-rose-300">{err.participant_id ?? err.gift_id}</p>}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 px-6 py-4">
                            <div className="min-w-[10rem] flex-1">
                                <div className="text-[11px] font-extrabold tracking-[0.25em] text-slate-400 uppercase">Total · {nf(votes)} vote</div>
                                <div className="text-3xl font-black text-cyan-300">{rp(total)}</div>
                                <div className="text-[11px] text-slate-400">Vote {rp(base)} + biaya layanan {fee_percent}% {rp(fee)}</div>
                            </div>
                            <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-5 py-3.5 text-xs font-extrabold tracking-[0.25em] uppercase hover:bg-white/10">Batal</button>
                            {pendingCode ? (
                                <button type="button" onClick={() => void pay(pendingCode)} disabled={paying} className="rounded-2xl bg-amber-500 px-5 py-3.5 text-xs font-extrabold tracking-[0.2em] text-black uppercase disabled:opacity-60">
                                    {paying ? 'Membuka...' : 'Lanjutkan pembayaran'}
                                </button>
                            ) : (
                                <button type="submit" disabled={!ok || !online || form.processing || paying} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-3.5 text-xs font-extrabold tracking-[0.2em] uppercase shadow-lg shadow-fuchsia-900/40 transition disabled:cursor-not-allowed disabled:opacity-40">
                                    <Zap className="h-4 w-4" /> {form.processing || paying ? 'Menyiapkan...' : 'Boost sekarang'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}

export default function VotingShow(props: Props) {
    const { event, period, settings, categories, live: initial } = props;
    const [tab, setTab] = useState<'home' | 'arena'>('home');
    const [live, setLive] = useState<Live>(initial);
    const [cat, setCat] = useState<'all' | 'none' | number>('all');
    const [q, setQ] = useState('');
    const [buy, setBuy] = useState<P | null>(null);
    const [sound, setSound] = useState(false);
    const ctx = useRef<AudioContext | null>(null);
    const lastFeed = useRef(initial.feed[0]?.id ?? 0);
    const cd = useCountdown(period.end);
    const started = !period.start || new Date(period.start).getTime() <= Date.now();
    const canBuy = started && !cd.over;

    useEffect(() => {
        const t = setInterval(async () => {
            try {
                const r = await fetch(`/voting/${event.id}/data`, { headers: { Accept: 'application/json' } });
                if (r.ok) setLive(await r.json());
            } catch { /* abaikan */ }
        }, 5000);
        return () => clearInterval(t);
    }, [event.id]);

    useEffect(() => {
        const top = live.feed[0]?.id ?? 0;
        if (top > lastFeed.current && sound && ctx.current) {
            const o = ctx.current.createOscillator(); const g = ctx.current.createGain();
            o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.15, ctx.current.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.current.currentTime + 0.5);
            o.connect(g); g.connect(ctx.current.destination); o.start(); o.stop(ctx.current.currentTime + 0.5);
        }
        lastFeed.current = top;
    }, [live.feed, sound]);

    const toggleSound = () => { if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)(); setSound((v) => !v); };

    // Bacakan pesan dukungan baru dengan suara perempuan (Web Speech API)
    const spokenFeed = useRef(initial.feed[0]?.id ?? 0);
    useEffect(() => {
        const top = live.feed[0]?.id ?? 0;
        if (top <= spokenFeed.current) return;
        const fresh = live.feed.filter((f) => f.id > spokenFeed.current).reverse();
        spokenFeed.current = top;
        if (!sound || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('id'));
        const female = voices.find((v) => /damayanti|gadis|google bahasa|female|perempuan|wanita/i.test(v.name));
        const voice = female ?? voices[0];

        fresh.forEach((f) => {
            const msg = (f.message ?? '').trim();
            if (!msg) return;
            const head = f.votes !== null ? `${f.votes} vote dari ${f.sender}.` : `Dukungan dari ${f.sender}.`;
            const u = new SpeechSynthesisUtterance(`${head} ${msg}`);
            u.lang = 'id-ID';
            if (voice) u.voice = voice;
            u.pitch = female ? 1.05 : 1.3;
            u.rate = 0.95;
            window.speechSynthesis.speak(u);
        });
    }, [live.feed, sound]);

    useEffect(() => {
        if (!sound && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    }, [sound]);

    const hasNone = live.participants.some((p) => p.category_id === null);
    const list = useMemo(() => live.participants.filter((p) => (cat === 'all' ? true : cat === 'none' ? p.category_id === null : p.category_id === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [live.participants, cat, q]);
    const scope = live.participants.filter((p) => (cat === 'all' ? true : cat === 'none' ? p.category_id === null : p.category_id === cat));
    const scopeVotes = settings.show_votes ? scope.reduce((a, p) => a + (p.votes ?? 0), 0) : null;
    const title = cat === 'all' ? event.title : cat === 'none' ? 'Lainnya' : categories.find((c) => c.id === cat)?.name ?? event.title;
    const podium = settings.show_ranking && !q ? list.slice(0, 3) : [];
    const rest = settings.show_ranking && !q ? list.slice(3) : list;
    const chip = (on: boolean) => `shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold tracking-widest uppercase transition ${on ? 'border-cyan-300 bg-cyan-300/15 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`;
    const votesLabel = (v: number | null) => (v === null ? '' : nf(v));
    const order = [1, 0, 2];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0a1030] to-[#1a0b3a] pb-32 text-white">
            <div className="mx-auto max-w-7xl px-6 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <a href="/voting" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-extrabold tracking-[0.2em] uppercase hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Semua voting</a>
                    <div className="flex gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-xs font-extrabold tracking-[0.2em] text-rose-200 uppercase"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Live</span>
                        <button type="button" onClick={toggleSound} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-extrabold tracking-[0.2em] uppercase hover:bg-white/10">{sound ? <Volume2 className="h-4 w-4 text-cyan-300" /> : <VolumeX className="h-4 w-4" />} Sound {sound ? 'on' : 'off'}</button>
                    </div>
                </div>

                {tab === 'home' && (
                    <div className={`${panel} mt-5 grid gap-8 p-6 lg:grid-cols-[360px_1fr] lg:p-9`}>
                        <div className="mx-auto w-full max-w-sm">
                            <div className="overflow-hidden rounded-3xl border border-cyan-300/30 shadow-2xl shadow-cyan-900/30">
                                {event.poster ? <img src={event.poster} alt={event.title} className="w-full" /> : <div className="flex aspect-[3/4] items-center justify-center bg-white/5"><Trophy className="h-16 w-16 text-white/20" /></div>}
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap gap-2 text-[11px] font-extrabold tracking-[0.2em] uppercase">
                                <span className={`rounded-full border px-3.5 py-2 ${canBuy ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-slate-500/40 text-slate-300'}`}>{canBuy ? '● Buka' : started ? 'Ditutup' : 'Belum dimulai'}</span>
                                <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-3.5 py-2 text-violet-200">{rp(settings.price)} / vote</span>
                            </div>
                            <h1 className="mt-5 text-4xl font-black tracking-tight uppercase sm:text-6xl">{event.title}</h1>
                            {event.description && <p className="mt-5 border-l-2 border-cyan-300/50 pl-5 whitespace-pre-line text-slate-300">{event.description}</p>}
                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                {([[Calendar, 'Tanggal event', dlong(event.date)], [MapPin, 'Lokasi', event.location ?? '-'], [User, 'Penyelenggara', event.organizer ?? '-']] as const).map(([I, l, v]) => (
                                    <div key={l} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><I className="h-5 w-5 shrink-0 text-cyan-300" /><div><div className={label}>{l}</div><div className="mt-0.5 font-extrabold">{v}</div></div></div>
                                ))}
                            </div>
                            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><Clock className="h-5 w-5 shrink-0 text-cyan-300" /><div><div className={label}>Periode voting</div><div className="mt-0.5 font-extrabold">{period.start ? `${dlong(period.start)} – ` : 'Sekarang – '}{dlong(period.end)}</div></div></div>
                            <div className="mt-3 flex flex-wrap items-end justify-between gap-5 rounded-3xl border border-white/10 bg-white/5 p-5">
                                <div><div className={label}>Voting berakhir dalam</div><Countdown end={period.end} /></div>
                                <button type="button" onClick={() => setTab('arena')} className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-600 px-7 py-4 text-sm font-extrabold tracking-[0.25em] uppercase shadow-lg shadow-violet-900/40"><Swords className="h-5 w-5" /> Masuk arena &amp; vote</button>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'arena' && (
                    <div className="mt-5 space-y-5">
                        <div className={`${panel} p-6 lg:p-8`}>
                            <div className="flex flex-wrap items-start justify-between gap-5">
                                <div>
                                    <div className="text-[11px] font-extrabold tracking-[0.3em] text-cyan-300 uppercase">Kategori voting</div>
                                    <h2 className="mt-2 text-4xl font-black tracking-tight uppercase sm:text-5xl">{title}</h2>
                                    <div className="mt-1 text-xs font-extrabold tracking-[0.3em] text-slate-400 uppercase">{event.title}</div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 p-4"><div className={label}>Kontestan</div><div className="mt-1 text-3xl font-black">{scope.length}</div></div>
                                    {scopeVotes !== null && <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 p-4"><div className={label}>Vote</div><div className="mt-1 text-3xl font-black text-emerald-300">{nf(scopeVotes)}</div></div>}
                                </div>
                            </div>
                            <div className="mt-5"><div className={label}>Voting berakhir dalam</div><Countdown end={period.end} /></div>
                        </div>

                        {(categories.length > 0) && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                <button type="button" onClick={() => setCat('all')} className={chip(cat === 'all')}>Semua</button>
                                {categories.map((c) => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={chip(cat === c.id)}>{c.name}</button>)}
                                {hasNone && <button type="button" onClick={() => setCat('none')} className={chip(cat === 'none')}>Lainnya</button>}
                            </div>
                        )}

                        {live.feed[0] && (
                            <div className="flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm">
                                <Zap className="h-5 w-5 shrink-0 text-cyan-300" />
                                <p className="min-w-0 truncate"><b>{live.feed[0].sender}</b> mendukung <b className="text-cyan-300">{live.feed[0].participant}</b>
                                    {live.feed[0].votes !== null && <span className="ml-2 rounded-full bg-amber-300/20 px-2.5 py-0.5 text-xs font-extrabold text-amber-200">{nf(live.feed[0].votes)} suara</span>}
                                    {live.feed[0].message && <span className="ml-2 text-slate-300">“{live.feed[0].message}”</span>}</p>
                            </div>
                        )}

                        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                            <div className="space-y-5">
                                {settings.show_sender && (
                                    <div className={`${panel} p-5`}>
                                        <div className="flex items-center gap-2 text-sm font-extrabold tracking-[0.2em] uppercase"><Crown className="h-5 w-5 text-cyan-300" /> Pendukung teratas</div>
                                        <div className="mt-4 space-y-2.5">
                                            {live.supporters.length === 0 && <p className="text-sm text-slate-400">Belum ada pendukung.</p>}
                                            {live.supporters.map((s, i) => (
                                                <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                                    <span className={`text-lg font-black ${i === 0 ? 'text-amber-300' : 'text-slate-400'}`}>{i + 1}</span>
                                                    <div className="min-w-0 flex-1"><div className="truncate font-extrabold">{s.name}</div><div className="text-xs text-slate-400">dari {s.orders} pembelian</div></div>
                                                    {s.votes !== null && <div className="text-right text-xl font-black text-cyan-300">{nf(s.votes)}<div className="text-[10px] tracking-widest text-slate-400 uppercase">vote</div></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className={`${panel} p-5`}>
                                    <div className="flex items-center gap-2 text-sm font-extrabold tracking-[0.2em] uppercase"><MessageSquare className="h-5 w-5 text-cyan-300" /> Vote masuk</div>
                                    <div className="mt-4 space-y-2.5">
                                        {live.feed.length === 0 && <p className="text-sm text-slate-400">Belum ada vote masuk.</p>}
                                        {live.feed.map((f) => (
                                            <div key={f.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                                                <div className="flex justify-between gap-2"><b className="truncate">{f.sender}</b>{f.votes !== null && <b className="text-emerald-300">+{nf(f.votes)}</b>}</div>
                                                <div className="text-cyan-300">{f.participant}</div>
                                                {f.message && <div className="mt-0.5 text-slate-300">“{f.message}”</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className={label}>Peringkat arena</div>
                                    <div className="relative w-full sm:w-72"><Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari peserta voting..." className={`${field} !mt-0 pl-11`} /></div>
                                </div>

                                {podium.length > 0 && (
                                    <div className="mt-5 grid grid-cols-3 items-end gap-3">
                                        {order.filter((i) => podium[i]).map((i) => {
                                            const p = podium[i];
                                            const tone = i === 0 ? 'border-amber-400/50 bg-amber-400/10' : i === 1 ? 'border-slate-300/40 bg-slate-300/10' : 'border-orange-500/40 bg-orange-500/10';
                                            return (
                                                <div key={p.id} className={`rounded-3xl border p-3 ${tone} ${i === 0 ? 'pb-5' : ''}`}>
                                                    <div className="flex items-center justify-between text-[11px] font-extrabold tracking-widest uppercase"><span className="inline-flex items-center gap-1">{i === 0 ? <Crown className="h-3.5 w-3.5 text-amber-300" /> : <Trophy className="h-3.5 w-3.5" />} Juara {i + 1}</span>{p.votes !== null && <span className="text-cyan-300">{votesLabel(p.votes)}</span>}</div>
                                                    <Avatar p={p} cls={`mt-3 w-full rounded-2xl ${i === 0 ? 'aspect-[4/5]' : 'aspect-square'}`} />
                                                    <div className="mt-3 truncate text-center font-black uppercase">{p.name}</div>
                                                    <button type="button" disabled={!canBuy} onClick={() => setBuy(p)} className="mt-3 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-2.5 text-xs font-extrabold tracking-[0.25em] uppercase disabled:opacity-40">Beli vote</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-4 space-y-3">
                                    {list.length === 0 && <p className={`${panel} p-8 text-center text-slate-400`}>Peserta tidak ditemukan.</p>}
                                    {rest.map((p, i) => (
                                        <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                                            {settings.show_ranking && !q && <span className="w-9 text-center text-lg font-black text-slate-400">#{i + 4}</span>}
                                            <Avatar p={p} cls="h-14 w-14 shrink-0 rounded-xl" />
                                            <div className="min-w-0 flex-1"><div className="truncate font-black uppercase">{p.name}</div>{p.description && <div className="truncate text-xs text-slate-400">{p.description}</div>}</div>
                                            {p.votes !== null && <div className="text-right text-xl font-black text-cyan-300">{nf(p.votes)}<div className="text-[10px] tracking-widest text-slate-400 uppercase">vote</div></div>}
                                            <button type="button" disabled={!canBuy} onClick={() => setBuy(p)} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-xs font-extrabold tracking-widest uppercase disabled:opacity-40">Beli vote</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <nav className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 gap-1.5 rounded-3xl border border-white/10 bg-[#0a0f2a]/90 p-2 shadow-2xl backdrop-blur">
                {([['home', Home, 'Home'], ['arena', Swords, 'Arena']] as const).map(([k, I, l]) => (
                    <button key={k} type="button" onClick={() => setTab(k)} className={`flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-xs font-extrabold tracking-[0.25em] uppercase transition ${tab === k ? 'border border-indigo-400/50 bg-indigo-600/40 text-white' : 'text-slate-400 hover:text-white'}`}><I className="h-5 w-5" /> {l}</button>
                ))}
            </nav>

            {buy && <BuyModal p={buy} rank={settings.show_ranking ? live.participants.findIndex((x) => x.id === buy.id) + 1 : 0} props={props} onClose={() => setBuy(null)} />}
        </div>
    );
}
