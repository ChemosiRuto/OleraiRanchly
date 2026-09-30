'use client';
import { useEffect, useState, useRef } from 'react';

const stats = [
  { target: 2400000, label: 'Livestock counted across Kenya', suffix: '+' },
  { target: 12, label: "Share of Kenya's GDP from livestock", suffix: '%' },
  { target: 60, label: 'Rural households depending on livestock', suffix: '+' },
  { target: 47, label: 'Counties reached by the platform', suffix: '' },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const startTime = performance.now();

    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easedProgress * target));
      if (progress < 1) requestAnimationFrame(animateCount);
    };

    requestAnimationFrame(animateCount);
  }, [isVisible, target]);

  return (
    <div ref={ref} className="text-3xl lg:text-4xl font-extrabold text-white mb-2 tracking-tight transition-all">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

export default function StatsBand() {
  return (
    // Applied background color #004700 as requested
    <section className="py-12" style={{ backgroundColor: '#004700' }}>
      <div className="container mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <Counter target={stat.target} suffix={stat.suffix} />
            <div className="text-xs font-semibold text-[#E49B0F] uppercase tracking-widest leading-relaxed">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
