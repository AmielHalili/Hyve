import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/auth";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

type Form = { name: string; email: string; password: string };

export default function SignUp() {
  const { register, handleSubmit } = useForm<Form>();
  const { user, signUpWithPassword } = useAuthStore();
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async ({ name, email, password }: Form) => {
    setErr(null);
    setInfo(null);
    const res = await signUpWithPassword(email, password, name);
    if (res.error) {
      setErr(res.error);
    } else {
      // If a session exists, proceed to onboarding immediately.
      // Otherwise, instruct the user to verify email first.
      try {
        navigate("/onboarding/interests", { state: { name } });
      } catch (_) {
        setInfo("Account created. If email confirmations are enabled, check your inbox to verify, then continue onboarding.");
      }
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
    <div className="max-w-md w-full space-y-4 text-[#22343D] px-4">
      <h2 className="text-2xl font-semibold">Create account</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input className="border rounded px-3 py-2 w-full" placeholder="Full name" {...register("name", { required: true })} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Email" {...register("email", { required: true })} />
        <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Password" {...register("password", { required: true })} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        {info && <p className="text-green-700 text-sm">{info}</p>}
        <button className="px-4 py-2 rounded bg-[#FFD35C] text-[#22343D] w-full">Sign up</button>
      </form>

      <p className="text-sm">
        Already have an account? <Link to="/signin" className="underline">Sign in</Link>
      </p>
    </div>
    </div>
  );
}
