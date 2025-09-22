import { useEffect, useState } from 'react';
import ScrollVelocity from './ScrollVelocity';
import CountUp from './CountUp';
import SplitText from '../components/SplitText';
import { supabase } from '../lib/supabase';
import { computeLevel } from '../lib/xp';

type Leader = { id: string; full_name: string | null; xp: number };

export default function Home() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbErr, setLbErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLbLoading(true); setLbErr(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('id,full_name,xp')
        .order('xp', { ascending: false })
        .limit(10);
      setLbLoading(false);
      if (error) { setLbErr(error.message); return; }
      setLeaders((data ?? []).map((p: any) => ({ id: p.id, full_name: p.full_name ?? null, xp: Math.max(0, p.xp ?? 0) })));
    })();
  }, []);
  return (
    <div>
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src="/images/HyveBG.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover z-0"
        loading="lazy"
      />
      <div className="absolute inset-0  z-0" />

      <div className="relative z-10 w-full flex items-center p-6 md:p-10 pt-24 md:pt-32 pb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img src="/images/Hyve.png" alt="Hyve logo" className="h-28 w-28 md:h-80 md:w-80 object-contain" />
            <SplitText
              text="Hyve"
              className="text-5xl md:text-8xl font-extrabold text-[#22343D] py-10"
              delay={300}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="left"
              onLetterAnimationComplete={() => {
                console.log('All letters have animated!');
              }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#22343D]">
            The networking hub for professionals.
          </h1>
          
          <p className="text-[#22343D]">
            Hyve helps you discover and host local, professional meetups — then connect with people who share your interests, roles, and skills.
          </p>
          
          <div className="flex gap-3">
            <a
              href="/events"
              className="px-4 py-2 rounded bg-[#FFD35C] text-[#22343D] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#22343D] hover:text-[#FFD35C] hover:shadow-lg"
            >
              Discover events
            </a>
            <a
              href="/host"
              className="px-4 py-2 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#22343D] hover:text-[#FFD35C] hover:shadow-lg"
            >
              Host an event
            </a>
          </div>
        </div>
       
      </div>
      <div className="mt-24">
            <ScrollVelocity
              texts={["Connect-Host-Discover", "Build Your Hyve"]}
              velocity={100}
              className="custom-scroll-text text-[#22343D]"
              parallaxClassName="py-2 pr-4"
              scrollerClassName="opacity-80"
            />
          </div>
      
    </div>
    <div className="bg-[#FCF6E8] z-50">
    <div className="max-w-6xl mx-auto px-6 md:px-20 py-6 md:py-40 text-center">
      <p className="text-[#22343D] text-4xl md:text-5xl font-semibold">Join our community:</p>
      <div className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-[#22343D] items-center justify-center">
        <div className="flex items-baseline gap-2">
          <CountUp from={0} to={50000} duration={1.5} separator="," className="text-3xl md:text-4xl font-extrabold text-[#22343D]" />
          <span className="text-2xl md:text-3xl font-extrabold text-[#22343D]">+</span>
          <span className="opacity-80 text-2xl md:text-3xl">professionals</span>
        </div>
        <div className="flex items-baseline gap-2">
          <CountUp from={0} to={20000} duration={1.5} separator="," className="text-3xl md:text-4xl font-extrabold text-[#22343D]" />
          <span className="text-2xl md:text-3xl font-extrabold text-[#22343D]">+</span>
          <span className="opacity-80 text-2xl md:text-3xl">mentors</span>
        </div>
        <div className="flex items-baseline gap-2">
          <CountUp from={0} to={1000} duration={1.5} separator="," className="text-3xl md:text-4xl font-extrabold text-[#22343D]" />
          <span className="text-2xl md:text-3xl font-extrabold text-[#22343D]">+</span>
          <span className="opacity-80 text-2xl md:text-3xl">companies</span>
        </div>
      </div>
  </div>
  </div>
  {/* Networking + Build your Hyve */}
  <section className="relative mt-0">
    <img
      src="/images/host.png"
      alt="Networking background"
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-white/70" />
    <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-20 py-16 md:py-24">
      <h2 className="text-3xl md:text-4xl font-semibold text-[#22343D]">Network smarter. Build your Hyve.</h2>
      <p className="mt-3 max-w-3xl text-[#22343D]/90">
        Meet people who share your interests, roles, and goals. Attend local meetups,
        host your own events, and turn casual hellos into lasting connections.
        Hyve makes it easy to discover, connect, and grow your professional circle.
      </p>
      <div className="mt-6 flex gap-3">
        <a href="/events" className="px-4 py-2 rounded bg-[#22343D] text-[#FFD35C] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:text-[#22343D] hover:shadow-lg">Find events</a>
        <a href="/host" className="px-4 py-2 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#22343D] hover:text-[#FFD35C] hover:shadow-lg">Host one</a>
      </div>
    </div>
  </section>

  {/* Level Up CTA */}
  <section className="bg-[#FCF6E8]">
    <div className="max-w-6xl mx-auto px-6 md:px-20 py-14 md:py-20 text-center">
      <h3 className="text-3xl md:text-4xl font-extrabold text-[#22343D]">Level Up and Become the Highest Connector</h3>
      <p className="mt-3 text-[#22343D]/90">
        Earn Buzz Points by hosting, connecting, and attending. Climb the ranks and showcase your network on the leaderboard.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <a href="/dashboard" className="px-4 py-2 rounded bg-[#FFD35C] text-[#22343D] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:shadow-lg">Track my Buzz Level</a>
        <a href="/connections" className="px-4 py-2 rounded border border-[#22343D] text-[#22343D] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#22343D] hover:text-[#FFD35C] hover:shadow-lg">Grow connections</a>
      </div>
    </div>
  </section>

  {/* Leaderboard */}
  <section className="bg-[#FFFDF0] border-t border-[#FFD35C]/10">
    <div className="max-w-6xl mx-auto px-6 md:px-20 py-14 md:py-20">
      <h3 className="text-2xl md:text-3xl font-semibold text-[#22343D]">Top Connectors</h3>
      {lbLoading && <p className="text-[#22343D] mt-3">Loading leaderboard…</p>}
      {lbErr && <p className="text-red-600 mt-3">{lbErr}</p>}
      {!lbLoading && !lbErr && (
        <ol className="mt-4 grid gap-2">
          {leaders.map((u, idx) => {
            const info = computeLevel(u.xp);
            return (
              <li key={u.id} className="flex items-center justify-between p-3 rounded bg-white/70 border border-[#22343D]/10 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center font-bold text-[#22343D]">#{idx + 1}</span>
                  <span className="font-medium text-[#22343D]">{u.full_name ?? 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#22343D]/80">Buzz Points: {info.totalXp}</span>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#22343D] text-[#FFD35C] font-bold">{info.level}</span>
                </div>
              </li>
            );
          })}
          {leaders.length === 0 && (
            <li className="text-[#22343D]/80">No data yet. Be the first to connect and host!</li>
          )}
        </ol>
      )}
    </div>
  </section>
  </div>
  );
}
