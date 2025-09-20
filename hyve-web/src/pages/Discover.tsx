import { Link } from "react-router-dom";

const MOCK_EVENTS = [
  { id: "e1", title: "Coffee & Code", date: "2025-09-22", city: "San Francisco", tags: ["tech", "social"] },
  { id: "e2", title: "Sunset Run Club", date: "2025-09-23", city: "Tampa", tags: ["fitness"] },
  { id: "e3", title: "Designers Meetup", date: "2025-09-25", city: "Oakland", tags: ["design", "networking"] },
];

export default function Discover() {
  const uniqueCities = Array.from(new Set(MOCK_EVENTS.map(e => e.city)));
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-[#F2F0EF]">Discover</h2>
      <div className="mb-4 flex gap-3">
        <input className="border rounded px-3 py-2 w-full md:w-80 bg-[#2C4063] text-[#FFE485]" placeholder="Search by title or tag..." />
        <select className="border rounded px-3 py-2 bg-[#2C4063] text-[#F2F0EF]">
          <option value= ""> Anywhere</option>
          {uniqueCities.map(city => (<option key = {city} value = {city}>{city}</option>))}
        </select>
        <input className="border rounded px-3 py-2 bg-[#2C4063] text-[#F2F0EF]" type="date" />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {MOCK_EVENTS.map(e => (
          <Link to={`/events/${e.id}`} key={e.id} className="border rounded-xl p-4 hover:shadow bg-[#2C4063]">
            <div className="aspect-video rounded-lg bg-gray-200 mb-3" />
            <div className="font-medium text-[#FFD35C]">{e.title}</div>
            <div className="text-[#FFE485] text-sm">{e.city} · {new Date(e.date).toLocaleDateString()}</div>
            <div className="mt-1 text-[#FFE485] text-xs">{e.tags.join(" • ")}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

