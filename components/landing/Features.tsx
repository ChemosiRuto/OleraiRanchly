import { Clipboard, Stethoscope, ShoppingCart, Wrench, Leaf, Link2, BarChart3, Users } from 'lucide-react';

const features = [
  { icon: Clipboard, title: 'Smart record keeping', desc: 'Track milk, health, photos, breed and weight — full history per animal.' },
  { icon: Stethoscope, title: 'On-demand vet access', desc: 'Video, voice or chat consultations with verified vets.' },
  { icon: ShoppingCart, title: 'A transparent marketplace', desc: 'Reach buyers. List livestock and products at fair prices.' },
  { icon: Wrench, title: 'Tools & equipment', desc: 'Source precision farming tools — weighing scales, machines, tags.' },
  { icon: Leaf, title: 'Feed & supplements', desc: 'Locate trusted suppliers near your farm, compare prices.' },
  { icon: Link2, title: 'Finance linkage', desc: 'Connect directly to SACCOs and insurers — no hidden fees.' },
  { icon: BarChart3, title: 'Analytics & reports', desc: 'Track profit, herd growth and productivity, export reports.' },
  { icon: Users, title: 'Community & learning', desc: 'Ask questions and learn from verified vets and fellow farmers.' },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-zinc-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-zinc-950">Tools built for how <span className="text-[#E49B0F] italic">this sector</span> works</h2>
          <p className="text-lg text-zinc-600">Designed around the real path from farm to market to vet — not a generic app template.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="relative p-8 rounded-3xl bg-white border border-zinc-100 transition-all duration-500 group hover:shadow-[0_8px_30px_rgb(228,155,15,0.12)] hover:border-[#E49B0F]/30 hover:-translate-y-1 flex flex-col items-center text-center overflow-hidden"
            >
              {/* Subtle hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#E49B0F]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Centered Icon without background */}
              <div className="text-[#E49B0F] mb-6 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500 relative z-10">
                <f.icon className="w-10 h-10 stroke-[1.5]" />
              </div>

              <h3 className="text-lg font-bold mb-3 text-zinc-950 group-hover:text-[#E49B0F] transition-colors relative z-10">
                {f.title}
              </h3>

              <p className="text-zinc-500 leading-relaxed text-sm relative z-10">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
