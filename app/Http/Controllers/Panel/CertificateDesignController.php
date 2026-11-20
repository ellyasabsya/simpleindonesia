<?php

namespace App\Http\Controllers\Panel;

use App\Models\CertificateSigner;
use App\Models\CertificateTemplate;
use App\Models\Event;
use App\Models\Institution;
use App\Support\CertificateDesign;
use App\Support\CertificatePdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Response;

/**
 * Desainer sertifikat (Tahap 4): template bawaan SIMPLE, template pribadi lembaga, logo, tanda tangan,
 * teks yang bisa digeser, dan pratinjau PDF. Semua gambar disimpan di disk privat dan hanya
 * bisa dibuka lewat route berotentikasi milik lembaga pemilik event.
 */
class CertificateDesignController extends EventScopedController
{
    private const DISK = 'local';

    private const MAX_TEMPLATES = 30;

    /* ---------------------------------------------------------------- guard */

    private function guard(Request $request, Event $event): Institution
    {
        $inst = $request->attributes->get('institution');
        abort_unless($inst && $event->institution_id === $inst->id, 404);
        abort_if($event->parent_id, 404);
        abort_unless(
            $event->status === Event::PUBLISHED && in_array('sertifikat', $event->menus(), true),
            403,
            'Fitur ini tidak termasuk dalam paket event Anda.'
        );

        return $inst;
    }

    /** Template milik lembaga ini yang berlaku untuk event ini (khusus event ini atau untuk semua event). */
    private function scope(Institution $inst, Event $event)
    {
        return CertificateTemplate::where('institution_id', $inst->id)
            ->where(fn ($q) => $q->whereNull('event_id')->orWhere('event_id', $event->id));
    }

    private function owned(Request $request, Event $event, int $id): CertificateTemplate
    {
        $inst = $this->guard($request, $event);

        return $this->scope($inst, $event)->with('signer')->findOrFail($id);
    }

    /* ---------------------------------------------------------------- halaman */

