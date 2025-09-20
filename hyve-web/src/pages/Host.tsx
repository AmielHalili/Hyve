import { useForm } from "react-hook-form";

type Form = {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

export default function Host() {
  const { register, handleSubmit, reset } = useForm<Form>();

  const onSubmit = (data: Form) => {
    console.log("Create event", data);
    // TODO: replace with api call e.g. api.post('/events', data)
    reset();
    alert("Event created (mock)");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-3">
      <h2 className="text-2xl font-semibold text-[#FFD35C]">Host an event</h2>
      <input className="border rounded px-3 py-2 w-full bg-[#2C4063] text-[#FFE485]" placeholder="Title" {...register("title", { required: true })} />
      <div className="grid grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2 w-full bg-[#2C4063] text-[#FFE485]" type="date" {...register("date", { required: true })} />
        <input className="border rounded px-3 py-2 w-full bg-[#2C4063] text-[#FFE485]" type="time" {...register("time", { required: true })} />
      </div>
      <input className="border rounded px-3 py-2 w-full bg-[#2C4063] text-[#FFE485]" placeholder="Location" {...register("location", { required: true })} />
      <textarea className="border rounded px-3 py-2 w-full bg-[#2C4063] text-[#FFE485]" placeholder="Description" rows={5} {...register("description")}></textarea>
      <button className="px-4 py-2 rounded bg-[#FFD35C] text-[#2C4063]">Create event</button>
    </form>
  );
}

