import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useState } from "react";
import FlowingMenu from "./FlowingMenu";


export default function Header() {
    const { user, signOut } = useAuthStore();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF0] border-b border-[#FFD35C]/10">
      <nav className="mx-auto max-w-6xl flex items-center justify-between p-4">
        <Link to="/" className="flex items-center gap-2 text-3xl font-bold text-[#FFD35C] hover:text-[#FFE485] transition-colors will-change-transform hover:animate-float">
          <img src="/images/Hyve.png" alt="Hyve logo" className="h-16 w-16 object-contain" />
          <span>Hyve</span>
        </Link>
        <div className="flex gap-2 sm:gap-4 items-center">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex items-center justify-center h-10 w-12 rounded transition-colors will-change-transform hover:animate-float ${
              open
                ? 'bg-[#22343D] hover:bg-[#22343D]'
                : 'bg-[#FFD35C] hover:bg-[#FFE485]'
            }`}
            aria-expanded={open}
            aria-controls="flowing-menu-overlay"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className="relative inline-block h-4 w-6">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-6 origin-center transition-transform duration-200 ${
                  open ? 'rotate-45 translate-y-[7px] bg-[#FFD35C]' : 'rotate-0 translate-y-0 bg-[#22343D]'
                }`}
              />
              <span
                className={`absolute left-0 bottom-0 block h-0.5 w-6 origin-center transition-transform duration-200 ${
                  open ? '-rotate-45 -translate-y-[7px] bg-[#FFD35C]' : 'rotate-0 translate-y-0 bg-[#22343D]'
                }`}
              />
            </span>
          </button>
          {user ? (
            <button
              onClick={async () => {
                try { await signOut(); } finally {
                  navigate('/', { replace: true });
                  window.location.reload();
                }
              }}
              className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D] hover:bg-gray-400 transition-colors will-change-transform hover:animate-float"
            >
              Sign out
            </button>
          ) : (
            <NavLink to="/signin" className="px-3 py-1 rounded bg-[#FFD35C] text-[#22343D] hover:bg-gray-400 transition-colors will-change-transform hover:animate-float">Sign in</NavLink>
          )}
        </div>
      </nav>
      {open && (
        <div
          id="flowing-menu-overlay"
          className="fixed left-0 right-0 top-20 bottom-0 z-50 bg-[#22343D]"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
            <FlowingMenu
              items={[
                { link: '/events', text: 'Discover', image: 'images/discover.jpg' },
                { link: '/host', text: 'Host', image: 'images/host.png' },
                { link: '/dashboard', text: 'Dashboard', image: 'images/dashboard.jpg' },
              ]}
            />
          </div>
        </div>
      )}
    </header>
  );
}
