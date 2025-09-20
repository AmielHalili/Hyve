import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";
import { PREMADE_TAGS } from "../data/premadeTags";

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showHosted, setShowHosted] = useState(false);
  const [hosted, setHosted] = useState<{
    id: string;
    slug: string | null;
    title: string;
    location: string;
    starts_at: string;
    cover_url: string | null;
  }[]>([]);
  const [hostErr, setHostErr] = useState<string | null>(null);
  const [hostLoading, setHostLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data, error } = await supabase.from("tags").select("id,name").eq("owner_id", user.id).order("name");
      if (error) setErr(error.message);
      else setTags(data ?? []);
    })();
  }, [user]);

  const addTag = async (name: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tags")
      .upsert({ name, owner_id: user.id }, { onConflict: "owner_id,name_lc" })
      .select("id,name")
      .single();
    if (!error && data) {
      setTags((cur) => (cur.find((t) => t.id === data.id) ? cur : [...cur, data].sort((a, b) => a.name.localeCompare(b.name))));
    }
  };

  const handleShowHosted = async () => {
    if (!user) return;
    const next = !showHosted;
    setShowHosted(next);
    if (next && hosted.length === 0) {
      setHostLoading(true);
      setHostErr(null);
      const { data, error } = await supabase
        .from("events")
        .select("id,slug,title,location,starts_at,cover_url")
        .eq("owner_id", user.id)
        .order("starts_at", { ascending: false });
      if (error) setHostErr(error.message);
      else setHosted(data ?? []);
      setHostLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#FFD35C]">My Hyve</h2>
      {!user && <p className="text-[#22343D]">Sign in first to see your events.</p>}
      {user && (
        <>
        <div className="border rounded-xl p-4 bg-[#2C4063] md:col-span-3">
            <b className="text-[#FFD35C]">Your interests</b>
            {err && <p className="text-red-300 text-sm">{err}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t.id} className="px-3 py-1 rounded-full bg-[#FFD35C] text-[#22343D] text-sm">{t.name}</span>
              ))}
              {tags.length === 0 && <p className="text-[#FFE485] text-sm">You have no interests yet.</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PREMADE_TAGS.map((t) => (
                <button key={t} onClick={() => addTag(t)} className="px-3 py-1 rounded-full border text-[#FFE485] border-[#FFD35C] text-sm hover:bg-[#FFD35C] hover:text-[#22343D]">
                  + {t}
                </button>
              ))}
            </div>
          </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">RSVPs</b>
            <p className="text-[#FFE485]">3 upcoming</p>
          </div>
          <button onClick={handleShowHosted} className="text-left border rounded-xl p-4 bg-[#2C4063] hover:bg-[#2C4063]/90 focus:outline-none focus:ring-2 focus:ring-[#FFD35C]">
            <b className="text-[#FFD35C]">Hosted</b>
            <p className="text-[#FFE485]">{showHosted ? "Hide" : "Show"} my events</p>
          </button>
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">Invites</b>
            <p className="text-[#FFE485]">2 awaiting response</p>
          </div>
          
        </div>
        {showHosted && (
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">My hosted events</b>
            {hostLoading && <p className="text-[#FFE485] text-sm mt-2">Loading…</p>}
            {hostErr && <p className="text-red-300 text-sm mt-2">{hostErr}</p>}
            {!hostLoading && !hostErr && (
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                {hosted.map((e) => (
                  <Link key={e.id} to={`/events/${e.slug ?? e.id}`} className="flex gap-3 p-2 rounded hover:bg-white/5">
                    {e.cover_url ? (
                      <img src={e.cover_url} alt="" className="w-20 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-14 bg-gray-600/40 rounded" />
                    )}
                    <div>
                      <div className="text-[#FFD35C] font-medium">{e.title}</div>
                      <div className="text-[#FFE485] text-xs">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
                    </div>
                  </Link>
                ))}
                {hosted.length === 0 && (
                  <p className="text-[#FFE485] text-sm">You haven’t hosted any events yet.</p>
                )}
              </div>
            )}
          </div>
        )}
        </>
      )}
    </div>
  );
}
