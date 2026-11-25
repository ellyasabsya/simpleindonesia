import type { ReactNode } from 'react';

// Ikon bilah bawah gaya "premium": garis tipis berujung bulat + isian lembut
// seperti kaca di dalam bentuknya. Saat menu aktif, isiannya menebal.
// Semua memakai currentColor, jadi warnanya mengikuti tema (terang/gelap).

type IconProps = {
    className?: string;
    strokeWidth?: number;
    /** menu sedang aktif: isian lembut dibuat lebih pekat */
    active?: boolean;
};

function Svg({
    className,
    strokeWidth = 1.6,
    children,
}: IconProps & { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

const tint = (active?: boolean) => (active ? 0.24 : 0.09);

export function CalendarIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <rect x="3.5" y="5" width="17" height="15.5" rx="4" fill="currentColor" fillOpacity={tint(p.active)} />
            <path d="M3.5 10h17" />
            <path d="M8 3.5v3M16 3.5v3" />
            <circle cx="8.5" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="12" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
        </Svg>
    );
}

export function TicketIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <path
                d="M3.5 9V7.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2V9a2.5 2.5 0 0 0 0 5v2.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V14a2.5 2.5 0 0 0 0-5Z"
                fill="currentColor"
                fillOpacity={tint(p.active)}
            />
            <path d="M14.5 7.5v1.4M14.5 11.3v1.4M14.5 15.1v1.4" />
        </Svg>
    );
}

export function VoteIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <path d="M8 13.5V5.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 5.5v8" />
            <path d="m10.3 8.3 1.4 1.4 2.4-2.9" />
            <path
                d="M4 13.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"
                fill="currentColor"
                fillOpacity={tint(p.active)}
            />
        </Svg>
    );
}

export function PersonIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <circle cx="12" cy="8.2" r="3.7" fill="currentColor" fillOpacity={tint(p.active)} />
            <path
                d="M4.8 20.2c.5-3.6 3.5-5.7 7.2-5.7s6.7 2.1 7.2 5.7Z"
                fill="currentColor"
                fillOpacity={tint(p.active)}
            />
        </Svg>
    );
}

export function AwardIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <path d="M8.6 14.2 7 20.5l5-2.4 5 2.4-1.6-6.3" />
            <circle cx="12" cy="9.5" r="5.5" fill="currentColor" fillOpacity={tint(p.active)} />
            <path d="m12 7 .9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 9.1l2-.3Z" strokeWidth="1" />
        </Svg>
    );
}

export function BuildingIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <path
                d="M5 20.5V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5v15"
                fill="currentColor"
                fillOpacity={tint(p.active)}
            />
            <path d="M15 10h3.5a1.5 1.5 0 0 1 1.5 1.5v9" />
            <path d="M3 20.5h18" />
            <path d="M8.5 8h3M8.5 11.5h3M8.5 15h3" />
        </Svg>
    );
}

export function WalletIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <path d="M5.5 7.5 16 4.8a1.5 1.5 0 0 1 1.9 1.45V7.5" />
            <rect x="3.5" y="7.5" width="17" height="12" rx="3" fill="currentColor" fillOpacity={tint(p.active)} />
            <path d="M20.5 12.5h-4a2 2 0 0 0 0 4h4" />
            <circle cx="16.7" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
        </Svg>
    );
}

export function MenuIcon(p: IconProps) {
    return (
        <Svg {...p}>
            <path d="M4.5 7h15M4.5 12h15M4.5 17h9" />
        </Svg>
    );
}
