import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1A2738] text-white">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl p-4 ">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
