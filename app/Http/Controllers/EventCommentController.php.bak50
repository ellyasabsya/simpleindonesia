<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EventCommentController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        abort_unless($event->status === Event::PUBLISHED, 404);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ], [
            'body.required' => 'Komentar tidak boleh kosong.',
            'body.max' => 'Komentar maksimal 1000 karakter.',
        ]);

        $event->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        return back();
    }

    public function destroy(Request $request, EventComment $comment): RedirectResponse
    {
        abort_unless($comment->user_id === $request->user()->id, 403);
        $comment->delete();

        return back();
    }

    public function report(Request $request, EventComment $comment): RedirectResponse
    {
        // Komentar sendiri tidak perlu dilaporkan; laporan pertama yang dicatat.
        abort_if($comment->user_id === $request->user()->id, 403);

        if ($comment->reported_at === null) {
            $comment->update(['reported_at' => now()]);
        }

        return back();
    }
}
