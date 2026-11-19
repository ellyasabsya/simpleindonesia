<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class News extends Model
{
    public const DRAFT = 'draft';
    public const PUBLISHED = 'published';

    protected $table = 'news';

    protected $fillable = ['title', 'slug', 'summary', 'cover_path', 'body', 'status', 'published_at', 'user_id'];

    protected $casts = ['published_at' => 'datetime'];

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::PUBLISHED);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(NewsComment::class, 'news_id')->latest();
    }

    public function coverUrl(): ?string
    {
        return $this->cover_path ? '/storage/'.$this->cover_path : null;
    }

    public function dateLabel(): ?string
    {
        return $this->published_at?->locale('id')->translatedFormat('j F Y');
    }

    public function card(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'cover_url' => $this->coverUrl(),
            'date' => $this->dateLabel(),
        ];
    }

    public static function latestForHome(int $limit = 3): array
    {
        return static::published()->orderByDesc('published_at')->limit($limit)->get()
            ->map(fn (News $n) => $n->card())->all();
    }
}
