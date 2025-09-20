import { Link, NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className=" bg-[#1A2738] backdrop-blur sticky top-0 z-40 border-[#2C4063]">
      <nav className="mx-auto max-w-6xl flex items-center justify-between p-4">
        <Link to="/" className="text-xl font-bold text-[#FFD35C] hover:text-[#FFE485] transition-colors">
          Hyve
        </Link>
        <div className="flex gap-2 sm:gap-4">
          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `px-3 py-1 rounded transition-colors ${
                isActive
                  ? "bg-[#FFD35C] text-[#2C4063] font-medium"
                  : "text-[#FFE485] hover:bg-[#FFD35C]/20 hover:text-[#FFD35C]"
              }`
            }
          >
            Discover
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `px-3 py-1 rounded transition-colors ${
                isActive
                  ? "bg-[#FFD35C] text-[#2C4063] font-medium"
                  : "text-[#FFE485] hover:bg-[#FFD35C]/20 hover:text-[#FFD35C]"
              }`
            }
          >
            Events
          </NavLink>
          <NavLink
            to="/host"
            className={({ isActive }) =>
              `px-3 py-1 rounded transition-colors ${
                isActive
                  ? "bg-[#FFD35C] text-[#2C4063] font-medium"
                  : "text-[#FFE485] hover:bg-[#FFD35C]/20 hover:text-[#FFD35C]"
              }`
            }
          >
            Host
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-3 py-1 rounded transition-colors ${
                isActive 
                  ? "bg-[#FFD35C] text-[#2C4063] font-medium" 
                  : "text-[#FFE485] hover:bg-[#FFD35C]/20 hover:text-[#FFD35C]"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/signin"
            className="px-3 py-1 rounded transition-colors text-[#FFE485] hover:bg-[#FFD35C]/20 hover:text-[#FFD35C]"
          >
            Sign in
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
