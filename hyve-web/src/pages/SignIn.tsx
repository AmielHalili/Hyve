import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/auth";
type Form = { email: string; password: string };

export default function SignIn() {
  const { register, handleSubmit } = useForm<Form>();
  const signIn = useAuthStore(s => s.signIn);

  return (
    <form onSubmit={handleSubmit(signIn)} className="max-w-md space-y-3">
      <h2 className="text-2xl font-semibold">Sign in</h2>
      <input className="border rounded px-3 py-2 w-full" placeholder="Email" {...register("email")} />
      <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Password" {...register("password")} />
      <button className="px-4 py-2 rounded bg-black text-white">Continue</button>
    </form>
  );
}
