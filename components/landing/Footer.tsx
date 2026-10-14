import Image from 'next/image';
import Link from 'next/link';
import { FaFacebookF, FaLinkedinIn, FaTiktok, FaXTwitter } from 'react-icons/fa6';
import logo from '../../images/logoF.png';

export default function Footer() {
  const links = {
    Product: ['Features', 'How it works', 'For farmers', 'For vets', 'For agro-chemists'],
    Resources: ['Blog', 'FAQ', 'Getting started', 'For providers'],
    Company: ['About us', 'Partners', 'Careers', 'Contact'],
    Legal: ['Privacy policy', 'Terms of service', 'Data protection', 'Cookie policy'],
  };

  return (
    <footer className="text-emerald-100 py-20" style={{ backgroundColor: '#004700' }}>
      <div className="container mx-auto px-4 grid md:grid-cols-6 gap-16">
        <div className="md:col-span-2">
          <Link href="/" aria-label="Olerai Ranchly home" className="mb-6 inline-flex items-center gap-3">
            <Image src={logo} alt="" priority className="size-20 shrink-0 rounded-full bg-[#FFF1C7] p-2 ring-2 ring-[#E49B0F] object-contain" />
            <span className="text-2xl font-bold text-black">Olerai<span className="text-[#E49B0F]">Ranchly</span></span>
          </Link>
          <p className="text-sm leading-relaxed text-emerald-100/80 mb-6">
            Digitizing livestock farming for rural farmers, vets and agro-chemists across Kenya — turning traditional practice into a data-driven agribusiness.
          </p>
          <div className="flex gap-4">
            <a href="#" aria-label="Facebook" className="flex size-10 items-center justify-center rounded-full bg-emerald-950 text-[#E49B0F] transition-colors hover:bg-[#E49B0F] hover:text-black"><FaFacebookF aria-hidden="true" className="size-4" /></a>
            <a href="#" aria-label="X (Twitter)" className="flex size-10 items-center justify-center rounded-full bg-emerald-950 text-[#E49B0F] transition-colors hover:bg-[#E49B0F] hover:text-black"><FaXTwitter aria-hidden="true" className="size-4" /></a>
            <a href="#" aria-label="LinkedIn" className="flex size-10 items-center justify-center rounded-full bg-emerald-950 text-[#E49B0F] transition-colors hover:bg-[#E49B0F] hover:text-black"><FaLinkedinIn aria-hidden="true" className="size-4" /></a>
            <a href="#" aria-label="TikTok" className="flex size-10 items-center justify-center rounded-full bg-emerald-950 text-[#E49B0F] transition-colors hover:bg-[#E49B0F] hover:text-black"><FaTiktok aria-hidden="true" className="size-4" /></a>
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
