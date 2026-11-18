<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventEditLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EditLinkController extends Controller
{
    public function store(Request $request, Event $event): JsonResponse
    {
        abort_if($event->parent_id !== null, 404);

        $days = (int) $request->validate(['days' => ['required', 'integer', 'in:1,3,7,14,30']])['days'];
        $token = Str::random(48);

        DB::transaction(function () use ($event, $request, $days, $token) {
            // Link aktif sebelumnya dicabut supaya hanya ada satu link yang hidup per event.
            EventEditLink::where('event_id', $event->id)
                ->whereNull('revoked_at')->whereNull('edited_at')->where('expires_at', '>', now())
                ->update(['revoked_at' => now()]);

            EventEditLink::create([
                'event_id' => $event->id,
                'token_hash' => hash('sha256', $token),
                'expires_at' => now()->addDays($days),
                'created_by' => $request->user()->id,
            ]);
        });

        return response()->json([
            'url' => url('/edit-event/'.$token),
            'links' => EventEditLink::listFor($event->id),
        ]);
    }

    public function revoke(Event $event, EventEditLink $link): JsonResponse
    {
        abort_if($link->event_id !== $event->id, 404);

        if ($link->status() === 'aktif') {
            $link->forceFill(['revoked_at' => now()])->save();
        }

        return response()->json(['links' => EventEditLink::listFor($event->id)]);
    }
}
