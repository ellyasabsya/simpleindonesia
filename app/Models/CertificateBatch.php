<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CertificateBatch extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['started_at' => 'datetime', 'finished_at' => 'datetime'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'batch_id');
    }
}
