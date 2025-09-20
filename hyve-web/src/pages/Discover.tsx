import { useState } from "react";
import { Link } from "react-router-dom";
import { DateRange } from "react-date-range";
import type { Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const MOCK_EVENTS = [
  { id: "e1", title: "Coffee & Code", date: "2025-09-22", city: "San Francisco", tags: ["tech", "social"] },
  { id: "e2", title: "Sunset Run Club", date: "2025-09-23", city: "San Francisco", tags: ["fitness"] },
  { id: "e3", title: "Designers Meetup", date: "2025-09-25", city: "Oakland", tags: ["design", "networking"] },
];

type DateRangeType = {
  startDate: Date | null;
  endDate: Date | null;
  key: string;
};

export default function Discover() {
  const [selectedCity, setSelectedCity] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [tempRange, setTempRange] = useState<DateRangeType[]>([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [appliedRange, setAppliedRange] = useState<DateRangeType[]>([
    { startDate: null, endDate: null, key: "selection" },
  ]);

  const uniqueCities = Array.from(new Set(MOCK_EVENTS.map(e => e.city)));

  const filteredEvents = MOCK_EVENTS.filter(e => {
    const eventDate = new Date(e.date);
    const { startDate, endDate } = appliedRange[0];

    if (selectedCity && e.city !== selectedCity) return false;

    if (startDate && endDate) {
      return eventDate >= startDate && eventDate <= endDate;
    }

    return true;
  });

  const handleClear = () => {
    const empty: DateRangeType[] = [{ startDate: null, endDate: null, key: "selection" }];
    setTempRange(empty);
    setAppliedRange(empty);
  };

  const handleApply = () => {
    setAppliedRange(tempRange);
    setShowCalendar(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-[#F2F0EF]">Discover</h2>
      <div className="mb-4 flex flex-col md:flex-row gap-3 relative">
        <input
          className="border rounded px-3 py-2 w-full md:w-80 bg-[#2C4063] text-[#FFE485]"
          placeholder="Search by title or tag..."
        />
        <select
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          className="border rounded px-3 py-2 bg-[#2C4063] text-[#F2F0EF]"
        >
          <option value="">Anywhere</option>
          {uniqueCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="border rounded px-3 py-2 bg-[#2C4063] text-[#F2F0EF] text-left"
        >
          {appliedRange[0].startDate && appliedRange[0].endDate
            ? `${appliedRange[0].startDate.toLocaleDateString()} - ${appliedRange[0].endDate.toLocaleDateString()}`
            : "Pick a date"}
        </button>

        {showCalendar && (
          <div className="absolute top-14 z-50 bg-white rounded shadow-lg p-3">
            <DateRange
              ranges={tempRange as Range[]}
              onChange={item => setTempRange([item.selection as DateRangeType])}
              moveRangeOnFirstSelection={false}
              rangeColors={["#FFD35C"]}
              editableDateInputs
              months={2}
              direction="horizontal"
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={handleClear}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Clear
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1 bg-[#FFD35C] text-black rounded hover:bg-yellow-400"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(e => (
            <Link
              to={`/events/${e.id}`}
              key={e.id}
              className="border rounded-xl p-4 hover:shadow bg-[#2C4063]"
            >
              <div className="aspect-video rounded-lg bg-gray-200 mb-3" />
              <div className="font-medium text-[#FFD35C]">{e.title}</div>
              <div className="text-[#FFE485] text-sm">
                {e.city} · {new Date(e.date).toLocaleDateString()}
              </div>
              <div className="mt-1 text-[#FFE485] text-xs">{e.tags.join(" • ")}</div>
            </Link>
          ))
        ) : (
          <div className="text-[#F2F0EF]">No events found.</div>
        )}
      </div>
    </div>
  );
}
