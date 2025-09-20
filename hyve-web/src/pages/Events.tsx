import { Link } from "react-router-dom";

const MOCK_EVENTS = [
  { id: "e1", title: "Coffee & Code", attendees: 24, date: "2025-09-22", venue: "Mission Cafe" },
  { id: "e2", title: "Sunset Run Club", attendees: 18, date: "2025-09-23", venue: "Ocean Beach" },
  { id: "e3", title: "Designers Meetup", attendees: 42, date: "2025-09-25", venue: "Oakstop" },
];

export default function Events() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-[#FFD35C]">Events</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {MOCK_EVENTS.map(e => (
          <Link to={`/events/${e.id}`} key={e.id} className="border rounded-xl p-4 hover:shadow bg-[#2C4063]">
            <div className="aspect-video rounded-lg bg-gray-200 mb-3" />
            <div className="font-medium text-[#FFD35C]">{e.title}</div>
            <div className="text-[#FFE485] text-sm">{new Date(e.date).toLocaleDateString()} · {e.venue}</div>
            <div className="mt-1 text-[#FFE485] text-xs">{e.attendees} going</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

