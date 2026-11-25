<?php

namespace App\Support;

use Illuminate\Support\Facades\Mail;

class TicketMail
{
    public static function send(?string $to, string $subject, string $body): void
    {
        if (! $to || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        try {
            Mail::raw($body, fn ($m) => $m->to($to)->subject($subject));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
