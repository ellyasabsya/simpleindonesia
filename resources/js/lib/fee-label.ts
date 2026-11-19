const rp = (n: number) => 'Rp' + new Intl.NumberFormat('id-ID').format(n);

export function feeRange(min: number, max: number): string {
    if (max <= 0) return 'Gratis';
    if (min === max) return rp(min);
    return `${min <= 0 ? 'Gratis' : rp(min)} – ${rp(max)}`;
}
