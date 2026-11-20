<?php

namespace App\Support;

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * Render desain sertifikat ke PDF. Dipakai oleh pratinjau (Tahap 4) dan nanti oleh job penerbitan (Tahap 5),
 * sehingga hasil PDF selalu sama dengan pratinjau.
 *
 * $images: ['logo' => dataUri|null, 'signature' => dataUri|null, 'background' => dataUri|null]
 */
class CertificatePdf
{
    private static function pt(float $v): string
    {
        return sprintf('%.2F', $v).'pt';
    }

    public static function render(array $design, string $orientation, array $values, array $images = []): string
    {
        $orientation = $orientation === 'portrait' ? 'portrait' : 'landscape';
        [$W, $H] = CertificateDesign::PAGE[$orientation];

        $items = [];
        foreach (CertificateDesign::normalize($design) as $e) {
            if ($e['type'] === 'rect') {
                $sw = (float) $e['sw'];
                $w = max(0, $e['w'] / 100 * $W - 2 * $sw);
                $h = max(0, $e['h'] / 100 * $H - 2 * $sw);
                $style = 'position:absolute;left:'.self::pt($e['x'] / 100 * $W).';top:'.self::pt($e['y'] / 100 * $H)
                    .';width:'.self::pt($w).';height:'.self::pt($h).';';
                if ($e['fill']) {
                    $style .= 'background-color:'.$e['fill'].';';
                }
                if ($sw > 0 && $e['stroke']) {
                    $style .= 'border:'.self::pt($sw).' solid '.$e['stroke'].';';
                }
                $items[] = ['kind' => 'div', 'style' => $style, 'html' => ''];
            } elseif ($e['type'] === 'image') {
                $src = $images[$e['src']] ?? null;
                if (! $src) {
                    continue;
                }
                $w = $e['w'] / 100 * $W;
                $items[] = [
                    'kind' => 'img',
                    'src' => $src,
                    'style' => 'position:absolute;left:'.self::pt($e['x'] / 100 * $W - $w / 2).';top:'.self::pt($e['y'] / 100 * $H).';width:'.self::pt($w).';',
                ];
            } else {
                $text = CertificateDesign::fill((string) $e['text'], $values);
                if (trim($text) === '') {
                    continue;
                }
                $w = $e['w'] / 100 * $W;
                $style = 'position:absolute;left:'.self::pt($e['x'] / 100 * $W - $w / 2).';top:'.self::pt($e['y'] / 100 * $H)
                    .';width:'.self::pt($w).";font-family:'".CertificateDesign::FONTS[$e['font']]."';font-size:".self::pt((float) $e['size'])
                    .';line-height:1.25;color:'.$e['color'].';text-align:'.$e['align'].';'
                    .($e['bold'] ? 'font-weight:bold;' : '').($e['italic'] ? 'font-style:italic;' : '');
                $items[] = ['kind' => 'div', 'style' => $style, 'html' => nl2br(e($text), false)];
            }
        }

        $html = view('certificates.design', [
            'W' => $W, 'H' => $H, 'bg' => $images['background'] ?? null, 'items' => $items,
        ])->render();

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', $orientation);
        $dompdf->render();

        return $dompdf->output();
    }
}
