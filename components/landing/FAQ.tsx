'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';

const faqItems = [
  { q: 'Is OleraiRanchly really free to start?', a: 'Yes. The Free plan includes record-keeping for up to 20 animals, marketplace access, community Q&A, and service locator.' },
  { q: 'Do I need a smartphone to use it?', a: 'No. The app works on smartphones, but we support USSD and SMS on feature phones.' },
  { q: 'Is my money safe? Does OleraiRanchly hold funds?', a: 'We don\'t hold or manage any money. Payments go directly between farmers, buyers, vets and agro-chemists via M-Pesa.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24" style={{ backgroundColor: '#f4f4f5' }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-4xl font-bold text-center mb-16 text-zinc-950">Everything you need <span className="text-[#004700] italic">to know</span></h2>
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-6">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full justify-between items-center font-semibold text-left text-zinc-950"
              >
                {item.q}
                <Plus className={`w-5 h-5 transition-transform ${openIndex === i ? 'rotate-45' : ''} text-[#004700]`} />
              </button>
              {openIndex === i && <p className="mt-4 text-zinc-600 text-sm leading-relaxed">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
