/** Gaya lembar beli tiket di HP. Hanya aktif di dalam [data-mobile-beli]; desktop tidak tersentuh. */
export const BELI_CSS = `
body:has([data-mobile-beli]) .afab{display:none !important}
[data-mobile-beli] .px-6{padding-left:16px;padding-right:16px}
[data-mobile-beli] .grid{grid-template-columns:1fr !important}
[data-mobile-beli] .font-extrabold{font-weight:600}
[data-mobile-beli] h2{font-size:19px;line-height:1.25}
[data-mobile-beli] h3{font-size:15px}
[data-mobile-beli] .border-b.border-slate-100{padding-top:8px;padding-bottom:12px;border-color:rgba(15,23,42,.07)}
[data-mobile-beli] [aria-label="Tutup"]{background:rgba(15,23,42,.06);min-width:36px;min-height:36px}
.dark [data-mobile-beli] [aria-label="Tutup"]{background:rgba(255,255,255,.1)}
[data-mobile-beli] [class*="bg-sky-50"]{background:#fff;border-color:rgba(15,23,42,.07);border-radius:20px}
.dark [data-mobile-beli] [class*="bg-sky-50"]{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1)}
[data-mobile-beli] input:not([type=checkbox]){font-size:16px;min-height:48px;border-radius:16px;border-color:transparent;background:rgba(15,23,42,.045)}
.dark [data-mobile-beli] input:not([type=checkbox]){background:rgba(255,255,255,.07)}
[data-mobile-beli] input:not([type=checkbox]):focus{box-shadow:0 0 0 3px rgba(99,102,241,.25)}
[data-mobile-beli] input[type=checkbox]{width:20px;height:20px;accent-color:#4f46e5}
[data-mobile-beli] label.text-sm{font-size:13px;font-weight:500}
[data-mobile-beli] div.rounded-xl.border{border-radius:20px;background:#fff;border-color:rgba(15,23,42,.07)}
.dark [data-mobile-beli] div.rounded-xl.border{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1)}
[data-mobile-beli] .rounded-2xl.border-2{border-radius:24px}
[data-mobile-beli] button.px-2{min-width:44px;min-height:44px}
[data-mobile-beli] button.bg-gradient-to-r{background-image:none;background-color:#4f46e5;border-radius:9999px;min-height:48px;white-space:nowrap;font-weight:600}
[data-mobile-beli] .border-t.border-slate-100{flex-direction:column;align-items:stretch;gap:12px;padding-top:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));background:#fff;border-color:rgba(15,23,42,.07)}
.dark [data-mobile-beli] .border-t.border-slate-100{background:#10132b;border-color:rgba(255,255,255,.1)}
[data-mobile-beli] .border-t.border-slate-100 > div:last-child{width:100%}
[data-mobile-beli] .border-t.border-slate-100 > div:last-child button{flex:1;justify-content:center}
[data-mobile-beli] .border-t.border-slate-100 button.text-slate-700{display:none}
[data-mobile-beli] button.border-dashed{border-radius:20px;border-color:rgba(79,70,229,.35);background:rgba(79,70,229,.05);min-height:96px}
[data-mobile-beli] .border-emerald-300{border-radius:20px}
`;
