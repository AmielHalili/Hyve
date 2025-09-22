import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';

type Peer = { id: string; full_name: string | null };

export default function Connections() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) { setPeers([]); setLoading(false); return; }
      setLoading(true); setError(null);
      const { data: rows, error } = await supabase
        .from('user_connections')
        .select('user_id,peer_id,created_at')
        .or(`user_id.eq.${user.id},peer_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) { setError(error.message); setLoading(false); return; }
      const ids = new Set<string>();
      (rows ?? []).forEach((r: any) => {
        const pid = r.user_id === user.id ? r.peer_id : r.user_id;
        ids.add(pid);
      });
      const idList = Array.from(ids);
      if (idList.length === 0) { setPeers([]); setLoading(false); return; }
      const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id,full_name')
        .in('id', idList);
      if (pErr) { setError(pErr.message); setLoading(false); return; }
      const byId: Record<string, any> = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
      setPeers(idList.map((id) => ({ id, full_name: byId[id]?.full_name ?? null })));
      setLoading(false);
    })();
  }, [user?.id]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return peers;
    return peers.filter((p) => (p.full_name ?? '').toLowerCase().includes(s));
  }, [q, peers]);

  async function disconnect(peerId: string) {
    if (!user) return;
    // Delete both directed edges explicitly
    await supabase.from('user_connections').delete().match({ user_id: user.id, peer_id: peerId });
    await supabase.from('user_connections').delete().match({ user_id: peerId, peer_id: user.id });
    setPeers((cur) => cur.filter((p) => p.id !== peerId));
  }

  if (!user) return <p className="text-[#22343D]">Sign in to view connections.</p>;

  return (
    <div className="text-[#22343D]">
      <h2 className="text-2xl font-semibold mb-4">All connections</h2>
      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search connections by name…"
          className="w-full max-w-md px-3 py-2 rounded bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border border-[#22343D]/30"
        />
      </div>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <ul className="grid gap-2">
          {filtered.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-3 rounded bg-[#FCF6E8] border border-[#22343D]/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <Link to={`/profile/${p.id}`} className="flex items-center gap-3 hover:opacity-90">
                <div className="h-9 w-9 rounded-full bg-[#FFD35C] text-[#22343D] flex items-center justify-center font-bold">
                  {(p.full_name ?? '?').slice(0,1).toUpperCase()}
                </div>
                <span className="">{p.full_name ?? 'Unknown'}</span>
              </Link>
              <button onClick={() => disconnect(p.id)} className="px-3 py-1 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:shadow-lg">
                Disconnect
              </button>
            </li>
          ))}
          {filtered.length === 0 && <p>No connections found.</p>}
        </ul>
      )}
    </div>
  );
}
