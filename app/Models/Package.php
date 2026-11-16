<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'name', 'slug', 'payment_type', 'share_percent', 'price',
        'event_type', 'included_sub_events', 'extra_sub_event_price',
        'assessment_addon_price', 'judge_addon_price', 'max_participant_categories',
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
            'included_sub_events' => 'integer',
            'extra_sub_event_price' => 'integer',
            'assessment_addon_price' => 'integer',
            'judge_addon_price' => 'integer',
            'max_participant_categories' => 'integer',
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
            'event_type' => $this->event_type,
            'included_sub_events' => $this->included_sub_events,
            'extra_sub_event_price' => $this->extra_sub_event_price,
            'assessment_addon_price' => $this->assessment_addon_price,
            'judge_addon_price' => $this->judge_addon_price,
            'max_participant_categories' => $this->max_participant_categories,
            'modules' => $this->modules,
            'features' => $this->features,
        ];
    }

    /** Biaya sub-event tambahan untuk sejumlah sub-event; null kalau paket tidak menyediakannya. */
    public function subEventCost(int $total): ?int
    {
        $extra = max(0, $total - (int) $this->included_sub_events);

        if ($extra === 0) {
            return 0;
        }

        return $this->extra_sub_event_price === null ? null : $extra * $this->extra_sub_event_price;
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
