<?php

namespace App\Support;

use App\Models\Event;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Kolom form buatan panitia, lengkap dengan tahap pengisian (register atau after). */
class FormFields
{
    public static function all(Event $event): array
    {
        $raw = DB::table('events')->where('id', $event->id)->value('registration_fields');
        $list = is_string($raw) ? (json_decode($raw, true) ?: []) : (is_array($raw) ? $raw : []);
        $out = [];
        foreach ($list as $f) {
            if (! is_array($f) || empty($f['key'])) {
                continue;
            }
            $out[] = [
                'key' => (string) $f['key'],
                'label' => (string) ($f['label'] ?? ''),
                'type' => (string) ($f['type'] ?? 'text'),
                'required' => (bool) ($f['required'] ?? false),
                'options' => array_values((array) ($f['options'] ?? [])),
                'archived' => (bool) ($f['archived'] ?? false),
                'stage' => (($f['stage'] ?? 'register') === 'after') ? 'after' : 'register',
            ];
        }

        return $out;
    }

    public static function active(Event $event, string $stage): array
    {
        return array_values(array_filter(
            self::all($event),
            fn ($f) => ! $f['archived'] && $f['stage'] === $stage
        ));
    }

    /** @return array{0: array, 1: array, 2: array} aturan, pesan, nama atribut */
    public static function rules(array $fields, array $old = []): array
    {
        $rules = [];
        $msgs = [];
        $names = [];
        foreach ($fields as $f) {
            $k = 'answers.'.$f['key'];
            $hasOld = $f['type'] === 'file' && isset($old[$f['key']]['path']);
            $req = ($f['required'] && ! $hasOld) ? 'required' : 'nullable';
            $rules[$k] = match ($f['type']) {
                'number' => [$req, 'numeric'],
                'date' => [$req, 'date'],
                'textarea' => [$req, 'string', 'max:3000'],
                'select' => [$req, 'string', Rule::in($f['options'])],
                'checkbox' => [$req, 'array', 'max:50'],
                'file' => [$req, 'file', 'mimes:'.RegistrationForm::FILE_MIMES, 'max:'.RegistrationForm::FILE_MAX_KB],
                default => [$req, 'string', 'max:255'],
            };
            if ($f['type'] === 'checkbox') {
                $rules[$k.'.*'] = ['string', Rule::in($f['options'])];
            }
            if ($f['type'] === 'file') {
                $msgs[$k.'.mimes'] = $f['label'].' harus berupa JPG, PNG, WEBP, atau PDF.';
                $msgs[$k.'.max'] = $f['label'].' maksimal 5 MB.';
                $msgs[$k.'.uploaded'] = 'Unggahan '.$f['label'].' gagal. Ukuran berkas mungkin terlalu besar.';
            }
            $names[$k] = $f['label'];
        }

        return [$rules, $msgs, $names];
    }
}
