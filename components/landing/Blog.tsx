export default function Blog() {
  const articles = [
    { title: 'The complete guide to milk yield optimization in Kenyan dairy cows', meta: 'By Dr. Mary Wanjiku — Sep 8, 2026' },
    { title: 'Boer goats vs local breeds: which is more profitable in 2026?', meta: 'By the OleraiRanchly team — Sep 5, 2026' },
    { title: 'Five common livestock diseases in Kenya, and how to prevent them', meta: 'By Dr. Samuel Otieno — Sep 2, 2026' },
  ];

  return (
    <section id="blog" className="py-24 border-t border-zinc-200" style={{ backgroundColor: '#f4f4f5' }}>
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-zinc-950">Insights for <span className="text-[#004700] italic">modern farmers</span></h2>
        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((a, i) => (
            <div key={i} className="bg-white border border-zinc-200 p-8 rounded-2xl hover:border-[#004700]/50 transition-colors group">
              <h3 className="font-bold text-xl mb-6 text-zinc-950 group-hover:text-[#004700] transition-colors">{a.title}</h3>
              <p className="text-sm text-zinc-500 font-medium">{a.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
