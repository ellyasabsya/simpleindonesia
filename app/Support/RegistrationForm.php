<?php

namespace App\Support;

use App\Models\Event;

class RegistrationForm
{
    public const TYPES = ['text', 'textarea', 'number', 'select', 'checkbox', 'date', 'file'];

    public const FILE_MIMES = 'jpg,jpeg,png,webp,pdf';

    public const FILE_MAX_KB = 5120;

    /** Jawaban untuk dikirim ke browser: path berkas tidak ikut. */
    public static function publicAnswers(?string $json): array
    {
        $a = json_decode((string) $json, true) ?: [];
        foreach ($a as $k => $v) {
            if (is_array($v) && isset($v['path'])) {
                $a[$k] = ['file' => true, 'name' => (string) ($v['name'] ?? 'berkas')];
            }
        }

        return $a;
    }

    public static function needsOptions(string $type): bool
    {
        return in_array($type, ['select', 'checkbox'], true);
    }

    /** Semua kolom kustom event ini, termasuk yang diarsipkan. */
    public static function fields(Event $event): array
    {
        $raw = $event->getAttribute('registration_fields');
        $list = is_array($raw) ? $raw : (json_decode((string) $raw, true) ?: []);

        return array_values(array_filter($list, 'is_array'));
    }
}
