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

    protected $fillable = [ 'terms_accepted_at', 'revenue_share_accepted_at', 'team_per_row', 'team_leaders',  'team_slots', 'competition_type', 'team_size',  'bank_name', 'bank_account_number', 'bank_account_name', 'parent_id', 'sub_order', 'participant_quota', 'registration_method', 'registration_fee', 'contact_name', 'contact_phone', 'contact_email', 'contact_position', 
        'institution_id', 'package_id', 'title', 'slug', 'category', 'description', 'location',
        'starts_at', 'ends_at', 'poster_path', 'juknis_path', 'status', 'rejection_reason', 'reviewed_at', 'package_snapshot', 'payment_status',
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

    public function juknisUrl(): ?string
    {
        return $this->juknis_path ? Storage::disk('public')->url($this->juknis_path) : null;
    }

    public function hasFeature(string $key): bool
    {
        return in_array($key, $this->effectiveFeatures(), true);
    }

    /** Fitur paket ditambah fitur add-on yang dibeli dan sudah lunas. Dihitung saat dibaca, tidak disimpan, jadi paket tidak berubah. */
    public function effectiveFeatures(): array
    {
        $snap = (array) ($this->package_snapshot ?? []);
        $features = (array) ($snap['features'] ?? []);
        // Sub-event mewarisi add-on yang dibeli di event induk.
        $src = $this->parent_id ? (self::find($this->parent_id) ?? $this) : $this;
        $opt = (array) (((array) ($src->package_snapshot ?? []))['options'] ?? []);
        if ($src->payment_status === 'lunas') {
            foreach (config('addons') as $key => $def) {
                if (! empty($opt[$key])) {
                    $features = array_merge($features, $def['features']);
                }
            }
        }

        return array_values(array_unique($features));
    }

    /** Menu dashboard event, dari snapshot (bukan dari paket yang mungkin sudah berubah). */
    public function menus(): array
    {
        return Package::menusFor($this->effectiveFeatures());
    }

    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sub_order');
    }

    public function comments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EventComment::class);
    }

    public function ticketTypes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TicketType::class);
    }

    public function scopeMain($query)
    {
        return $query->whereNull('parent_id');
    }
}
