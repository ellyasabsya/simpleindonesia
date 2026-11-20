import PanelLayout from '@/components/panel/panel-layout';
import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Copy, Eye, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Orient = 'landscape' | 'portrait';
type Kind = 'logo' | 'background' | 'signature';
type El = {
    id: string;
    type: 'text' | 'image' | 'rect';
    x: number;
    y: number;
    w: number;
    h?: number;
    text?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    align?: 'left' | 'center' | 'right';
    font?: 'sans' | 'serif';
    src?: 'logo' | 'signature';
    fill?: string | null;
    stroke?: string | null;
    sw?: number;
};
type Builtin = { key: string; name: string; designs: Record<Orient, El[]> };
type Saved = {
    id: number;
    name: string;
    orientation: Orient;
    design: El[];
    number_format: string;
    base_key: string | null;
    all_events: boolean;
    has_logo: boolean;
    has_background: boolean;
    signer: { name: string; position: string | null; has_signature: boolean } | null;
    v: number;
};
type Props = {
    eventId: number;
    builtins: Builtin[];
    templates: { id: number; name: string; orientation: Orient }[];
    current: Saved | null;
    variables: { key: string; label: string }[];
    sample: Record<string, string>;
    year: string;
    defaultSigner: { name: string; position: string | null } | null;
};

const PAGE: Record<Orient, [number, number]> = { landscape: [842, 595], portrait: [595, 842] };
const FONT_CSS = { sans: "'DejaVu Sans', Verdana, sans-serif", serif: "'DejaVu Serif', Georgia, serif" };

const card = 'rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5';
const label = 'text-xs font-bold uppercase tracking-widest text-slate-500';
const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-white/10 dark:bg-white/5';
const btn = 'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50';
const ghost = `${btn} cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5`;
const primary = `${btn} bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow hover:opacity-90`;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

