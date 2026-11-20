<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sertifikat Saya - SIMPLE</title>
<style>
:root{--bg:#f1f5f9;--card:#fff;--text:#0f172a;--muted:#64748b;--line:#e2e8f0;--accent:#4f46e5;--ok-bg:#d1fae5;--ok:#047857;--bad-bg:#fee2e2;--bad:#b91c1c}
@media (prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#151a2e;--text:#e2e8f0;--muted:#94a3b8;--line:#263050;--accent:#818cf8;--ok-bg:#064e3b;--ok:#6ee7b7;--bad-bg:#7f1d1d;--bad:#fca5a5}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5}
.wrap{max-width:860px;margin:0 auto;padding:24px 16px 56px}
a{color:var(--accent);text-decoration:none}
h1{font-size:1.6rem;margin:8px 0 4px}
.sub{color:var(--muted);margin:0 0 20px;font-size:.95rem}
form.f{display:grid;grid-template-columns:1fr 130px 190px auto;gap:8px;margin-bottom:18px}
input,select{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--text);font-size:.95rem}
.btn{padding:10px 18px;border:0;border-radius:12px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer;font-size:.95rem}
.card{display:flex;gap:14px;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;margin-bottom:10px}
.card .t{font-weight:700}
.meta{color:var(--muted);font-size:.85rem;margin-top:2px}
.badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:700;background:var(--ok-bg);color:var(--ok);white-space:nowrap}
.badge.bad{background:var(--bad-bg);color:var(--bad)}
.empty{text-align:center;background:var(--card);border:1px dashed var(--line);border-radius:18px;padding:40px 16px;color:var(--muted)}
.pager{display:flex;justify-content:space-between;align-items:center;margin-top:18px;color:var(--muted);font-size:.9rem}
.pager .off{opacity:.35}
@media (max-width:640px){form.f{grid-template-columns:1fr 1fr}form.f input[name=cari]{grid-column:1/-1}.card{flex-direction:column;align-items:flex-start}}
</style>
</head>
<body>
<div class="wrap">
    <a href="/dashboard">&larr; Dashboard</a>
    <h1>Sertifikat Saya</h1>
    <p class="sub">{{ $owned }} sertifikat atas akun Anda.</p>

    @if ($owned > 0)
    <form class="f" method="get" action="{{ url('/sertifikat-saya') }}">
        <input type="search" name="cari" value="{{ $f['cari'] }}" placeholder="Cari event, nomor, atau nama" maxlength="100">
        <select name="tahun" aria-label="Tahun">
            <option value="">Semua tahun</option>
            @foreach ($years as $y)
                <option value="{{ $y }}" @selected($f['tahun'] === $y)>{{ $y }}</option>
            @endforeach
        </select>
        <select name="jenis" aria-label="Jenis sertifikat">
            <option value="">Semua jenis</option>
            @foreach ($types as $key => $label)
                <option value="{{ $key }}" @selected($f['jenis'] === $key)>{{ $label }}</option>
            @endforeach
        </select>
        <button class="btn" type="submit">Cari</button>
    </form>
    @if ($filtered)
        <p class="sub">{{ $total }} hasil. <a href="{{ url('/sertifikat-saya') }}">Hapus filter</a></p>
    @endif
    @endif

    @forelse ($items as $it)
        <div class="card">
            <div>
                <div class="t">{{ $it['event'] }}</div>
                <div class="meta">{{ $it['label'] }} &middot; {{ $it['number'] }}@if ($it['date']) &middot; {{ $it['date'] }}@endif</div>
            </div>
            <div style="display:flex;gap:12px;align-items:center">
                <span class="badge {{ $it['valid'] ? '' : 'bad' }}">{{ $it['valid'] ? 'Berlaku' : 'Tidak berlaku' }}</span>
                <a href="{{ $it['url'] }}">Lihat</a>
            </div>
        </div>
    @empty
        <div class="empty">
            @if ($owned === 0)
                Belum ada sertifikat. Sertifikat dari event yang Anda ikuti akan muncul di sini.
            @else
                Tidak ada sertifikat yang cocok dengan pencarian atau filter Anda.
            @endif
        </div>
    @endforelse

    @if ($pages > 1)
        <div class="pager">
            @if ($prevUrl)<a href="{{ $prevUrl }}">&larr; Sebelumnya</a>@else<span class="off">&larr; Sebelumnya</span>@endif
            <span>Halaman {{ $page }} dari {{ $pages }}</span>
            @if ($nextUrl)<a href="{{ $nextUrl }}">Berikutnya &rarr;</a>@else<span class="off">Berikutnya &rarr;</span>@endif
        </div>
    @endif
</div>
</body>
</html>
