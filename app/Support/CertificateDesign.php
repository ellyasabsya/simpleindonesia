<?php

namespace App\Support;

use App\Models\Event;

/**
 * Desain sertifikat (Tahap 4): template bawaan, variabel, dan pembersihan desain kiriman klien.
 *
 * Desain = daftar elemen. Semua posisi dalam persen halaman, ukuran huruf dalam pt (halaman A4: 842x595 pt).
 *  - text  : x = titik tengah, y = tepi atas, w = lebar kotak teks (persen)
 *  - image : x = titik tengah, y = tepi atas, w = lebar gambar (persen); src = logo | signature
 *  - rect  : x, y = pojok kiri atas, w, h (persen); fill/stroke hex atau null; sw = tebal garis (pt)
 */
class CertificateDesign
{
    public const PAGE = ['landscape' => [842, 595], 'portrait' => [595, 842]];

    public const MAX_ELEMENTS = 40;

    public const FONTS = ['sans' => 'DejaVu Sans', 'serif' => 'DejaVu Serif'];

    public const VARIABLES = [
        'nama_peserta' => 'Nama penerima',
        'kategori' => 'Kategori (Peserta, Juri, dst.)',
        'nomor_sertifikat' => 'Nomor sertifikat',
        'nama_event' => 'Nama event',
        'tanggal_event' => 'Tanggal event',
        'lokasi_event' => 'Lokasi event',
        'penyelenggara' => 'Nama penyelenggara',
        'nama_penandatangan' => 'Nama penandatangan',
        'jabatan_penandatangan' => 'Jabatan penandatangan',
    ];

    public static function variableList(): array
    {
        $out = [];
        foreach (self::VARIABLES as $k => $label) {
            $out[] = ['key' => $k, 'label' => $label];
        }

        return $out;
    }

    /* ----------------------------------------------------------- variabel */

    public static function formatNumber(Event $event, string $format, int $seq): string
    {
        return strtr($format !== '' ? $format : '{urut}/SERT/{tahun}', [
            '{urut}' => str_pad((string) $seq, 3, '0', STR_PAD_LEFT),
            '{tahun}' => $event->starts_at->format('Y'),
            '{event}' => (string) $event->id,
        ]);
    }

    public static function values(Event $event, string $name, string $category, string $number, ?string $signer = null, ?string $position = null): array
    {
        $fmt = fn ($d) => $d->copy()->locale('id')->translatedFormat('j F Y');
        $date = $event->starts_at->toDateString() === $event->ends_at->toDateString()
            ? $fmt($event->starts_at)
            : $fmt($event->starts_at).' - '.$fmt($event->ends_at);

        return [
            'nama_peserta' => $name,
            'kategori' => $category,
            'nomor_sertifikat' => $number,
            'nama_event' => (string) $event->title,
            'tanggal_event' => $date,
            'lokasi_event' => (string) $event->location,
            'penyelenggara' => (string) ($event->institution->name ?? ''),
            'nama_penandatangan' => (string) $signer,
            'jabatan_penandatangan' => (string) $position,
        ];
    }

    public static function fill(string $text, array $values): string
    {
        return preg_replace_callback('/\{\{\s*([a-z_]+)\s*\}\}/i', function ($m) use ($values) {
            $k = strtolower($m[1]);

            return array_key_exists($k, $values) ? (string) $values[$k] : $m[0];
        }, $text);
    }

    /* ------------------------------------------------------ pembersihan */

    private static function num($v, float $min, float $max): float
    {
        return round(max($min, min($max, (float) $v)), 2);
    }

    private static function hex($v, ?string $default): ?string
    {
        return is_string($v) && preg_match('/^#[0-9a-fA-F]{6}$/', $v) ? strtolower($v) : $default;
    }

    public static function normalize(array $design): array
    {
        $out = [];
        $seen = [];

        foreach (array_slice(array_values($design), 0, self::MAX_ELEMENTS) as $e) {
            if (! is_array($e)) {
                continue;
            }
            $type = $e['type'] ?? '';
            if (! in_array($type, ['text', 'image', 'rect'], true)) {
                continue;
            }

            $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) ($e['id'] ?? ''));
            $id = substr($id, 0, 40);
            $n = count($out) + 1;
            while ($id === '' || isset($seen[$id])) {
                $id = $type.'-'.$n++;
            }
            $seen[$id] = true;

            $el = [
                'id' => $id,
                'type' => $type,
                'x' => self::num($e['x'] ?? 50, 0, 100),
                'y' => self::num($e['y'] ?? 0, 0, 100),
                'w' => self::num($e['w'] ?? 30, 0.5, 100),
            ];

            if ($type === 'text') {
                $el += [
                    'text' => mb_substr((string) ($e['text'] ?? ''), 0, 400),
                    'size' => self::num($e['size'] ?? 16, 6, 120),
                    'color' => self::hex($e['color'] ?? null, '#111827'),
                    'bold' => (bool) ($e['bold'] ?? false),
                    'italic' => (bool) ($e['italic'] ?? false),
                    'align' => in_array($e['align'] ?? '', ['left', 'center', 'right'], true) ? $e['align'] : 'center',
                    'font' => isset(self::FONTS[$e['font'] ?? '']) ? $e['font'] : 'sans',
                ];
            } elseif ($type === 'image') {
                $el['src'] = in_array($e['src'] ?? '', ['logo', 'signature'], true) ? $e['src'] : 'logo';
            } else {
                $el += [
                    'h' => self::num($e['h'] ?? 10, 0, 100),
                    'fill' => self::hex($e['fill'] ?? null, null),
                    'stroke' => self::hex($e['stroke'] ?? null, null),
                    'sw' => self::num($e['sw'] ?? 0, 0, 20),
                ];
            }

