import { useAuthStore } from "../store/auth";

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#FFD35C]">My Hyve</h2>
      {!user && <p className="text-[#FFE485]">Sign in to view your RSVPs and hosted events.</p>}
      {user && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">RSVPs</b>
            <p className="text-[#FFE485]">3 upcoming</p>
          </div>
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">Hosted</b>
            <p className="text-[#FFE485]">1 planned</p>
          </div>
          <div className="border rounded-xl p-4 bg-[#2C4063]">
            <b className="text-[#FFD35C]">Invites</b>
            <p className="text-[#FFE485]">2 awaiting response</p>
          </div>
        </div>
      )}
    </div>
  );
}
