<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PaketController extends Controller
{
    public function __invoke(HomeController $home): Response
    {
        return Inertia::render('paket', ['packages' => $home->cards()]);
    }
}
