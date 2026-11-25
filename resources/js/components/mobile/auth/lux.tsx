/** Efek mengilap login/register HP: kilau bergerak, cahaya lembut, muncul halus. Mati otomatis bila "kurangi gerakan". */
const CSS = `
@keyframes auth-sheen{0%,55%{transform:translateX(-130%)}100%{transform:translateX(230%)}}
@keyframes auth-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes auth-glow{0%,100%{opacity:.75}50%{opacity:1}}
[data-mobile-auth]{position:relative;overflow:hidden;isolation:isolate}
[data-mobile-auth] main,[data-mobile-auth] header{animation:auth-rise .55s cubic-bezier(.2,.8,.2,1) both}
[data-mobile-auth] main{animation-delay:.08s}
[data-mobile-auth] button[type=submit]{position:relative;overflow:hidden;box-shadow:0 12px 28px -8px rgba(79,70,229,.65),inset 0 1px 0 rgba(255,255,255,.4)}
[data-mobile-auth] button[type=submit]::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-130%);animation:auth-sheen 3.8s ease-in-out 1s infinite}
[data-mobile-auth=android]::before{content:"";position:absolute;left:0;right:0;top:0;height:430px;z-index:-1;pointer-events:none;background:radial-gradient(circle at 88% 8%,rgba(255,255,255,.34),transparent 45%),radial-gradient(circle at 8% 65%,rgba(196,181,253,.38),transparent 50%);animation:auth-glow 5s ease-in-out infinite}
[data-mobile-auth=android]::after{content:"";position:absolute;top:0;left:0;width:45%;height:430px;z-index:-1;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.2),transparent);transform:translateX(-130%);animation:auth-sheen 6s ease-in-out 1.5s infinite}
[data-mobile-auth=android] main{border-top:1px solid rgba(255,255,255,.7);box-shadow:0 -14px 34px -14px rgba(30,27,75,.45)}
[data-mobile-auth] form label>span:first-child{font-size:13px;font-weight:600;margin-bottom:6px}
[data-mobile-auth] form label.flex{font-size:13px}
[data-mobile-auth] main>p{font-size:13px}
[data-mobile-auth] main>p a{font-weight:600}
/* auth-unified */
[data-mobile-auth=unified] button[type=submit]{box-shadow:0 10px 24px -10px rgba(79,70,229,.55)}
[data-mobile-auth=unified] form label>span.flex:not(.border-rose-400){border-color:transparent;border-radius:14px;background:rgba(15,23,42,.045)}
.dark [data-mobile-auth=unified] form label>span.flex:not(.border-rose-400){background:rgba(255,255,255,.07)}
[data-mobile-auth=unified] form label>span.flex:focus-within{background:#fff;border-color:rgba(99,102,241,.6)}
.dark [data-mobile-auth=unified] form label>span.flex:focus-within{background:rgba(255,255,255,.1)}
[data-mobile-auth=unified] form input:not([type=checkbox]){font-size:16px}
/* auth-hero */
[data-mobile-auth=unified] header{animation:none}
[data-mobile-auth=unified] form label>span.flex input{height:52px}
[data-mobile-auth=unified] form label>span.flex{box-shadow:none}
[data-mobile-auth=unified] form label>span.flex:focus-within{box-shadow:0 0 0 4px rgba(99,102,241,.18)}
.dark [data-mobile-auth=unified] form label>span:first-child{color:#e2e8f0}
@media (prefers-reduced-motion:reduce){[data-mobile-auth] *,[data-mobile-auth]::before,[data-mobile-auth]::after,[data-mobile-auth] button[type=submit]::after{animation:none!important}}
`;

export function AuthLux() {
    return <style>{CSS}</style>;
}
