export default function Footer() {
    return (
      <footer className="border-t">
        <div className="mx-auto max-w-6xl p-4 text-sm text-gray-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Hyve</span>
          <nav className="flex gap-4">
            <a className="hover:underline" href="/discover">Discover</a>
            <a className="hover:underline" href="/events">Events</a>
            <a className="hover:underline" href="/host">Host</a>
            <a className="hover:underline" href="/dashboard">My Hyve</a>
            <a className="hover:underline" href="#">Privacy</a>
          </nav>
        </div>
      </footer>
    );
  }
  
