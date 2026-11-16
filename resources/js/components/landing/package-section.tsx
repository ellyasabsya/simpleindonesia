import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import PackageCardView, { cardCss, type PackageCard } from './package-card';
import Section from './section';

function useInView<T extends Element>() {
    const ref = useRef<T>(null);
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            setSeen(true);
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setSeen(true);
                    io.disconnect();
                }
            },
            { threshold: 0.1 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return [ref, seen] as const;
}

const FIRST = 3;

export default function PackageSection() {
    const { packages = [] } = usePage<{ packages?: PackageCard[] }>().props;
    const [gridRef, seen] = useInView<HTMLDivElement>();
    const extra = packages.length - FIRST;

    return (
        <Section
            id="paket"
            title="Pilih Paket, Buat Event Anda Bersinar"
            description="Pilih paket sesuai kebutuhan event Anda."
            href={extra > 0 ? '/paket' : undefined}
            linkLabel="Lihat Semua Paket"
        >
            <style>{cardCss}</style>

            {packages.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                    Paket belum tersedia.
                </p>
            ) : (
                <>

                    <div ref={gridRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {packages.slice(0, FIRST).map((p, i) => (
                            <PackageCardView key={p.id} p={p} index={i} show={seen} maxFeatures={4} />
                        ))}
                    </div>
                </>
            )}
        </Section>
    );
}
