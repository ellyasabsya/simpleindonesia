<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Support\CertificateCategories;
use App\Support\CertificateIssuer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/** Daftar, detail dan unduhan sertifikat milik akun yang masuk. Sertifikat akun lain selalu 404. */
class MyCertificateController extends Controller
{
    private const PER_PAGE = 12;

    private function owned(Request $request, int $id): Certificate
    {
        return Certificate::where('user_id', $request->user()->id)
            ->whereIn('status', [Certificate::ISSUED, Certificate::REVOKED])
            ->findOrFail($id);
    }

    /** Halaman "Sertifikat Saya": daftar + pencarian + filter tahun dan jenis. */
    public function index(Request $request)
    {
        $tz = config('app.agenda_timezone', 'Asia/Jakarta');

        $all = Certificate::where('user_id', $request->user()->id)
            ->whereIn('status', [Certificate::ISSUED, Certificate::REVOKED])
            ->orderByDesc('issued_at')->orderByDesc('id')
            ->get();

        $rows = $all->map(function (Certificate $c) use ($tz) {
            $at = ($c->issued_at ?? $c->created_at)?->copy()->timezone($tz);

            return [
                'id' => $c->id,
                'event' => (string) $c->event_title,
                'label' => $c->categoryLabel(),
                'category' => (string) $c->category,
                'number' => (string) $c->certificate_number,
                'name' => (string) $c->recipient_name,
                'year' => $at?->year,
                'date' => $at?->locale('id')->translatedFormat('j F Y'),
                'valid' => $c->isValid(),
                'url' => route('sertifikat.saya.detail', ['certificate' => $c->id]),
            ];
        });

        // Pilihan filter diambil dari sertifikat milik akun ini saja.
        $years = $rows->pluck('year')->filter()->unique()->sortDesc()->values()->all();
        $types = $rows->pluck('category')->unique()->mapWithKeys(
            fn ($k) => [$k => CertificateCategories::label($k)]
        )->all();

        $q = trim(mb_substr((string) $request->query('cari', ''), 0, 100));
        $year = (int) $request->query('tahun', 0);
        $type = (string) $request->query('jenis', '');
        if (! in_array($year, $years, true)) {
            $year = 0;
        }
        if (! isset($types[$type])) {
            $type = '';
        }

        $filtered = $rows
            ->when($year, fn ($c) => $c->where('year', $year))
            ->when($type !== '', fn ($c) => $c->where('category', $type))
            ->when($q !== '', fn ($c) => $c->filter(fn ($r) => mb_stripos(
                $r['event'].' '.$r['number'].' '.$r['name'].' '.$r['label'], $q
            ) !== false))
            ->values();

        $pages = max(1, (int) ceil($filtered->count() / self::PER_PAGE));
        $page = min(max(1, (int) $request->query('halaman', 1)), $pages);

        $keep = array_filter(['cari' => $q, 'tahun' => $year ?: null, 'jenis' => $type]);
        $pageUrl = fn (int $n) => url('/sertifikat-saya').'?'.http_build_query($keep + ['halaman' => $n]);

        return Inertia::render('saya/sertifikat', [
            'items' => $filtered->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)->values()->all(),
            'total' => $filtered->count(),
            'owned' => $rows->count(),
            'years' => $years,
            'types' => $types,
            'f' => ['cari' => $q, 'tahun' => $year, 'jenis' => $type],
            'filtered' => $q !== '' || $year || $type !== '',
            'page' => $page,
            'pages' => $pages,
            'prevUrl' => $page > 1 ? $pageUrl($page - 1) : null,
            'nextUrl' => $page < $pages ? $pageUrl($page + 1) : null,
        ]);
    }

    public function show(Request $request, int $certificate)
    {
        $c = $this->owned($request, $certificate);

        return view('certificates.show', [
            'c' => $c,
            'label' => $c->categoryLabel(),
            'valid' => $c->isValid(),
            'downloadUrl' => $c->isValid() ? route('sertifikat.saya.unduh', ['certificate' => $c->id]) : null,
        ]);
    }

    public function download(Request $request, int $certificate)
    {
        $c = $this->owned($request, $certificate);
        abort_unless($c->isValid() && $c->pdf_path && Storage::disk(CertificateIssuer::DISK)->exists($c->pdf_path), 404);

        return Storage::disk(CertificateIssuer::DISK)->download(
            $c->pdf_path,
            'sertifikat-'.preg_replace('/[^A-Za-z0-9]+/', '-', $c->event_title).'-'.$c->id.'.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }
}
