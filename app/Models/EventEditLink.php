<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventEditLink extends Model
{
    protected $fillable = ['event_id', 'token_hash', 'expires_at', 'created_by'];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'last_opened_at' => 'datetime',
        'edited_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /** aktif | dipakai | kedaluwarsa | dicabut */
    public function status(): string
    {
        if ($this->revoked_at) {
            return 'dicabut';
        }
        if ($this->edited_at) {
            return 'dipakai';
        }
        if ($this->expires_at->isPast()) {
            return 'kedaluwarsa';
        }

        return 'aktif';
    }

    public static function listFor(int $eventId): array
    {
        $f = 'd M Y H:i';

        return static::where('event_id', $eventId)->latest('id')->limit(10)->get()->map(fn (self $l) => [
            'id' => $l->id,
            'status' => $l->status(),
            'expires_at' => $l->expires_at->format($f),
            'created_at' => $l->created_at->format($f),
            'last_opened_at' => $l->last_opened_at?->format($f),
            'edited_at' => $l->edited_at?->format($f),
        ])->values()->all();
    }
}
