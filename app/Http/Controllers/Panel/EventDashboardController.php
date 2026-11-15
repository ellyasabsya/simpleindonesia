<?php

namespace App\Http\Controllers\Panel;

use App\Models\Event;
use Inertia\Response;

class EventDashboardController extends EventScopedController
{
    public function show(Event $event): Response
    {
        return $this->render('panel/events/show', $event);
    }

    /** Halaman menu yang belum dibuat; diganti satu per satu. */
    public function menu(Event $event, string $menu): Response
    {
        $label = config('features.menus')[$menu] ?? null;
        abort_if($label === null, 404);

        return $this->render('panel/events/menu', $event, [
            'menu' => ['key' => $menu, 'label' => $label],
        ]);
    }
}
