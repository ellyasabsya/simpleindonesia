import { Head } from '@inertiajs/react';
import Hero from '@/components/landing/hero';
import Navbar from '@/components/landing/navbar';

export default function Welcome() {
    return (
        <>
            <Head title="SIMPLE - Kelola Event Lebih Cerdas" />
            <div className="min-h-screen scroll-smooth bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
                <Navbar />
                <main>
                    <Hero />
                </main>
            </div>
        </>
    );
}
