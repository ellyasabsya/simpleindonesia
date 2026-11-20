import type { ReactNode } from 'react';

export type AppBarProps = {
    title: string;
    /** string = alamat tujuan tombol kembali, true = kembali ke halaman sebelumnya */
    back?: string | boolean;
    /** Tombol di sisi kiri (mis. hamburger). Dipakai jika back tidak diisi. */
    leading?: ReactNode;
    /** Tombol di sisi kanan (mis. bel notifikasi). */
    actions?: ReactNode;
    /** iOS saja: judul besar di bawah bar. Android mengabaikannya. */
    large?: boolean;
};
