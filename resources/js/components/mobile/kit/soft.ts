// Token gaya HP: Premium Elegant. Datar, lapang, garis tipis, aksen emas.
// (Nama berkas dipertahankan agar tidak ada berkas yatim di proyek.)

/** Latar halaman: krem hangat (terang) / hampir hitam (gelap). */
export const PAGE = 'bg-[#f4f6fc] dark:bg-[#0a0c1a]';

/** Permukaan kartu: putih dengan garis tipis, tanpa bayangan. */
export const CARD = 'bg-white ring-1 ring-slate-900/[0.07] dark:bg-white/[0.04] dark:ring-white/10';

/** Kolom / wadah ikon: sedikit lebih gelap dari latar. */
export const FIELD = 'bg-slate-900/[0.045] dark:bg-white/[0.07]';

/** Teks sekunder dengan kontras cukup di kedua mode. */
export const MUTED = 'text-slate-600 dark:text-slate-300';

/** Umpan balik ketukan. */
export const PRESS = 'transition-transform duration-150 active:scale-[0.98]';

/** Daftar berkelompok ala aplikasi native: satu kartu, baris dipisah garis tipis. */
export const GROUP = 'lux-list overflow-hidden rounded-3xl bg-white ring-1 ring-slate-900/[0.07] divide-y divide-slate-900/[0.07] dark:bg-white/[0.04] dark:ring-white/10 dark:divide-white/10';

/** Efek mewah secukupnya: muncul halus, kilau pelan pada tombol utama. Mati otomatis bila HP memakai "kurangi gerakan". */
export const LUX_CSS = `
@keyframes lux-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes lux-sheen{0%,55%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
.lux-fade{animation:lux-rise .35s cubic-bezier(.2,.8,.2,1) both}
.lux-list>*{animation:lux-rise .5s cubic-bezier(.2,.8,.2,1) both}
.lux-list>*:nth-child(2){animation-delay:.06s}
.lux-list>*:nth-child(3){animation-delay:.12s}
.lux-list>*:nth-child(4){animation-delay:.18s}
.lux-sheen{position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-130%);animation:lux-sheen 4s ease-in-out 1.2s 2}
@media (prefers-reduced-motion:reduce){.lux-fade,.lux-list>*,.lux-sheen{animation:none!important}}
`;
