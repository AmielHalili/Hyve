import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/auth";
import { getBaseUrl } from "../lib/url";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  starts_at: string;
  tags: { id: string; name: string }[];
  cover_url?: string | null;
  images?: { id: string; url: string }[];
  owner_id?: string;
  attend_token?: string | null;
};

export default function EventDetail() {
  const { slug } = useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rsvpCount, setRsvpCount] = useState<number>(0);
  const [hasRsvped, setHasRsvped] = useState<boolean>(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,description,location,starts_at,cover_url,owner_id,attend_token,event_tags:event_tags(tag:tags(id,name)),images:event_images(id,url)"
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
          owner_id: e.owner_id,
          attend_token: e.attend_token,
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

  const isOwner = !!user && event?.owner_id === user.id;
  const attendUrl = (!slug || !event?.attend_token)
    ? ''
    : `${getBaseUrl()}/events/${slug}/attend?t=${encodeURIComponent(event.attend_token)}`;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!event) return <p className="text-[#22343D]">Loading…</p>;
  // adding more images disabled

  return (
    <div className="grid lg:grid-cols-3 gap-6 text-[#22343D]">
      <div className="lg:col-span-2">
        <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10 space-y-4">
          {event.cover_url ? (
            <img src={event.cover_url} alt="" className="aspect-video w-full object-cover rounded-lg" />
          ) : (
            <div className="aspect-video rounded-lg bg-gray-200" />
          )}
          <div className="h-px bg-[#22343D]/10" />
          <div>
            <h2 className="text-2xl font-semibold">{event.title}</h2>
            <p className="text-[#22343D]/80">{new Date(event.starts_at).toLocaleString()} · {event.location}</p>
          </div>
          <div className="h-px bg-[#22343D]/10" />
          <p className="text-[#22343D]/90">{event.description}</p>
          {event.tags?.length > 0 && (
            <>
              <div className="h-px bg-[#22343D]/10" />
              <div className="flex flex-wrap gap-2">
                {event.tags.map((t) => (
                  <span key={t.id} className="px-3 py-1 rounded-full bg-[#FFD35C] text-[#22343D] text-xs">
                    {t.name}
                  </span>
                ))}
              </div>
            </>
          )}
          {event.images && event.images.length > 0 && (
            <>
              <div className="h-px bg-[#22343D]/10" />
              <div className="grid md:grid-cols-3 gap-3">
                {event.images.map((img) => (
                  <img key={img.id} src={img.url} alt="Event" className="w-full h-40 object-cover rounded" />
                ))}
              </div>
            </>
          )}
          {/* Additional image uploads disabled */}
        </div>
      </div>
      <aside className="border rounded-xl p-4 h-fit bg-[#FCF6E8] border-[#22343D]/10 space-y-3">
        <div className="text-xl font-semibold mb-2">{rsvpCount} going</div>
        <button
          className={`w-full px-4 py-2 rounded transition-colors ${
            hasRsvped
              ? 'bg-transparent border border-[#22343D] text-[#22343D] hover:bg-[#FFD35C]'
              : 'bg-[#22343D] text-[#FCF6E8] hover:bg-[#FFD35C] hover:text-[#22343D]'
          }`}
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
        <div className="h-px bg-[#22343D]/10" />
        <button className="w-full px-4 py-2 rounded border border-[#22343D] text-[#22343D] hover:bg-[#FFD35C] transition-colors">Share</button>
        {isOwner && event.attend_token && (
          <div className="mt-4">
            <button
              className="w-full px-4 py-2 rounded bg-[#22343D] text-[#FCF6E8] hover:bg-[#FFD35C] hover:text-[#22343D] transition-colors"
              onClick={() => setShowQR((v) => !v)}
            >
              {showQR ? 'Hide' : 'Show'} Check-in QR
            </button>
            {showQR && (
              <div className="mt-3 space-y-2 text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(attendUrl)}&size=240x240`}
                  alt="Event check-in QR"
                  className="mx-auto rounded bg-white p-2"
                />
                <div className="text-xs text-[#22343D]/70 break-all">{attendUrl}</div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
