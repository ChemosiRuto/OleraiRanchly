import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Image Container with Ken Burns effect */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images.jpg"
          alt="Dairy Cows in a green pasture"
          fill
          priority
          quality={100}
          className="object-cover animate-slow-zoom"
        />
        {/* Overlay: Reverted to emerald tint for natural color synthesis */}
        <div className="absolute inset-0 bg-emerald-800/70 mix-blend-multiply" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-emerald-900/50 backdrop-blur px-4 py-1.5 rounded-full mb-8 border border-emerald-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-sm font-semibold text-emerald-100 uppercase tracking-wider text-xs">Kenya's #1 Livestock Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 max-w-4xl mx-auto tracking-tighter leading-tight drop-shadow-lg">
           Turn raw rural livestock and land into <span className="text-[#E49B0F] italic">profit</span> and be your <span className="text-[#E49B0F] italic">own boss</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-100 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Stop losing middlemen costs. Track your herd, connect with verified vets in minutes,
          sell at real market prices, and take control of your agribusiness —
          all from the phone in your pocket.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-[#E49B0F] hover:bg-[#E49B0F]0 text-black gap-2 h-16 px-10 text-lg font-bold w-full sm:w-auto shadow-2xl hover:shadow-xl transition-all rounded-full">
            <Zap className="w-5 h-5 fill-black text-black" /> Start Free — Takes 30 Seconds
          </Button>
        </div>
      </div>
    </section>
  );
}
