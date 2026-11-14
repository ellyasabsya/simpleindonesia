import type { ReactNode } from 'react';

type Props = {
    id: string;
    title: string;
    description: string;
    href?: string;
    linkLabel?: string;
    children?: ReactNode;
};

export default function Section({ id, title, description, href, linkLabel, children }: Props) {
    return (
        <section id={id} className="relative scroll-mt-20 py-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <span className="mb-4 block h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-600 via-violet-500 to-pink-500" />
                        <h2 className="title-gradient text-4xl font-black uppercase tracking-tight md:text-6xl">
                            {title}
                        </h2>
                        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">{description}</p>
                    </div>
                    {href && (
                        <a
                            href={href}
                            className="font-bold text-indigo-700 transition hover:text-pink-500 dark:text-indigo-300 dark:hover:text-pink-300"
                        >
                            {linkLabel} →
                        </a>
                    )}
                </div>

                <div className="mt-12">{children}</div>
            </div>
        </section>
    );
}

export function Placeholder({ label }: { label: string }) {
    return (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center text-slate-500 backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
            {label}
        </div>
    );
}
