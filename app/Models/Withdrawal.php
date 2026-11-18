<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
    public const MENUNGGU = 'menunggu';

    public const DISETUJUI = 'disetujui';

    public const DITRANSFER = 'ditransfer';

    public const DITOLAK = 'ditolak';

    protected $fillable = [
        'institution_id', 'event_id', 'amount', 'bank_name', 'account_number', 'account_name',
        'status', 'reject_reason', 'transfer_proof', 'approved_at', 'transferred_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'approved_at' => 'datetime',
            'transferred_at' => 'datetime',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
