<?php

namespace App\Models;

use App\Support\CertificateCategories;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Certificate extends Model
{
    public const PENDING = 'pending';
    public const ISSUED = 'issued';
    public const REVOKED = 'revoked';
    public const FAILED = 'failed';

    protected $guarded = ['id'];

    /** Lokasi file dan data internal tidak ikut terkirim ke frontend. */
    protected $hidden = ['pdf_path', 'design_snapshot'];

    protected $casts = [
        'design_snapshot' => 'array',
        'issued_at' => 'datetime',
        'notified_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(CertificateBatch::class, 'batch_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(CertificateEvent::class);
    }

    public function scopeIssued(Builder $q): Builder
    {
        return $q->where('status', self::ISSUED);
    }

    public function isValid(): bool
    {
        return $this->status === self::ISSUED;
    }

    public function categoryLabel(): string
    {
        return $this->award_title ?: CertificateCategories::label($this->category);
    }

    /** Token acak 40 karakter, tidak bisa ditebak. */
    public static function newToken(): string
    {
        return Str::random(40);
    }

    /** Nomor urut berikutnya untuk event + kategori, aman terhadap proses bersamaan. */
    public static function nextSequence(int $eventId, string $category): int
    {
        return DB::transaction(function () use ($eventId, $category) {
            DB::table('certificate_sequences')->insertOrIgnore([
                'event_id' => $eventId, 'category' => $category, 'last_seq' => 0,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('certificate_sequences')
                ->where('event_id', $eventId)->where('category', $category)->increment('last_seq');

            return (int) DB::table('certificate_sequences')
                ->where('event_id', $eventId)->where('category', $category)->lockForUpdate()->value('last_seq');
        });
    }

    public function record(string $action, ?int $actorId = null, array $meta = []): CertificateEvent
    {
        return CertificateEvent::create([
            'event_id' => $this->event_id,
            'certificate_id' => $this->id,
            'batch_id' => $this->batch_id,
            'actor_id' => $actorId,
            'action' => $action,
            'meta' => $meta ?: null,
        ]);
    }
}
