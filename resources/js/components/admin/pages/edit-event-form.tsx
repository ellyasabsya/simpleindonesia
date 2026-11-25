import { Lock, MapPin, Plus, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';

type Prize = { rank: string; prize: string };
type Cat = { id?: number; name: string; quota: string; competition_name: string; min_age: string; max_age: string; requirements: string; prizes: Prize[]; registrants?: number };
type Tix = { id?: number; name: string; price: string; quota: string; valid_from: string; valid_until: string; max_per_order: string; orders?: number; sold?: number };
export type Det = {
    id: number; title: string; description: string; starts_at: string; ends_at: string; category: string; location: string;
    poster_url: string | null; juknis_url: string | null; poster: File | null; juknis: File | null;
    competition_type: string; team_size: string; team_slots: string[]; team_per_row: string; team_leaders: string;
    registration_method: string; registration_fee: string; bank_name: string; bank_account_number: string; bank_account_name: string;
    contact_name: string; contact_phone: string; contact_email: string; contact_position: string;
    participant_categories: Cat[]; ticket_types: Tix[]; has_registrants: boolean;
};
export type FormShape = Det & { subs: Det[] };

const COMP = ['perlombaan', 'olahraga'];
export const inp = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-normal outline-none md:py-2.5 md:text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 disabled:bg-slate-100 disabled:text-slate-500 dark:border-white/10 dark:bg-white/5 dark:disabled:bg-white/10';
export const box = 'rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-5 dark:border-white/10 dark:bg-slate-900/60';
export const h3 = 'text-[15px] font-semibold md:text-base md:font-extrabold';
export const mini = 'rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/5';

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="block text-[13px] font-semibold text-slate-600 md:text-xs dark:text-slate-300">
            {label}
            {children}
            {error && <span className="mt-1 block text-xs font-normal text-rose-500">{error}</span>}
        </label>
    );
}

