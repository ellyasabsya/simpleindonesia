<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Models\NewsComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NewsCommentController extends Controller
{
    public function store(Request $request, News $news): RedirectResponse
    {
        abort_unless($news->status === News::PUBLISHED, 404);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ], [
            'body.required' => 'Komentar tidak boleh kosong.',
            'body.max' => 'Komentar maksimal 1000 karakter.',
        ]);

        $news->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        return back();
    }

    public function destroy(Request $request, NewsComment $comment): RedirectResponse
    {
        abort_unless($comment->user_id === $request->user()->id, 403);
        $comment->delete();

        return back();
    }

    public function report(Request $request, NewsComment $comment): RedirectResponse
    {
        abort_if($comment->user_id === $request->user()->id, 403);

        if ($comment->reported_at === null) {
            $comment->forceFill(['reported_at' => now()])->save();
            \App\Support\AdminNotifier::send('Komentar dilaporkan', 'Ada komentar berita yang dilaporkan dan perlu dimoderasi.', '/admin/komentar');
        }

        return back();
    }
}
