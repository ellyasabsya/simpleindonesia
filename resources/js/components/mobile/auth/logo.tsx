const CSS = `
@keyframes logo-sheen{0%,50%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}
@keyframes logo-halo{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
.auth-logo-sheen{position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.95) 50%,transparent 65%);transform:translateX(-140%) skewX(-18deg);animation:logo-sheen 3.6s ease-in-out .8s infinite}
.auth-logo-halo{animation:logo-halo 3.2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.auth-logo-sheen,.auth-logo-halo{animation:none!important}}
`;

/** Logo SIMPLE di login/register HP: bingkai putih, cahaya indigo, kilau melintas. */
export default function AuthLogo({ size = 'size-16' }: { size?: string }) {
    return (
        <span className={'relative inline-flex ' + size}>
            <style>{CSS}</style>
            <span aria-hidden className="auth-logo-halo absolute -inset-2 rounded-[1.6rem] bg-indigo-400/50 blur-xl" />
            <span className="relative flex size-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white to-indigo-50 shadow-[0_12px_30px_-8px_rgba(79,70,229,0.7),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-white/80">
                <img src="/logo-s-sm.png" alt="SIMPLE" className="size-full object-contain p-2" />
                <span aria-hidden className="auth-logo-sheen" />
            </span>
        </span>
    );
}
