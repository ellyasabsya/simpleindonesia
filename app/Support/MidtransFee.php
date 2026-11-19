<?php

namespace App\Support;

class MidtransFee
{
    /** Estimasi MDR dari jenis pembayaran Midtrans dan nominal bruto. */
    public static function estimate(?string $paymentType, int $amount): int
    {
        $rates = config('midtrans_fees');
        $r = $rates[$paymentType ?? ''] ?? $rates['default'];

        return (int) round($amount * $r['percent'] / 100 + $r['flat']);
    }
}