            $out[] = $el;
        }

        return $out;
    }

    /* --------------------------------------------------------- bawaan */

    public static function builtins(): array
    {
        $list = [['klasik', 'Klasik Emas'], ['modern', 'Modern Biru'], ['minimal', 'Minimal']];

        return array_map(fn ($b) => [
            'key' => $b[0],
            'name' => $b[1],
            'designs' => ['landscape' => self::build($b[0], true), 'portrait' => self::build($b[0], false)],
        ], $list);
    }

    private static function build(string $key, bool $land): array
    {
        $c = [
            'klasik' => ['text' => '#3b2f1e', 'accent' => '#b8860b', 'font' => 'serif'],
            'modern' => ['text' => '#0f172a', 'accent' => '#1d4ed8', 'font' => 'sans'],
            'minimal' => ['text' => '#111827', 'accent' => '#6b7280', 'font' => 'sans'],
        ][$key];

        // [x, y, w] per elemen
        $p = $land ? [
            'logo' => [50, 4.5, 9], 'title' => [50, 19, 80], 'sub' => [50, 33, 60], 'name' => [50, 39.5, 84],
            'desc' => [50, 54, 72], 'org' => [50, 67, 60], 'sig' => [75, 73, 15], 'sname' => [75, 86, 30],
            'spos' => [75, 90.5, 30], 'num' => [25, 90, 34],
        ] : [
            'logo' => [50, 5, 16], 'title' => [50, 15.5, 80], 'sub' => [50, 28.5, 60], 'name' => [50, 34.5, 86],
            'desc' => [50, 46, 76], 'org' => [50, 57, 70], 'sig' => [50, 68, 26], 'sname' => [50, 80, 56],
            'spos' => [50, 84, 56], 'num' => [50, 92, 70],
        ];
        $s = $land ? ['title' => 40, 'sub' => 14, 'name' => 36, 'desc' => 15, 'org' => 13] : ['title' => 34, 'sub' => 13, 'name' => 30, 'desc' => 14, 'org' => 12];

        $els = [];
        $rect = fn ($id, $x, $y, $w, $h, $fill, $stroke = null, $sw = 0) => ['id' => $id, 'type' => 'rect', 'x' => $x, 'y' => $y, 'w' => $w, 'h' => $h, 'fill' => $fill, 'stroke' => $stroke, 'sw' => $sw];

        if ($key === 'klasik') {
            $ix = $land ? 3 : 4.2;
            $iy = $land ? 4.2 : 3;
            $jx = $ix + ($land ? 1.4 : 2);
            $jy = $iy + ($land ? 2 : 1.4);
            $els[] = $rect('bg', 0, 0, 100, 100, '#fffdf5');
            $els[] = $rect('frame1', $ix, $iy, 100 - 2 * $ix, 100 - 2 * $iy, null, $c['accent'], 6);
            $els[] = $rect('frame2', $jx, $jy, 100 - 2 * $jx, 100 - 2 * $jy, null, $c['accent'], 1.5);
        } elseif ($key === 'modern') {
            $els[] = $rect('band', 0, 0, 3, 100, $c['accent']);
            $els[] = $rect('band2', 0, 97, 100, 3, $c['accent']);
        } else {
            $ly = $land ? 49.5 : 42.5;
            $els[] = $rect('line', 30, $ly, 40, 0.25, $c['accent']);
        }

        $text = fn ($id, $t, $size, $extra = []) => array_merge([
            'id' => $id, 'type' => 'text', 'x' => $p[$id][0], 'y' => $p[$id][1], 'w' => $p[$id][2],
            'text' => $t, 'size' => $size, 'color' => $c['text'], 'bold' => false, 'italic' => false, 'align' => 'center', 'font' => $c['font'],
        ], $extra);

        $els[] = ['id' => 'logo', 'type' => 'image', 'src' => 'logo', 'x' => $p['logo'][0], 'y' => $p['logo'][1], 'w' => $p['logo'][2]];
        $els[] = $text('title', 'SERTIFIKAT', $s['title'], ['bold' => true, 'color' => $key === 'minimal' ? $c['text'] : $c['accent']]);
        $els[] = $text('sub', 'diberikan kepada', $s['sub']);
        $els[] = $text('name', '{{nama_peserta}}', $s['name'], ['bold' => true]);
        $els[] = $text('desc', "Atas partisipasinya sebagai {{kategori}}\ndalam kegiatan {{nama_event}}\n{{tanggal_event}} · {{lokasi_event}}", $s['desc']);
        $els[] = $text('org', '{{penyelenggara}}', $s['org'], ['italic' => true]);
        $els[] = ['id' => 'sig', 'type' => 'image', 'src' => 'signature', 'x' => $p['sig'][0], 'y' => $p['sig'][1], 'w' => $p['sig'][2]];
        $els[] = $text('sname', '{{nama_penandatangan}}', 14, ['bold' => true]);
        $els[] = $text('spos', '{{jabatan_penandatangan}}', 11);
        $els[] = $text('num', 'No. {{nomor_sertifikat}}', 10);

        return self::normalize($els);
    }
}
