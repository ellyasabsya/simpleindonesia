import { usePage } from '@inertiajs/react';
import { Hash } from 'lucide-react';
import { useState } from 'react';

type Row = { code: string | null; name: string; kind: string; status: string; event: string | null };

export default function RegistrationIdList() {
    const rows = ((usePage().props as any).regIds ?? []) as Row[];
    const [q, setQ] = useState('');
    const showEvent = rows.some((r) => r.event);
    const list = rows.filter((r) => `${r.code} ${r.name} ${r.kind} ${r.event ?? ''}`.toLowerCase().includes(q.toLowerCase()));

    return (
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                    <Hash className="size-5 text-indigo-600" /> Daftar ID registrasi <span className="text-sm font-semibold text-slate-500">({rows.length})</span>
                </h3>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari ID, nama, kategori" className="w-64 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
            </div>
            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            <th className="py-2 pr-4">ID registrasi</th>
                            <th className="py-2 pr-4">Nama</th>
                            {showEvent && <th className="py-2 pr-4">Lomba</th>}
                            <th className="py-2 pr-4">Kategori / tiket</th>
                            <th className="py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((r, i) => (
                            <tr key={(r.code ?? '') + i} className="border-t border-slate-200/70 dark:border-white/10">
                                <td className="py-2.5 pr-4 font-mono text-[13px] font-bold text-indigo-700 dark:text-indigo-300">{r.code ?? '-'}</td>
                                <td className="py-2.5 pr-4 font-semibold">{r.name}</td>
                                {showEvent && <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{r.event}</td>}
                                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{r.kind}</td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300">{r.status}</td>
                            </tr>
                        ))}
                        {list.length === 0 && (
                            <tr><td colSpan={5} className="py-6 text-center text-slate-500">Belum ada data.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
