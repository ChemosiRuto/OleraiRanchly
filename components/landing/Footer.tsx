import * as Icons from 'lucide-react';

export default function Footer() {
  const links = {
    Product: ['Features', 'How it works', 'For farmers', 'For vets', 'For agro-chemists'],
    Resources: ['Blog', 'FAQ', 'Getting started', 'For providers'],
    Company: ['About us', 'Partners', 'Careers', 'Contact'],
    Legal: ['Privacy policy', 'Terms of service', 'Data protection', 'Cookie policy'],
  };

  // Safe accessor to avoid build-time errors
  const Icon = (name: string) => {
    const Component = (Icons as any)[name];
    return Component ? <Component className="w-5 h-5" /> : null;
  };

  return (
    <footer className="text-emerald-100 py-20" style={{ backgroundColor: '#004700' }}>
      <div className="container mx-auto px-4 grid md:grid-cols-5 gap-16">
        <div className="md:col-span-1">
          <h2 className="text-xl font-bold text-white mb-6">Olerai<span style={{ color: '#E49B0F' }}>Ranchly</span></h2>
          <p className="text-sm leading-relaxed text-emerald-100/80 mb-6">
            Digitizing livestock farming for rural farmers, vets and agro-chemists across Kenya — turning traditional practice into a data-driven agribusiness.
          </p>
          {/* Icons moved below the paragraph */}
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center hover:bg-[#E49B0F] hover:text-black transition-colors">{Icon('Twitter')}</a>
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center hover:bg-[#E49B0F] hover:text-black transition-colors">{Icon('Facebook')}</a>
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center hover:bg-[#E49B0F] hover:text-black transition-colors">{Icon('Linkedin')}</a>
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center hover:bg-[#E49B0F] hover:text-black transition-colors">{Icon('MessageCircle')}</a>
          </div>
        </div>
        {Object.entries(links).map(([title, items]) => (
          <div key={title}>
            <h4 className="font-semibold text-white mb-6">{title}</h4>
            <ul className="space-y-4 text-sm">
              {items.map(item => (
                <li key={item}><a href="#" className="hover:text-[#E49B0F] transition-colors text-emerald-100">{item}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container mx-auto px-4 mt-20 pt-8 border-t border-emerald-800 text-sm text-center text-emerald-300">
        &copy; 2026 OleraiRanchly Livestock. Made in Kenya 🇰🇪
      </div>
    </footer>
  );
}