function xsrf() {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function Slider({ title, value, min, max, step = 1, unit = '', onChange }: { title: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
    return (
        <div className="mt-3">
            <div className="flex items-center justify-between">
                <p className={label}>{title}</p>
                <p className="text-sm font-bold">{value}{unit}</p>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-blue-600" />
        </div>
    );
}

function Designer(props: Props) {
    const { eventId, builtins, templates, current: cur, variables, sample, year, defaultSigner } = props;
    const base = `/panel/event/${eventId}/sertifikat/desain`;

    const [orientation, setOrientation] = useState<Orient>(cur?.orientation ?? 'landscape');
    const [design, setDesign] = useState<El[]>(cur?.design ?? builtins[0].designs.landscape);
    const [baseKey, setBaseKey] = useState<string | null>(cur?.base_key ?? builtins[0].key);
    const [name, setName] = useState(cur?.name ?? 'Template baru');
    const [numberFormat, setNumberFormat] = useState(cur?.number_format ?? '{urut}/SERT/{tahun}');
    const [signer, setSigner] = useState({
        name: cur?.signer?.name ?? defaultSigner?.name ?? '',
        position: cur?.signer?.position ?? defaultSigner?.position ?? '',
    });
    const [allEvents, setAllEvents] = useState(cur?.all_events ?? false);
    const [files, setFiles] = useState<Partial<Record<Kind, File>>>({});
    const [removed, setRemoved] = useState<Record<Kind, boolean>>({ logo: false, background: false, signature: false });
    const [sel, setSel] = useState<string | null>(null);
    const [busy, setBusy] = useState<'' | 'save' | 'preview'>('');
    const [err, setErr] = useState('');
    const [ok, setOk] = useState('');

    const stage = useRef<HTMLDivElement>(null);
    const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
    const [pageW, pageH] = PAGE[orientation];

    /* gambar: unggahan baru (blob) > hapus > file tersimpan di server */
    const [blobs, setBlobs] = useState<Partial<Record<Kind, string>>>({});
    useEffect(() => {
        const next: Partial<Record<Kind, string>> = {};
        (Object.keys(files) as Kind[]).forEach((k) => {
            const f = files[k];
            if (f) next[k] = URL.createObjectURL(f);
        });
        setBlobs(next);
        return () => Object.values(next).forEach((u) => URL.revokeObjectURL(u));
    }, [files]);

    const hasSaved = (k: Kind) => !!cur && (k === 'logo' ? cur.has_logo : k === 'background' ? cur.has_background : !!cur.signer?.has_signature);
    const imgUrl = (k: Kind): string | null => {
        if (blobs[k]) return blobs[k]!;
        if (removed[k]) return null;
        return hasSaved(k) ? `${base}/aset/${cur!.id}/${k}?v=${cur!.v}` : null;
    };
    const pickFile = (k: Kind, f: File | undefined) => {
        if (!f) return;
        setFiles((o) => ({ ...o, [k]: f }));
        setRemoved((o) => ({ ...o, [k]: false }));
    };
    const clearImage = (k: Kind) => {
        setFiles((o) => { const n = { ...o }; delete n[k]; return n; });
        setRemoved((o) => ({ ...o, [k]: true }));
    };

    /* variabel */
    const vars: Record<string, string> = {
        ...sample,
        nomor_sertifikat: numberFormat.replace('{urut}', '001').replace('{tahun}', year).replace('{event}', String(eventId)),
        nama_penandatangan: signer.name,
        jabatan_penandatangan: signer.position,
    };
    const fill = (t: string) => t.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, k: string) => (k.toLowerCase() in vars ? vars[k.toLowerCase()] : m));

    /* elemen */
    const selected = design.find((e) => e.id === sel) ?? null;
    const patch = (id: string, p: Partial<El>) => setDesign((l) => l.map((e) => (e.id === id ? { ...e, ...p } : e)));
    const uid = (t: string) => `${t}-${Date.now().toString(36)}`;
    const add = (el: Omit<El, 'id'>) => {
        const id = uid(el.type);
        setDesign((l) => [...l, { ...el, id }]);
        setSel(id);
    };
    const remove = (id: string) => { setDesign((l) => l.filter((e) => e.id !== id)); setSel(null); };
    const move = (id: string, dir: -1 | 1) =>
        setDesign((l) => {
            const i = l.findIndex((e) => e.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= l.length) return l;
            const n = [...l];
            [n[i], n[j]] = [n[j], n[i]];
            return n;
        });

    const onDown = (ev: React.PointerEvent, e: El) => {
        ev.stopPropagation();
        setSel(e.id);
        (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
        drag.current = { id: e.id, sx: ev.clientX, sy: ev.clientY, ox: e.x, oy: e.y };
    };
    const onMove = (ev: React.PointerEvent) => {
        const d = drag.current;
        const st = stage.current;
        if (!d || !st) return;
        const r = st.getBoundingClientRect();
        patch(d.id, {
            x: r1(clamp(d.ox + ((ev.clientX - d.sx) / r.width) * 100, 0, 100)),
            y: r1(clamp(d.oy + ((ev.clientY - d.sy) / r.height) * 100, 0, 100)),
        });
    };

    /* template bawaan dan orientasi */
    const pickBuiltin = (b: Builtin) => {
        setDesign(b.designs[orientation]);
        setBaseKey(b.key);
        setSel(null);
    };
    const changeOrientation = (o: Orient) => {
        if (o === orientation) return;
        const b = builtins.find((x) => x.key === baseKey);
        const untouched = b && JSON.stringify(b.designs[orientation]) === JSON.stringify(design);
        if (b && untouched) setDesign(b.designs[o]);
        setOrientation(o);
        setSel(null);
    };

    /* kirim */
    const buildForm = (asNew = false): FormData => {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('orientation', orientation);
        fd.append('design', JSON.stringify(design));
        fd.append('number_format', numberFormat);
        fd.append('base_key', baseKey ?? '');
        fd.append('all_events', allEvents ? '1' : '0');
        fd.append('signer_name', signer.name);
        fd.append('signer_position', signer.position);
        (['logo', 'background', 'signature'] as Kind[]).forEach((k) => {
            const f = files[k];
            if (f) fd.append(k, f);
            if (removed[k]) fd.append(`remove_${k}`, '1');
        });
        if (cur) fd.append(asNew ? 'copy_from' : 'template_id', String(cur.id));
        return fd;
    };

    const preview = async () => {
        setErr(''); setOk('');
        const w = window.open('', '_blank');
        setBusy('preview');
        try {
            const res = await fetch(`${base}/pratinjau`, {
                method: 'POST',
                body: buildForm(),
                headers: { Accept: 'application/json', 'X-XSRF-TOKEN': xsrf(), 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) {
                let msg = 'Gagal membuat pratinjau PDF.';
                try {
                    const j = await res.json();
                    msg = (j.errors && (Object.values(j.errors)[0] as string[])[0]) || j.message || msg;
                } catch { /* abaikan */ }
                throw new Error(msg);
            }
            const url = URL.createObjectURL(await res.blob());
            if (w) w.location.href = url; else window.open(url, '_blank');
        } catch (e) {
            w?.close();
            setErr((e as Error).message);
        } finally {
            setBusy('');
        }
    };

    const save = (asNew = false) => {
        setErr(''); setOk('');
        setBusy('save');
        const data: Record<string, string | File | number> = {
            name: asNew && cur ? `${name} (salinan)` : name,
            orientation,
            design: JSON.stringify(design),
            number_format: numberFormat,
            base_key: baseKey ?? '',
            all_events: allEvents ? 1 : 0,
            signer_name: signer.name,
            signer_position: signer.position,
        };
        (['logo', 'background', 'signature'] as Kind[]).forEach((k) => {
            const f = files[k];
            if (f) data[k] = f;
            if (removed[k]) data[`remove_${k}`] = 1;
        });
        let url = base;
        if (cur && !asNew) { url = `${base}/${cur.id}`; data._method = 'put'; }
        if (cur && asNew) data.copy_from = cur.id;
        router.post(url, data, {
            forceFormData: true,
            preserveScroll: true,
            onError: (e) => setErr((Object.values(e)[0] as string) ?? 'Gagal menyimpan.'),
            onSuccess: () => { setOk('Tersimpan.'); setFiles({}); setRemoved({ logo: false, background: false, signature: false }); },
            onFinish: () => setBusy(''),
        });
    };

    const destroy = () => {
        if (!cur || !window.confirm(`Hapus template "${cur.name}"? Sertifikat yang sudah terbit tidak berubah.`)) return;
        router.delete(`${base}/${cur.id}`);
    };

    const bgUrl = imgUrl('background');
    const logoUrl = imgUrl('logo');
    const sigUrl = imgUrl('signature');
    const ratio = useMemo(() => `${pageW} / ${pageH}`, [pageW, pageH]);

    const renderEl = (e: El) => {
        const sel_ = e.id === sel;
        const common: React.CSSProperties = { position: 'absolute', touchAction: 'none', cursor: 'move' };
        const ring: React.CSSProperties = sel_ ? { outline: '2px dashed #3b64f6', outlineOffset: 1 } : {};

        if (e.type === 'rect') {
            const sw = ((e.sw ?? 0) / pageW) * 100;
            return (
                <div
                    key={e.id}
                    onPointerDown={(ev) => onDown(ev, e)}
                    style={{
                        ...common, ...ring,
                        left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, height: `${e.h ?? 0}%`,
                        boxSizing: 'border-box',
                        background: e.fill ?? 'transparent',
                        border: e.stroke && sw > 0 ? `${sw}cqw solid ${e.stroke}` : 'none',
                    }}
                />
            );
        }
        if (e.type === 'image') {
            const url = e.src === 'signature' ? sigUrl : logoUrl;
            return (
                <div key={e.id} onPointerDown={(ev) => onDown(ev, e)} style={{ ...common, ...ring, left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, transform: 'translateX(-50%)' }}>
                    {url ? (
                        <img src={url} alt="" draggable={false} className="pointer-events-none block w-full" />
                    ) : (
                        <div className="pointer-events-none grid aspect-[3/2] w-full place-items-center rounded border border-dashed border-slate-400 bg-white/60 text-[1.4cqw] text-slate-500">
                            {e.src === 'signature' ? 'Tanda tangan' : 'Logo'}
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div
                key={e.id}
                onPointerDown={(ev) => onDown(ev, e)}
                style={{
                    ...common, ...ring,
                    left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, transform: 'translateX(-50%)',
                    fontSize: `${((e.size ?? 16) / pageW) * 100}cqw`,
                    lineHeight: 1.25,
                    textAlign: e.align ?? 'center',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    color: e.color,
                    fontWeight: e.bold ? 700 : 400,
                    fontStyle: e.italic ? 'italic' : 'normal',
                    fontFamily: FONT_CSS[e.font ?? 'sans'],
                    minHeight: '1.25em',
                }}
            >
                {fill(e.text ?? '')}
            </div>
        );
    };

    const elName = (e: El) =>
        e.type === 'text' ? `Teks: ${(e.text ?? '').split('\n')[0].slice(0, 22) || '(kosong)'}` : e.type === 'image' ? (e.src === 'signature' ? 'Tanda tangan' : 'Logo') : 'Kotak / garis';

    return (
        <PanelLayout title="Desain Sertifikat">
            <div className="space-y-6">
                {/* pilih template */}
                <section className={card}>
                    <p className={label}>Mulai dari template bawaan</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {builtins.map((b) => (
                            <button key={b.key} type="button" onClick={() => pickBuiltin(b)} className={`${ghost} ${baseKey === b.key ? 'border-blue-500 text-blue-700' : ''}`}>{b.name}</button>
                        ))}
                    </div>
                    <p className={`${label} mt-5`}>Template saya</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => router.visit(base)} className={`${ghost} ${!cur ? 'border-blue-500 text-blue-700' : ''}`}><Plus size={15} /> Template baru</button>
                        {templates.map((t) => (
                            <button key={t.id} type="button" onClick={() => router.visit(`${base}?template=${t.id}`)} className={`${ghost} ${cur?.id === t.id ? 'border-blue-500 text-blue-700' : ''}`}>{t.name}</button>
                        ))}
                        {templates.length === 0 && <span className="self-center text-sm text-slate-400">Belum ada template tersimpan.</span>}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
                    {/* kanvas */}
                    <section className={card}>
                        <div className="mx-auto" style={{ width: orientation === 'portrait' ? 'min(100%, 460px)' : '100%' }}>
                            <div
                                ref={stage}
                                onPointerMove={onMove}
                                onPointerUp={() => { drag.current = null; }}
                                onPointerCancel={() => { drag.current = null; }}
                                onPointerDown={() => setSel(null)}
                                className="relative w-full select-none overflow-hidden border border-slate-300 bg-white shadow"
                                style={{ aspectRatio: ratio, containerType: 'inline-size' }}
                            >
                                {bgUrl && <img src={bgUrl} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />}
                                {design.map(renderEl)}
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">Geser elemen langsung di atas kertas. Tombol <b>Pratinjau PDF</b> menampilkan hasil PDF sebenarnya.</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" className={ghost} onClick={() => add({ type: 'text', x: 50, y: 50, w: 60, text: 'Teks baru', size: 16, color: '#111827', bold: false, italic: false, align: 'center', font: 'sans' })}><Plus size={15} /> Teks</button>
                            <button type="button" className={ghost} onClick={() => add({ type: 'image', src: 'logo', x: 50, y: 10, w: 12 })}><Plus size={15} /> Logo</button>
                            <button type="button" className={ghost} onClick={() => add({ type: 'image', src: 'signature', x: 75, y: 72, w: 15 })}><Plus size={15} /> Tanda tangan</button>
                            <button type="button" className={ghost} onClick={() => add({ type: 'rect', x: 30, y: 50, w: 40, h: 0.5, fill: '#6b7280', stroke: null, sw: 0 })}><Plus size={15} /> Garis / kotak</button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                            <button type="button" className={primary} disabled={busy !== ''} onClick={() => save(false)}><Save size={15} /> {busy === 'save' ? 'Menyimpan…' : cur ? 'Simpan perubahan' : 'Simpan template'}</button>
                            <button type="button" className={ghost} disabled={busy !== ''} onClick={preview}><Eye size={15} /> {busy === 'preview' ? 'Membuat PDF…' : 'Pratinjau PDF'}</button>
                            {cur && <button type="button" className={ghost} disabled={busy !== ''} onClick={() => save(true)}><Copy size={15} /> Simpan sebagai baru</button>}
                            {cur && <button type="button" className={`${ghost} text-red-600`} disabled={busy !== ''} onClick={destroy}><Trash2 size={15} /> Hapus</button>}
                            {ok && <span className="text-sm font-semibold text-emerald-600">{ok}</span>}
                            {err && <span className="text-sm font-semibold text-red-500">{err}</span>}
                        </div>
                    </section>

                    {/* panel kanan */}
                    <aside className="space-y-6">
                        <section className={card}>
                            <p className={label}>Elemen</p>
                            <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm">
                                {[...design].reverse().map((e) => (
                                    <li key={e.id}>
                                        <button type="button" onClick={() => setSel(e.id)} className={`w-full truncate rounded-lg px-2 py-1.5 text-left ${e.id === sel ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-white/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>{elName(e)}</button>
                                    </li>
                                ))}
                            </ul>

                            {selected && (
                                <div className="mt-4 border-t border-slate-200 pt-3 dark:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold">{elName(selected)}</p>
                                        <div className="flex gap-1">
                                            <button type="button" title="Naikkan lapisan" className="rounded p-1.5 hover:bg-slate-100" onClick={() => move(selected.id, 1)}><ArrowUp size={15} /></button>
                                            <button type="button" title="Turunkan lapisan" className="rounded p-1.5 hover:bg-slate-100" onClick={() => move(selected.id, -1)}><ArrowDown size={15} /></button>
                                            <button type="button" title="Hapus elemen" className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(selected.id)}><Trash2 size={15} /></button>
                                        </div>
                                    </div>

                                    {selected.type === 'text' && (
                                        <>
                                            <textarea className={`${input} mt-3`} rows={3} value={selected.text ?? ''} maxLength={400} onChange={(e) => patch(selected.id, { text: e.target.value })} />
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {variables.map((v) => (
                                                    <button key={v.key} type="button" title={v.label} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50" onClick={() => patch(selected.id, { text: `${selected.text ?? ''}{{${v.key}}}` })}>{`{{${v.key}}}`}</button>
                                                ))}
                                            </div>
                                            <Slider title="Ukuran huruf" value={selected.size ?? 16} min={6} max={100} unit=" pt" onChange={(v) => patch(selected.id, { size: v })} />
                                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                                <input type="color" value={selected.color ?? '#111827'} onChange={(e) => patch(selected.id, { color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1" />
                                                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!selected.bold} onChange={(e) => patch(selected.id, { bold: e.target.checked })} /> Tebal</label>
                                                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!selected.italic} onChange={(e) => patch(selected.id, { italic: e.target.checked })} /> Miring</label>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <select className={input} value={selected.align ?? 'center'} onChange={(e) => patch(selected.id, { align: e.target.value as El['align'] })}>
                                                    <option value="left">Rata kiri</option><option value="center">Tengah</option><option value="right">Rata kanan</option>
                                                </select>
                                                <select className={input} value={selected.font ?? 'sans'} onChange={(e) => patch(selected.id, { font: e.target.value as El['font'] })}>
                                                    <option value="sans">Sans</option><option value="serif">Serif</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {selected.type === 'rect' && (
                                        <>
                                            <Slider title="Tinggi" value={selected.h ?? 1} min={0} max={100} step={0.25} unit="%" onChange={(v) => patch(selected.id, { h: v })} />
                                            <div className="mt-3 flex items-center gap-3 text-sm">
                                                <label className="flex items-center gap-1"><input type="checkbox" checked={!!selected.fill} onChange={(e) => patch(selected.id, { fill: e.target.checked ? '#6b7280' : null })} /> Isi</label>
                                                {selected.fill && <input type="color" value={selected.fill} onChange={(e) => patch(selected.id, { fill: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1" />}
                                            </div>
                                            <div className="mt-2 flex items-center gap-3 text-sm">
                                                <label className="flex items-center gap-1"><input type="checkbox" checked={!!selected.stroke} onChange={(e) => patch(selected.id, { stroke: e.target.checked ? '#6b7280' : null, sw: selected.sw || 2 })} /> Garis tepi</label>
                                                {selected.stroke && <input type="color" value={selected.stroke} onChange={(e) => patch(selected.id, { stroke: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1" />}
                                            </div>
                                            {selected.stroke && <Slider title="Tebal garis" value={selected.sw ?? 1} min={0} max={20} step={0.5} unit=" pt" onChange={(v) => patch(selected.id, { sw: v })} />}
                                        </>
                                    )}

                                    <Slider title={selected.type === 'rect' ? 'Lebar' : selected.type === 'image' ? 'Lebar gambar' : 'Lebar kotak teks'} value={selected.w} min={1} max={100} step={0.5} unit="%" onChange={(v) => patch(selected.id, { w: v })} />
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <label className="text-xs text-slate-500">X (%)<input type="number" step={0.5} min={0} max={100} className={input} value={selected.x} onChange={(e) => patch(selected.id, { x: clamp(Number(e.target.value), 0, 100) })} /></label>
                                        <label className="text-xs text-slate-500">Y (%)<input type="number" step={0.5} min={0} max={100} className={input} value={selected.y} onChange={(e) => patch(selected.id, { y: clamp(Number(e.target.value), 0, 100) })} /></label>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className={card}>
                            <p className={label}>Pengaturan template</p>
                            <input className={`${input} mt-2`} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Nama template" />

                            <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/10">
                                {(['landscape', 'portrait'] as Orient[]).map((o) => (
                                    <button key={o} type="button" onClick={() => changeOrientation(o)} className={`rounded-xl px-2 py-2 text-sm font-semibold ${orientation === o ? 'bg-white text-blue-700 shadow dark:bg-white/20 dark:text-white' : 'text-slate-500'}`}>{o === 'landscape' ? 'A4 landscape' : 'A4 portrait'}</button>
                                ))}
                            </div>

                            <p className={`${label} mt-4`}>Format nomor</p>
                            <input className={`${input} mt-1`} value={numberFormat} maxLength={80} onChange={(e) => setNumberFormat(e.target.value)} />
                            <p className="mt-1 text-xs text-slate-500">{'{urut}'} {'{tahun}'} {'{event}'}. Contoh: <b>{vars.nomor_sertifikat}</b></p>

                            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={allEvents} onChange={(e) => setAllEvents(e.target.checked)} /> Pakai juga di event lain milik lembaga ini</label>
                        </section>

                        <section className={card}>
                            <p className={label}>Gambar dan penandatangan</p>
                            {(['logo', 'background', 'signature'] as Kind[]).map((k) => (
                                <div key={k} className="mt-3 flex items-center justify-between gap-2 text-sm">
                                    <span className="font-semibold">{k === 'logo' ? 'Logo' : k === 'background' ? 'Latar (opsional)' : 'Tanda tangan'}</span>
                                    <span className="flex items-center gap-2">
                                        <label className="cursor-pointer text-blue-600 hover:underline">{imgUrl(k) ? 'Ganti' : 'Pilih'}
                                            <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { pickFile(k, e.target.files?.[0]); e.target.value = ''; }} />
                                        </label>
                                        {imgUrl(k) && <button type="button" className="text-red-600 hover:underline" onClick={() => clearImage(k)}>Hapus</button>}
                                    </span>
                                </div>
                            ))}
                            <p className="mt-1 text-xs text-slate-400">JPG atau PNG. Latar sebaiknya rasio A4 supaya tidak melar.</p>
                            <input className={`${input} mt-3`} placeholder="Nama penandatangan" value={signer.name} maxLength={120} onChange={(e) => setSigner({ ...signer, name: e.target.value })} />
                            <input className={`${input} mt-2`} placeholder="Jabatan" value={signer.position} maxLength={120} onChange={(e) => setSigner({ ...signer, position: e.target.value })} />
                        </section>
                    </aside>
                </div>
            </div>
        </PanelLayout>
    );
}

export default function CertificateDesigner(props: Props) {
    return <Designer key={props.current?.id ?? 'new'} {...props} />;
}
