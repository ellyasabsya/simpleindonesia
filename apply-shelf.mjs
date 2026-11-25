#!/usr/bin/env node
// apply-shelf.mjs: kartu rak "Segera dimulai" jadi 4:5 model kecil. Mengubah 1 berkas: mobile/home/panels.tsx.
import fs from 'node:fs';
import path from 'node:path';

const F = path.join(process.cwd(), 'resources/js/components/mobile/home/panels.tsx');
const stop = (m) => { console.error('BERHENTI: ' + m); process.exit(1); };
if (!fs.existsSync(F)) stop('panels.tsx tidak ada (jalankan dari folder simpleindonesia)');
let s = fs.readFileSync(F, 'utf8');

if (s.includes('w-[44%] shrink-0')) { console.log('OK: sudah terpasang, tidak ada yang berubah'); process.exit(0); }

const R = [
    ["(big ? 'aspect-[4/5]' : 'aspect-[16/10]')", "'aspect-[4/5]'"],
    ['block w-[72%] shrink-0', 'block w-[44%] shrink-0'],
    ['<div className="p-3.5">', '<div className="p-3">'],
    ['text-[15px] leading-snug font-semibold text-slate-900 dark:text-white">{e.title}', 'text-[13px] leading-snug font-semibold text-slate-900 dark:text-white">{e.title}'],
    [
        "<p className={'mt-1 truncate text-xs ' + MUTED}>{[range, e.location].filter(Boolean).join(' · ')}</p>",
        "<p className={'mt-1 truncate text-[11px] ' + MUTED}>{range}</p>\n                {e.location && <p className={'truncate text-[11px] ' + MUTED}>{e.location}</p>}",
    ],
];
for (const [o] of R) {
    const n = s.split(o).length - 1;
    if (n !== 1) stop('bagian tidak sesuai dugaan (' + o.slice(0, 40) + '...). Pastikan apply-home.mjs dan apply-ratio.mjs sudah dijalankan.');
}
for (const [o, n] of R) s = s.replace(o, () => n);
fs.writeFileSync(F, s);
console.log('OK: 1 berkas ditulis (home/panels.tsx)');
