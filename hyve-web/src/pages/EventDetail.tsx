import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  starts_at: string;
  tags: { id: string; name: string }[];
  cover_url?: string | null;
  images?: { id: string; url: string }[];
};

export default function EventDetail() {
  const { slug } = useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rsvpCount, setRsvpCount] = useState<number>(0);
  const [hasRsvped, setHasRsvped] = useState<boolean>(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,description,location,starts_at,cover_url,event_tags:event_tags(tag:tags(id,name)),images:event_images(id,url)"
        )
        .eq("slug", slug)
        .single();
      if (error) setError(error.message);
      else {
        const e: any = data;
        const mapped: EventRow = {
          id: e.id,
          title: e.title,
          description: e.description,
          location: e.location,
          starts_at: e.starts_at,
          cover_url: e.cover_url,
          tags: (e.event_tags ?? []).map((et: any) => et?.tag).filter(Boolean) as { id: string; name: string }[],
          images: e.images ?? [],
        };
        setEvent(mapped);
        // fetch rsvp count and user status
        const [{ count }, { data: my }] = await Promise.all([
          supabase.from("event_rsvps").select("event_id", { count: "exact", head: true }).eq("event_id", e.id),
          user ? supabase.from("event_rsvps").select("event_id").eq("event_id", e.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }) as any,
        ]);
        setRsvpCount((count as number) || 0);
        setHasRsvped(!!my);
      }
    })();
  }, [slug, user?.id]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!event) return <p className="text-[#FFE485]">Loading…</p>;
  // adding more images disabled

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {event.cover_url ? (
          <img src={event.cover_url} alt="" className="aspect-video w-full object-cover rounded-xl" />
        ) : (
          <div className="aspect-video rounded-xl bg-[#2C4063]" />
        )}
        <h2 className="text-2xl font-semibold text-[#FFD35C]">{event.title}</h2>
        <p className="text-[#FFE485]">{new Date(event.starts_at).toLocaleString()} · {event.location}</p>
        <p className="text-[#F2F0EF]">{event.description}</p>
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((t) => (
              <span key={t.id} className="px-3 py-1 rounded-full bg-[#FFD35C] text-[#22343D] text-xs">
                {t.name}
              </span>
            ))}
          </div>
        )}
        {event.images && event.images.length > 0 && (
          <div className="grid md:grid-cols-3 gap-3">
            {event.images.map((img) => (
              <img key={img.id} src={img.url} alt="Event" className="w-full h-40 object-cover rounded" />
            ))}
          </div>
        )}
        {/* Additional image uploads disabled */}
      </div>
      <aside className="border rounded-xl p-4 h-fit bg-[#2C4063]">
        <div className="text-xl font-semibold mb-2 text-[#FFD35C]">{rsvpCount} going</div>
        <button
          className={`w-full px-4 py-2 rounded ${hasRsvped ? 'bg-[#2C4063] border border-[#FFD35C] text-[#FFD35C]' : 'bg-[#FFD35C] text-[#2C4063]'}`}
          onClick={async () => {
            if (!user) {
              navigate('/signin', { replace: false });
              return;
            }
            if (hasRsvped) {
              const { error } = await supabase.from('event_rsvps').delete().eq('event_id', event.id).eq('user_id', user.id);
              if (!error) {
                setHasRsvped(false);
                setRsvpCount((c) => Math.max(0, c - 1));
              }
            } else {
              const { error } = await supabase.from('event_rsvps').insert({ event_id: event.id, user_id: user.id });
              if (!error) {
                setHasRsvped(true);
                setRsvpCount((c) => c + 1);
              }
            }
          }}
        >
          {hasRsvped ? 'Leave RSVP' : 'RSVP'}
        </button>
        <button className="w-full mt-2 px-4 py-2 rounded border text-[#FFD35C]">Share</button>
      </aside>
    </div>
  );
}
