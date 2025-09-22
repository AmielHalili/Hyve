import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";
import { PREMADE_TAGS } from "../data/premadeTags";
import { computeLevel } from "../lib/xp";

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [editInterests, setEditInterests] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  // Social links
  const [twitterUrl, setTwitterUrl] = useState<string>('');
  const [instagramUrl, setInstagramUrl] = useState<string>('');
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  // Education/Work profile fields
  const [roleType, setRoleType] = useState<"student" | "workforce" | null>(null);
  const [studentMajor, setStudentMajor] = useState<string | null>(null);
  const [jobCategory, setJobCategory] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState(false);
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
  // Attended section state
  const [attended, setAttended] = useState<{
    id: string;
    slug: string | null;
    title: string;
    location: string;
    starts_at: string;
    cover_url: string | null;
  }[]>([]);
  const [attErr, setAttErr] = useState<string | null>(null);
  const [attLoading, setAttLoading] = useState(false);
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
      if (!user) { setFullName(null); setXp(0); return; }
      // Try to fetch full_name, xp, and role fields; fall back to name-only if columns don't exist
      let prof: any = null;
      const res = await supabase.from('profiles').select('full_name,xp,role_type,student_major,job_category,twitter_url,instagram_url,linkedin_url').eq('id', user.id).maybeSingle();
      if (res.error) {
        const res2 = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
        prof = res2.data ?? null;
      } else {
        prof = res.data ?? null;
      }
      setFullName(prof?.full_name ?? null);
      setSettingsName(prof?.full_name ?? '');
      setXp(Math.max(0, prof?.xp ?? 0));
      setRoleType((prof?.role_type as any) ?? null);
      setStudentMajor(prof?.student_major ?? null);
      setJobCategory(prof?.job_category ?? null);
      setTwitterUrl(prof?.twitter_url ?? '');
      setInstagramUrl(prof?.instagram_url ?? '');
      setLinkedinUrl(prof?.linkedin_url ?? '');
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
      // Award XP (+10) to both users for a successful connection
      try {
        // Current user
        const { data: me } = await supabase.from('profiles').select('xp').eq('id', user.id).maybeSingle();
        const myXp = (me as any)?.xp ?? 0;
        await supabase.from('profiles').update({ xp: (myXp as number) + 10 } as any).eq('id', user.id);
        setXp((prev) => (Number.isFinite(prev) ? prev + 10 : (myXp as number) + 10));
      } catch {}
      try {
        // Requester user
        const { data: other } = await supabase.from('profiles').select('xp').eq('id', requesterId).maybeSingle();
        const otherXp = (other as any)?.xp ?? 0;
        await supabase.from('profiles').update({ xp: (otherXp as number) + 10 } as any).eq('id', requesterId);
      } catch {}
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

      // Attended preview
      setAttLoading(true); setAttErr(null);
      const { data: attData, error: attError } = await supabase
        .from('event_attendance')
        .select('events:events(id,slug,title,location,starts_at,cover_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4);
      if (attError) setAttErr(attError.message); else setAttended((attData ?? []).map((row: any) => row.events));
      setAttLoading(false);
    })();
  }, [user?.id]);
  return (
    <div className="space-y-4 text-[#22343D]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{fullName ? `${fullName.split(' ')[0]}'s Hyve` : 'My Hyve'}</h2>
          <div className="flex items-center gap-2">
            {twitterUrl && (
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-[#FFE485] hover:text-[#FFD35C]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.633 7.997c.013.177.013.355.013.533 0 5.42-4.125 11.67-11.67 11.67-2.32 0-4.475-.677-6.287-1.84.322.038.63.05.965.05 1.92 0 3.686-.653 5.093-1.752a4.118 4.118 0 01-3.846-2.853c.253.038.506.063.772.063.368 0 .736-.05 1.079-.139a4.108 4.108 0 01-3.297-4.032v-.05c.544.304 1.175.493 1.846.518a4.103 4.103 0 01-1.832-3.413c0-.76.203-1.456.558-2.065a11.675 11.675 0 008.475 4.3 4.631 4.631 0 01-.102-.94 4.106 4.106 0 014.106-4.106c1.183 0 2.252.493 3.003 1.283a8.1 8.1 0 002.604-.99 4.11 4.11 0 01-1.804 2.27 8.2 8.2 0 002.367-.63 8.826 8.826 0 01-2.056 2.13z"/></svg>
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[#FFE485] hover:text-[#FFD35C]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"/></svg>
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-[#FFE485] hover:text-[#FFD35C]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.5 8h4V24h-4V8zm7.5 0h3.833v2.167h.05c.534-1.017 1.834-2.084 3.775-2.084 4.034 0 4.784 2.659 4.784 6.117V24h-4v-7.167c0-1.708-.034-3.909-2.384-3.909-2.388 0-2.754 1.867-2.754 3.792V24h-4V8z"/></svg>
              </a>
            )}
          </div>
        </div>
        {user && (
          <button
            onClick={() => { setShowSettings(v => !v); setSaveMsg(null); }}
            className="px-3 py-1 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#FFD35C] hover:shadow-md"
          >
            Settings
          </button>
        )}
      </div>
      {showSettings && user && (
        <div className="mt-3 border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <div className="px-3 py-2 rounded bg-[#FCF6E8] border border-[#22343D]/10">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm mb-1">Full name</label>
              <input
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#FCF6E8] border border-[#22343D]/30"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Twitter</label>
              <input
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#FCF6E8] border border-[#22343D]/30"
                placeholder="https://twitter.com/username"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Instagram</label>
              <input
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#FCF6E8] border border-[#22343D]/30"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">LinkedIn</label>
              <input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#FCF6E8] border border-[#22343D]/30"
                placeholder="https://www.linkedin.com/in/username"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              disabled={savingName}
              onClick={async () => {
                setSavingName(true); setSaveMsg(null);
                const payload: any = {
                  id: user.id,
                  full_name: settingsName || null,
                  twitter_url: twitterUrl || null,
                  instagram_url: instagramUrl || null,
                  linkedin_url: linkedinUrl || null,
                };
                const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
                setSavingName(false);
                if (error) setSaveMsg(`Error: ${error.message}`);
                else {
                  setSaveMsg('Saved');
                  setFullName(settingsName || null);
                }
              }}
              className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D] disabled:opacity-60"
            >
              {savingName ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setShowSettings(false); setSettingsName(fullName ?? ''); setSaveMsg(null); }}
              className="px-3 py-1 rounded border border-[#22343D] text-[#22343D]"
            >
              Close
            </button>
            {saveMsg && <span className="self-center text-sm">{saveMsg}</span>}
          </div>
        </div>
      )}
     
      {/* Buzz Level summary */}
      {user && (
        <>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Buzz Level */}
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10">
            {(() => {
              const info = computeLevel(xp);
              const size = 96;
              const stroke = 8;
              const radius = (size - stroke) / 2;
              const circumference = 2 * Math.PI * radius;
              const dashOffset = Math.max(0, Math.min(1, 1 - info.progress)) * circumference;
              return (
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative" style={{ width: size, height: size }}>
                      <svg width={size} height={size} className="block">
                        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1F2E48" strokeWidth={stroke} />
                        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#FFD35C"
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                          />
                        </g>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[#22343D] text-2xl font-semibold">{info.level}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">Buzz Level</div>
                      <div className="text-xs">Buzz Points: {info.totalXp}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">{info.xpIntoLevel}/{info.xpForNextLevel} to next Buzz Level</div>
                  </div>
                </div>
              );
            })()}
          </div>
          {/* Education / Work */}
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10">
            <div className="flex items-center justify-between">
              <b>Education / Work</b>
              <button
                onClick={() => { setEditingRole((v) => !v); setRoleMsg(null); }}
                className="px-3 py-1 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#FFD35C] hover:shadow-md"
              >
                {editingRole ? 'Done' : 'Edit'}
              </button>
            </div>
            {!editingRole && (
              <div className="mt-2 text-sm space-y-1">
                <div>Role: {roleType ? (roleType === 'student' ? 'Student' : 'Workforce') : 'Not set'}</div>
                {roleType === 'student' && <div>Major: {studentMajor ?? 'Not set'}</div>}
                {roleType === 'workforce' && <div>Job category: {jobCategory ?? 'Not set'}</div>}
              </div>
            )}
            {editingRole && (
              <>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setRoleType('student'); setRoleMsg(null); }}
                    className={`px-3 py-1 rounded border text-sm ${roleType === 'student' ? 'bg-[#FFD35C] text-[#22343D] border-transparent' : 'text-[#FFE485] border-[#FFD35C]'}`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => { setRoleType('workforce'); setRoleMsg(null); }}
                    className={`px-3 py-1 rounded border text-sm ${roleType === 'workforce' ? 'bg-[#FFD35C] text-[#22343D] border-transparent' : 'text-[#FFE485] border-[#FFD35C]'}`}
                  >
                    Workforce
                  </button>
                </div>
                {roleType === 'student' && (
                  <div className="mt-3">
                    <label className="block text-sm text-[#FFE485] mb-1">Major</label>
                    <select
                      value={studentMajor ?? ''}
                      onChange={(e) => setStudentMajor(e.target.value || null)}
                      className="w-full px-3 py-2 rounded bg-[#1F2E48] text-[#FFE485] border border-[#3A517A]"
                    >
                      <option value="">Select a major…</option>
                      {['Computer Science','Business','Engineering','Design','Biology','Psychology','Economics','Communications','Mathematics','Other'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
                {roleType === 'workforce' && (
                  <div className="mt-3">
                    <label className="block text-sm text-[#FFE485] mb-1">Job category</label>
                    <select
                      value={jobCategory ?? ''}
                      onChange={(e) => setJobCategory(e.target.value || null)}
                      className="w-full px-3 py-2 rounded bg-[#1F2E48] text-[#FFE485] border border-[#3A517A]"
                    >
                      <option value="">Select a category…</option>
                      {['Software Engineering','Product Management','Design','Data/AI','Marketing','Sales','Operations','Finance','HR/People','Other'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    disabled={savingRole}
                    onClick={async () => {
                      if (!user) return;
                      setSavingRole(true); setRoleMsg(null);
                      try {
                        const payload: any = { id: user.id, role_type: roleType };
                        if (roleType === 'student') { payload.student_major = studentMajor ?? null; payload.job_category = null; }
                        else if (roleType === 'workforce') { payload.job_category = jobCategory ?? null; payload.student_major = null; }
                        const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
                        if (error) setRoleMsg(`Error: ${error.message}`); else setRoleMsg('Saved');
                      } finally {
                        setSavingRole(false);
                      }
                    }}
                    className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D] disabled:opacity-60"
                  >
                    {savingRole ? 'Saving…' : 'Save'}
                  </button>
                  {roleMsg && <span className="text-sm text-[#FFE485]">{roleMsg}</span>}
                </div>
              </>
            )}
          </div>
        </div>
        </>
      )}
      
      {!user && <div className="min-h-1/2 bg-white text-[#22343D] flex items-center justify-center px-6">
        <div className="w-full max-w-xl space-y-3 text-center">
          <h2 className="text-3xl font-semibold ">You must be signed in to view Dasboard</h2>
          <p className="text-gray-600"></p>
            <Link to="/signin" className="px-4 py-2 inline-block rounded bg-[#22343D] text-[#FCF6E8] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:text-[#22343D] hover:shadow-lg">Sign in</Link>
        </div>
      </div>}
      {user && (
        <>
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10 md:col-span-3">
            <div className="flex items-center justify-between">
              <b>Your interests</b>
              {user && (
                <button
                  onClick={() => { setEditInterests((v) => !v); setNewInterest(''); }}
                  className="px-3 py-1 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#FFD35C] hover:shadow-md"
                >
                  {editInterests ? 'Done' : 'Edit'}
                </button>
              )}
            </div>
            {err && <p className="text-red-600 text-sm">{err}</p>}
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
              {tags.length === 0 && <p className="text-sm">You have no interests yet.</p>}
            </div>
            {editInterests && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add interest"
                  className="px-3 py-1 rounded bg-[#FCF6E8] border border-[#22343D]/30"
                />
                <button
                  onClick={() => { if (newInterest.trim()) { addTag(newInterest.trim()); setNewInterest(''); } }}
                  className="px-3 py-1 rounded bg-[#22343D] text-[#FCF6E8] transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#FFD35C] hover:text-[#22343D]"
                >
                  Add
                </button>
                <div className="flex flex-wrap gap-2 ml-2">
                  {PREMADE_TAGS.map((t) => (
                    <button key={t} onClick={() => addTag(t)} className="px-3 py-1 rounded-full border text-[#22343D] border-[#FFD35C] text-sm hover:bg-[#FFD35C]">
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left column: RSVPs + Attended in one card with divider */}
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10 space-y-6">
            {/* RSVPs preview */}
            <div>
              <div className="flex items-center justify-between">
                <b>My RSVPs</b>
                <Link to="/my/rsvps" className="text-sm underline">Show all</Link>
              </div>
              {rsvpLoading && <p className="text-sm mt-2">Loading…</p>}
              {rsvpErr && <p className="text-red-600 text-sm mt-2">{rsvpErr}</p>}
              {!rsvpLoading && !rsvpErr && (
                <div className="mt-3 grid gap-3">
                  {rsvps.map((e) => (
                    <Link key={e.id} to={`/events/${e.slug ?? e.id}`} className="flex gap-3 p-2 rounded hover:bg-white/40">
                      {e.cover_url ? (
                        <img src={e.cover_url} alt="" className="w-20 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-20 h-14 bg-gray-600/40 rounded" />
                      )}
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-[#22343D]/80 text-xs">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
                      </div>
                    </Link>
                  ))}
                  {rsvps.length === 0 && (
                    <p className="text-sm">You haven’t RSVPed to any events yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="my-1 h-px bg-[#22343D]/10" />

            {/* Attended preview under RSVPs */}
            <div>
              <div className="flex items-center justify-between">
                <b>Attended</b>
                <Link to="/my/attended" className="text-sm underline">Show all</Link>
              </div>
              {attLoading && <p className="text-sm mt-2">Loading…</p>}
              {attErr && <p className="text-red-600 text-sm mt-2">{attErr}</p>}
              {!attLoading && !attErr && (
                <div className="mt-3 grid gap-3">
                  {attended.map((e) => (
                    <Link key={e.id} to={`/events/${e.slug ?? e.id}`} className="flex gap-3 p-2 rounded hover:bg-white/40">
                      {e.cover_url ? (
                        <img src={e.cover_url} alt="" className="w-20 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-20 h-14 bg-gray-600/40 rounded" />
                      )}
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-[#22343D]/80 text-xs">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
                      </div>
                    </Link>
                  ))}
                  {attended.length === 0 && (
                    <p className="text-sm">No attended events yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Hosted preview */}
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10">
            <div className="flex items-center justify-between">
              <b>Hosted Events</b>
              <Link to="/my/hosted" className="text-sm underline">Show all</Link>
            </div>
            {hostLoading && <p className="text-sm mt-2">Loading…</p>}
            {hostErr && <p className="text-red-600 text-sm mt-2">{hostErr}</p>}
            {!hostLoading && !hostErr && (
              <div className="mt-3 grid gap-3">
                {hosted.map((e) => (
                  <Link key={e.id} to={`/events/${e.slug ?? e.id}`} className="flex gap-3 p-2 rounded hover:bg-white/40">
                    {e.cover_url ? (
                      <img src={e.cover_url} alt="" className="w-20 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-14 bg-gray-600/40 rounded" />
                    )}
                    <div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-[#22343D]/80 text-xs">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
                    </div>
                  </Link>
                ))}
                {hosted.length === 0 && (
                  <p className="text-sm">You haven’t hosted any events yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Network section */}
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">Network</h3>
          {/* Connections */}
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10">
            <div className="flex items-center justify-between">
              <b>Connections</b>
              <Link to="/connections" className="text-sm underline">See all</Link>
            </div>
            {netErr && <p className="text-red-600 text-sm mt-2">{netErr}</p>}
            <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {recentPeers.map((p) => (
                <li key={p.id} className="p-2 rounded bg-[#FCF6E8] border border-[#22343D]/10">
                  <Link to={`/profile/${p.id}`} className="flex items-center gap-2 hover:opacity-90">
                    <div className="h-8 w-8 rounded-full bg-[#FFD35C] text-[#22343D] flex items-center justify-center font-bold">
                      {(p.full_name ?? '?').slice(0,1).toUpperCase()}
                    </div>
                    <div className="text-sm truncate">{p.full_name ?? 'Unknown'}</div>
                  </Link>
                </li>
              ))}
              {recentPeers.length === 0 && <p className="text-sm">No connections yet.</p>}
            </ul>
          </div>
          {/* Incoming Requests */}
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10">
            <b>Incoming requests</b>
            <ul className="mt-3 space-y-2">
              {incomingReqs.slice(0,3).map((r) => (
                <li key={r.requester_id} className="flex items-center justify-between p-2 rounded bg-[#FCF6E8] border border-[#22343D]/10">
                  <span className="text-sm">{r.full_name ?? 'Unknown'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(r.requester_id)} className="px-3 py-1 rounded bg-[#22343D] text-[#FCF6E8] transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#FFD35C] hover:text-[#22343D]">Accept</button>
                    <button onClick={() => declineRequest(r.requester_id)} className="px-3 py-1 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#FFD35C]">Decline</button>
                  </div>
                </li>
              ))}
              {incomingReqs.length === 0 && <p className="text-sm">No pending requests.</p>}
            </ul>
          </div>
          {/* Search connections */}
          <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10">
            <b>Search connections</b>
            <div className="mt-2 flex gap-2">
              <input
                value={search}
                onChange={(e) => onSearchUsers(e.target.value)}
                placeholder="Search people by name…"
                className="flex-1 px-3 py-2 rounded bg-[#FCF6E8] border border-[#22343D]/30"
              />
            </div>
            {searchLoading && <p className="text-sm mt-2">Searching…</p>}
            {searchErr && <p className="text-red-600 text-sm mt-2">{searchErr}</p>}
            {!searchLoading && !searchErr && search.length >= 2 && (
              <ul className="mt-3 grid gap-2">
                {searchResults.map((p) => (
                  <li key={p.id} className="flex items-center justify-between p-2 rounded bg-[#FCF6E8] border border-[#22343D]/10">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#FFD35C] text-[#22343D] flex items-center justify-center font-bold">
                        {(p.full_name ?? '?').slice(0,1).toUpperCase()}
                      </div>
                      <span className="text-sm">{p.full_name ?? 'Unknown'}</span>
                    </div>
                    <button
                      disabled={connectedIds.has(p.id) || outgoingReqIds.has(p.id)}
                      onClick={() => sendRequest(p.id)}
                      className="px-3 py-1 rounded bg-[#22343D] text-[#FCF6E8] disabled:opacity-60 transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#FFD35C] hover:text-[#22343D]"
                    >
                      {connectedIds.has(p.id) ? 'Connected' : outgoingReqIds.has(p.id) ? 'Requested' : 'Connect'}
                    </button>
                  </li>
                ))}
                {searchResults.length === 0 && <p className="text-sm">No results.</p>}
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
