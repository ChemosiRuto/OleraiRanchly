import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import StatsBand from '@/components/landing/StatsBand';
import Roles from '@/components/landing/Roles';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import ProviderBanner from '@/components/landing/ProviderBanner';
import Blog from '@/components/landing/Blog';
import FAQ from '@/components/landing/FAQ';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-yellow-400 selection:text-black">
      <Navbar />
      <Hero />
      <Features />
      <StatsBand />
      <Roles />
      <HowItWorks />
      <Testimonials />
      <ProviderBanner />
      <Blog />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
