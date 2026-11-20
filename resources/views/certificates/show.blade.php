<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sertifikat {{ $label }}</title>
<style>
body{font-family:system-ui,sans-serif;background:#f1f5f9;margin:0;padding:24px;color:#1e293b}
.card{max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-size:20px;margin:0 0 4px}dl{margin:20px 0;display:grid;grid-template-columns:140px 1fr;gap:8px 12px;font-size:14px}
dt{color:#64748b}dd{margin:0;word-break:break-word}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600}
.ok{background:#d1fae5;color:#047857}.no{background:#fee2e2;color:#b91c1c}
.btn{display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:12px;text-decoration:none;font-size:14px}
a.back{display:block;max-width:560px;margin:0 auto 12px;color:#4f46e5;font-size:14px;text-decoration:none}
</style>
</head>
<body>
<a class="back" href="{{ route('sertifikat.saya') }}">← Sertifikat Saya</a>
<div class="card">
    <h1>Sertifikat {{ $label }}</h1>
    <span class="badge {{ $valid ? 'ok' : 'no' }}">{{ $valid ? 'Berlaku' : 'Tidak berlaku' }}</span>
    <dl>
        <dt>Nama</dt><dd>{{ $c->recipient_name }}</dd>
        <dt>Event</dt><dd>{{ $c->event_title }}</dd>
        <dt>Tanggal event</dt><dd>{{ $c->event_date_text }}</dd>
        <dt>Penyelenggara</dt><dd>{{ $c->organizer_name }}</dd>
        <dt>Nomor</dt><dd>{{ $c->certificate_number }}</dd>
        <dt>Diterbitkan</dt><dd>{{ $c->issued_at?->timezone('Asia/Jakarta')->translatedFormat('j F Y H:i') }} WIB</dd>
    </dl>
    @if ($downloadUrl)
        <a class="btn" href="{{ $downloadUrl }}">Unduh PDF</a>
    @else
        <p style="font-size:14px;color:#b91c1c">Sertifikat ini sudah dicabut{{ $c->revoked_reason ? ': '.$c->revoked_reason : '' }}.</p>
    @endif
</div>
</body>
</html>
