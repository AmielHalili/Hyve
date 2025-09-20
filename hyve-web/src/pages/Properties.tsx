import { Link } from "react-router-dom";

const MOCK = [
  { id: "p1", title: "Sunny 2BR in Midtown", price: 2800, city: "New York" },
  { id: "p2", title: "Modern Studio", price: 1900, city: "Boston" },
  { id: "p3", title: "Spacious 3BR", price: 3200, city: "Philadelphia" },
];

export default function Properties() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-[#FFD35C]">Properties</h2>
      <div className="mb-4 flex gap-3">
        <input className="border rounded px-3 py-2 w-full md:w-80 bg-[#2C4063] text-[#FFE485]" placeholder="Search city or title..." />
        <select className="border rounded px-3 py-2 bg-[#2C4063] text-[#FFE485]">
          <option>Any price</option>
          <option>Under $2,000</option>
          <option>$2,000–$3,000</option>
          <option>Over $3,000</option>
        </select>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {MOCK.map(p => (
          <Link to={`/properties/${p.id}`} key={p.id} className="border rounded-xl p-4 hover:shadow bg-[#2C4063]">
            <div className="aspect-video rounded-lg bg-gray-200 mb-3" />
            <div className="font-medium text-[#FFD35C]">{p.title}</div>
            <div className="text-[#FFE485] text-sm">{p.city}</div>
            <div className="mt-1 text-[#FFD35C]">${p.price.toLocaleString()}/mo</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
