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

    /** Ubah 0812..., +62 812..., 812... menjadi 62812... (format wa.me). Kosong jika tidak valid. */
    public static function normalizeWa(?string $raw): string
    {
        $d = preg_replace('/\D+/', '', (string) $raw) ?? '';
        if ($d === '') {
            return '';
        }
        if (str_starts_with($d, '0')) {
            $d = '62'.substr($d, 1);
        } elseif (str_starts_with($d, '8')) {
            $d = '62'.$d;
        }

        return strlen($d) >= 9 && strlen($d) <= 15 ? $d : '';
    }

    /** Nomor WhatsApp admin untuk tombol chat. Memakai nomor lama bila belum diatur. */
    public static function adminWhatsapp(): string
    {
        try {
            $v = static::normalizeWa(static::text('admin_whatsapp'));
        } catch (\Throwable $e) {
            $v = '';
        }

        return $v !== '' ? $v : '6281277700335';
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
