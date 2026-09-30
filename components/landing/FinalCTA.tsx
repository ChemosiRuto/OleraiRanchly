import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Updated green to #004700 */}
        <div className="bg-[#004700] rounded-3xl p-16 text-center text-white shadow-2xl relative overflow-hidden">
          {/* subtle gold rim */}
          <div className="absolute inset-0 border-2 border-[#E49B0F]/20 rounded-3xl" />

          <h2 className="text-5xl font-extrabold mb-8 tracking-tight">Your Livestock Empire <span className="text-[#E49B0F] italic">Starts Today.</span></h2>
          <p className="text-emerald-100 text-lg mb-12 max-w-xl mx-auto leading-relaxed">Join 2,400+ farmers, vets and agro-chemists already growing with OleraiRanchly. No risk. No card. Just results.</p>
          <Button size="lg" className="bg-[#E49B0F] hover:bg-[#E49B0F]0 text-black font-bold gap-3 h-16 px-12 text-xl hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 fill-black" /> Start free today
          </Button>
        </div>
      </div>
    </section>
  );
}
