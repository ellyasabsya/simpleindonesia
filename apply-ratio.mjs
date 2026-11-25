#!/usr/bin/env node
// apply-ratio.mjs: kartu sorotan beranda kembali 4:5 (rak tetap 16:10). Mengubah 1 berkas: mobile/home/panels.tsx.
import fs from 'node:fs';
import path from 'node:path';

const F = path.join(process.cwd(), 'resources/js/components/mobile/home/panels.tsx');
const stop = (m) => { console.error('BERHENTI: ' + m); process.exit(1); };
if (!fs.existsSync(F)) stop('panels.tsx tidak ada (jalankan dari folder simpleindonesia)');
let s = fs.readFileSync(F, 'utf8');

if (s.includes("big ? 'aspect-[4/5]'")) { console.log('OK: sudah terpasang, tidak ada yang berubah'); process.exit(0); }

const A_OLD = '<div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-neutral-800">';
const A_NEW = "<div className={'relative overflow-hidden bg-slate-200 dark:bg-neutral-800 ' + (big ? 'aspect-[4/5]' : 'aspect-[16/10]')}>";
const B_OLD = "(big ? ' size-16 text-2xl' : ' size-12 text-lg')";
const B_NEW = "(big ? ' size-20 text-3xl' : ' size-12 text-lg')";
for (const [o] of [[A_OLD], [B_OLD]]) if (!s.includes(o)) stop('panels.tsx tidak sesuai dugaan. Pastikan apply-home.mjs sudah dijalankan.');

s = s.replace(A_OLD, () => A_NEW).replace(B_OLD, () => B_NEW);
fs.writeFileSync(F, s);
console.log('OK: 1 berkas ditulis (home/panels.tsx)');
