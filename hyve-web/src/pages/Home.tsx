export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src="/images/HyveBG.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover z-0"
        loading="lazy"
      />
      <div className="absolute inset-0  z-0" />

      <section className="relative z-10 grid gap-6 md:grid-cols-2 items-center p-6 md:p-10 pt-24 md:pt-32 pb-16">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#22343D]">
            Find or host local events — build your Hyve.
          </h1>
          <p className="text-[#22343D]">
            Hyve helps you discover nearby meetups and gatherings, and makes it easy to host your own.
          </p>
          <div className="flex gap-3">
            <a href="/discover" className="px-4 py-2 rounded bg-[#FFD35C] text-[#22343D]">Discover events</a>
            <a href="/host" className="px-4 py-2 rounded border text-[#22343D]">Host an event</a>
          </div>
        </div>
        <div className="rounded-xl border p-6 bg-[#F5EBDB]">
          <p className="font-medium mb-2 text-black">What you can do</p>
          <ul className="list-disc pl-6 text-black space-y-1">
            <li>Browse local events by date and location</li>
            <li>View event details and RSVP</li>
            <li>Create and manage events as a host</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
