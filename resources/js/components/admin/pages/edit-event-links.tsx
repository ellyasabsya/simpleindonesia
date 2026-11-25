import { Copy, Link2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { box, h3, inp, mini } from './edit-event-form';

export type LinkRow = { id: number; status: string; expires_at: string; created_at: string; last_opened_at: string | null; edited_at: string | null };

const LINK_LABEL: Record<string, string> = { aktif: 'Aktif', dipakai: 'Sudah dipakai', kedaluwarsa: 'Kedaluwarsa', dicabut: 'Dicabut' };

function xsrf(): string {
    const m = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
    return m ? decodeURIComponent(m.split('=').slice(1).join('=')) : '';
}

export function EditLinkPanel({ eventId, initial }: { eventId: number; initial: LinkRow[] }) {
    const [rows, setRows] = useState<LinkRow[]>(initial);
    const [days, setDays] = useState('7');
    const [url, setUrl] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    const call = async (path: string, method: string, body?: object) => {
        const res = await fetch(path, {
            method,
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf() },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
    };

    const create = async () => {
        setBusy(true);
        setMsg('');
        try {
            const r = await call(`/admin/events/${eventId}/edit-links`, 'POST', { days: Number(days) });
            setUrl(r.url);
            setRows(r.links);
        } catch {
            setMsg('Gagal membuat link. Muat ulang halaman lalu coba lagi.');
        } finally {
            setBusy(false);
        }
    };

    const revoke = async (id: number) => {
        if (!window.confirm('Cabut link ini? Panitia tidak bisa lagi membukanya.')) return;
        try {
            const r = await call(`/admin/events/${eventId}/edit-links/${id}/revoke`, 'PATCH');
            setRows(r.links);
        } catch {
            setMsg('Gagal mencabut link.');
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setMsg('Link disalin.');
        } catch {
            setMsg('Gagal menyalin otomatis. Salin manual dari kotak di atas.');
        }
    };

    return (
        <section className={box}>
            <h3 className={h3}>Link edit untuk panitia</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Panitia mengedit sendiri lewat link ini, tanpa login. Satu link hanya bisa dipakai untuk sekali simpan. Membuat link baru mencabut link aktif sebelumnya.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="block text-[13px] font-semibold text-slate-600 md:text-xs dark:text-slate-300">
                    Masa berlaku
                    <select className={inp} value={days} onChange={(e) => setDays(e.target.value)}>
                        {['1', '3', '7', '14', '30'].map((d) => <option key={d} value={d}>{d} hari</option>)}
                    </select>
                </label>
                <button type="button" onClick={create} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Buat link baru
                </button>
            </div>

            {url && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">Salin sekarang. Link ini tidak akan ditampilkan lagi.</p>
                    <div className="mt-2 flex gap-2">
                        <input readOnly className={`${inp} mt-0`} value={url} onFocus={(e) => e.currentTarget.select()} />
                        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-bold text-emerald-700"><Copy className="h-4 w-4" /> Salin</button>
                    </div>
                </div>
            )}
            {msg && <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{msg}</p>}

            {rows.length > 0 && (
                <div className="mt-4 space-y-2">
                    {rows.map((r) => (
                        <div key={r.id} className={`${mini} flex flex-wrap items-center justify-between gap-2`}>
                            <div className="text-xs">
                                <span className="font-bold">{LINK_LABEL[r.status] ?? r.status}</span>
                                <span className="text-slate-500"> · dibuat {r.created_at} · berlaku sampai {r.expires_at}</span>
                                {r.last_opened_at && <span className="text-slate-500"> · dibuka {r.last_opened_at}</span>}
                                {r.edited_at && <span className="text-slate-500"> · disimpan {r.edited_at}</span>}
                            </div>
                            {r.status === 'aktif' && (
                                <button type="button" onClick={() => revoke(r.id)} className="text-xs font-bold text-rose-600 hover:underline">Cabut</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
