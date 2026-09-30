'use client';
import { useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const roles = [
  { name: 'Farmers', desc: 'Manage livestock, records & markets' },
  { name: 'Veterinarians', desc: 'Bookings & consultations' },
  { name: 'Agro-chemists', desc: 'Products & farmer network' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-zinc-100">
      <div className="container mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo and Tagline container */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#E49B0F] flex items-center justify-center shrink-0">
            <span className="text-black font-extrabold text-lg tracking-tighter">OR</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-black leading-none">Olerai<span className="text-[#E49B0F]">Ranchly</span></span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1 italic">Build To Grow</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          <div className="relative group" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <button className="flex items-center gap-1.5 text-base font-medium text-zinc-700 hover:text-[#E49B0F] transition-colors">
              Who it's for <ChevronDown className="w-4 h-4 opacity-50" />
            </button>
            {isOpen && (
              <div className="absolute top-full left-0 w-72 bg-white rounded-xl shadow-2xl border border-zinc-100 py-3 mt-3 animate-in fade-in slide-in-from-top-2">
                {roles.map((role) => (
                  <a key={role.name} href="#roles" className="block px-6 py-4 hover:bg-zinc-50 transition-colors">
                    <div className="font-semibold text-zinc-950 text-base">{role.name}</div>
                    <div className="text-sm text-zinc-500 mt-1">{role.desc}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
          {['Features', 'How it works', 'Blog', 'FAQ'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/[\s\']/g, '-')}`} className="text-base font-medium text-zinc-700 hover:text-[#E49B0F] transition-colors">
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Button variant="outline" className="hidden md:flex border-zinc-200 text-zinc-800 font-semibold hover:bg-zinc-50 h-11 px-6">Log in</Button>
          <Button className="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold transition-all h-11 px-8 rounded-full">Start free</Button>
          <button className="md:hidden text-zinc-800"><Menu className="w-7 h-7" /></button>
        </div>
      </div>
    </header>
  );
}
