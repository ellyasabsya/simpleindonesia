<?php

namespace App\Http\Middleware;

use App\Models\Event;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Event harus milik lembaga pengguna. Menu selain dashboard hanya terbuka
 * bila ada di snapshot paket event dan event sudah tayang.
 */
class EnsureEventMenuAccess
{
    public function handle(Request $request, Closure $next, ?string $menu = null): Response
    {
        $event = $request->route('event');
        if (! $event instanceof Event) {
            $event = Event::findOrFail($event);
        }

        $institution = $request->attributes->get('institution');
        abort_unless($institution && $event->institution_id === $institution->id, 404);

        $menu ??= $request->route('menu');

        if ($menu && $menu !== 'dashboard') {
            abort_unless(in_array($menu, $event->menus(), true), 403, 'Fitur ini tidak termasuk dalam paket event Anda.');

            if ($event->status !== Event::PUBLISHED) {
                return redirect()->route('panel.event.show', $event);
            }
        }

        return $next($request);
    }
}
