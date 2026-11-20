<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Riwayat sertifikat. Hanya ditambah, tidak diubah. */
class CertificateEvent extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = ['meta' => 'array', 'created_at' => 'datetime'];

    public function certificate(): BelongsTo
    {
        return $this->belongsTo(Certificate::class);
    }
}
