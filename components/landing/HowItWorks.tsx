export default function HowItWorks() {
  const steps = [
    { num: '1', title: 'Sign up free', desc: 'Register with your phone number and choose your role.' },
    { num: '2', title: 'Add your animals', desc: 'Record breed, health, yield and photos — build your digital herd.' },
    { num: '3', title: 'Grow & sell', desc: 'Reach vets, find buyers, source tools and connect to finance.' },
  ];

  return (
    <section id="how-it-works" className="py-24" style={{ backgroundColor: '#f4f4f5' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-6 text-zinc-950">From signup to your <span className="text-[#004700] italic">first sale,</span> in three steps</h2>
          <p className="text-zinc-600">Under two minutes to get started. No credit card, no technical know-how.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={i} className="text-center space-y-6">
              <div className="w-20 h-20 bg-[#004700] text-white rounded-2xl flex items-center justify-center text-4xl font-extrabold mx-auto mb-8 shadow-[0_0_20px_rgba(0,71,0,0.2)]">
                {step.num}
              </div>
              <h3 className="text-2xl font-bold text-zinc-950">{step.title}</h3>
              <p className="text-zinc-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
