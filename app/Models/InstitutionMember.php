<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionMember extends Model
{
    protected $fillable = ['institution_id', 'user_id', 'role'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
