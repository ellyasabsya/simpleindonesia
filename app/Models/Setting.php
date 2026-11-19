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

    /** Biaya layanan (persen) untuk tiket dan voting. Default 10. */
    public static function serviceFeePercent(): float
    {
        $v = static::text('service_fee_percent', '10');

        return is_numeric($v) ? max(0.0, min(50.0, (float) $v)) : 10.0;
    }

    /** Voting butuh konfirmasi otomatis: buka hanya bila pembayaran online aktif dan Server Key terisi. */
    public static function votingOpen(): bool
    {
        return static::midtransOn() && (string) config('midtrans.server_key') !== '';
    }
}
