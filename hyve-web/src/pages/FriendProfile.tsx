import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { computeLevel } from '../lib/xp';
import { useAuthStore } from '../store/auth';

type Profile = {
  id: string;
  full_name: string | null;
  xp: number;
  role_type: 'student' | 'workforce' | null;
  student_major: string | null;
  job_category: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
};

export default function FriendProfile() {
  const { id } = useParams();
  const me = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) { setError('No profile id'); setLoading(false); return; }
      setLoading(true); setError(null);
      const [{ data: p, error: pErr }, { data: t, error: tErr }] = await Promise.all([
        supabase.from('profiles').select('id,full_name,xp,role_type,student_major,job_category,twitter_url,instagram_url,linkedin_url').eq('id', id).maybeSingle(),
        supabase.from('tags').select('id,name').eq('owner_id', id).order('name'),
      ]);
      if (pErr) { setError(pErr.message); setLoading(false); return; }
      if (tErr) { setError(tErr.message); setLoading(false); return; }
      setProfile(p as any);
      setTags(t ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <p className="text-[#FFE485]">Loading…</p>;
  if (error) return <p className="text-red-300">{error}</p>;
  if (!profile) return <p className="text-[#FFE485]">Profile not found.</p>;

  const name = profile.full_name ?? 'Unknown';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-[#FFD35C]">{name}</h2>
          <div className="flex items-center gap-2 text-[#FFE485]">
            {profile.twitter_url && (
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-[#FFD35C]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.633 7.997c.013.177.013.355.013.533 0 5.42-4.125 11.67-11.67 11.67-2.32 0-4.475-.677-6.287-1.84.322.038.63.05.965.05 1.92 0 3.686-.653 5.093-1.752a4.118 4.118 0 01-3.846-2.853c.253.038.506.063.772.063.368 0 .736-.05 1.079-.139a4.108 4.108 0 01-3.297-4.032v-.05c.544.304 1.175.493 1.846.518a4.103 4.103 0 01-1.832-3.413c0-.76.203-1.456.558-2.065a11.675 11.675 0 008.475 4.3 4.631 4.631 0 01-.102-.94 4.106 4.106 0 014.106-4.106c1.183 0 2.252.493 3.003 1.283a8.1 8.1 0 002.604-.99 4.11 4.11 0 01-1.804 2.27 8.2 8.2 0 002.367-.63 8.826 8.826 0 01-2.056 2.13z"/></svg>
              </a>
            )}
            {profile.instagram_url && (
              <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-[#FFD35C]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"/></svg>
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-[#FFD35C]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.5 8h4V24h-4V8zm7.5 0h3.833v2.167h.05c.534-1.017 1.834-2.084 3.775-2.084 4.034 0 4.784 2.659 4.784 6.117V24h-4v-7.167c0-1.708-.034-3.909-2.384-3.909-2.388 0-2.754 1.867-2.754 3.792V24h-4V8z"/></svg>
              </a>
            )}
          </div>
        </div>
        {me?.id === profile.id && (
          <Link className="text-sm underline text-[#FFE485]" to="/dashboard">Edit my profile</Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 bg-[#2C4063] md:col-span-2">
          <b className="text-[#FFD35C]">About</b>
          <div className="mt-2 text-[#FFE485] text-sm space-y-1">
            <div>Role: {profile.role_type ? (profile.role_type === 'student' ? 'Student' : 'Workforce') : 'Not set'}</div>
            {profile.role_type === 'student' && <div>Major: {profile.student_major ?? 'Not set'}</div>}
            {profile.role_type === 'workforce' && <div>Job category: {profile.job_category ?? 'Not set'}</div>}
          </div>
        </div>
        <div className="space-y-4">
          {/* Buzz Level */}
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            {(() => {
              const info = computeLevel(profile.xp || 0);
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
                        <span className="text-[#FFD35C] text-2xl font-semibold">{info.level}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[#FFE485] text-sm">Buzz Level</div>
                      <div className="text-[#FFE485] text-xs">Buzz Points: {info.totalXp}</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Interests */}
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">Interests</b>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t.id} className="px-3 py-1 rounded-full bg-[#FFD35C] text-[#22343D] text-sm">{t.name}</span>
              ))}
              {tags.length === 0 && <p className="text-[#FFE485] text-sm">No interests listed.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
