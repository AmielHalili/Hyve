import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { PREMADE_TAGS } from "../data/premadeTags";
import { useAuthStore } from "../store/auth";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  starts_at: string; // ISO
  tags: { id: string; name: string }[];
  cover_url?: string | null;
};

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loc, setLoc] = useState("");
  const [when, setWhen] = useState<"any" | "today" | "7d" | "month">("any");
  const [tag, setTag] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id,slug,title,location,starts_at,cover_url,event_tags:event_tags(tag:tags(id,name))"
        )
        .order("starts_at", { ascending: true });
      if (error) setError(error.message);
      else {
        const mapped: EventRow[] = (data as any[] | null)?.map((e: any) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          location: e.location,
          starts_at: e.starts_at,
          cover_url: e.cover_url,
          tags: (e.event_tags ?? [])
            .map((et: any) => et?.tag)
            .filter(Boolean) as { id: string; name: string }[],
        })) ?? [];
        setEvents(mapped);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) { setJoinedIds(new Set()); return; }
      const { data } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', user.id);
      const s = new Set<string>((data ?? []).map((r: any) => r.event_id));
      setJoinedIds(s);
    })();
  }, [user?.id]);

  const filtered = events.filter((e) => {
    const q = query.trim().toLowerCase();
    const l = loc.trim().toLowerCase();
    const titleOk = !q || e.title.toLowerCase().includes(q);
    const locOk = !l || e.location.toLowerCase().includes(l);
    const d = new Date(e.starts_at);
    const now = new Date();
    let whenOk = true;
    if (when === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      whenOk = d >= start && d < end;
    } else if (when === "7d") {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      whenOk = d >= now && d <= end;
    } else if (when === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      whenOk = d >= start && d < end;
    }
    const tagOk = !tag || e.tags.some((t) => t.name === tag);
    return titleOk && locOk && whenOk && tagOk;
  });

  return (
    <div className="text-[#22343D]">
      <h2 className="text-4xl font-semibold mb-4">Discover Events</h2>
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <input
          className="border rounded px-3 py-2 w-full bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border-[#22343D]/30"
          placeholder="Search by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 w-full bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border-[#22343D]/30"
          placeholder="Filter by location…"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 bg-[#FCF6E8] text-[#22343D] border-[#22343D]/30"
          value={when}
          onChange={(e) => setWhen(e.target.value as any)}
        >
          <option value="any">Any time</option>
          <option value="today">Today</option>
          <option value="7d">Next 7 days</option>
          <option value="month">This month</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-[#22343D] text-sm">Tag:</span>
          <select
            className="border rounded px-3 py-2 bg-[#FCF6E8] text-[#22343D] border-[#22343D]/30"
            value={tag ?? ''}
            onChange={(e) => setTag(e.target.value || null)}
          >
            <option value="">All tags</option>
            {PREMADE_TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      {loading && <p className="text-[#22343D]">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map((e) => (
          <Link to={`/events/${e.slug}`} key={e.id} className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:bg-[#F1E7D3]">
            <div className="relative mb-3">
              {e.cover_url ? (
                <img src={e.cover_url} alt="" className="aspect-video w-full object-cover rounded-lg" />
              ) : (
                <div className="aspect-video rounded-lg bg-gray-200" />
              )}
              {joinedIds.has(e.id) && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#FFD35C] text-[#22343D] text-xs font-medium">Joined</span>
              )}
            </div>
            <div className="font-medium text-[#22343D]">{e.title}</div>
            <div className="text-[#22343D]/80 text-sm">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
            {e.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {e.tags.map((t) => (
                  <span key={t.id} className="px-2 py-0.5 rounded-full bg-[#FFD35C] text-[#22343D] text-xs">{t.name}</span>
                ))}
              </div>
            )}
          </Link>
        ))}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-[#22343D]">No events yet. Be the first to <Link className="underline" to="/host">host one</Link>.</p>
        )}
      </div>
    </div>
  );
}
