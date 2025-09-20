export default function Home() {
    return (
      <section className="grid gap-6 md:grid-cols-2 items-center ">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#F2F0EF]">
            Find or host local events — build your Hyve.
          </h1>
          <p className="text-[#F2F0EF]">
            Hyve helps you discover nearby meetups and gatherings, and makes it easy to host your own.
          </p>
          <div className="flex gap-3">
            <a href="/discover" className="px-4 py-2 rounded bg-[#FFD35C] text-[#2C4063]">Discover events</a>
            <a href="/host" className="px-4 py-2 rounded border text-[#F2F0EF]">Host an event</a>
          </div>
        </div>
        <div className="rounded-xl border p-6 bg-[#2C4063]">
          <p className="font-medium mb-2 text-[#F2F0EF]">What you can do</p>
          <ul className="list-disc pl-6 text-[#F2F0EF] space-y-1">
            <li>Browse local events by date and location</li>
            <li>View event details and RSVP</li>
            <li>Create and manage events as a host</li>
          </ul>
        </div>
      </section>
    );
  }
