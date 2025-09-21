import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";

export default function MyHostedEvents() {
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<{
    id: string;
    slug: string | null;
    title: string;
    location: string;
    starts_at: string;
    cover_url: string | null;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) { setEvents([]); return; }
      setLoading(true); setError(null);
      const { data, error } = await supabase
        .from('events')
        .select('id,slug,title,location,starts_at,cover_url')
        .eq('owner_id', user.id)
        .order('starts_at', { ascending: false });
      setLoading(false);
      if (error) { setError(error.message); return; }
      setEvents(data ?? []);
    })();
  }, [user?.id]);

  if (!user) return <p className="text-[#FFE485]">Please sign in to view your hosted events.</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-[#FFD35C]">My Hosted Events</h2>
      {loading && <p className="text-[#FFE485]">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}
      <div className="grid md:grid-cols-3 gap-4">
        {events.map((e) => (
          <Link to={`/events/${e.slug ?? e.id}`} key={e.id} className="border rounded-xl p-4 hover:shadow bg-[#2C4063]">
            <div className="relative mb-3">
              {e.cover_url ? (
                <img src={e.cover_url} alt="" className="aspect-video w-full object-cover rounded-lg" />
              ) : (
                <div className="aspect-video rounded-lg bg-gray-200" />
              )}
            </div>
            <div className="font-medium text-[#FFD35C]">{e.title}</div>
            <div className="text-[#FFE485] text-sm">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
          </Link>
        ))}
        {!loading && !error && events.length === 0 && (
          <p className="text-[#FFE485]">No hosted events yet. You can <Link to="/host" className="underline">create one</Link>.</p>
        )}
      </div>
    </div>
  );
}

