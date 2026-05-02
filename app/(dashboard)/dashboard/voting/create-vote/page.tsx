"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  MdArrowBack, MdAdd, MdDelete, MdCloudUpload, MdClose, MdImage,
} from "react-icons/md";
import { uploadFile } from "@/app/actions/upload";
import { createVote } from "@/app/actions/voting";

// ─── Types ────────────────────────────────────────────────────────────────────

type Contestant = {
  id: number;
  name: string;
  tagline: string;
  category: string;
  photoUrl: string | null;
};

type CompetitionForm = {
  title: string;
  description: string;
  edition: string;
  voteStart: string;
  voteEnd: string;
  pricing: "free" | "paid";
  pricePerVote: number;
  showLiveCount: boolean;
  publicLeaderboard: boolean;
  banner: string | null;
};

type FormErrors = Partial<Record<keyof CompetitionForm, string>> & {
  contestants?: Record<number, Partial<Record<keyof Omit<Contestant, "id">, string>>>;
  general?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toIso = (local: string) =>
  local ? new Date(local).toISOString() : "";

// ─── Component ────────────────────────────────────────────────────────────────

const CreateCompetitionPage = () => {
  const [form, setForm] = useState<CompetitionForm>({
    title: "",
    description: "",
    edition: "",
    voteStart: "",
    voteEnd: "",
    pricing: "free",
    pricePerVote: 0,
    showLiveCount: true,
    publicLeaderboard: true,
    banner: null,
  });

  const [contestants, setContestants] = useState<Contestant[]>([
    { id: 1, name: "", tagline: "", category: "", photoUrl: null },
    { id: 2, name: "", tagline: "", category: "", photoUrl: null },
  ]);

  const [errors, setErrors] = useState<FormErrors>({});

  // Banner state
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerRef = useRef<HTMLInputElement | null>(null);

  // Per-contestant photo state
  const [photoPreviews, setPhotoPreviews] = useState<Record<number, string | null>>({});
  const [photoUploading, setPhotoUploading] = useState<Record<number, boolean>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const anyUploading =
    bannerUploading || Object.values(photoUploading).some(Boolean);

  // ─── Error helpers ───────────────────────────────────────────────────────────

  const clearFieldError = (field: keyof CompetitionForm) =>
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });

  const clearContestantError = (id: number, field: keyof Omit<Contestant, "id">) =>
    setErrors((prev) => {
      if (!prev.contestants?.[id]) return prev;
      const contestants = { ...prev.contestants };
      const entry = { ...contestants[id] };
      delete entry[field];
      contestants[id] = entry;
      return { ...prev, contestants };
    });

  // ─── Form handlers ───────────────────────────────────────────────────────────

  const updateForm = <K extends keyof CompetitionForm>(
    field: K,
    value: CompetitionForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  // ─── Banner upload ───────────────────────────────────────────────────────────

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, banner: "Only image files are allowed." }));
      return;
    }
    clearFieldError("banner");

    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setBannerUploading(true);
      const result = await uploadFile(file);
      setForm((prev) => ({ ...prev, banner: result.url }));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        banner: err.message ?? "Banner upload failed.",
      }));
      setBannerPreview(null);
    } finally {
      setBannerUploading(false);
    }
  };

  const removeBanner = () => {
    setBannerPreview(null);
    setForm((prev) => ({ ...prev, banner: null }));
    clearFieldError("banner");
    if (bannerRef.current) bannerRef.current.value = "";
  };

  // ─── Contestant handlers ─────────────────────────────────────────────────────

  const addContestant = () => {
    setContestants((prev) => [
      ...prev,
      { id: Date.now(), name: "", tagline: "", category: "", photoUrl: null },
    ]);
  };

  const removeContestant = (id: number) => {
    if (contestants.length <= 2) return;
    setContestants((prev) => prev.filter((c) => c.id !== id));
    setPhotoPreviews((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setPhotoUploading((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setErrors((prev) => {
      const n = { ...prev };
      if (n.contestants) { delete n.contestants[id]; }
      return n;
    });
  };

  const updateContestant = (
    id: number,
    field: keyof Omit<Contestant, "id" | "photoUrl">,
    value: string,
  ) => {
    setContestants((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
    clearContestantError(id, field);
  };

  // ─── Photo upload ────────────────────────────────────────────────────────────

  const handlePhotoFile = async (contestantId: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        contestants: {
          ...prev.contestants,
          [contestantId]: {
            ...prev.contestants?.[contestantId],
            photoUrl: "Only image files are allowed.",
          },
        },
      }));
      return;
    }
    clearContestantError(contestantId, "photoUrl");

    const reader = new FileReader();
    reader.onload = (e) =>
      setPhotoPreviews((prev) => ({ ...prev, [contestantId]: e.target?.result as string }));
    reader.readAsDataURL(file);

    try {
      setPhotoUploading((prev) => ({ ...prev, [contestantId]: true }));
      const result = await uploadFile(file);
      setContestants((prev) =>
        prev.map((c) => (c.id === contestantId ? { ...c, photoUrl: result.url } : c)),
      );
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        contestants: {
          ...prev.contestants,
          [contestantId]: {
            ...prev.contestants?.[contestantId],
            photoUrl: err.message ?? "Photo upload failed.",
          },
        },
      }));
      setPhotoPreviews((prev) => ({ ...prev, [contestantId]: null }));
    } finally {
      setPhotoUploading((prev) => ({ ...prev, [contestantId]: false }));
    }
  };

  const removePhoto = (contestantId: number) => {
    setPhotoPreviews((prev) => ({ ...prev, [contestantId]: null }));
    setContestants((prev) =>
      prev.map((c) => (c.id === contestantId ? { ...c, photoUrl: null } : c)),
    );
    clearContestantError(contestantId, "photoUrl");
    if (fileInputRefs.current[contestantId])
      fileInputRefs.current[contestantId]!.value = "";
  };

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.title.trim()) newErrors.title = "Competition title is required.";
    if (!form.description.trim()) newErrors.description = "Description is required.";
    if (!form.edition.trim()) newErrors.edition = "Edition / category is required.";
    if (!form.voteStart) newErrors.voteStart = "Voting start date is required.";
    if (!form.voteEnd) newErrors.voteEnd = "Voting end date is required.";
    if (
      form.voteStart &&
      form.voteEnd &&
      new Date(form.voteEnd) <= new Date(form.voteStart)
    ) {
      newErrors.voteEnd = "End date must be after start date.";
    }
    if (form.pricing === "paid" && form.pricePerVote <= 0) {
      newErrors.pricePerVote = "Enter a valid price per vote.";
    }

    const contestantErrors: FormErrors["contestants"] = {};
    contestants.forEach((c) => {
      const ce: Partial<Record<keyof Omit<Contestant, "id">, string>> = {};
      if (!c.name.trim()) ce.name = "Name is required.";
      if (!c.tagline.trim()) ce.tagline = "Tagline is required.";
      if (!c.category.trim()) ce.category = "Category is required.";
      if (!c.photoUrl) ce.photoUrl = "Photo is required.";
      if (Object.keys(ce).length) contestantErrors[c.id] = ce;
    });

    if (Object.keys(contestantErrors).length)
      newErrors.contestants = contestantErrors;

    setErrors(newErrors);

    // Scroll to first error
    if (Object.keys(newErrors).length) {
      setTimeout(() => {
        document.querySelector("[data-error='true']")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    }

    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (anyUploading) return;
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      edition: form.edition.trim(),
      voteStart: toIso(form.voteStart),
      voteEnd: toIso(form.voteEnd),
      pricing: form.pricing,
      pricePerVote: form.pricing === "paid" ? form.pricePerVote : 0,
      showLiveCount: form.showLiveCount,
      publicLeaderboard: form.publicLeaderboard,
      banner : form.banner ?? null,
      contestants: contestants.map(({ id, ...rest }) => rest),
    };

    try {
      setIsSubmitting(true);
      setErrors({});

      const res = await createVote(payload);

      console.log(res);
      
      if (!res.success) {
        setErrors({ general: res?.message ?? "Something went wrong. Please try again." });
        return;
      }

      window.location.href = "/dashboard/voting";
    } catch (err: any) {
      setErrors({ general: err?.message ?? "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/competitions"
          className="p-2 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white"
        >
          <MdArrowBack size={20} />
        </Link>
        <h1 className="text-2xl font-extrabold text-white">Create Competition</h1>
      </div>

      {/* GLOBAL ERROR BANNER */}
      {errors.general && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <span className="text-red-400 text-lg leading-none">✕</span>
          <p className="text-red-400 text-sm">{errors.general}</p>
        </div>
      )}

      <div className="bg-[#121212] border border-[#1f1f1f] rounded-2xl p-6 flex flex-col gap-8">

        {/* ── COMPETITION DETAILS ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Competition Details</h2>

          <Field error={errors.title}>
            <input
              data-error={!!errors.title}
              placeholder="Competition Title *"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              className={input(!!errors.title)}
            />
          </Field>

          <Field error={errors.description}>
            <textarea
              data-error={!!errors.description}
              placeholder="Description — tell voters what this competition is about *"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              className={`${input(!!errors.description)} h-28 resize-none`}
            />
          </Field>

          <Field error={errors.edition}>
            <input
              data-error={!!errors.edition}
              placeholder="Category / Edition (e.g. Season 3, Round 1) *"
              value={form.edition}
              onChange={(e) => updateForm("edition", e.target.value)}
              className={input(!!errors.edition)}
            />
          </Field>
        </section>

        {/* ── BANNER ─────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-white font-semibold text-lg">Banner Image</h2>
          <p className="text-gray-500 text-xs -mt-2">
            Displayed at the top of your competition page (optional)
          </p>

          {bannerPreview ? (
            <div className="relative group rounded-xl overflow-hidden">
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-40 object-cover"
              />
              {bannerUploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#FFD159] border-t-transparent rounded-full animate-spin" />
                  <p className="text-white text-xs">Uploading...</p>
                </div>
              )}
              {!bannerUploading && form.banner && (
                <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <span>✓</span> Uploaded
                </div>
              )}
              {!bannerUploading && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => bannerRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FFD159] text-black text-xs rounded-lg font-medium"
                  >
                    <MdImage size={14} /> Change
                  </button>
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1f1f1f] text-white text-xs rounded-lg"
                  >
                    <MdClose size={14} /> Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => bannerRef.current?.click()}
              className="w-full h-40 bg-[#0f0f0f] border border-dashed border-[#2a2a2a] hover:border-[#FFD159] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition"
            >
              <div className="p-3 rounded-full bg-[#1a1a1a]">
                <MdCloudUpload size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-500 text-sm">Click to upload banner</p>
              <p className="text-gray-600 text-xs">JPG, PNG, WEBP · max 5 MB</p>
            </div>
          )}

          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBannerFile(file);
            }}
          />
          {errors.banner && <ErrorMsg>{errors.banner}</ErrorMsg>}
        </section>

        {/* ── SCHEDULE ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Schedule</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Voting Opens *" error={errors.voteStart}>
              <input
                data-error={!!errors.voteStart}
                type="datetime-local"
                value={form.voteStart}
                onChange={(e) => updateForm("voteStart", e.target.value)}
                className={input(!!errors.voteStart)}
              />
            </Field>
            <Field label="Voting Closes *" error={errors.voteEnd}>
              <input
                data-error={!!errors.voteEnd}
                type="datetime-local"
                value={form.voteEnd}
                onChange={(e) => updateForm("voteEnd", e.target.value)}
                className={input(!!errors.voteEnd)}
              />
            </Field>
          </div>
        </section>

        {/* ── VOTE PRICING ───────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Vote Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={radioCard(form.pricing === "free")}>
              <input
                type="radio"
                name="pricing"
                checked={form.pricing === "free"}
                onChange={() => updateForm("pricing", "free")}
                className="accent-[#FFD159] mt-0.5"
              />
              <div>
                <p className="text-white text-sm font-medium">Free</p>
                <p className="text-gray-500 text-xs mt-0.5">Anyone can vote at no cost</p>
              </div>
            </label>

            <label className={radioCard(form.pricing === "paid")}>
              <input
                type="radio"
                name="pricing"
                checked={form.pricing === "paid"}
                onChange={() => updateForm("pricing", "paid")}
                className="accent-[#FFD159] mt-0.5"
              />
              <div className="flex flex-col gap-2 flex-1">
                <div>
                  <p className="text-white text-sm font-medium">Paid</p>
                  <p className="text-gray-500 text-xs mt-0.5">Voters pay per vote cast</p>
                </div>
                {form.pricing === "paid" && (
                  <Field error={errors.pricePerVote}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="Price per vote (₦)"
                      value={form.pricePerVote || ""}
                      onChange={(e) =>
                        updateForm("pricePerVote", parseFloat(e.target.value) || 0)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={`${input(!!errors.pricePerVote)} text-sm`}
                    />
                  </Field>
                )}
              </div>
            </label>
          </div>
        </section>

        {/* ── CONTESTANTS ────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Contestants</h2>
            <button
              onClick={addContestant}
              className="flex items-center gap-1 text-[#FFD159] text-sm"
            >
              <MdAdd /> Add Contestant
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contestants.map((contestant, index) => {
              const preview = photoPreviews[contestant.id] ?? null;
              const uploading = photoUploading[contestant.id] ?? false;
              const ce = errors.contestants?.[contestant.id] ?? {};

              return (
                <div
                  key={contestant.id}
                  className={`bg-[#0f0f0f] border rounded-2xl overflow-hidden flex flex-col transition ${
                    Object.keys(ce).length
                      ? "border-red-500/40"
                      : "border-[#1f1f1f]"
                  }`}
                >
                  {/* PHOTO */}
                  <div className="relative">
                    {preview ? (
                      <div className="relative group">
                        <img
                          src={preview}
                          alt={`Contestant ${index + 1}`}
                          className="w-full h-36 object-cover"
                        />
                        {uploading && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-[#FFD159] border-t-transparent rounded-full animate-spin" />
                            <p className="text-white text-xs">Uploading...</p>
                          </div>
                        )}
                        {!uploading && contestant.photoUrl && (
                          <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                            <span>✓</span> Uploaded
                          </div>
                        )}
                        {!uploading && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[contestant.id]?.click()}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#FFD159] text-black text-xs rounded-lg font-medium"
                            >
                              <MdImage size={14} /> Change
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhoto(contestant.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#1f1f1f] text-white text-xs rounded-lg"
                            >
                              <MdClose size={14} /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current[contestant.id]?.click()}
                        className={`w-full h-36 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                          ce.photoUrl
                            ? "bg-red-500/5 hover:bg-red-500/10"
                            : "bg-[#1a1a1a] hover:bg-[#222]"
                        }`}
                      >
                        <div className="p-3 rounded-full bg-[#2a2a2a]">
                          <MdCloudUpload
                            size={20}
                            className={ce.photoUrl ? "text-red-400" : "text-gray-500"}
                          />
                        </div>
                        <p className={`text-xs ${ce.photoUrl ? "text-red-400" : "text-gray-600"}`}>
                          {ce.photoUrl ? ce.photoUrl : "Add photo *"}
                        </p>
                      </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#FFD159] text-black text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>

                    {contestants.length > 2 && (
                      <button
                        onClick={() => removeContestant(contestant.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-gray-400 hover:text-red-400 flex items-center justify-center transition"
                      >
                        <MdDelete size={13} />
                      </button>
                    )}

                    <input
                      ref={(el) => { fileInputRefs.current[contestant.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoFile(contestant.id, file);
                      }}
                    />
                  </div>

                  {/* FIELDS */}
                  <div className="p-3 flex flex-col gap-2">
                    <div>
                      <input
                        placeholder="Contestant name *"
                        value={contestant.name}
                        onChange={(e) => updateContestant(contestant.id, "name", e.target.value)}
                        className={contInput(!!ce.name)}
                      />
                      {ce.name && <ErrorMsg>{ce.name}</ErrorMsg>}
                    </div>
                    <div>
                      <input
                        placeholder="Tagline / bio *"
                        value={contestant.tagline}
                        onChange={(e) => updateContestant(contestant.id, "tagline", e.target.value)}
                        className={contInput(!!ce.tagline)}
                      />
                      {ce.tagline && <ErrorMsg>{ce.tagline}</ErrorMsg>}
                    </div>
                    <div>
                      <input
                        placeholder="Group / category *"
                        value={contestant.category}
                        onChange={(e) => updateContestant(contestant.id, "category", e.target.value)}
                        className={contInput(!!ce.category)}
                      />
                      {ce.category && <ErrorMsg>{ce.category}</ErrorMsg>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SETTINGS ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white font-semibold text-lg">Settings</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Live Vote Count</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className={radioCard(form.showLiveCount === true)}>
                <input
                  type="radio"
                  name="showLiveCount"
                  checked={form.showLiveCount === true}
                  onChange={() => updateForm("showLiveCount", true)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Show live count</p>
                  <p className="text-gray-500 text-xs">Voters see standings in real time</p>
                </div>
              </label>
              <label className={radioCard(form.showLiveCount === false)}>
                <input
                  type="radio"
                  name="showLiveCount"
                  checked={form.showLiveCount === false}
                  onChange={() => updateForm("showLiveCount", false)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Hide until closed</p>
                  <p className="text-gray-500 text-xs">Results revealed after voting ends</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Leaderboard Visibility</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className={radioCard(form.publicLeaderboard === true)}>
                <input
                  type="radio"
                  name="publicLeaderboard"
                  checked={form.publicLeaderboard === true}
                  onChange={() => updateForm("publicLeaderboard", true)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Public</p>
                  <p className="text-gray-500 text-xs">Rankings visible on the voting page</p>
                </div>
              </label>
              <label className={radioCard(form.publicLeaderboard === false)}>
                <input
                  type="radio"
                  name="publicLeaderboard"
                  checked={form.publicLeaderboard === false}
                  onChange={() => updateForm("publicLeaderboard", false)}
                  className="accent-[#FFD159]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Hidden</p>
                  <p className="text-gray-500 text-xs">Only you can see the leaderboard</p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* ── ACTIONS ────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/competitions"
            className="px-4 py-2 bg-[#1f1f1f] text-gray-300 rounded-xl text-sm"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || anyUploading}
            className="px-6 py-2 bg-[#FFD159] text-black rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : anyUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              "Publish Competition"
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-base {
          background: #0f0f0f;
          border: 1px solid #1f1f1f;
          color: white;
          padding: 10px 14px;
          border-radius: 12px;
          outline: none;
          width: 100%;
          font-size: 14px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-base:focus {
          border-color: #FFD159;
          box-shadow: 0 0 0 1px #FFD159;
        }
        .input-base::placeholder { color: #555; }
        .input-error {
          border-color: #f87171 !important;
          box-shadow: 0 0 0 1px #f87171 !important;
        }
        input[type="datetime-local"].input-base::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
        }
        input[type="number"].input-base::-webkit-inner-spin-button { opacity: 0.3; }
        .cont-input-base {
          background: transparent;
          border: none;
          border-bottom: 1px solid #2a2a2a;
          color: white;
          font-size: 13px;
          padding: 4px 0;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
        }
        .cont-input-base:focus { border-color: #FFD159; }
        .cont-input-base::placeholder { color: #444; }
        .cont-input-error { border-bottom-color: #f87171 !important; }
      `}</style>
    </div>
  );
};

// ─── Tiny helpers ──────────────────────────────────────────────────────────────

const input = (hasError: boolean) =>
  `input-base${hasError ? " input-error" : ""}`;

const contInput = (hasError: boolean) =>
  `cont-input-base${hasError ? " cont-input-error" : ""}`;

const radioCard = (active: boolean) =>
  `flex items-start gap-3 bg-[#0f0f0f] border rounded-xl p-4 cursor-pointer transition ${
    active ? "border-[#FFD159]" : "border-[#1f1f1f] hover:border-[#FFD159]"
  }`;

const Field = ({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-gray-400">{label}</label>}
    {children}
    {error && <ErrorMsg>{error}</ErrorMsg>}
  </div>
);

const ErrorMsg = ({ children }: { children: React.ReactNode }) => (
  <p className="text-red-400 text-xs mt-0.5">{children}</p>
);

export default CreateCompetitionPage;