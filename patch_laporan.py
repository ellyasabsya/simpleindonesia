import os, re

ROOT = os.environ.get("SK_ROOT", ".")
F = os.path.join(ROOT, "resources/js/pages/panel/events/laporan.tsx")
s = open(F, encoding="utf-8").read()

COMPONENT = r"""function TrenLunas({ trend }: { trend: { date: string; n: number }[] }) {
    const gid = 'tren' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const W = 640;
    const H = 220;
    const L = 34;
    const R = 20;
    const T = 28;
    const B = 34;
    const top = Math.max(1, ...trend.map((t) => t.n));
    const step = top <= 4 ? 1 : Math.ceil(top / 4);
    const yMax = Math.ceil(top / step) * step;
    const ticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step);
    const px = (i: number) => (trend.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (trend.length - 1));
    const py = (n: number) => T + (1 - n / yMax) * (H - T - B);
    const pts = trend.map((t, i) => ({ x: px(i), y: py(t.n), t }));
    let line = '';
    pts.forEach((p, i) => {
        if (i === 0) line = `M${p.x},${p.y}`;
        else {
            const q = pts[i - 1];
            const cx = (q.x + p.x) / 2;
            line += ` C${cx},${q.y} ${cx},${p.y} ${p.x},${p.y}`;
        }
    });
    const base = H - B;
    const area = pts.length > 1 ? `${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z` : '';
    const every = Math.max(1, Math.ceil(pts.length / 8));

    return (
        <div className="mt-4 w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Grafik tren pendaftaran lunas per hari">
                <defs>
                    <linearGradient id={`${gid}a`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id={`${gid}l`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                {ticks.map((v) => (
                    <g key={v}>
                        <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="currentColor" strokeOpacity={v === 0 ? 0.25 : 0.1} strokeDasharray={v === 0 ? undefined : '4 4'} />
                        <text x={L - 8} y={py(v) + 4} textAnchor="end" className="fill-slate-500" fontSize="11" fontWeight="600">{v}</text>
                    </g>
                ))}
                {pts.length === 1 && <line x1={pts[0].x} x2={pts[0].x} y1={pts[0].y} y2={base} stroke="#8b5cf6" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 4" />}
                {area && <path d={area} fill={`url(#${gid}a)`} />}
                {pts.length > 1 && <path d={line} fill="none" stroke={`url(#${gid}l)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                {pts.map((p, i) => (
                    <g key={p.t.date}>
                        <circle cx={p.x} cy={p.y} r="9" fill="#8b5cf6" fillOpacity="0.18" />
                        <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#6d28d9" strokeWidth="3" />
                        <text x={p.x} y={p.y - 14} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100" fontSize="13" fontWeight="800">{p.t.n}</text>
                        {i % every === 0 && <text x={p.x} y={H - 10} textAnchor="middle" className="fill-slate-500" fontSize="11" fontWeight="600">{p.t.date}</text>}
                    </g>
                ))}
            </svg>
        </div>
    );
}

"""

def once(text, old, new, label):
    n = text.count(old)
    assert n == 1, f"GAGAL [{label}]: ditemukan {n}x (harus 1). Tidak ada file yang diubah."
    return text.replace(old, new)

s = once(s, "import { Link } from '@inertiajs/react';", "import { Link } from '@inertiajs/react';\nimport { useId } from 'react';", "import")
s = once(s, "export default function Laporan(", COMPONENT + "export default function Laporan(", "komponen")

pat = re.compile(r'<div className="mt-4 flex h-40 items-end gap-2 overflow-x-auto">.*?\{trend\.map\(\(t\) => \(.*?\)\)\}\s*</div>', re.S)
assert len(pat.findall(s)) == 1, f"GAGAL [blok batang]: ditemukan {len(pat.findall(s))}x (harus 1). Tidak ada file yang diubah."
s = pat.sub("<TrenLunas trend={trend} />", s)

open(F, "w", encoding="utf-8").write(s)
print("ok: tren pendaftaran lunas diganti grafik area/garis")
