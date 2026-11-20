import { Head } from '@inertiajs/react';
import HomeMobile from '@/components/mobile/pages/home-mobile';
import { usePhone } from '@/components/mobile/use-phone';
import EventSection from '@/components/landing/event-section';
import Footer from '@/components/landing/footer';
import Hero from '@/components/landing/hero';
import Navbar from '@/components/landing/navbar';
import NewsSection from '@/components/landing/news-section';
import PackageSection from '@/components/landing/package-section';
import TicketSection from '@/components/landing/ticket-section';
import VotingSection from '@/components/landing/voting-section';
import PageBackground from '@/components/page-background';

export default function Welcome() {
    const phone = usePhone();
    if (phone) return <HomeMobile />;

    return (
        <>
            <Head title="SIMPLE - Kelola Event Lebih Cerdas" />
            <div className="relative min-h-screen text-slate-900 transition-colors dark:text-white">
                <PageBackground />
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
