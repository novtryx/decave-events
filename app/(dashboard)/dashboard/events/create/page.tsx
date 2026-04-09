"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { MdArrowBack, MdAdd, MdDelete, MdCloudUpload, MdClose, MdImage } from "react-icons/md";
import { uploadFile } from "@/app/actions/upload";
import { createEvent } from "@/app/actions/events";

// ─── Types ───────────────────────────────────────────────────────────────────

type Ticket = {
  id: number;
  type: string;
  description: string;
  price: string;
  startQty: string;
  startDate: string;
  stopdate: string;
};

type EventForm = {
  title: string;
  type: string;
  description: string;
  venue: string;
  address: string;
  eventDate: string;
  visibilty: boolean;
  theme: string;
  organizerPays: boolean;
};

// ─── Upload helper ────────────────────────────────────────────────────────────


// ─── Component ────────────────────────────────────────────────────────────────

const CreateEventPage = () => {
  const [form, setForm] = useState<EventForm>({
    title: "",
    type: "",
    description: "",
    venue: "",
    address: "",
    eventDate: "",
    visibilty: true,
    theme: "",
    organizerPays: false,
  });

  // Banner states
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 1, type: "", description: "", price: "", startQty: "", startDate: "", stopdate: "" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Banner handlers ────────────────────────────────────────────────────────

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }

    setUploadError(null);
    setBannerUrl(null);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload in background
    try {
      setIsUploading(true);
      const result = await uploadFile(file);
      setBannerUrl(result.url); // store the server URL for submission
    } catch (err: any) {
      setUploadError(err.message ?? "Banner upload failed. Please try again.");
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeBanner = () => {
    setBannerPreview(null);
    setBannerUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Form handlers ──────────────────────────────────────────────────────────

  const updateForm = (field: keyof EventForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTicket = () => {
    setTickets([
      ...tickets,
      { id: Date.now(), type: "", description: "", price: "", startQty: "", startDate: "", stopdate: "" },
    ]);
  };

  const removeTicket = (id: number) => {
    if (tickets.length === 1) return;
    setTickets(tickets.filter((t) => t.id !== id));
  };

  const updateTicket = (id: number, field: keyof Omit<Ticket, "id">, value: string) => {
    setTickets(tickets.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isUploading) {
      alert("Please wait for the banner to finish uploading.");
      return;
    }
    if (!bannerUrl) {
      alert("Please upload a banner image before publishing.");
      return;
    }

    const payload = {
      ...form,
      banner: bannerUrl, // ✅ server-returned URL sent as @IsUrl() field
      tickets: tickets.map(({ id, ...rest }) => ({
        ...rest,
        price: parseFloat(rest.price),
        startQty: parseInt(rest.startQty),
      })),
    };

    try {
      setIsSubmitting(true);
      console.log("Submitting payload:", payload);
      // Replace with your actual API call:
      await createEvent(payload)
      // await createEvent(payload);
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-extrabold text-white">Create Event</h1>
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
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-52 object-cover"
                />

                {/* Uploading spinner overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#FFD159] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white text-xs">Uploading...</p>
                  </div>
                )}

                {/* Uploaded success badge */}
                {!isUploading && bannerUrl && (
                  <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <span>✓</span> Uploaded
                  </div>
                )}

                {/* Hover actions (only when not uploading) */}
                {!isUploading && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-[#FFD159] text-black text-sm rounded-lg font-medium"
                    >
                      <MdImage size={16} />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="flex items-center gap-2 px-3 py-2 bg-[#1f1f1f] text-white text-sm rounded-lg"
                    >
                      <MdClose size={16} />
                      Remove
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
                className="relative flex flex-col items-center justify-center gap-3 h-52 rounded-xl cursor-pointer"
              >
                <div
                  style={{ background: isDragging ? "rgba(255,209,89,0.15)" : "#1f1f1f" }}
                  className="p-4 rounded-full transition-all duration-200"
                >
                  <MdCloudUpload
                    size={28}
                    style={{ color: isDragging ? "#FFD159" : "#9ca3af" }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">
                    {isDragging ? "Drop it here!" : "Drag & drop your banner"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    or <span className="text-[#FFD159]">click to browse</span>
                    {" "}· PNG, JPG, WEBP up to 10MB
                  </p>
                </div>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <p className="text-red-400 text-xs mt-1">{uploadError}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBannerFile(file);
              }}
            />
          </div>
        </section>

        {/* DATE & TIME */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Date & Time</h2>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Event Date</label>
            <input
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => updateForm("eventDate", e.target.value)}
              className="input"
            />
          </div>
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

        {/* TICKETS */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-semibold text-lg">Tickets</h2>
            <button
              onClick={addTicket}
              className="flex items-center gap-1 text-[#FFD159] text-sm"
            >
              <MdAdd /> Add Ticket
            </button>
          </div>

          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className="flex flex-col gap-3 bg-[#0f0f0f] p-4 rounded-xl border border-[#1f1f1f]"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                  Ticket {index + 1}
                </span>
                <button
                  onClick={() => removeTicket(ticket.id)}
                  className="text-red-400 flex items-center gap-1 text-xs"
                >
                  <MdDelete size={14} /> Remove
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  placeholder="Ticket Type (e.g. VIP, Regular)"
                  value={ticket.type}
                  onChange={(e) => updateTicket(ticket.id, "type", e.target.value)}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Price (₦)"
                  min={0}
                  value={ticket.price}
                  onChange={(e) => updateTicket(ticket.id, "price", e.target.value)}
                  className="input"
                />
              </div>

              <input
                placeholder="Ticket Description"
                value={ticket.description}
                onChange={(e) => updateTicket(ticket.id, "description", e.target.value)}
                className="input"
              />

              <input
                type="number"
                placeholder="Available Quantity"
                min={1}
                value={ticket.startQty}
                onChange={(e) => updateTicket(ticket.id, "startQty", e.target.value)}
                className="input"
              />

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Sale Start Date</label>
                  <input
                    type="datetime-local"
                    value={ticket.startDate}
                    onChange={(e) => updateTicket(ticket.id, "startDate", e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400">Sale End Date</label>
                  <input
                    type="datetime-local"
                    value={ticket.stopdate}
                    onChange={(e) => updateTicket(ticket.id, "stopdate", e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* SETTINGS */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Settings</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Visibility</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 cursor-pointer hover:border-[#FFD159] transition">
                <input
                  type="radio"
                  name="visibilty"
                  checked={form.visibilty === true}
                  onChange={() => updateForm("visibilty", true)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Public</p>
                  <p className="text-gray-500 text-xs">Visible to everyone</p>
                </div>
              </label>
              <label className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 cursor-pointer hover:border-[#FFD159] transition">
                <input
                  type="radio"
                  name="visibilty"
                  checked={form.visibilty === false}
                  onChange={() => updateForm("visibilty", false)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Private</p>
                  <p className="text-gray-500 text-xs">Invite only</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Platform Fee Handling</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 cursor-pointer hover:border-[#FFD159] transition">
                <input
                  type="radio"
                  name="organizerPays"
                  checked={form.organizerPays === false}
                  onChange={() => updateForm("organizerPays", false)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Attendee Pays Fee</p>
                  <p className="text-gray-500 text-xs">Fee added to ticket price</p>
                </div>
              </label>
              <label className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 cursor-pointer hover:border-[#FFD159] transition">
                <input
                  type="radio"
                  name="organizerPays"
                  checked={form.organizerPays === true}
                  onChange={() => updateForm("organizerPays", true)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Organizer Pays Fee</p>
                  <p className="text-gray-500 text-xs">Fee deducted from payout</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/events"
            className="px-4 py-2 bg-[#1f1f1f] text-gray-300 rounded-xl"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="px-6 py-2 bg-[#FFD159] text-black rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              "Publish Event"
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
        .input::placeholder {
          color: #555;
        }
        select.input option {
          background: #0f0f0f;
        }
        input[type="datetime-local"].input::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
        }
      `}</style>
    </div>
  );
};

export default CreateEventPage;