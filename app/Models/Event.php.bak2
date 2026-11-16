<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Event extends Model
{
    public const PENDING = 'pending';
    public const PUBLISHED = 'published';
    public const REJECTED = 'rejected';

    protected $fillable = [
        'institution_id', 'package_id', 'title', 'slug', 'category', 'description', 'location',
        'starts_at', 'ends_at', 'poster_path', 'status', 'rejection_reason', 'reviewed_at', 'package_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'reviewed_at' => 'datetime',
            'package_snapshot' => 'array',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function posterUrl(): ?string
    {
        return $this->poster_path ? Storage::disk('public')->url($this->poster_path) : null;
    }

    public function hasFeature(string $key): bool
    {
        return in_array($key, $this->package_snapshot['features'] ?? [], true);
    }

    /** Menu dashboard event, dari snapshot (bukan dari paket yang mungkin sudah berubah). */
    public function menus(): array
    {
        return Package::menusFor($this->package_snapshot['features'] ?? []);
    }
}
