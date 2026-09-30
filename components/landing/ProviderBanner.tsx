import { Button } from '@/components/ui/button';

export default function ProviderBanner() {
  return (
    <section className="py-20 bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-br from-[#E49B0F] to-[#E49B0F] rounded-3xl p-12 lg:p-20 text-black grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-extrabold mb-8 leading-tight">Are you a vet, agro-chemist, <span className="italic block">or livestock business?</span></h2>
            <p className="text-black/80 text-lg mb-10 leading-relaxed font-medium">Join Kenya's fastest-growing livestock network. List your service free, get discovered by farmers nearby, and grow — every provider is manually verified.</p>
            <Button className="bg-black text-white hover:bg-zinc-800 h-14 px-8 text-lg font-bold">List your service — free</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[ { num: '2,400+', lbl: 'Farmers registered' }, { num: '180+', lbl: 'Verified vets' }, { num: '12', lbl: 'Counties covered' } ].map((s, i) => (
              <div key={i} className="bg-black/10 p-6 rounded-2xl">
                <div className="text-2xl font-extrabold text-black mb-2">{s.num}</div>
                <div className="text-xs font-bold text-black/70 uppercase tracking-widest">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
