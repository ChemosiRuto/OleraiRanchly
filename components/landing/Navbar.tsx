'use client';
import { useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import StartFreeTrigger from '@/components/auth/StartFreeTrigger';
import logo from '../../images/logoF.png';

const roles = [
  { name: 'Farmers', desc: 'Manage livestock, records & markets' },
  { name: 'Veterinarians', desc: 'Bookings & consultations' },
  { name: 'Agro-chemists', desc: 'Products & farmer network' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-zinc-100">
      <div className="container mx-auto px-4 py-5 flex items-center justify-between sm:px-6">
        <Link href="/" aria-label="Olerai Ranchly home" className="flex items-center gap-2 sm:gap-3">
          <Image src={logo} alt="" priority className="h-14 w-14 shrink-0 object-cover sm:h-16 sm:w-16" />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-black leading-none sm:text-2xl">Olerai<span className="text-[#E49B0F]">Ranchly</span></span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1 italic">Build To Grow</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <div className="relative group" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <button className="flex items-center gap-1.5 text-base font-medium text-zinc-700 hover:text-[#E49B0F] transition-colors">
              Who it&apos;s for <ChevronDown className="w-4 h-4 opacity-50" />
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

        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/login" className="hidden h-11 items-center border border-zinc-200 px-5 text-sm font-semibold text-zinc-800 transition-colors hover:border-[#004700] hover:text-[#004700] md:inline-flex">Log in</Link>
          <StartFreeTrigger id="header-start-free" className="h-11 rounded-full bg-zinc-950 px-3 font-semibold text-white transition-colors hover:bg-zinc-800 sm:px-8">Start free</StartFreeTrigger>
          <button className="md:hidden text-zinc-800"><Menu className="w-7 h-7" /></button>
        </div>
      </div>
    </header>
  );
}
