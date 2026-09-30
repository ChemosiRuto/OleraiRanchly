import { Beef, Stethoscope, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Roles() {
  return (
    <section id="roles" className="py-24 bg-white text-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          {/* Updated green to #004700 */}
          <div className="inline-block px-4 py-1.5 bg-[#004700]/10 rounded-full text-[#004700] text-sm font-semibold mb-6">Built for everyone</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">One platform, <span className="text-[#004700] italic">every role</span> covered</h2>
          <p className="text-zinc-600 text-lg">Choose a role at signup and add more later — one account, several capabilities.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Farmer card */}
          <div className="p-10 rounded-xl bg-[#004700] text-white border border-[#E49B0F] hover:shadow-[0_0_30px_rgba(228,155,15,0.4)] transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E49B0F]/0 via-[#E49B0F]/0 to-[#E49B0F]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <Beef className="w-16 h-16 text-[#E49B0F] mb-8 relative z-10" />
            <h3 className="text-3xl font-bold mb-6 relative z-10">For farmers</h3>
            <p className="text-emerald-100 text-lg mb-10 leading-relaxed relative z-10">Manage your herd, track records per animal, find vets and buyers, source tools and equipment, and grow your livestock business with data you can trust.</p>
            <Button className="bg-[#E49B0F] text-black font-bold h-auto py-3 px-8 w-max rounded-lg hover:bg-[#E49B0F]/90 hover:shadow-[0_0_15px_rgba(228,155,15,0.5)] transition-all relative z-10 mx-auto block">Get started free</Button>
          </div>

          <div className="space-y-6">
            {/* Vet card */}
            <div className="p-10 rounded-xl bg-[#004700] text-white border border-[#E49B0F] hover:shadow-[0_0_30px_rgba(228,155,15,0.3)] hover:border-[#E49B0F]/80 transition-all duration-300 max-w-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E49B0F]/0 via-[#E49B0F]/0 to-[#E49B0F]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-start gap-6 relative z-10">
                <Stethoscope className="w-12 h-12 text-[#E49B0F] shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">For veterinarians</h3>
                  <p className="text-emerald-100 mb-0">List your practice, take bookings from farmers nearby, and grow your client base digitally.</p>
                </div>
              </div>
            </div>
            {/* Agro-chemist card */}
            <div className="p-10 rounded-xl bg-[#004700] text-white border border-[#E49B0F] hover:shadow-[0_0_30px_rgba(228,155,15,0.3)] hover:border-[#E49B0F]/80 transition-all duration-300 max-w-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E49B0F]/0 via-[#E49B0F]/0 to-[#E49B0F]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-start gap-6 relative z-10">
                <ShoppingCart className="w-12 h-12 text-[#E49B0F] shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">For agro-chemists</h3>
                  <p className="text-emerald-100 mb-0">Showcase feed, supplements, drugs and tools. Connect with farmers seeking supplies in your area, free.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
