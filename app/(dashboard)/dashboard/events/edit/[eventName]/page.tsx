"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { MdArrowBack, MdCloudUpload, MdClose, MdImage, MdAdd, MdLock } from "react-icons/md";
import { uploadFile } from "@/app/actions/upload";
import { getEventByName, updateEvent } from "@/app/actions/events";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { underscoreToSpace } from "@/lib/generalFunction";

// ─── Types ───────────────────────────────────────────────────────────────────

type EventForm = {
  title: string;
  type: string;
  description: string;
  venue: string;
  address: string;
  theme: string;
  visibilty: boolean;
};

type Event = {
  id: number;
  title: string;
  type: string;
  description: string;
  venue: string;
  address: string;
  eventDate: string;
  visibilty: boolean;
  theme: string;
  organizerPays: boolean;
  banner: string | null;
  otherImages: string[] | null;
  tickets: any[];
};

// ─── Locked field display ─────────────────────────────────────────────────────

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-gray-500">{label}</label>
    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed">
      <MdLock size={14} className="text-gray-600 flex-shrink-0" />
      <span className="text-sm truncate">{value}</span>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const EditEventPage = () => {
  const params = useParams();
  const router = useRouter();
  const eventName = params.eventName as string;

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ["event", eventName],
    queryFn: () => getEventByName(underscoreToSpace(eventName)),
  });

  const [form, setForm] = useState<EventForm>({
    title: "",
    type: "",
    description: "",
    venue: "",
    address: "",
    theme: "",
    visibilty: true,
  });

  // Banner states
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Other images states
  const [otherImagePreviews, setOtherImagePreviews] = useState<(string | null)[]>([]);
  const [otherImageUrls, setOtherImageUrls] = useState<(string | null)[]>([]);
  const [otherImagesUploading, setOtherImagesUploading] = useState<boolean[]>([]);
  const [otherImagesError, setOtherImagesError] = useState<string | null>(null);
  const otherImagesInputRef = useRef<HTMLInputElement>(null);

  // ─── Populate form when event loads ────────────────────────────────────────

  useEffect(() => {
    if (!event) return;

    setForm({
      title: event.title,
      type: event.type,
      description: event.description,
      venue: event.venue,
      address: event.address,
      theme: event.theme ?? "",
      visibilty: event.visibilty,
    });

    if (event.banner) {
      setBannerPreview(event.banner);
      setBannerUrl(event.banner);
    }

    if (event.otherImages?.length) {
      setOtherImagePreviews(event.otherImages);
      setOtherImageUrls(event.otherImages);
      setOtherImagesUploading(event.otherImages.map(() => false));
    }
  }, [event]);

  // ─── Banner handlers ────────────────────────────────────────────────────────

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }
    setUploadError(null);
    setBannerUrl(null);

    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const result = await uploadFile(file);
      setBannerUrl(result.url);
    } catch (err: any) {
      setUploadError(err.message ?? "Banner upload failed.");
      setBannerPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleBannerFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const removeBanner = () => {
    setBannerPreview(null);
    setBannerUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Other images handlers ──────────────────────────────────────────────────

  const handleOtherImagesFiles = async (files: FileList) => {
    const remaining = 4 - otherImagePreviews.length;
    if (remaining <= 0) { setOtherImagesError("Maximum of 4 images allowed."); return; }

    const selected = Array.from(files).slice(0, remaining);
    setOtherImagesError(null);

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setOtherImagesError("Only image files are allowed.");
        continue;
      }

      const index = otherImagePreviews.length;

      const reader = new FileReader();
      reader.onload = (e) => {
        setOtherImagePreviews((prev) => [...prev, e.target?.result as string]);
        setOtherImageUrls((prev) => [...prev, null]);
        setOtherImagesUploading((prev) => [...prev, true]);
      };
      reader.readAsDataURL(file);

      try {
        const result = await uploadFile(file);
        setOtherImageUrls((prev) => {
          const updated = [...prev];
          updated[index] = result.url;
          return updated;
        });
      } catch (err: any) {
        setOtherImagesError(err.message ?? "Image upload failed.");
        setOtherImagePreviews((prev) => prev.filter((_, i) => i !== index));
        setOtherImageUrls((prev) => prev.filter((_, i) => i !== index));
      } finally {
        setOtherImagesUploading((prev) => {
          const updated = [...prev];
          updated[index] = false;
          return updated;
        });
      }
    }
  };

  const removeOtherImage = (index: number) => {
    setOtherImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setOtherImageUrls((prev) => prev.filter((_, i) => i !== index));
    setOtherImagesUploading((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Form handlers ──────────────────────────────────────────────────────────

  const updateForm = (field: keyof EventForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: (payload: any) => updateEvent(payload, Number(event?.id)),
    onSuccess: () => router.push(`/dashboard/events`),
    onError: (err) => console.error("Failed to update event:", err),
  });

  const handleSubmit = () => {
    if (isUploading || otherImagesUploading.some(Boolean)) {
      alert("Please wait for all images to finish uploading.");
      return;
    }
    if (!bannerUrl) {
      alert("A banner image is required.");
      return;
    }

    mutate({
      ...form,
      banner: bannerUrl,
      otherImages: otherImageUrls.filter(Boolean) as string[],
    });
  };

  const anyUploading = isUploading || otherImagesUploading.some(Boolean);

  // ─── Loading / error states ─────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading event...</p>
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-red-400 text-sm">Failed to load event.</p>
    </div>
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-NG", {
      weekday: "long", day: "numeric", month: "long",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/events"
          className="p-2 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white"
        >
          <MdArrowBack size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Edit Event</h1>
          <p className="text-gray-500 text-xs mt-0.5">Some fields are locked after publishing</p>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-[#121212] border border-[#1f1f1f] rounded-2xl p-6 flex flex-col gap-8">

        {/* EVENT DETAILS */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Event Details</h2>

          <input
            placeholder="Event Title"
            value={form.title}
            onChange={(e) => updateForm("title", e.target.value)}
            className="input"
            disabled
          />

          <select
            value={form.type}
            onChange={(e) => updateForm("type", e.target.value)}
            className="input"
          >
            <option value="">Event Type</option>
            <option value="music">Music</option>
            <option value="tech">Tech</option>
            <option value="business">Business</option>
            <option value="sports">Sports</option>
            <option value="other">Other</option>
          </select>

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            className="input h-32 resize-none"
          />

          <input
            placeholder="Theme (optional)"
            value={form.theme}
            onChange={(e) => updateForm("theme", e.target.value)}
            className="input"
          />

          {/* BANNER UPLOAD */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Event Banner</label>

            {bannerPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-[#1f1f1f] group">
                <img src={bannerPreview} alt="Banner preview" className="w-full h-52 object-cover" />

                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#FFD159] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white text-xs">Uploading...</p>
                  </div>
                )}

                {!isUploading && bannerUrl && (
                  <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <span>✓</span> Saved
                  </div>
                )}

                {!isUploading && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-[#FFD159] text-black text-sm rounded-lg font-medium"
                    >
                      <MdImage size={16} /> Change
                    </button>
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="flex items-center gap-2 px-3 py-2 bg-[#1f1f1f] text-white text-sm rounded-lg"
                    >
                      <MdClose size={16} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? "2px dashed #FFD159" : "2px dashed #2a2a2a",
                  background: isDragging ? "rgba(255, 209, 89, 0.05)" : "#0f0f0f",
                  transform: isDragging ? "scale(1.01)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
                className="flex flex-col items-center justify-center gap-3 h-52 rounded-xl cursor-pointer"
              >
                <div
                  style={{ background: isDragging ? "rgba(255,209,89,0.15)" : "#1f1f1f" }}
                  className="p-4 rounded-full transition-all duration-200"
                >
                  <MdCloudUpload size={28} style={{ color: isDragging ? "#FFD159" : "#9ca3af" }} />
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">
                    {isDragging ? "Drop it here!" : "Drag & drop your banner"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    or <span className="text-[#FFD159]">click to browse</span> · PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
              </div>
            )}

            {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleBannerFile(file); }}
            />
          </div>

          {/* OTHER IMAGES */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">
                Other Images <span className="text-gray-600">(optional · max 4)</span>
              </label>
              {otherImagePreviews.length < 4 && (
                <button type="button" onClick={() => otherImagesInputRef.current?.click()}
                  className="flex items-center gap-1 text-[#FFD159] text-xs"
                >
                  <MdAdd size={14} /> Add Images
                </button>
              )}
            </div>

            {otherImagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {otherImagePreviews.map((preview, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden border border-[#1f1f1f] group aspect-square">
                    <img src={preview!} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                    {otherImagesUploading[index] && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#FFD159] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!otherImagesUploading[index] && otherImageUrls[index] && (
                      <div className="absolute top-1 left-1 bg-green-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-md">✓</div>
                    )}
                    {!otherImagesUploading[index] && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                        <button type="button" onClick={() => removeOtherImage(index)}
                          className="p-1.5 bg-red-500/80 text-white rounded-lg"
                        >
                          <MdClose size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {otherImagePreviews.length < 4 && (
                  <div onClick={() => otherImagesInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#2a2a2a] flex items-center justify-center cursor-pointer hover:border-[#FFD159] transition-colors"
                  >
                    <MdAdd size={20} className="text-gray-600" />
                  </div>
                )}
              </div>
            ) : (
              <div onClick={() => otherImagesInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl cursor-pointer border-2 border-dashed border-[#2a2a2a] hover:border-[#FFD159] transition-colors bg-[#0f0f0f]"
              >
                <MdImage size={20} className="text-gray-600" />
                <p className="text-gray-500 text-xs">Click to add up to 4 event images</p>
              </div>
            )}

            {otherImagesError && <p className="text-red-400 text-xs">{otherImagesError}</p>}
            <input ref={otherImagesInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { if (e.target.files) handleOtherImagesFiles(e.target.files); e.target.value = ""; }}
            />
          </div>
        </section>

        {/* LOCKED — DATE & TIME */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-lg">Date & Time</h2>
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded-full">
              <MdLock size={10} /> Locked
            </span>
          </div>
          <LockedField label="Event Date" value={formatDate(event.eventDate)} />
        </section>

        {/* LOCATION */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Location</h2>
          <input
            placeholder="Venue Name"
            value={form.venue}
            onChange={(e) => updateForm("venue", e.target.value)}
            className="input"
          />
          <input
            placeholder="Full Address"
            value={form.address}
            onChange={(e) => updateForm("address", e.target.value)}
            className="input"
          />
        </section>

        {/* LOCKED — TICKETS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-lg">Tickets</h2>
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded-full">
              <MdLock size={10} /> Locked
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {event.tickets.map((ticket, index) => (
              <div key={ticket.id ?? index}
                className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <MdLock size={14} className="text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-400 font-medium">{ticket.type}</p>
                    <p className="text-xs text-gray-600">{ticket.startQty} tickets · ₦{Number(ticket.price).toLocaleString("en-NG")}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-600 bg-[#1a1a1a] px-2 py-1 rounded-lg">Not editable</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">Ticket details cannot be changed after publishing to protect existing buyers.</p>
        </section>

        {/* LOCKED — ORGANIZER PAYS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-lg">Platform Fee Handling</h2>
            <span className="flex items-center gap-1 text-xs text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded-full">
              <MdLock size={10} /> Locked
            </span>
          </div>
          <LockedField
            label="Fee Handling"
            value={event.organizerPays ? "Organizer Pays Fee — deducted from payout" : "Attendee Pays Fee — added to ticket price"}
          />
          <p className="text-xs text-gray-600">Fee handling cannot be changed after tickets have been sold.</p>
        </section>

        {/* SETTINGS — VISIBILITY (editable) */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Settings</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Visibility</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 cursor-pointer hover:border-[#FFD159] transition">
                <input type="radio" name="visibilty" checked={form.visibilty === true}
                  onChange={() => updateForm("visibilty", true)} className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Public</p>
                  <p className="text-gray-500 text-xs">Visible to everyone</p>
                </div>
              </label>
              <label className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 cursor-pointer hover:border-[#FFD159] transition">
                <input type="radio" name="visibilty" checked={form.visibilty === false}
                  onChange={() => updateForm("visibilty", false)} className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Private</p>
                  <p className="text-gray-500 text-xs">Invite only</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/events" className="px-4 py-2 bg-[#1f1f1f] text-gray-300 rounded-xl">
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isPending || anyUploading}
            className="px-6 py-2 bg-[#FFD159] text-black rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : anyUploading ? (
              <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Uploading...</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          background: #0f0f0f;
          border: 1px solid #1f1f1f;
          color: white;
          padding: 10px 14px;
          border-radius: 12px;
          outline: none;
          width: 100%;
        }
        .input:focus {
          border-color: #FFD159;
          box-shadow: 0 0 0 1px #FFD159;
        }
        .input::placeholder { color: #555; }
        select.input option { background: #0f0f0f; }
        input[type="datetime-local"].input::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>
    </div>
  );
};

export default EditEventPage;