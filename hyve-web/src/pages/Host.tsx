import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
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
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

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

      // Generate an attendance token for QR check-in
      try {
        const token = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        await supabase.from('events').update({ attend_token: token } as any).eq('id', created.id);
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
      <div className="min-h-screen bg-white text-[#22343D] flex items-center justify-center px-6">
        <div className="w-full max-w-xl space-y-3 text-center">
          <h2 className="text-4xl font-semibold ">Host an event</h2>
          <p className="text-gray-600">You must be signed in to create an event.</p>
            <Link to="/signin" className="px-4 py-2 inline-block rounded bg-[#22343D] text-[#FCF6E8] transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:text-[#22343D] hover:shadow-lg">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#22343D] flex items-center justify-center px-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl space-y-4">
        <h2 className="text-4xl font-semibold">Host an event</h2>
        <input className="border rounded px-3 py-2 w-full bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border-[#22343D]/30" placeholder="Title" {...register("title", { required: true })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2 w-full bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border-[#22343D]/30" type="date" {...register("date", { required: true })} />
          <input className="border rounded px-3 py-2 w-full bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border-[#22343D]/30" type="time" {...register("time", { required: true })} />
        </div>
        <input className="border rounded px-3 py-2 w-full bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border-[#22343D]/30" placeholder="Location" {...register("location", { required: true })} />
        <textarea className="border rounded px-3 py-2 w-full bg-[#FCF6E8] text-[#22343D] placeholder-gray-500 border-[#22343D]/30" placeholder="Description" rows={5} {...register("description")}></textarea>
        <div>
          <p className="text-sm mb-2">Select tags</p>
          <div className="flex flex-wrap gap-2">
            {PREMADE_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                  selected.includes(t)
                    ? "bg-[#FFD35C] text-[#22343D] border-transparent"
                    : "text-[#22343D] border-[#FFD35C] hover:bg-[#FFD35C] hover:text-[#22343D]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <p className="text-sm mb-2">Cover image</p>
            <input
              ref={coverInputRef}
              id="cover-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <label
              htmlFor="cover-upload"
              className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-[#22343D]/30 rounded-lg bg-[#FCF6E8] px-4 py-8 text-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#22343D]"><path d="M12 3a1 1 0 01.894.553l1.447 2.894 3.196.465a1 1 0 01.554 1.706l-2.313 2.255.546 3.18a1 1 0 01-1.451 1.054L12 13.347l-2.869 1.51a1 1 0 01-1.451-1.054l.546-3.18L5.913 8.618a1 1 0 01.554-1.706l3.196-.465L11.106 3.553A1 1 0 0112 3z"/></svg>
              <div className="text-sm">Click to upload cover image</div>
              <div className="text-xs text-gray-600">PNG, JPG up to ~5MB</div>
            </label>
            {coverFile && (
              <div className="mt-2 flex items-center gap-3">
                <img src={URL.createObjectURL(coverFile)} alt="Preview" className="h-16 w-24 object-cover rounded border border-[#22343D]/10" />
                <span className="text-sm">{coverFile.name}</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm mb-2">Gallery images</p>
            <input
              ref={galleryInputRef}
              id="gallery-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) setGallery((prev) => [...prev, ...files]);
                setGalleryFiles(e.target.files);
                if (e.currentTarget) e.currentTarget.value = "";
              }}
              className="sr-only"
            />
            <label
              htmlFor="gallery-upload"
              className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-[#22343D]/30 rounded-lg bg-[#FCF6E8] px-4 py-8 text-center cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-[#22343D]"><path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm3 4a2 2 0 114 0 2 2 0 01-4 0zm-3 8l4.5-5 3.5 4.2L15.5 13 21 17H4z"/></svg>
              <div className="text-sm">Click to add gallery images</div>
              <div className="text-xs text-gray-600">You can select multiple files</div>
            </label>
            {gallery.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {gallery.map((f, i) => (
                  <span key={`${f.name}-${i}`} className="flex items-center gap-2 px-2 py-1 rounded bg-white text-[#22343D] text-xs border border-[#22343D]/10">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm3 4a2 2 0 114 0 2 2 0 01-4 0zm-3 8l4.5-5 3.5 4.2L15.5 13 21 17H4z"/></svg>
                    <span className="truncate max-w-[12rem]">{f.name}</span>
                    <button type="button" onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
           <button disabled={submitting} className="px-4 py-2 rounded bg-[#22343D] text-[#FCF6E8] disabled:opacity-60 transition-all duration-300 transform hover:-translate-y-1 hover:bg-[#FFD35C] hover:text-[#22343D] hover:shadow-lg">
             {submitting ? "Creating…" : "Create event"}
           </button>
      </form>
    </div>
  );
}
