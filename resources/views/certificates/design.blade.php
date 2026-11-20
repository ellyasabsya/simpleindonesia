<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 0; }
    html, body { margin: 0; padding: 0; }
</style>
</head>
<body>
<div style="position:absolute;left:0;top:0;width:{{ $W }}pt;height:{{ $H }}pt;overflow:hidden;">
    @if ($bg)
        <img src="{{ $bg }}" style="position:absolute;left:0;top:0;width:{{ $W }}pt;height:{{ $H }}pt;">
    @endif
    @foreach ($items as $i)
        @if ($i['kind'] === 'img')
            <img src="{{ $i['src'] }}" style="{!! $i['style'] !!}">
        @else
            <div style="{!! $i['style'] !!}">{!! $i['html'] !!}</div>
        @endif
    @endforeach
</div>
</body>
</html>
