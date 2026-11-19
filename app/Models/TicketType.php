<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketType extends Model
{
    protected $fillable = [
        'participant_category_id',
        'audience','event_id', 'name', 'price', 'quota', 'valid_from', 'valid_until', 'max_per_order', 'valid_days', 'custom_sale', 'require_holder_details', 'support_enabled', 'support_options'];

    protected function casts(): array
    {
        return ['valid_from' => 'date', 'valid_until' => 'date', 'custom_sale' => 'boolean', 'require_holder_details' => 'boolean', 'support_enabled' => 'boolean'];
    }

    public function event() { return $this->belongsTo(Event::class); }
}