    public function index(Request $request, Event $event): Response
    {
        $inst = $this->guard($request, $event);
        $templates = $this->scope($inst, $event)->with('signer')->orderByDesc('id')->get();

        $current = null;
        if ($request->filled('template')) {
            $current = $templates->firstWhere('id', (int) $request->query('template'));
            abort_unless($current, 404);
        }

        $lastSigner = CertificateSigner::where('event_id', $event->id)->orderByDesc('id')->first();
        $sample = CertificateDesign::values($event, 'Nama Penerima Contoh', 'Peserta', '001');

        return $this->render('panel/events/certificate-designer', $event, [
            'eventId' => $event->id,
            'builtins' => CertificateDesign::builtins(),
            'templates' => $templates->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'orientation' => $t->orientation])->values()->all(),
            'current' => $current ? $this->present($current) : null,
            'variables' => CertificateDesign::variableList(),
            'sample' => $sample,
            'year' => $event->starts_at->format('Y'),
            'defaultSigner' => $lastSigner ? ['name' => $lastSigner->name, 'position' => $lastSigner->position] : null,
        ]);
    }

    private function present(CertificateTemplate $t): array
    {
        return [
            'id' => $t->id,
            'name' => $t->name,
            'orientation' => $t->orientation,
            'design' => CertificateDesign::normalize((array) $t->design),
            'number_format' => $t->number_format,
            'base_key' => $t->base_key,
            'all_events' => $t->event_id === null,
            'has_logo' => (bool) $t->logo_path,
            'has_background' => (bool) $t->background_path,
            'signer' => $t->signer ? [
                'name' => $t->signer->name,
                'position' => $t->signer->position,
                'has_signature' => (bool) $t->signer->signature_path,
            ] : null,
            'v' => $t->updated_at?->timestamp ?? 0,
        ];
    }

    /* ------------------------------------------------------------ simpan dll */

    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'orientation' => ['required', 'in:landscape,portrait'],
            'design' => ['required', 'string', 'max:60000'],
            'number_format' => ['required', 'string', 'max:80'],
            'base_key' => ['nullable', 'string', 'max:40'],
            'all_events' => ['nullable', 'boolean'],
            'signer_name' => ['nullable', 'string', 'max:120', 'required_with:signature'],
            'signer_position' => ['nullable', 'string', 'max:120'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:4096'],
            'background' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:8192'],
            'signature' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
            'remove_background' => ['nullable', 'boolean'],
            'remove_signature' => ['nullable', 'boolean'],
            'template_id' => ['nullable', 'integer'],
            'copy_from' => ['nullable', 'integer'],
        ];
    }

    private const MESSAGES = [
        'name.required' => 'Isi nama template.',
        'number_format.required' => 'Isi format nomor sertifikat.',
        'logo.image' => 'Logo harus berupa gambar JPG atau PNG.',
        'logo.mimes' => 'Logo harus JPG atau PNG.',
        'logo.max' => 'Logo maksimal 4 MB.',
        'background.image' => 'Latar harus berupa gambar JPG atau PNG.',
        'background.mimes' => 'Latar harus JPG atau PNG.',
        'background.max' => 'Latar maksimal 8 MB.',
        'signature.image' => 'Tanda tangan harus berupa gambar JPG atau PNG.',
        'signature.mimes' => 'Tanda tangan harus JPG atau PNG.',
        'signature.max' => 'Tanda tangan maksimal 2 MB.',
        'signer_name.required_with' => 'Isi nama penandatangan untuk gambar tanda tangan.',
    ];

    private function decodeDesign(string $raw): array
    {
        $arr = json_decode($raw, true);
        $design = is_array($arr) ? CertificateDesign::normalize($arr) : [];
        if ($design === []) {
            throw ValidationException::withMessages(['design' => 'Desain kosong. Tambahkan minimal satu elemen.']);
        }

        return $design;
    }

    public function store(Request $request, Event $event): RedirectResponse
    {
        $inst = $this->guard($request, $event);

        if (CertificateTemplate::where('institution_id', $inst->id)->count() >= self::MAX_TEMPLATES) {
            throw ValidationException::withMessages(['name' => 'Jumlah template sudah mencapai batas ('.self::MAX_TEMPLATES.'). Hapus yang tidak dipakai.']);
        }

        $t = $this->persist($request, $event, $inst, null);

        return redirect("/panel/event/{$event->id}/sertifikat/desain?template={$t->id}");
    }

    public function update(Request $request, Event $event, int $template): RedirectResponse
    {
        $inst = $this->guard($request, $event);
        $t = $this->owned($request, $event, $template);
        $this->persist($request, $event, $inst, $t);

        return redirect("/panel/event/{$event->id}/sertifikat/desain?template={$t->id}");
    }

    public function destroy(Request $request, Event $event, int $template): RedirectResponse
    {
        $t = $this->owned($request, $event, $template);

        $this->drop($t->logo_path);
        $this->drop($t->background_path);
        if ($t->signer) {
            $shared = CertificateTemplate::where('signer_id', $t->signer->id)->where('id', '!=', $t->id)->exists();
            if (! $shared) {
                $this->drop($t->signer->signature_path);
                $t->signer->delete();
            }
        }
        $t->delete();

        return redirect("/panel/event/{$event->id}/sertifikat/desain");
    }

    private function persist(Request $request, Event $event, Institution $inst, ?CertificateTemplate $t): CertificateTemplate
    {
        $data = $request->validate($this->rules(), self::MESSAGES);
        $design = $this->decodeDesign($data['design']);

        $isNew = $t === null;
        $t ??= new CertificateTemplate(['institution_id' => $inst->id, 'created_by' => $request->user()->id]);

        // Salin dari template lain (fitur "Simpan sebagai baru"): hanya milik lembaga ini.
        $source = null;
        if ($isNew && ! empty($data['copy_from'])) {
            $source = $this->scope($inst, $event)->with('signer')->find((int) $data['copy_from']);
        }

        $t->event_id = ! empty($data['all_events']) ? null : $event->id;
        $t->name = trim($data['name']);
        $t->orientation = $data['orientation'];
        $t->design = $design;
        $t->number_format = trim($data['number_format']);
        $t->base_key = ($data['base_key'] ?? '') !== '' ? $data['base_key'] : null;

        $dir = "certificates/inst{$inst->id}/templates";

        foreach (['logo' => 'logo_path', 'background' => 'background_path'] as $kind => $col) {
            if ($request->hasFile($kind)) {
                $this->drop($t->{$col});
                $t->{$col} = $request->file($kind)->store($dir, self::DISK);
            } elseif ($request->boolean('remove_'.$kind)) {
                $this->drop($t->{$col});
                $t->{$col} = null;
            } elseif ($source && $source->{$col}) {
                $t->{$col} = $this->copy($source->{$col}, $dir);
            }
        }

        // Penandatangan: satu per template.
        $name = trim((string) ($data['signer_name'] ?? ''));
        $signer = $t->signer;
        if ($name !== '') {
            $signer ??= new CertificateSigner(['event_id' => $event->id]);
            $signer->name = $name;
            $signer->position = trim((string) ($data['signer_position'] ?? '')) ?: null;
            if ($request->hasFile('signature')) {
                $this->drop($signer->signature_path);
                $signer->signature_path = $request->file('signature')->store($dir, self::DISK);
            } elseif ($request->boolean('remove_signature')) {
                $this->drop($signer->signature_path);
                $signer->signature_path = null;
            } elseif (! $signer->exists && $source?->signer?->signature_path) {
                $signer->signature_path = $this->copy($source->signer->signature_path, $dir);
            }
            $signer->save();
            $t->signer_id = $signer->id;
        } elseif ($signer) {
            $this->drop($signer->signature_path);
            $signer->delete();
            $t->signer_id = null;
        }

        $t->save();

        return $t;
    }

    /* ------------------------------------------------------------- pratinjau */

    /** Pratinjau PDF dari isi editor (belum perlu disimpan). Mengembalikan PDF yang sama dengan hasil penerbitan nanti. */
    public function preview(Request $request, Event $event)
    {
        $inst = $this->guard($request, $event);
        $data = $request->validate($this->rules(), self::MESSAGES);
        $design = $this->decodeDesign($data['design']);

        $t = null;
        if (! empty($data['template_id'])) {
            $t = $this->scope($inst, $event)->with('signer')->findOrFail((int) $data['template_id']);
        }

        $number = CertificateDesign::formatNumber($event, trim($data['number_format']), 1);
        $values = CertificateDesign::values(
            $event, 'Nama Penerima Contoh', 'Peserta', $number,
            trim((string) ($data['signer_name'] ?? '')), trim((string) ($data['signer_position'] ?? ''))
        );

        $pdf = CertificatePdf::render($design, $data['orientation'], $values, $this->images($request, $t));

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="pratinjau-sertifikat.pdf"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /** Gambar untuk PDF: unggahan baru menang, lalu penghapusan, lalu file tersimpan milik template. */
    private function images(Request $request, ?CertificateTemplate $t): array
    {
        $out = [];
        foreach (['logo', 'background', 'signature'] as $kind) {
            if ($request->hasFile($kind)) {
                $out[$kind] = $this->dataUri((string) file_get_contents($request->file($kind)->getRealPath()));
            } elseif ($request->boolean('remove_'.$kind)) {
                $out[$kind] = null;
            } elseif ($t) {
                $path = match ($kind) {
                    'logo' => $t->logo_path,
                    'background' => $t->background_path,
                    default => $t->signer?->signature_path,
                };
                $out[$kind] = $this->storedUri($path);
            } else {
                $out[$kind] = null;
            }
        }

        return $out;
    }

    /** Tampilkan gambar tersimpan ke editor (hanya pemilik event). */
    public function asset(Request $request, Event $event, int $template, string $kind)
    {
        $t = $this->owned($request, $event, $template);
        $path = match ($kind) {
            'logo' => $t->logo_path,
            'background' => $t->background_path,
            'signature' => $t->signer?->signature_path,
            default => null,
        };
        abort_unless($path && Storage::disk(self::DISK)->exists($path), 404);

        return response()->file(Storage::disk(self::DISK)->path($path), [
            'Cache-Control' => 'private, max-age=600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /* ------------------------------------------------------------- file util */

    private function dataUri(string $bytes): ?string
    {
        $info = @getimagesizefromstring($bytes);
        if (! $info || ! in_array($info['mime'], ['image/png', 'image/jpeg'], true)) {
            return null;
        }

        return 'data:'.$info['mime'].';base64,'.base64_encode($bytes);
    }

    private function storedUri(?string $path): ?string
    {
        if (! $path || ! Storage::disk(self::DISK)->exists($path)) {
            return null;
        }

        return $this->dataUri(Storage::disk(self::DISK)->get($path));
    }

    private function drop(?string $path): void
    {
        if ($path) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    private function copy(string $path, string $dir): ?string
    {
        $disk = Storage::disk(self::DISK);
        if (! $disk->exists($path)) {
            return null;
        }
        $new = $dir.'/'.bin2hex(random_bytes(16)).'.'.pathinfo($path, PATHINFO_EXTENSION);
        $disk->copy($path, $new);

        return $new;
    }
}
