/** Gaya isi halaman juri di HP. Aktif hanya bila penanda [data-mobile-juri] ada (dirender saat phone). */
const L = 'body:has([data-mobile-juri]) ';
const D = '.dark ' + L;

const rules: [string, string][] = [
    ['.font-extrabold', 'font-weight:600'],
    ['h1.text-3xl', 'font-size:24px;line-height:1.25'],
    ['.text-6xl', 'font-size:44px'],
    ['[class*="from-slate-950"]', 'background-image:linear-gradient(135deg,#4338ca,#6366f1)'],
    ['[class*="rounded-[2rem]"]', 'border-radius:28px;box-shadow:none'],
    ['section[class*="sm:p-7"]', 'display:none'],
    ['[class*="backdrop-blur"]', '-webkit-backdrop-filter:none;backdrop-filter:none'],
    ['[class*="bg-white/85"]', 'background:#fff;box-shadow:none'],
    ['.fixed.bottom-0', 'padding-bottom:calc(10px + env(safe-area-inset-bottom))'],
    ['.h-12[class~="lg:hidden"]', 'height:calc(76px + env(safe-area-inset-bottom))'],
    ['input', 'font-size:16px'],
];
const dark: [string, string][] = [
    ['[class*="bg-white/85"]', 'background:rgba(255,255,255,.04)'],
];

export const JURI_CSS = rules.map(([s, d]) => L + s + '{' + d + '}').join('\n') + '\n' + dark.map(([s, d]) => D + s + '{' + d + '}').join('\n');


/** Gaya form nilai per peserta di HP. Aktif hanya bila penanda [data-juri-form] ada. */
const F = 'body:has([data-juri-form]) ';
const form: [string, string][] = [
    ['.grid-cols-3>button', 'min-height:52px;font-size:18px;border-radius:12px'],
    ['[class*="w-[4.25rem]"]', 'width:68px;font-size:11px'],
    ['a[class*="bg-white/80"]', 'min-height:44px;display:inline-flex;align-items:center;font-size:13px'],
    ['.fixed.bottom-0 button', 'min-height:46px;font-size:14px;padding-left:20px;padding-right:20px'],
    ['.fixed.inset-0', 'padding:0'],
    ['.fixed.inset-0>div', 'max-width:none;max-height:92vh;overflow-y:auto;border-radius:24px 24px 0 0;padding-bottom:env(safe-area-inset-bottom)'],
    ['.fixed.inset-0 input', 'min-height:52px'],
    ['.fixed.inset-0 button', 'min-height:46px;font-size:14px'],
];
export const JURI_FORM_CSS = '\n' + form.map(([s, d]) => F + s + '{' + d + '}').join('\n');
