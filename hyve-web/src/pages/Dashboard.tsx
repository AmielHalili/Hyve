import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";
import { PREMADE_TAGS } from "../data/premadeTags";

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [editInterests, setEditInterests] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  // Hosted events state
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
  // RSVP events state
  const [rsvps, setRsvps] = useState<{
    id: string;
    slug: string | null;
    title: string;
    location: string;
    starts_at: string;
    cover_url: string | null;
  }[]>([]);
  const [rsvpErr, setRsvpErr] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  // Network section state
  const [recentPeers, setRecentPeers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [incomingReqs, setIncomingReqs] = useState<{ requester_id: string; full_name: string | null }[]>([]);
  const [outgoingReqIds, setOutgoingReqIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [netErr, setNetErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string | null }[]>([]);
  

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data, error } = await supabase.from("tags").select("id,name").eq("owner_id", user.id).order("name");
      if (error) setErr(error.message);
      else setTags(data ?? []);
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!user) { setFullName(null); return; }
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      setFullName((data as any)?.full_name ?? null);
      setSettingsName((data as any)?.full_name ?? '');
    })();
  }, [user?.id]);

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

  // Load recent 6 connections and current connection/request state
  useEffect(() => {
    (async () => {
      if (!user) {
        setRecentPeers([]); setIncomingReqs([]); setOutgoingReqIds(new Set()); setConnectedIds(new Set()); return;
      }
      setNetErr(null);
      // Connections
      const { data: connRows, error: cErr } = await supabase
        .from('user_connections')
        .select('user_id,peer_id,created_at')
        .or(`user_id.eq.${user.id},peer_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (cErr) { setNetErr(cErr.message); return; }
      const seen = new Set<string>();
      const recentOrder: string[] = [];
      (connRows ?? []).forEach((r: any) => {
        const pid = r.user_id === user.id ? r.peer_id : r.user_id;
        if (!seen.has(pid)) { seen.add(pid); recentOrder.push(pid); }
      });
      setConnectedIds(seen);
      const top6 = recentOrder.slice(0, 6);
      if (top6.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id,full_name').in('id', top6);
        const byId: Record<string, any> = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
        setRecentPeers(top6.map((id) => ({ id, full_name: byId[id]?.full_name ?? null })));
      } else {
        setRecentPeers([]);
      }
      // Incoming pending (top 3)
      const { data: inc } = await supabase
        .from('connection_requests')
        .select('requester_id')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .limit(3);
      const reqIds = (inc ?? []).map((r: any) => r.requester_id);
      if (reqIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id,full_name').in('id', reqIds);
        const by: Record<string, any> = Object.fromEntries((data ?? []).map((p: any) => [p.id, p]));
        setIncomingReqs(reqIds.map((id) => ({ requester_id: id, full_name: by[id]?.full_name ?? null })));
      } else setIncomingReqs([]);
      // Outgoing pending ids
      const { data: out } = await supabase
        .from('connection_requests')
        .select('recipient_id')
        .eq('requester_id', user.id)
        .eq('status', 'pending');
      setOutgoingReqIds(new Set((out ?? []).map((r: any) => r.recipient_id)));
    })();
  }, [user?.id]);

  async function acceptRequest(requesterId: string) {
    if (!user) return;
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('recipient_id', user.id)
      .eq('status', 'pending');
    if (!error) {
      await supabase.from('user_connections').insert([
        { user_id: user.id, peer_id: requesterId },
        { user_id: requesterId, peer_id: user.id },
      ]);
      setIncomingReqs((cur) => cur.filter((r) => r.requester_id !== requesterId));
      setConnectedIds((s) => new Set([...Array.from(s), requesterId]));
    }
  }

  async function declineRequest(requesterId: string) {
    if (!user) return;
    await supabase
      .from('connection_requests')
      .update({ status: 'declined' })
      .eq('requester_id', requesterId)
      .eq('recipient_id', user.id)
      .eq('status', 'pending');
    setIncomingReqs((cur) => cur.filter((r) => r.requester_id !== requesterId));
  }

  async function onSearchUsers(q: string) {
    setSearch(q);
    if (!user) return;
    if (q.trim().length < 2) { setSearchResults([]); setSearchErr(null); return; }
    setSearchLoading(true); setSearchErr(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name')
      .ilike('full_name', `%${q}%`)
      .neq('id', user.id)
      .limit(12);
    setSearchLoading(false);
    if (error) { setSearchErr(error.message); return; }
    setSearchResults((data ?? []).filter((p: any) => !connectedIds.has(p.id) && !outgoingReqIds.has(p.id)));
  }

  async function sendRequest(id: string) {
    if (!user || connectedIds.has(id) || outgoingReqIds.has(id)) return;
    const { error } = await supabase.from('connection_requests').insert({ requester_id: user.id, recipient_id: id, status: 'pending' });
    if (!error) setOutgoingReqIds((s) => new Set([...Array.from(s), id]));
  }
  

  
  const removeTag = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('tags').delete().eq('id', id).eq('owner_id', user.id);
    if (!error) setTags((cur) => cur.filter((t) => t.id !== id));
  };

  // Load initial RSVP/Hosted previews (limit to 4 each)
  useEffect(() => {
    (async () => {
      if (!user) { setHosted([]); setRsvps([]); return; }
      // Hosted preview
      setHostLoading(true); setHostErr(null);
      const { data: hostedData, error: hostedError } = await supabase
        .from('events')
        .select('id,slug,title,location,starts_at,cover_url')
        .eq('owner_id', user.id)
        .order('starts_at', { ascending: false })
        .limit(4);
      if (hostedError) setHostErr(hostedError.message); else setHosted(hostedData ?? []);
      setHostLoading(false);

      // RSVPs preview
      setRsvpLoading(true); setRsvpErr(null);
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('events:events(id,slug,title,location,starts_at,cover_url)')
        .eq('user_id', user.id)
        .limit(4);
      if (rsvpError) setRsvpErr(rsvpError.message); else setRsvps((rsvpData ?? []).map((row: any) => row.events));
      setRsvpLoading(false);
    })();
  }, [user?.id]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#FFD35C]">{fullName ? `${fullName.split(' ')[0]}'s Hyve` : 'My Hyve'}</h2>
        {user && (
          <button
            onClick={() => { setShowSettings(v => !v); setSaveMsg(null); }}
            className="px-3 py-1 rounded border border-[#FFD35C] text-[#FFD35C] hover:bg-[#FFD35C] hover:text-[#22343D] transition-colors"
          >
            Settings
          </button>
        )}
      </div>
      {showSettings && user && (
        <div className="mt-3 border rounded-xl p-4 bg-[#2C4063]">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm text-[#FFE485] mb-1">Email</label>
              <div className="px-3 py-2 rounded bg-[#1F2E48] text-[#FFE485]">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm text-[#FFE485] mb-1">Full name</label>
              <input
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#1F2E48] text-[#FFE485] border border-[#3A517A]"
                placeholder="Your name"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              disabled={savingName}
              onClick={async () => {
                setSavingName(true); setSaveMsg(null);
                const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: settingsName || null }, { onConflict: 'id' });
                setSavingName(false);
                if (error) setSaveMsg(`Error: ${error.message}`);
                else { setSaveMsg('Saved'); setFullName(settingsName || null); }
              }}
              className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D] disabled:opacity-60"
            >
              {savingName ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setShowSettings(false); setSettingsName(fullName ?? ''); setSaveMsg(null); }}
              className="px-3 py-1 rounded border border-[#FFD35C] text-[#FFD35C]"
            >
              Close
            </button>
            {saveMsg && <span className="self-center text-sm text-[#FFE485]">{saveMsg}</span>}
          </div>
        </div>
      )}
      {!user && <p className="text-[#22343D]">Sign in first to see your events.</p>}
      {user && (
        <>
          <div className="border rounded-xl p-4 bg-[#2C4063] md:col-span-3">
            <div className="flex items-center justify-between">
              <b className="text-[#FFD35C]">Your interests</b>
              {user && (
                <button
                  onClick={() => { setEditInterests((v) => !v); setNewInterest(''); }}
                  className="px-3 py-1 rounded border border-[#FFD35C] text-[#FFD35C] hover:bg-[#FFD35C] hover:text-[#22343D] transition-colors"
                >
                  {editInterests ? 'Done' : 'Edit'}
                </button>
              )}
            </div>
            {err && <p className="text-red-300 text-sm">{err}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t.id} className="px-3 py-1 rounded-full bg-[#FFD35C] text-[#22343D] text-sm flex items-center gap-2">
                  {t.name}
                  {editInterests && (
                    <button
                      onClick={() => removeTag(t.id)}
                      className="text-[#22343D] hover:text-red-700"
                      aria-label={`Remove ${t.name}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {tags.length === 0 && <p className="text-[#FFE485] text-sm">You have no interests yet.</p>}
            </div>
            {editInterests && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add interest"
                  className="px-3 py-1 rounded bg-[#1F2E48] text-[#FFE485] border border-[#3A517A]"
                />
                <button
                  onClick={() => { if (newInterest.trim()) { addTag(newInterest.trim()); setNewInterest(''); } }}
                  className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D]"
                >
                  Add
                </button>
                <div className="flex flex-wrap gap-2 ml-2">
                  {PREMADE_TAGS.map((t) => (
                    <button key={t} onClick={() => addTag(t)} className="px-3 py-1 rounded-full border text-[#FFE485] border-[#FFD35C] text-sm hover:bg-[#FFD35C] hover:text-[#22343D]">
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* RSVPs preview */}
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <div className="flex items-center justify-between">
              <b className="text-[#FFD35C]">My RSVPs</b>
              <Link to="/my/rsvps" className="text-sm text-[#FFE485] underline">Show all</Link>
            </div>
            {rsvpLoading && <p className="text-[#FFE485] text-sm mt-2">Loading…</p>}
            {rsvpErr && <p className="text-red-300 text-sm mt-2">{rsvpErr}</p>}
            {!rsvpLoading && !rsvpErr && (
              <div className="mt-3 grid gap-3">
                {rsvps.map((e) => (
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
                {rsvps.length === 0 && (
                  <p className="text-[#FFE485] text-sm">You haven’t RSVPed to any events yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Hosted preview */}
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <div className="flex items-center justify-between">
              <b className="text-[#FFD35C]">Hosted Events</b>
              <Link to="/my/hosted" className="text-sm text-[#FFE485] underline">Show all</Link>
            </div>
            {hostLoading && <p className="text-[#FFE485] text-sm mt-2">Loading…</p>}
            {hostErr && <p className="text-red-300 text-sm mt-2">{hostErr}</p>}
            {!hostLoading && !hostErr && (
              <div className="mt-3 grid gap-3">
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
        </div>
        {/* Network section */}
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold text-[#FFD35C]">Network</h3>
          {/* Connections */}
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <div className="flex items-center justify-between">
              <b className="text-[#FFD35C]">Connections</b>
              <Link to="/connections" className="text-sm underline text-[#FFE485]">See all</Link>
            </div>
            {netErr && <p className="text-red-300 text-sm mt-2">{netErr}</p>}
            <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {recentPeers.map((p) => (
                <li key={p.id} className="flex items-center gap-2 p-2 rounded bg-[#1F2E48]">
                  <div className="h-8 w-8 rounded-full bg-[#FFD35C] text-[#22343D] flex items-center justify-center font-bold">
                    {(p.full_name ?? '?').slice(0,1).toUpperCase()}
                  </div>
                  <div className="text-[#FFE485] text-sm truncate">{p.full_name ?? 'Unknown'}</div>
                </li>
              ))}
              {recentPeers.length === 0 && <p className="text-[#FFE485] text-sm">No connections yet.</p>}
            </ul>
          </div>
          {/* Incoming Requests */}
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">Incoming requests</b>
            <ul className="mt-3 space-y-2">
              {incomingReqs.slice(0,3).map((r) => (
                <li key={r.requester_id} className="flex items-center justify-between p-2 rounded bg-[#1F2E48]">
                  <span className="text-[#FFE485] text-sm">{r.full_name ?? 'Unknown'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(r.requester_id)} className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D]">Accept</button>
                    <button onClick={() => declineRequest(r.requester_id)} className="px-3 py-1 rounded border border-[#FFD35C] text-[#FFD35C]">Decline</button>
                  </div>
                </li>
              ))}
              {incomingReqs.length === 0 && <p className="text-[#FFE485] text-sm">No pending requests.</p>}
            </ul>
          </div>
          {/* Search connections */}
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">Search connections</b>
            <div className="mt-2 flex gap-2">
              <input
                value={search}
                onChange={(e) => onSearchUsers(e.target.value)}
                placeholder="Search people by name…"
                className="flex-1 px-3 py-2 rounded bg-[#1F2E48] text-[#FFE485] border border-[#3A517A]"
              />
            </div>
            {searchLoading && <p className="text-[#FFE485] text-sm mt-2">Searching…</p>}
            {searchErr && <p className="text-red-300 text-sm mt-2">{searchErr}</p>}
            {!searchLoading && !searchErr && search.length >= 2 && (
              <ul className="mt-3 grid gap-2">
                {searchResults.map((p) => (
                  <li key={p.id} className="flex items-center justify-between p-2 rounded bg-[#1F2E48]">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#FFD35C] text-[#22343D] flex items-center justify-center font-bold">
                        {(p.full_name ?? '?').slice(0,1).toUpperCase()}
                      </div>
                      <span className="text-[#FFE485] text-sm">{p.full_name ?? 'Unknown'}</span>
                    </div>
                    <button
                      disabled={connectedIds.has(p.id) || outgoingReqIds.has(p.id)}
                      onClick={() => sendRequest(p.id)}
                      className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D] disabled:opacity-60"
                    >
                      {connectedIds.has(p.id) ? 'Connected' : outgoingReqIds.has(p.id) ? 'Requested' : 'Connect'}
                    </button>
                  </li>
                ))}
                {searchResults.length === 0 && <p className="text-[#FFE485] text-sm">No results.</p>}
              </ul>
            )}
          </div>
        </div>
        {/* Full hosted list moved to /my/hosted */}
        </>
      )}
    </div>
  );
}
