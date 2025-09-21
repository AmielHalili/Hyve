"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useAuthStore } from "../store/auth";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { PREMADE_TAGS } from "../data/premadeTags";
import { motion } from "framer-motion";

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
      const starts = new Date(`${date}T${time}`);
      const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      let slug = baseSlug || `event-${Date.now()}`;
      const { data: existing } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
      if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
      const { data: created, error } = await supabase
        .from("events")
        .insert({ slug, title, description, location, starts_at: starts.toISOString(), owner_id: user.id })
        .select("id,slug")
        .single();
      if (error || !created) throw error ?? new Error("Failed to create event");

      // Upload Cover
      if (coverFile) {
        const path = `events/${created.id}/cover-${Date.now()}-${coverFile.name}`;
        const { error: upErr } = await supabase.storage.from("event-images").upload(path, coverFile, { contentType: coverFile.type });
        if (upErr) throw new Error(`Cover upload failed: ${upErr.message}`);
        const { data: pub } = supabase.storage.from("event-images").getPublicUrl(path);
        const { error: updErr } = await supabase.from("events").update({ cover_url: pub.publicUrl }).eq("id", created.id);
        if (updErr) throw new Error(`Failed to save cover: ${updErr.message}`);
      }

      // Upload gallery
      const filesToUpload = gallery.length > 0 ? gallery : Array.from(galleryFiles ?? []);
      if (filesToUpload.length > 0) {
        const uploads = filesToUpload.map(async (file) => {
          const path = `events/${created.id}/gallery/${Date.now()}-${file.name}`;
          const { error: gErr } = await supabase.storage.from("event-images").upload(path, file, { contentType: file.type });
          if (gErr) throw new Error(`Gallery upload failed: ${gErr.message}`);
          const { data: pub } = supabase.storage.from("event-images").getPublicUrl(path);
          const { error: insErr } = await supabase.from("event_images").insert({ event_id: created.id, url: pub.publicUrl });
          if (insErr) throw new Error(`Failed to save gallery image: ${insErr.message}`);
        });
        await Promise.all(uploads);
      }

      // Handle tags
      if (selected.length > 0) {
        const upsertPayload = selected.map((name) => ({ name, owner_id: user.id }));
        const { data: tagRows } = await supabase.from("tags").upsert(upsertPayload, { onConflict: "owner_id,name_lc" }).select("id,name");
        if (tagRows && tagRows.length > 0) {
          const links = tagRows.map((t) => ({ event_id: created.id, tag_id: t.id }));
          await supabase.from("event_tags").upsert(links, { onConflict: "event_id,tag_id", ignoreDuplicates: true });
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

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-10 space-y-8"
      >
        <h1 className="text-4xl font-extrabold text-gray-900">Host an Event</h1>

        {!user ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600">You must be signed in to create an event.</p>
            <Link className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700" to="/signin">
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.input
              type="text"
              placeholder="Event Title"
              {...register("title", { required: true })}
              className="w-full rounded-xl border border-gray-300 px-5 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              whileFocus={{ scale: 1.02 }}
            />

            <div className="grid grid-cols-2 gap-4">
              <motion.input
                type="date"
                {...register("date", { required: true })}
                className="rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                whileFocus={{ scale: 1.02 }}
              />
              <motion.input
                type="time"
                {...register("time", { required: true })}
                className="rounded-xl border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                whileFocus={{ scale: 1.02 }}
              />
            </div>

            <motion.input
              placeholder="Location"
              {...register("location", { required: true })}
              className="w-full rounded-xl border border-gray-300 px-5 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              whileFocus={{ scale: 1.02 }}
            />

            <motion.textarea
              placeholder="Description"
              rows={5}
              {...register("description")}
              className="w-full rounded-xl border border-gray-300 px-5 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              whileFocus={{ scale: 1.01 }}
            />

            <div>
              <p className="text-gray-700 mb-2 font-medium">Select Tags</p>
              <div className="flex flex-wrap gap-2">
                {PREMADE_TAGS.map((t) => (
                  <motion.button
                    key={t}
                    type="button"
                    onClick={() => toggle(t)}
                    className={`px-4 py-2 rounded-full border font-medium text-sm ${
                      selected.includes(t)
                        ? "bg-blue-600 text-white border-transparent"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-700 mb-1 font-medium">Cover Image</p>
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
              </div>
              <div>
                <p className="text-gray-700 mb-1 font-medium">Gallery Images</p>
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
                  className="w-full text-sm"
                />
              </div>
            </div>

            {gallery.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {gallery.map((f, i) => (
                  <span key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm">
                    {f.name}
                    <button type="button" onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

            <motion.button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              whileTap={{ scale: 0.97 }}
            >
              {submitting ? "Creating…" : "Create Event"}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
