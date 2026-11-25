import { router } from '@inertiajs/react';
import { Award, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import Button from '../kit/button';
import EmptyState from '../kit/empty-state';
import { Row, Section } from '../kit/section';
import { FIELD, MUTED } from '../kit/soft';

type Item = {
    id: number;
    event: string;
    label: string;
    category: string;
    number: string;
    name: string;
    year: number | null;
    date: string | null;
    valid: boolean;
    url: string;
};

type Props = {
    items: Item[];
    total: number;
    owned: number;
    years: number[];
    types: Record<string, string>;
    f: { cari: string; tahun: number; jenis: string };
    filtered: boolean;
    page: number;
    pages: number;
    prevUrl: string | null;
    nextUrl: string | null;
};

/** Sertifikat saya untuk HP: pencarian, filter lewat pemilih bawaan perangkat, lalu daftar bergrup. */
export default function SertifikatMobile({ items, total, owned, years, types, f, filtered, page, pages, prevUrl, nextUrl }: Props) {
    const [cari, setCari] = useState(f.cari ?? '');
    const [tahun, setTahun] = useState(f.tahun ? String(f.tahun) : '');
    const [jenis, setJenis] = useState(f.jenis ?? '');
    const typeList = Object.entries(types ?? {});
    const muted = MUTED;
    const select = 'max-w-full bg-transparent text-right outline-none';

    const submit = (e?: FormEvent) => {
        e?.preventDefault();
        const q: Record<string, string> = {};
        if (cari.trim()) q.cari = cari.trim();
        if (tahun) q.tahun = tahun;
        if (jenis) q.jenis = jenis;
        router.get('/sertifikat-saya', q, { preserveScroll: true });
    };

    return (
        <div className="space-y-5 pb-4">
            <p className={`px-1 text-sm ${muted}`}>{owned} sertifikat atas akun Anda.</p>

            {owned > 0 && (
                <form onSubmit={submit} className="space-y-4">
                    <div className="relative">
                        <Search className={`pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 ${muted}`} />
                        <input
                            type="search"
                            value={cari}
                            onChange={(e) => setCari(e.target.value)}
                            placeholder="Cari event, nomor, atau nama"
                            maxLength={100}
                            className={'h-12 w-full rounded-full pr-3 pl-9 text-base outline-none ' + FIELD}
                        />
                    </div>
                    <Section>
                        <Row
                            label="Tahun"
                            value={
                                <select value={tahun} onChange={(e) => setTahun(e.target.value)} aria-label="Tahun" className={select}>
                                    <option value="">Semua</option>
                                    {years.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            }
                        />
                        <Row
                            label="Jenis"
                            value={
                                <select value={jenis} onChange={(e) => setJenis(e.target.value)} aria-label="Jenis sertifikat" className={select}>
                                    <option value="">Semua</option>
                                    {typeList.map(([k, l]) => (
                                        <option key={k} value={k}>
                                            {l}
                                        </option>
                                    ))}
                                </select>
                            }
                        />
                    </Section>
                    <Button full icon={Search} onClick={() => submit()}>
                        Cari
                    </Button>
                </form>
            )}

            {filtered && (
                <Section>
                    <Row label={`${total} hasil`} value="Hapus filter" href="/sertifikat-saya" />
                </Section>
            )}

            {items.length === 0 ? (
                <EmptyState
                    icon={Award}
                    title={owned === 0 ? 'Belum ada sertifikat' : 'Tidak ada hasil'}
                    text={owned === 0 ? 'Sertifikat dari event yang Anda ikuti akan muncul di sini.' : 'Tidak ada sertifikat yang cocok dengan pencarian atau filter Anda.'}
                />
            ) : (
                <Section>
                    {items.map((it) => (
                        <Row
                            key={it.id}
                            icon={Award}
                            tint="#D97706"
                            label={it.event}
                            sub={`${it.label} · ${it.number}${it.date ? ' · ' + it.date : ''}`}
                            value={<span className={it.valid ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}>{it.valid ? 'Berlaku' : 'Tidak berlaku'}</span>}
                            href={it.url}
                            external
                        />
                    ))}
                </Section>
            )}

            {pages > 1 && (
                <div className="flex items-center justify-between gap-2">
                    <Button variant="tonal" href={prevUrl ?? undefined} onClick={prevUrl ? undefined : () => {}}>
                        Sebelumnya
                    </Button>
                    <span className={`text-xs ${muted}`}>
                        {page} / {pages}
                    </span>
                    <Button variant="tonal" href={nextUrl ?? undefined} onClick={nextUrl ? undefined : () => {}}>
                        Berikutnya
                    </Button>
                </div>
            )}
        </div>
    );
}
