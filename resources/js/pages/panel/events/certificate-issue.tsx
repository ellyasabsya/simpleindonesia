import PanelLayout from '@/components/panel/panel-layout';
import { router, usePage } from '@inertiajs/react';
import { CheckCircle2, Download, Loader2, Palette, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

type Cat = { key: string; label: string; total: number; issued: number; revoked: number; failed: number; waiting: number };
type Tpl = { id: number; name: string; orientation: string };
type Batch = { id: number; category: string; status: string; total: number; done: number; failed: number; created_at: string | null; finished_at: string | null };
type Recent = { id: number; name: string; category: string; number: string; issued_at: string | null };
type Props = { eventId: number; categories: Cat[]; templates: Tpl[]; batches: Batch[]; recent: Recent[]; queue: string };

const card = 'rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const select =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-slate-900';

const BATCH: Record<string, { text: string; cls: string }> = {
    queued: { text: 'Antre', cls: 'bg-slate-100 text-slate-600' },
    running: { text: 'Berjalan', cls: 'bg-amber-100 text-amber-700' },
    done: { text: 'Selesai', cls: 'bg-emerald-100 text-emerald-700' },
    failed: { text: 'Gagal', cls: 'bg-red-100 text-red-700' },
};

const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) : '-';

export default function CertificateIssue({ eventId, categories, templates, batches: initial, recent, queue }: Props) {
    const base = `/panel/event/${eventId}/sertifikat`;
    const errors = (usePage().props as { errors?: Record<string, string> }).errors ?? {};

    const firstWaiting = categories.find((c) => c.waiting > 0)?.key ?? categories[0]?.key ?? 'peserta';
    const [category, setCategory] = useState(firstWaiting);
    const [templateId, setTemplateId] = useState<string>(templates[0] ? String(templates[0].id) : '');
    const [batches, setBatches] = useState<Batch[]>(initial);
    const [busy, setBusy] = useState(false);

    useEffect(() => setBatches(initial), [initial]);

    const active = batches.some((b) => b.status === 'queued' || b.status === 'running');

    // Pantau progres selama ada batch aktif; muat ulang halaman saat selesai agar angka kategori ikut berubah.
    useEffect(() => {
        if (!active) return;
        const t = setInterval(async () => {
            try {
                const res = await fetch(`${base}/terbitkan/progres`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
                if (!res.ok) return;
                const json = (await res.json()) as { batches: Batch[] };
                setBatches(json.batches);
                if (!json.batches.some((b) => b.status === 'queued' || b.status === 'running')) {
                    router.reload();
                }
            } catch {
                /* abaikan, coba lagi pada putaran berikutnya */
            }
        }, 3000);
        return () => clearInterval(t);
    }, [active, base]);

    const cat = categories.find((c) => c.key === category);

    const start = () => {
        if (!cat || !templateId) return;
        setBusy(true);
        router.post(`${base}/terbitkan`, { category, template_id: Number(templateId) }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    return (
        <PanelLayout title="Terbitkan Sertifikat">
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <a href={base} onClick={(e) => { e.preventDefault(); router.visit(base); }} className="text-sm text-indigo-600 hover:underline">
                        ← Kembali ke Sertifikat Digital
                    </a>
                    <a
                        href={`${base}/desain`}
                        onClick={(e) => { e.preventDefault(); router.visit(`${base}/desain`); }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        <Palette className="h-4 w-4" /> Buka desainer
                    </a>
                </div>

                {queue === 'sync' && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Antrean masih berjalan serentak (sync), sehingga penerbitan massal dikerjakan saat Anda menunggu dan bisa terputus. Ubah QUEUE_CONNECTION ke database dan jalankan worker.
                    </div>
                )}

                <div className={card}>
                    <h2 className="mb-4 text-base font-semibold">Terbitkan sertifikat</h2>
                    {templates.length === 0 ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Belum ada template. Buat dan simpan template di desainer dahulu.
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Kategori penerima</label>
                                <select className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
                                    {categories.map((c) => (
                                        <option key={c.key} value={c.key}>
                                            {c.label} ({c.waiting} menunggu)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">Template</label>
                                <select className={select} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.orientation === 'portrait' ? 'portrait' : 'landscape'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={start}
                                    disabled={busy || active || !cat || cat.waiting === 0}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {busy || active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Terbitkan {cat?.waiting ?? 0} sertifikat
                                </button>
                            </div>
                        </div>
                    )}
                    {errors.category && <p className="mt-3 text-sm text-red-600">{errors.category}</p>}
                    {errors.template_id && <p className="mt-3 text-sm text-red-600">{errors.template_id}</p>}
                    {cat && cat.failed > 0 && (
                        <p className="mt-3 text-sm text-red-600">{cat.failed} sertifikat gagal. Tekan Terbitkan lagi untuk mengulang, nomor yang sama dipakai kembali.</p>
                    )}
                    <p className="mt-3 text-xs text-slate-500">
                        Yang sudah terbit atau dicabut tidak dibuat ulang. Menekan tombol dua kali tidak menggandakan sertifikat.
                    </p>
                </div>

                <div className={card}>
                    <h2 className="mb-4 text-base font-semibold">Penerbitan terakhir</h2>
                    {batches.length === 0 ? (
                        <p className="text-sm text-slate-500">Belum ada penerbitan.</p>
                    ) : (
                        <div className="space-y-3">
                            {batches.map((b) => {
                                const pct = b.total ? Math.round(((b.done + b.failed) / b.total) * 100) : 0;
                                const st = BATCH[b.status] ?? BATCH.queued;
                                return (
                                    <div key={b.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                            <span className="font-medium">{b.category}</span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.text}</span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                                            <span>
                                                {b.done} terbit · {b.failed} gagal · dari {b.total}
                                            </span>
                                            <span>{fmt(b.finished_at ?? b.created_at)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={card}>
                    <h2 className="mb-4 text-base font-semibold">Sertifikat terbit terbaru</h2>
                    {recent.length === 0 ? (
                        <p className="text-sm text-slate-500">Belum ada sertifikat terbit.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/10">
                            {recent.map((r) => (
                                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        <span className="font-medium">{r.name}</span>
                                        <span className="text-slate-500">{r.category} · {r.number}</span>
                                    </span>
                                    <a href={`${base}/berkas/${r.id}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                                        <Download className="h-4 w-4" /> Unduh
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </PanelLayout>
    );
}
