import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";
import { PREMADE_TAGS } from "../data/premadeTags";

export default function OnboardingInterests() {
  const { state } = useLocation() as { state?: { name?: string } };
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState<string>(state?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return; // allow page load; ask to sign in below
  }, [user]);

  const toggle = (t: string) => {
    setSelected((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const canSave = useMemo(() => name.trim().length > 0 && selected.length > 0 && !!user, [name, selected, user]);

  const onSave = async () => {
    if (!user) {
      navigate("/signin");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Upsert profile with name
      await supabase.from("profiles").upsert({ id: user.id, full_name: name, onboarding_complete: true });

      // Upsert tags for this user and link as interests (tags table is owned per user)
      const upsertPayload = selected.map((name) => ({ name, owner_id: user.id }));
      const { error: tagErr } = await supabase
        .from("tags")
        .upsert(upsertPayload, { onConflict: "owner_id,name_lc" });
      if (tagErr) throw tagErr;

      // Optionally store explicit user_tag links if you create such a table; here tags themselves represent interests

      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg space-y-4 text-black">
        <h2 className="text-2xl font-semibold">Welcome to Hyve</h2>
        <p>Please sign in to continue onboarding.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 text-black">
      <div>
        <h2 className="text-2xl font-semibold">Tell us about you</h2>
        <p className="text-sm opacity-80">Choose some interests so we can tailor events.</p>
      </div>

      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {PREMADE_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={`px-3 py-1 rounded-full border ${
              selected.includes(t) ? "bg-[#FFD35C] text-[#22343D] border-transparent" : "text-[#FFE485] border-[#FFD35C]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        disabled={!canSave || saving}
        onClick={onSave}
        className="px-4 py-2 rounded bg-[#FFD35C] text-[#22343D] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save and continue"}
      </button>
    </div>
  );
}

