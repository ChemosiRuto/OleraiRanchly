export default function Testimonials() {
  const testimonials = [
    {
      text: "I manage my 20 dairy cows from one app. Found a buyer in Nairobi within a day, at 30% more than the middleman was offering.",
      name: "James Kiprop",
      role: "Dairy farmer, Bomet County"
    },
    {
      text: "My practice is now visible to farmers across three counties. Bookings have doubled in six months — verification gave farmers instant trust.",
      name: "Dr. Samuel Otieno",
      role: "Veterinary surgeon, KVB verified"
    },
    {
      text: "Farmers find my shop online and call ahead now. Monthly sales grew by 40% in the first three months.",
      name: "Beatrice Wanjiru",
      role: "Agro-chemist, Nakuru County"
    }
  ];

  return (
    <section className="py-24" style={{ backgroundColor: '#f4f4f5' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-6 text-zinc-950">Trusted <span className="text-[#004700] italic">across Kenya</span></h2>
          <p className="text-zinc-600">From Bomet to Nakuru — farmers, vets and agro-chemists are changing how they work.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="p-8 bg-white rounded-3xl border border-zinc-200">
              <span className="text-5xl text-[#004700] block mb-6 font-serif">&ldquo;</span>
              <p className="text-zinc-700 text-lg mb-8 leading-relaxed">{t.text}</p>
              <div className="border-t border-zinc-200 pt-6">
                <strong className="block text-zinc-950 font-bold">{t.name}</strong>
                <span className="text-sm text-zinc-500">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
