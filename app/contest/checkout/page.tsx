"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HiOutlineUser, HiOutlineShieldCheck } from "react-icons/hi2";
import { CgMail } from "react-icons/cg";
import CryptoJS from "crypto-js";
import { castFreeVote, initializeVotePayment } from "@/app/actions/voting";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type VoterForm = {
  voterName: string;
  voterEmail: string;
};

type VoterErrors = {
  voterName?: string;
  voterEmail?: string;
};

// ─── Validation ───────────────────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateVoter(form: VoterForm): VoterErrors {
  const errors: VoterErrors = {};
  if (!form.voterName.trim()) errors.voterName = "Full name is required";
  if (!form.voterEmail.trim()) {
    errors.voterEmail = "Email is required";
  } else if (!emailRegex.test(form.voterEmail)) {
    errors.voterEmail = "Enter a valid email address";
  }
  return errors;
}

function hasErrors(errors: VoterErrors) {
  return Object.keys(errors).length > 0;
}

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  colSpan,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  colSpan?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${colSpan ?? ""}`}>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#FFD159] transition">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full bg-neutral-900/50 border p-4 pl-12 rounded-2xl text-sm outline-none transition
            ${
              error
                ? "border-red-500/60 bg-red-500/5 focus:border-red-500"
                : "border-neutral-800 focus:border-[#FFD159] focus:bg-neutral-900"
            }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
}

// ─── Checkout Content ─────────────────────────────────────────────────────────

const CheckoutContent = () => {
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Decrypt payload from voting page
  const data = useMemo(() => {
    const encrypted = params.get("data");
    if (!encrypted) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(
        decodeURIComponent(encrypted),
        "devave-query-secret"
      );
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch {
      return null;
    }
  }, [params]);

  const [form, setForm] = useState<VoterForm>({
    voterName: "",
    voterEmail: "",
  });
  const [errors, setErrors] = useState<VoterErrors>({});

  const updateField = (field: keyof VoterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePayment = async () => {
    setGeneralError(null);

    const formErrors = validateVoter(form);
    setErrors(formErrors);

    if (hasErrors(formErrors)) {
      setGeneralError("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const res = await initializeVotePayment({
        competitionId: data.competitionId,
        contestantId: data.contestantId,
        qty: data.qty,
        voterName: form.voterName,
        voterEmail: form.voterEmail,
      });
      window.location.href = res.payment.authorization_url;
    } catch (err: any) {
      setGeneralError(
        err.message ?? "Payment initialization failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Free voting — no payment needed ─────────────────────────────────────

  const handleFreeVote = async () => {
    setGeneralError(null);

    const formErrors = validateVoter(form);
    setErrors(formErrors);

    if (hasErrors(formErrors)) {
      setGeneralError("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      await castFreeVote({
        competitionId: data.competitionId,
        contestantId: data.contestantId,
        qty: data.qty,
        voterName: form.voterName,
        voterEmail: form.voterEmail,
      });
      router.push(`/voting/${data.competitionTitle}?voted=true`);
    } catch (err: any) {
      setGeneralError(err.message ?? "Failed to cast vote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-500 text-sm">
        Invalid or expired checkout link.
      </div>
    );
  }

  const isFree = data.pricing === "free";
  const fmt = (n: number) => `₦${new Intl.NumberFormat("en-NG").format(n)}`;

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 antialiased selection:bg-[#FFD159] selection:text-black">

      {/* HEADER */}
      <nav className="border-b border-neutral-900 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tighter">Vote Checkout</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
              Secure Transaction
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
            <HiOutlineShieldCheck className="text-[#FFD159]" size={16} /> 256-bit Encryption
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">

          {/* LEFT — VOTER DETAILS */}
          <div className="space-y-10">

            {/* CONTESTANT SUMMARY */}
            <div className="flex items-center gap-4 p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                {data.contestantPhoto ? (
                  <img
                    src={data.contestantPhoto}
                    alt={data.contestantName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-black text-[#FFD159]/30">
                    {data.contestantName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">
                  Voting for
                </p>
                <p className="font-black text-base tracking-tight truncate">
                  {data.contestantName}
                </p>
                <p className="text-xs text-neutral-500 truncate">{data.competitionTitle}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">
                  Votes
                </p>
                <p className="text-2xl font-black text-[#FFD159]">{data.qty}</p>
              </div>
            </div>

            {/* VOTER FORM */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-[#FFD159]">
                  01
                </span>
                <h2 className="text-lg font-bold tracking-tight">Your Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={<HiOutlineUser />}
                  placeholder="Full Name"
                  value={form.voterName}
                  onChange={(v) => updateField("voterName", v)}
                  error={errors.voterName}
                  colSpan="md:col-span-2"
                />
                <Field
                  icon={<CgMail />}
                  type="email"
                  placeholder="Email Address"
                  value={form.voterEmail}
                  onChange={(v) => updateField("voterEmail", v)}
                  error={errors.voterEmail}
                  colSpan="md:col-span-2"
                />
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Your email is used to send a vote confirmation receipt. It will not be shared publicly.
              </p>
            </section>
          </div>

          {/* RIGHT — ORDER SUMMARY */}
          <aside>
            <div className="lg:sticky lg:top-32">
              <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FFD159]/5 blur-[80px] rounded-full" />

                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-1">
                    Vote Summary
                  </h3>
                  <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold">
                    Review your votes
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Contestant</span>
                    <span className="font-bold truncate max-w-[140px] text-right">
                      {data.contestantName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Votes</span>
                    <span className="font-bold">{data.qty}×</span>
                  </div>

                  {!isFree && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Price per vote</span>
                      <span className="font-bold">{fmt(data.pricePerVote)}</span>
                    </div>
                  )}

                  <div className="h-px bg-neutral-800" />

                  <div className="flex justify-between items-end pt-2">
                    <span className="text-xs text-neutral-500 uppercase font-black tracking-widest">
                      Total
                    </span>
                    {isFree ? (
                      <span className="text-2xl font-black text-green-400">Free</span>
                    ) : (
                      <span className="text-3xl font-black tracking-tighter text-[#FFD159]">
                        {fmt(data.total)}
                      </span>
                    )}
                  </div>
                </div>

                {/* General error */}
                {generalError && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs text-red-400 border border-red-500/20 bg-red-500/5">
                    <span className="mt-0.5">⚠</span>
                    {generalError}
                  </div>
                )}

                <div className="space-y-4 w-full">
                  <Button
                    loading={loading}
                    onClick={isFree ? handleFreeVote : handlePayment}
                    className="w-full"
                  >
                    {isFree
                      ? `Cast ${data.qty} vote${data.qty > 1 ? "s" : ""} — Free`
                      : `Pay ${fmt(data.total)}`}
                  </Button>
                  <p className="text-[9px] text-center text-neutral-600 uppercase tracking-widest font-bold">
                    By clicking, you agree to the Terms of Service
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const VotingCheckoutPage = () => (
  <Suspense fallback={<div className="min-h-screen bg-black" />}>
    <CheckoutContent />
  </Suspense>
);

export default VotingCheckoutPage;