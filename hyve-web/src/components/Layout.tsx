import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <div className="min-h-screen flex flex-col  ">
      <Header />
      <main className={`flex-1 w-full ${isHome ? "p-0" : "mx-auto max-w-6xl p-4"}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
