import { useForm } from "react-hook-form";
import { useState } from "react";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { PREMADE_TAGS } from "../data/premadeTags";

type Form = {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

export default function Host() {
  const { register, handleSubmit, reset } = useForm<Form>();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggle = (t: string) => {
    setSelected((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const onSubmit = async ({ title, date, time, location, description }: Form) => {
    if (!user) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // Combine date + time to an ISO timestamp (local time to UTC)
      const starts = new Date(`${date}T${time}`);

      // Generate a URL-friendly slug from the title and ensure uniqueness
      const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      let slug = baseSlug || `event-${Date.now()}`;
      // If slug exists, append a short suffix
      const { data: existing, error: existErr } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (existErr) throw existErr;
      if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

      const { data: created, error } = await supabase
        .from("events")
        .insert({
          slug,
          title,
          description,
          location,
          starts_at: starts.toISOString(),
          owner_id: user.id,
        })
        .select("id,slug")
        .single();

      if (error || !created) throw error ?? new Error("Failed to create event");

      // Award XP for hosting an event (+50xp)
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .maybeSingle();
        const currentXp = (prof as any)?.xp ?? 0;
        await supabase
          .from('profiles')
          .update({ xp: (currentXp as number) + 50 } as any)
          .eq('id', user.id);
      } catch {}

      // Upload images to Storage and update DB
      const bucket = "event-images";
      if (coverFile) {
        const path = `events/${created.id}/cover-${Date.now()}-${coverFile.name}`;
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, coverFile, { contentType: coverFile.type });
        if (upErr) throw new Error(`Cover upload failed: ${upErr.message}`);
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        const { error: updErr } = await supabase
          .from("events")
          .update({ cover_url: pub.publicUrl })
          .eq("id", created.id);
        if (updErr) throw new Error(`Failed to save cover: ${updErr.message}`);
      }

      const filesToUpload = gallery.length > 0 ? gallery : Array.from(galleryFiles ?? []);
      if (filesToUpload.length > 0) {
        const uploads = filesToUpload.map(async (file) => {
          const path = `events/${created.id}/gallery/${Date.now()}-${file.name}`;
          const { error: gErr } = await supabase.storage
            .from(bucket)
            .upload(path, file, { contentType: file.type });
          if (gErr) throw new Error(`Gallery upload failed: ${gErr.message}`);
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          const { error: insErr } = await supabase
            .from("event_images")
            .insert({ event_id: created.id, url: pub.publicUrl });
          if (insErr) throw new Error(`Failed to save gallery image: ${insErr.message}`);
        });
        await Promise.all(uploads);
      }

      // Handle tags: upsert user's selected tags and link them
      const tagNames = selected;
      if (tagNames.length > 0) {
        // Upsert tags owned by user (unique on owner_id + name_lc)
        const upsertPayload = tagNames.map((name) => ({ name, owner_id: user.id }));
        const { data: tagRows, error: tagErr } = await supabase
          .from("tags")
          .upsert(upsertPayload, { onConflict: "owner_id,name_lc" })
          .select("id,name");
        if (tagErr) throw new Error(`Tagging failed: ${tagErr.message}`);
        if (tagRows && tagRows.length > 0) {
          const links = tagRows.map((t) => ({ event_id: created.id, tag_id: t.id }));
          const { error: linkErr } = await supabase
            .from("event_tags")
            .upsert(links, { onConflict: "event_id,tag_id", ignoreDuplicates: true });
          if (linkErr) throw new Error(`Failed to link tags: ${linkErr.message}`);
        }
      }

      reset();
      navigate(`/events/${created.slug}`);
    } catch (e: any) {
      setErrorMsg(e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl space-y-3">
        <h2 className="text-2xl font-semibold text-[#FFD35C]">Host an event</h2>
        <p className="text-[#FFE485]">You must be signed in to create an event.</p>
        <Link to="/signin" className="px-4 py-2 inline-block rounded bg-[#FFD35C] text-[#2C4063]">Sign in</Link>
      </div>
    );
  }

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
      <div>
        <p className="text-[#FFE485] mb-2">Select tags</p>
        <div className="flex flex-wrap gap-2">
          {PREMADE_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`px-3 py-1 rounded-full border text-sm ${
                selected.includes(t)
                  ? "bg-[#FFD35C] text-[#22343D] border-transparent"
                  : "text-[#FFE485] border-[#FFD35C] hover:bg-[#FFD35C]/20 hover:text-[#FFD35C]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-[#FFE485] mb-2">Cover image</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[#FFE485] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[#22343D] file:bg-[#FFD35C] file:cursor-pointer"
          />
        </div>
        <div>
          <p className="text-[#FFE485] mb-2">Gallery images</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) setGallery((prev) => [...prev, ...files]);
              setGalleryFiles(e.target.files);
              e.currentTarget.value = "";
            }}
            className="block w-full text-sm text-[#FFE485] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[#22343D] file:bg-[#FFD35C] file:cursor-pointer"
          />
          {gallery.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {gallery.map((f, i) => (
                <span key={`${f.name}-${i}`} className="flex items-center gap-2 px-2 py-1 rounded bg-[#2C4063] text-[#FFE485] text-xs">
                  {f.name}
                  <button type="button" onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-300">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {errorMsg && <p className="text-red-300 text-sm">{errorMsg}</p>}
      <button disabled={submitting} className="px-4 py-2 rounded bg-[#FFD35C] text-[#2C4063] disabled:opacity-60">
        {submitting ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
