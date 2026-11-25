<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#4f46e5">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="SIMPLE">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">

        <style id="prelayar">
            html { background: linear-gradient(160deg, #dbeafe 0%, #ede9fe 55%, #fce7f3 100%) fixed; }
            html.dark { background: #1e1b4b; }
            @media (prefers-color-scheme: dark) { html:not(.light) { background: #1e1b4b; } }
            body { background: transparent; }
        </style>

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
        <script src="/admin-chat-fab.js" data-wa="{{ \App\Models\Setting::adminWhatsapp() }}" defer></script>
</body>
</html>
