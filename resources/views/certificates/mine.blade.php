<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sertifikat Saya</title>
    <style>
        body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px}
        main{max-width:640px;margin:0 auto}
        li{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px 18px;margin:10px 0;list-style:none}
        small{color:#64748b}
    </style>
</head>
<body>
<main>
    <h1>Sertifikat Saya</h1>
    @forelse ($items as $i)
        <li><b>{{ $i['label'] }}</b><br>{{ $i['name'] }} · <small>{{ $i['event'] }}</small></li>
    @empty
        <p><small>Belum ada sertifikat.</small></p>
    @endforelse
    <p><small>Unduh sertifikat tersedia setelah Tahap 5 dan 7.</small></p>
</main>
</body>
</html>
