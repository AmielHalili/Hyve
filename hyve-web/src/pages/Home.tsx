import ScrollVelocity from './ScrollVelocity';
import CountUp from './CountUp';
import SplitText from '../components/SplitText';

export default function Home() {
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
  </div>
  );
}