export function DetailForm({ d, set, pre, err, categories, detail }: {
    d: Det; set: (p: Partial<Det>) => void; pre: string; err: (k: string) => string | undefined; categories: Record<string, string>; detail: boolean;
}) {
    const comp = COMP.includes(d.category);
    const team = comp && d.competition_type === 'team';
    const lockTeam = d.has_registrants;
    const updCat = (i: number, p: Partial<Cat>) => set({ participant_categories: d.participant_categories.map((x, j) => (j === i ? { ...x, ...p } : x)) });
    const updTix = (i: number, p: Partial<Tix>) => set({ ticket_types: d.ticket_types.map((x, j) => (j === i ? { ...x, ...p } : x)) });
    const text = (k: keyof Det, label: string, type = 'text') => (
        <Field label={label} error={err(pre + k)}>
            <input type={type} className={inp} value={String(d[k] ?? '')} onChange={(e) => set({ [k]: e.target.value } as Partial<Det>)} />
        </Field>
    );

    return (
        <div className="mt-3 space-y-5 md:mt-4 md:space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">{text('title', 'Judul')}</div>
                <div className="sm:col-span-2">
                    <Field label="Deskripsi" error={err(pre + 'description')}>
                        <textarea rows={4} className={inp} value={d.description} onChange={(e) => set({ description: e.target.value })} />
                    </Field>
                </div>
                {text('starts_at', 'Mulai', 'date')}
                {text('ends_at', 'Selesai', 'date')}
                {detail && (
                    <>
                        <Field label="Kategori" error={err(pre + 'category')}>
                            <select className={inp} value={d.category} onChange={(e) => set({ category: e.target.value })}>
                                <option value="">Pilih kategori</option>
                                {Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </select>
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="Lokasi acara" error={err(pre + 'location')}>
                                <input className={inp} maxLength={150} value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="Contoh: Universitas Batam, Jl. Uniba No. 5, Batam" />
                                <span className="mt-1.5 flex items-start gap-1.5 text-xs font-normal text-slate-500 dark:text-slate-400"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />Tulis nama tempat, alamat, dan kota agar peserta mudah menemukan lokasi lewat Google Maps.</span>
                            </Field>
                        </div>
                    </>
                )}
                <Field label="Poster (kosongkan jika tidak diganti)" error={err(pre + 'poster')}>
                    {d.poster_url && <img src={d.poster_url} alt="" className="mt-1 h-24 rounded-lg object-cover" />}
                    <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => set({ poster: e.target.files?.[0] ?? null })} />
                </Field>
                <Field label="Juknis PDF (kosongkan jika tidak diganti)" error={err(pre + 'juknis')}>
                    {d.juknis_url && <a href={d.juknis_url} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-semibold text-indigo-700 hover:underline">Lihat juknis saat ini</a>}
                    <input type="file" accept="application/pdf" className="mt-1 block w-full text-sm" onChange={(e) => set({ juknis: e.target.files?.[0] ?? null })} />
                </Field>
            </div>

            {detail && comp && (
                <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
                    <h4 className={h3}>Jenis perlombaan</h4>
                    {lockTeam && <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600"><Lock className="h-3.5 w-3.5" /> Sudah ada pendaftar. Jenis dan susunan tim dikunci.</p>}
                    <div className="grid gap-3 sm:grid-cols-4">
                        <Field label="Jenis" error={err(pre + 'competition_type')}>
                            <select className={inp} disabled={lockTeam} value={d.competition_type} onChange={(e) => set({ competition_type: e.target.value })}>
                                <option value="">Pilih</option>
                                <option value="individual">Perorangan</option>
                                <option value="team">Tim</option>
                            </select>
                        </Field>
                        {team && (
                            <>
                                <Field label="Peserta per tim" error={err(pre + 'team_size')}>
                                    <input type="number" min={2} className={inp} disabled={lockTeam} value={d.team_size} onChange={(e) => set({ team_size: e.target.value })} />
                                </Field>
                                <Field label="Peserta per baris" error={err(pre + 'team_per_row')}>
                                    <input type="number" min={1} className={inp} disabled={lockTeam} value={d.team_per_row} onChange={(e) => set({ team_per_row: e.target.value })} />
                                </Field>
                                <Field label="Kotak ketua" error={err(pre + 'team_leaders')}>
                                    <input type="number" min={0} className={inp} disabled={lockTeam} value={d.team_leaders} onChange={(e) => set({ team_leaders: e.target.value })} />
                                </Field>
                            </>
                        )}
                    </div>
                </div>
            )}

            {detail && (
                <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
                    <h4 className={h3}>Kategori peserta</h4>
                    {d.participant_categories.map((c, i) => {
                        const k = `${pre}participant_categories.${i}.`;
                        return (
                            <div key={c.id ?? `n${i}`} className={mini}>
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold">Kategori {i + 1}{c.registrants ? ` · ${c.registrants} pendaftar` : ''}</span>
                                    <button type="button" disabled={!!c.registrants || d.participant_categories.length <= 1}
                                        onClick={() => set({ participant_categories: d.participant_categories.filter((_, j) => j !== i) })}
                                        className="inline-flex h-10 items-center gap-1 px-2 text-xs font-bold text-rose-600 disabled:opacity-40 md:h-auto md:px-0"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label="Nama kategori" error={err(k + 'name')}><input className={inp} value={c.name} onChange={(e) => updCat(i, { name: e.target.value })} /></Field>
                                    <Field label={c.registrants ? `Kuota (min ${c.registrants})` : 'Kuota'} error={err(k + 'quota')}><input type="number" min={1} className={inp} value={c.quota} onChange={(e) => updCat(i, { quota: e.target.value })} /></Field>
                                    {comp && (
                                        <>
                                            <div className="sm:col-span-2"><Field label="Nama kategori" error={err(k + 'competition_name')}><input className={inp} value={c.competition_name} onChange={(e) => updCat(i, { competition_name: e.target.value })} /></Field></div>
                                            <Field label="Usia minimal" error={err(k + 'min_age')}><input type="number" min={0} className={inp} value={c.min_age} onChange={(e) => updCat(i, { min_age: e.target.value })} /></Field>
                                            <Field label="Usia maksimal" error={err(k + 'max_age')}><input type="number" min={0} className={inp} value={c.max_age} onChange={(e) => updCat(i, { max_age: e.target.value })} /></Field>
                                            <div className="sm:col-span-2"><Field label="Syarat tambahan" error={err(k + 'requirements')}><textarea rows={2} className={inp} value={c.requirements} onChange={(e) => updCat(i, { requirements: e.target.value })} /></Field></div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Hadiah</span>
                                                {c.prizes.map((p, pi) => (
                                                    <div key={pi} className="flex gap-2">
                                                        <input placeholder="Juara" className={`${inp} mt-0 w-32`} value={p.rank} onChange={(e) => updCat(i, { prizes: c.prizes.map((x, j) => (j === pi ? { ...x, rank: e.target.value } : x)) })} />
                                                        <input placeholder="Hadiah" className={`${inp} mt-0`} value={p.prize} onChange={(e) => updCat(i, { prizes: c.prizes.map((x, j) => (j === pi ? { ...x, prize: e.target.value } : x)) })} />
                                                        <button type="button" aria-label="Hapus hadiah" onClick={() => updCat(i, { prizes: c.prizes.filter((_, j) => j !== pi) })} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 md:size-auto md:p-2"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                ))}
                                                {c.prizes.length < 10 && (
                                                    <button type="button" onClick={() => updCat(i, { prizes: [...c.prizes, { rank: '', prize: '' }] })} className="inline-flex h-10 items-center gap-1 text-xs font-bold text-indigo-700 md:h-auto"><Plus className="h-3.5 w-3.5" /> Tambah hadiah</button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {err(pre + 'participant_categories') && <p className="text-xs text-rose-500">{err(pre + 'participant_categories')}</p>}
                    <button type="button" onClick={() => set({ participant_categories: [...d.participant_categories, { name: '', quota: '', competition_name: '', min_age: '', max_age: '', requirements: '', prizes: [] }] })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 h-10 px-3 text-sm font-bold text-indigo-700 md:h-auto md:py-2"><Plus className="h-4 w-4" /> Tambah kategori peserta</button>
                </div>
            )}

            {detail && (
                <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
                    <h4 className={h3}>Pendaftaran</h4>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Lock className="h-3.5 w-3.5" /> Metode: {d.registration_method === 'ticket' ? 'Tiket' : 'Transfer manual'} (tidak bisa diubah)</p>
                    {d.registration_method === 'transfer_manual' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {text('registration_fee', 'Biaya pendaftaran (Rp)', 'number')}
                            {text('bank_name', 'Nama bank')}
                            {text('bank_account_number', 'Nomor rekening')}
                            {text('bank_account_name', 'Nama pemilik rekening')}
                        </div>
                    )}
                    {d.registration_method === 'ticket' && (
                        <>
                            {d.ticket_types.map((t, i) => {
                                const k = `${pre}ticket_types.${i}.`;
                                return (
                                    <div key={t.id ?? `n${i}`} className={mini}>
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-xs font-bold">Tiket {i + 1}{t.orders ? ` · ${t.sold ?? 0} terpesan, harga dikunci` : ''}</span>
                                            <button type="button" disabled={!!t.orders || d.ticket_types.length <= 1} onClick={() => set({ ticket_types: d.ticket_types.filter((_, j) => j !== i) })}
                                                className="inline-flex h-10 items-center gap-1 px-2 text-xs font-bold text-rose-600 disabled:opacity-40 md:h-auto md:px-0"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <Field label="Nama tiket" error={err(k + 'name')}><input className={inp} value={t.name} onChange={(e) => updTix(i, { name: e.target.value })} /></Field>
                                            <Field label="Harga (Rp)" error={err(k + 'price')}><input type="number" min={0} className={inp} disabled={!!t.orders} value={t.price} onChange={(e) => updTix(i, { price: e.target.value })} /></Field>
                                            <Field label={t.sold ? `Kuota (min ${t.sold})` : 'Kuota'} error={err(k + 'quota')}><input type="number" min={1} className={inp} value={t.quota} onChange={(e) => updTix(i, { quota: e.target.value })} /></Field>
                                            <Field label="Berlaku mulai" error={err(k + 'valid_from')}><input type="date" className={inp} value={t.valid_from} onChange={(e) => updTix(i, { valid_from: e.target.value })} /></Field>
                                            <Field label="Berlaku sampai" error={err(k + 'valid_until')}><input type="date" className={inp} value={t.valid_until} onChange={(e) => updTix(i, { valid_until: e.target.value })} /></Field>
                                        </div>
                                    </div>
                                );
                            })}
                            {err(pre + 'ticket_types') && <p className="text-xs text-rose-500">{err(pre + 'ticket_types')}</p>}
                            {d.ticket_types.length < 10 && (
                                <button type="button" onClick={() => set({ ticket_types: [...d.ticket_types, { name: '', price: '', quota: '', valid_from: '', valid_until: '', max_per_order: '1' }] })}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 h-10 px-3 text-sm font-bold text-indigo-700 md:h-auto md:py-2"><Plus className="h-4 w-4" /> Tambah jenis tiket</button>
                            )}
                        </>
                    )}
                </div>
            )}

            {detail && (
                <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
                    <h4 className={h3}>Penanggung jawab</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {text('contact_name', 'Nama')}
                        {text('contact_phone', 'Nomor kontak')}
                        {text('contact_email', 'Email', 'email')}
                        {text('contact_position', 'Jabatan')}
                    </div>
                </div>
            )}
        </div>
    );
}
