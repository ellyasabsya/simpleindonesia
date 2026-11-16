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
        return self::menusFor($this->features);
    }

    public static function menusFor(array $features): array
    {
        $all = config('features.features');

        return collect($features)
            ->map(fn ($key) => $all[$key]['menu'] ?? null)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /** Salinan paket yang disimpan di event saat diajukan. */
    public function snapshot(): array
    {
        return [
            'name' => $this->name,
            'payment_type' => $this->payment_type,
            'share_percent' => $this->share_percent,
            'price' => $this->price,
            'modules' => $this->modules,
            'features' => $this->features,
        ];
    }

    public function priceLabel(): string
    {
        return match ($this->payment_type) {
            'revenue_share' => 'Bagi hasil '.rtrim(rtrim(number_format((float) $this->share_percent, 1), '0'), '.').'%',
            'upfront' => 'Bayar di muka Rp'.number_format((int) $this->price, 0, ',', '.'),
            default => 'Gratis',
        };
    }
}
