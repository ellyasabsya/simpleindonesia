<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function flag(string $key, bool $default = false): bool
    {
        $v = static::where('key', $key)->value('value');

        return $v === null ? $default : $v === '1';
    }

    public static function put(string $key, bool $on): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $on ? '1' : '0']);
    }

    public static function text(string $key, string $default = ''): string
    {
        $v = static::where('key', $key)->value('value');

        return $v === null ? $default : (string) $v;
    }

    public static function putText(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => trim((string) $value)]);
    }

    public static function midtransOn(): bool
    {
        return static::flag('pay_midtrans', true);
    }

    public static function manualOn(): bool
    {
        return static::flag('pay_manual', false);
    }

    /** Data rekening untuk transfer manual. */
    public static function bank(): array
    {
        return [
            'bank_name' => static::text('bank_name'),
            'bank_account_number' => static::text('bank_account_number'),
            'bank_account_holder' => static::text('bank_account_holder'),
        ];
    }

    /** Voting berbayar butuh konfirmasi otomatis: tutup kalau hanya transfer manual yang aktif. */
    public static function votingOpen(): bool
    {
        return static::midtransOn() || ! static::manualOn();
    }
}
