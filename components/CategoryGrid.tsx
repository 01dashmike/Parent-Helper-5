const categories = [
  { name: "Baby & Toddler", icon: "👶", color: "bg-teal-100" },
  { name: "After School Clubs", icon: "🎓", color: "bg-coral-100" },
  { name: "Parent Support", icon: "💬", color: "bg-sage-100" },
  { name: "Photography", icon: "📸", color: "bg-lavender-100" },
  { name: "Free Samples", icon: "🎁", color: "bg-amber-100" },
];

export default function CategoryGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-teal-700 mb-12">
          Explore by category
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`${cat.color} rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition`}
            >
              <div className="text-3xl mb-3" aria-hidden>{cat.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800">{cat.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
