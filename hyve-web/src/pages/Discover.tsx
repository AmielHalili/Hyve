import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { DateRange } from "react-date-range";
import type { Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const MOCK_EVENTS = [
  { id: "e1", title: "Coffee & Code", date: "2025-09-22", city: "San Francisco", tags: ["tech", "social"], img: "/images/CoffeeAndCode.jpg" },
  { id: "e2", title: "Sunset Run Club", date: "2025-09-23", city: "Orlando", tags: ["fitness"], img: "/images/SunsetRun.jpg" },
  { id: "e3", title: "Designers Meetup", date: "2025-09-25", city: "Oakland", tags: ["design", "networking"], img: "/images/DesignersMeetup.jpg" },
  { id: "e4", title: "Tech Networking Event", date: "2025-10-19", city: "Tampa", tags: ["tech", "networking"], img: "/images/TechNetworking.jpg" },
];

type DateRangeType = {
  startDate: Date | null;
  endDate: Date | null;
  key: string;
};

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [tempRange, setTempRange] = useState<DateRangeType[]>([
    { startDate: null, endDate: null, key: "selection" },
  ]);
  const [appliedRange, setAppliedRange] = useState<DateRangeType[]>([
    { startDate: null, endDate: null, key: "selection" },
  ]);

  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const uniqueCities = Array.from(new Set(MOCK_EVENTS.map(e => e.city)));

  // Filter events
  const filteredEvents = MOCK_EVENTS.filter(e => {
    const eventDate = new Date(e.date);
    const { startDate, endDate } = appliedRange[0];

    if (selectedCity && e.city !== selectedCity) return false;

    if (startDate && endDate) {
      const event = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      if (!(event >= start && event <= end)) return false;
    }

    const query = searchQuery.toLowerCase();
    if (query) {
      const titleMatch = e.title.toLowerCase().includes(query);
      const tagMatch = e.tags.some(tag => tag.toLowerCase().includes(query));
      if (!titleMatch && !tagMatch) return false;
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
        {/* Search input */}
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-80 bg-[#2C4063] text-[#FFE485]"
          placeholder="Search by title or tag..."
        />

        {/* City dropdown */}
        <select
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          className="border rounded px-3 py-2 bg-[#2C4063] text-[#F2F0EF]"
        >
          <option value="">Location</option>
          {uniqueCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {/* Date range picker button */}
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="border rounded px-3 py-2 bg-[#2C4063] text-[#F2F0EF] text-left"
        >
          {appliedRange[0].startDate && appliedRange[0].endDate
            ? `${appliedRange[0].startDate.toLocaleDateString()} - ${appliedRange[0].endDate.toLocaleDateString()}`
            : "Pick a date"}
        </button>

        {/* Calendar popup */}
        {showCalendar && (
          <div ref={calendarRef} className="absolute top-14 z-50 bg-white rounded shadow-lg p-3">
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

      {/* Event list with horizontal scroll */}
      <div className="overflow-x-auto py-4">
        <div className="flex space-x-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(e => (
              <Link
                to={`/events/${e.id}`}
                key={e.id}
                className="flex-shrink-0 w-72 border rounded-xl p-4 hover:shadow bg-[#2C4063]"
              >
                {/* Event image */}
                <img
                  src={e.img}
                  alt={e.title}
                  className="aspect-video rounded-lg mb-3 object-cover w-full"
                />

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
    </div>
  );
}
