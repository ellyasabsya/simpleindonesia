<?php

namespace App\Services;

use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = (string) config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    public function snapToken(string $orderId, int $amount, array $customer = [], array $items = []): string
    {
        $params = [
            'transaction_details' => ['order_id' => $orderId, 'gross_amount' => $amount],
            'customer_details' => $customer,
        ];
        if ($items) {
            $params['item_details'] = $items;
        }

        return Snap::getSnapToken($params);
    }

    /** Tanya status transaksi langsung ke Midtrans. */
    public function status(string $orderId): array
    {
        return (array) json_decode(json_encode(\Midtrans\Transaction::status($orderId)), true);
    }

    public function validSignature(array $p): bool
    {
        $expected = hash('sha512', ($p['order_id'] ?? '').($p['status_code'] ?? '').($p['gross_amount'] ?? '').config('midtrans.server_key'));

        return hash_equals($expected, (string) ($p['signature_key'] ?? ''));
    }

    public function isPaid(array $p): bool
    {
        $status = $p['transaction_status'] ?? '';

        return $status === 'settlement' || ($status === 'capture' && ($p['fraud_status'] ?? 'accept') === 'accept');
    }
}
