<?php

namespace App\Models;

use Database\Factories\InstitutionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Institution extends Model
{
    /** @use HasFactory<InstitutionFactory> */
    use HasFactory;

    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    protected $fillable = ['user_id', 'name', 'email', 'phone', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Cari di nama, email, telepon lembaga, serta nama/email anggota (pemilik akun).
     *
     * @param  Builder<Institution>  $query
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);
        if ($term === '') {
            return;
        }

        $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $term).'%';

        $query->where(function (Builder $q) use ($like) {
            foreach (['institutions.name', 'institutions.email', 'institutions.phone'] as $column) {
                $q->orWhereRaw("{$column} like ? escape '\\'", [$like]);
            }
            $q->orWhereHas('user', function (Builder $u) use ($like) {
                $u->whereRaw("name like ? escape '\\'", [$like])
                    ->orWhereRaw("email like ? escape '\\'", [$like]);
            });
        });
    }
}
