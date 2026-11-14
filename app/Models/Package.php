<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'name', 'slug', 'payment_type', 'share_percent', 'price',
        'modules', 'features', 'description', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'modules' => 'array',
            'features' => 'array',
            'is_active' => 'boolean',
            'share_percent' => 'float',
            'price' => 'integer',
        ];
    }

    /** Menu dashboard event yang terbuka untuk paket ini. */
    public function menus(): array
    {
        $all = config('features.features');

        return collect($this->features)
            ->map(fn ($key) => $all[$key]['menu'] ?? null)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
