import { useParams } from "react-router-dom";

export default function PropertyDetail() {
  const { id } = useParams();
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video rounded-xl bg-[#2C4063]" />
        <h2 className="text-2xl font-semibold text-[#FFD35C]">Property {id}</h2>
        <p className="text-[#FFE485]">Nice place with great light. 2BR · 1BA · 950 sqft.</p>
      </div>
      <aside className="border rounded-xl p-4 h-fit bg-[#2C4063]">
        <div className="text-xl font-semibold mb-2 text-[#FFD35C]">$2,800/mo</div>
        <button className="w-full px-4 py-2 rounded bg-[#FFD35C] text-[#2C4063]">Request a tour</button>
        <button className="w-full mt-2 px-4 py-2 rounded border text-[#FFD35C]">Apply now</button>
      </aside>
    </div>
  );
}
