import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

export default function AttendEvent() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const token = sp.get('t') || '';
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'error' | 'ok' | 'signin'>('loading');
  const [message, setMessage] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!slug) { setStatus('error'); setMessage('Invalid event.'); return; }
      // Require auth to mark attendance
      if (!user) { setStatus('signin'); return; }

      // Fetch event and token to verify
      const { data: ev, error } = await supabase
        .from('events')
        .select('id,title,attend_token')
        .eq('slug', slug)
        .maybeSingle();
      if (error || !ev) { setStatus('error'); setMessage(error?.message || 'Event not found.'); return; }
      setEventTitle(ev.title);
      if (!ev.attend_token) { setStatus('error'); setMessage('Attendance not enabled for this event.'); return; }
      if (ev.attend_token !== token) { setStatus('error'); setMessage('Invalid or expired check-in link.'); return; }

      // Check if already attended
      const { data: existed } = await supabase
        .from('event_attendance')
        .select('event_id')
        .eq('event_id', ev.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existed) {
        setStatus('ok');
        setMessage('You are already checked in.');
        return;
      }

      // Insert attendance
      const { error: insErr } = await supabase
        .from('event_attendance')
        .insert({ event_id: ev.id, user_id: user.id });
      if (insErr) { setStatus('error'); setMessage(insErr.message); return; }

      // Award +25 XP on first check-in
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .maybeSingle();
        const currentXp = (prof as any)?.xp ?? 0;
        await supabase
          .from('profiles')
          .update({ xp: (currentXp as number) + 25 } as any)
          .eq('id', user.id);
      } catch {}

      setStatus('ok');
      setMessage('Checked in! +25 Buzz Points');
    })();
  }, [slug, token, user?.id]);

  if (status === 'signin') {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center px-6">
        <div className="border rounded-xl p-6 bg-[#FCF6E8] border-[#22343D]/10 text-[#22343D] max-w-lg w-full text-center space-y-3">
          <h2 className="text-2xl font-semibold">Sign in to check in</h2>
          <p className="text-gray-700">You must be signed in to mark attendance.</p>
          <Link to={`/signin`} className="px-4 py-2 inline-block rounded bg-[#22343D] text-[#FCF6E8] hover:bg-[#FFD35C] hover:text-[#22343D] transition-colors">Sign in</Link>
        </div>
      </div>
    );
  }

  if (status === 'loading') return <p className="text-[#22343D]">Confirming your attendance…</p>;
  if (status === 'error') return (
    <div className="border rounded-xl p-4 bg-[#FCF6E8] border-[#22343D]/10 text-[#22343D] max-w-lg">
      <p className="text-red-600">{message}</p>
    </div>
  );

  return (
    <div className="border rounded-xl p-6 bg-[#FCF6E8] border-[#22343D]/10 text-[#22343D] max-w-lg space-y-3">
      <h2 className="text-2xl font-semibold">You're checked in!</h2>
      <p>Thanks for attending{eventTitle ? ` ${eventTitle}` : ''}.</p>
      <div className="flex gap-2">
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:shadow-lg">Go back</button>
        <Link to="/dashboard" className="px-4 py-2 rounded bg-[#22343D] text-[#FCF6E8] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:text-[#22343D] hover:shadow-lg">View Dashboard</Link>
      </div>
    </div>
  );
}
