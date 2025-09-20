import { Outlet, NavLink } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <div className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-40 bg-[var(--hyve-green)]/90 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl" />
          <span className="font-extrabold tracking-tight">Hyve</span>
        </div>
        <nav className="flex items-center gap-6 text-white/90">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            Home
          </NavLink>
          <NavLink
            to="/discover"
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            Discover
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            Events
          </NavLink>
          <NavLink
            to="/host"
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            Host
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="py-10">
      <div className="container mx-auto px-4 text-sm text-white/70">
        © {new Date().getFullYear()} Hyve — Build your hive.
      </div>
    </footer>
  );
}
