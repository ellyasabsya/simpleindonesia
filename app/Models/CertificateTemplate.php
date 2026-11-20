<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateTemplate extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['design' => 'array'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function signer(): BelongsTo
    {
        return $this->belongsTo(CertificateSigner::class, 'signer_id');
    }
}
