# Tampilan mobile (iOS dan Android)

Semua kode tampilan HP ada di folder ini, terpisah dari tampilan desktop.

| Berkas | Fungsi |
| --- | --- |
| `bottom-nav.tsx` | Pintu masuk. Dipakai layout; memilih iOS atau Android. Jangan diubah kecuali perlu. |
| `use-nav-config.ts` | **Daftar menu** bottom nav (publik, peserta, panel). Ubah menu di sini. |
| `ios/bottom-nav.tsx` | Tampilan iOS: tab bar blur, warna biru iOS, tombol Beranda bulat. |
| `android/bottom-nav.tsx` | Tampilan Android (Material 3): pil penanda, tombol Beranda persegi membulat. |
| `use-platform.ts` | Mendeteksi iOS atau Android. |
| `use-typing.ts` | Menyembunyikan bar saat keyboard layar terbuka. |
| `nav-types.ts`, `nav-utils.ts`, `home-icon.tsx` | Tipe, fungsi bantu, dan ikon bersama. |

## Mencoba di komputer

Tambahkan ke alamat halaman:

- `?ui=ios` paksa tampilan iOS (diingat browser)
- `?ui=android` paksa tampilan Android
- `?ui=auto` kembali ke deteksi otomatis

## Menambah menu

Buka `use-nav-config.ts`, tambahkan satu baris `{ label, href, icon }` di `left` atau `right`.
Sebaiknya total menu kiri + kanan tidak lebih dari 4 supaya tidak sesak.

## Menambah komponen mobile lain

Buat berkasnya di `ios/` dan `android/` dengan nama sama, lalu buat satu berkas
pintu masuk di folder ini yang memilih keduanya lewat `usePlatform()`.
