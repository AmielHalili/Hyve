import { useParams } from "react-router-dom";

const MOCK_DETAILS: Record<string, { title: string; date: string; venue: string; desc: string; going: number }>= {
  e1: { title: "Coffee & Code", date: "2025-09-22T18:00:00", venue: "Mission Cafe", desc: "Bring your laptop and meet fellow devs.", going: 24 },
  e2: { title: "Sunset Run Club", date: "2025-09-23T17:30:00", venue: "Ocean Beach", desc: "5k jog followed by stretches.", going: 18 },
  e3: { title: "Designers Meetup", date: "2025-09-25T19:00:00", venue: "Oakstop", desc: "Talks and portfolio reviews.", going: 42 },
};

export default function EventDetail() {
  const { id } = useParams();
  const event = (id && MOCK_DETAILS[id]) || { title: `Event ${id}`, date: new Date().toISOString(), venue: "TBA", desc: "", going: 0 };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video rounded-xl bg-[#2C4063]" />
        <h2 className="text-2xl font-semibold text-[#FFD35C]">{event.title}</h2>
        <p className="text-[#FFE485]">{new Date(event.date).toLocaleString()} · {event.venue}</p>
        <p className="text-[#F2F0EF]">{event.desc}</p>
      </div>
      <aside className="border rounded-xl p-4 h-fit bg-[#2C4063]">
        <div className="text-xl font-semibold mb-2 text-[#FFD35C]">{event.going} going</div>
        <button className="w-full px-4 py-2 rounded bg-[#FFD35C] text-[#2C4063]">RSVP</button>
        <button className="w-full mt-2 px-4 py-2 rounded border text-[#FFD35C]">Share</button>
      </aside>
    </div>
  );
}

