import { Head } from '@inertiajs/react';
import EventSection from '@/components/landing/event-section';
import Footer from '@/components/landing/footer';
import Hero from '@/components/landing/hero';
import Navbar from '@/components/landing/navbar';
import NewsSection from '@/components/landing/news-section';
import PackageSection from '@/components/landing/package-section';
import TicketSection from '@/components/landing/ticket-section';
import VotingSection from '@/components/landing/voting-section';

export default function Welcome() {
    return (
        <>
            <Head title="SIMPLE - Kelola Event Lebih Cerdas" />
            <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
                {/* Background tunggal untuk seluruh halaman */}
                <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-blue-100 via-slate-50 to-purple-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900">
                    <div className="bg-grid absolute inset-0" />
                </div>

                <Navbar />
                <div className="relative z-10">
                    <main>
                        <Hero />
                        <EventSection />
                        <TicketSection />
                        <VotingSection />
                        <PackageSection />
                        <NewsSection />
                    </main>
                    <Footer />
                </div>
            </div>
        </>
    );
}
