<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<style>
    @page { margin: 0; }
    body { margin: 0; }
    .page { position: relative; width: 842pt; height: 595pt; overflow: hidden; background: #fff; }
    .bg { position: absolute; left: 0; top: 0; width: 842pt; height: 595pt; }
    .f { position: absolute; line-height: 1.2; }
</style>
</head>
<body>
<div class="page">
    @if ($bg)
        <img class="bg" src="{{ $bg }}" alt="">
    @endif

    @foreach ($fields as $f)
        <div class="f" style="left: {{ $f['left'] }}pt; top: {{ $f['top'] }}pt; width: {{ $f['width'] }}pt; text-align: {{ $f['align'] }}; font-size: {{ $f['size'] }}pt; color: {{ $f['color'] }}; font-weight: {{ $f['bold'] ? 'bold' : 'normal' }}; font-family: '{{ $f['font'] }}', sans-serif;">{!! nl2br(e($f['text'])) !!}</div>
    @endforeach
</div>
</body>
</html>
