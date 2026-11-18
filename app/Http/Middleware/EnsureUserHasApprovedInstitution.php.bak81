<?php

namespace App\Http\Middleware;

use App\Models\Institution;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasApprovedInstitution
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect('/admin');
        }

        $institution = Institution::where('user_id', $user->id)
            ->where('status', Institution::APPROVED)
            ->latest()
            ->first();

        if (! $institution) {
            return redirect()->route('lembaga.daftar');
        }

        $request->attributes->set('institution', $institution);

        return $next($request);
    }
}
