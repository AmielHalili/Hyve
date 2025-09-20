import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/auth";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";

type Form = { email: string; password: string };

export default function SignIn() {
  const { register, handleSubmit } = useForm<Form>();
  const { user, signInWithPassword, signInWithOAuth } = useAuthStore();
  const [err, setErr] = useState<string | null>(null);

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async ({ email, password }: Form) => {
    setErr(null);
    const res = await signInWithPassword(email, password);
    if (res.error) {
      setErr(
        res.error === "Failed to fetch"
          ? "Network error. Check Supabase CORS Allowed Origins (add your dev URL, e.g. http://localhost:5173))."
          : res.error
      );
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
    <div className="max-w-md w-full space-y-4 text-black px-4">
      <h2 className="text-2xl font-semibold">Sign in</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Email" {...register("email", { required: true })} />
        <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Password" {...register("password", { required: true })} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="px-4 py-2 rounded bg-[#FFD35C] text-[#22343D] w-full">Sign in</button>
      </form>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => signInWithOAuth("google")} className="border rounded px-4 py-2">Continue with Google</button>
        <button onClick={() => signInWithOAuth("github")} className="border rounded px-4 py-2">Continue with GitHub</button>
      </div>

      <p className="text-sm">
        Don’t have an account? <Link to="/signup" className="underline">Create account</Link>
      </p>
    </div>
    </div>
  );
}
