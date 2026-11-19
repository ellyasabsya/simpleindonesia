<?php

return [
    // Dana tiket/vote baru bisa ditarik N hari setelah event (termasuk sub-event) selesai.
    'hold_days' => (int) env('REVENUE_HOLD_DAYS', 3),
];
