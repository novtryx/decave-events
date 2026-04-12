"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineUser, HiOutlinePhone, HiOutlineTicket, HiOutlineShieldCheck } from "react-icons/hi2";
import { RiToggleLine, RiToggleFill } from "react-icons/ri";
import { CgMail } from "react-icons/cg";
import CryptoJS from 'crypto-js';
import { initializePayment, InitializePayment } from "@/app/actions/events";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Person = {
  name: string;
  email: string;
  phone: string;
  eventId: number;
  ticketId: string;
};

type PersonErrors = {
  name?: string;
  email?: string;
  phone?: string;
};

// ─── Validation ───────────────────────────────────────────────────────────────

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\s\-()]{7,15}$/;

function validatePerson(person: Person): PersonErrors {
  const errors: PersonErrors = {};
  if (!person.name.trim()) errors.name = "Full name is required";
  if (!person.email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(person.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!person.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (!phoneRegex.test(person.phone)) {
    errors.phone = "Enter a valid phone number";
  }
  return errors;
}

function hasErrors(errors: PersonErrors) {
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
            ${error
              ? "border-red-500/60 bg-red-500/5 focus:border-red-500"
              : "border-neutral-800 focus:border-[#FFD159] focus:bg-neutral-900"
            }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 pl-1">{error}</p>
      )}
    </div>
  );
}

// ─── Checkout Content ─────────────────────────────────────────────────────────

const CheckoutContent = () => {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

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

  const eventId = data?.eventId;
  const ticketId = data?.ticketId;
  const qty = data?.qty ?? 1;

  const [assignOthers, setAssignOthers] = useState(false);

  const [buyer, setBuyer] = useState<Person>({
    name: "", email: "", phone: "", eventId, ticketId,
  });
  const [buyerErrors, setBuyerErrors] = useState<PersonErrors>({});

  const [attendees, setAttendees] = useState<Person[]>(
    Array.from({ length: qty - 1 }, () => ({
      name: "", email: "", phone: "", eventId, ticketId,
    }))
  );
  const [attendeeErrors, setAttendeeErrors] = useState<PersonErrors[]>(
    Array.from({ length: qty - 1 }, () => ({}))
  );

  const updateAttendee = (index: number, field: keyof Person, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);

    // clear error on change
    if (attendeeErrors[index]?.[field as keyof PersonErrors]) {
      const updatedErrors = [...attendeeErrors];
      updatedErrors[index] = { ...updatedErrors[index], [field]: undefined };
      setAttendeeErrors(updatedErrors);
    }
  };

  const buildPayload = (): InitializePayment[] => {
    const base = { eventId: Number(eventId), ticketId: ticketId || "" };
    if (!assignOthers) {
      return Array.from({ length: Number(qty) }, () => ({ ...buyer, ...base }));
    }
    const filled = attendees.filter((a) => a.name || a.email || a.phone);
    if (filled.length === 0) {
      return Array.from({ length: Number(qty) }, () => ({ ...buyer, ...base }));
    }
    const people = [buyer, ...filled];
    return Array.from({ length: Number(qty) }, (_, i) => ({
      ...(people[i] || buyer),
      ...base,
    }));
  };

  const handlePayment = async () => {
    setGeneralError(null);

    // validate buyer
    const bErrors = validatePerson(buyer);
    setBuyerErrors(bErrors);

    // validate attendees if assigning others
    let aErrors: PersonErrors[] = [...attendeeErrors];
    if (assignOthers) {
      aErrors = attendees.map((a) => validatePerson(a));
      setAttendeeErrors(aErrors);
    }

    const buyerInvalid = hasErrors(bErrors);
    const attendeesInvalid = assignOthers && aErrors.some(hasErrors);

    if (buyerInvalid || attendeesInvalid) {
      setGeneralError("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const res = await initializePayment(payload);
      window.location.href = res.payment.authorization_url;
    } catch (err: any) {
      setGeneralError(err.message ?? "Payment initialization failed. Please try again.");
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

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 antialiased selection:bg-[#FFD159] selection:text-black">

      {/* HEADER */}
      <nav className="border-b border-neutral-900 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tighter">Checkout</h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Secure Transaction</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
            <HiOutlineShieldCheck className="text-[#FFD159]" size={16} /> 256-bit Encryption
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">

          {/* LEFT */}
          <div className="space-y-12">

            {/* STEP 1: BUYER */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-[#FFD159]">01</span>
                <h2 className="text-lg font-bold tracking-tight">Your Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={<HiOutlineUser />}
                  placeholder="Full Name"
                  value={buyer.name}
                  onChange={(v) => {
                    setBuyer({ ...buyer, name: v });
                    if (buyerErrors.name) setBuyerErrors({ ...buyerErrors, name: undefined });
                  }}
                  error={buyerErrors.name}
                />
                <Field
                  icon={<HiOutlinePhone />}
                  type="tel"
                  placeholder="Phone Number"
                  value={buyer.phone}
                  onChange={(v) => {
                    setBuyer({ ...buyer, phone: v });
                    if (buyerErrors.phone) setBuyerErrors({ ...buyerErrors, phone: undefined });
                  }}
                  error={buyerErrors.phone}
                />
                <Field
                  icon={<CgMail />}
                  type="email"
                  placeholder="Email Address"
                  value={buyer.email}
                  onChange={(v) => {
                    setBuyer({ ...buyer, email: v });
                    if (buyerErrors.email) setBuyerErrors({ ...buyerErrors, email: undefined });
                  }}
                  error={buyerErrors.email}
                  colSpan="md:col-span-2"
                />
              </div>
            </section>

            {/* STEP 2: MULTI-TICKET */}
            {qty > 1 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-neutral-900/30 border border-neutral-800 rounded-[2rem]">
                  <div className="flex items-center gap-4">
                    <HiOutlineTicket size={24} className="text-[#FFD159]" />
                    <div>
                      <p className="text-sm font-bold">Assign individual tickets?</p>
                      <p className="text-xs text-neutral-500">Enable this to provide names for each attendee</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAssignOthers(!assignOthers)}
                    className="text-3xl text-[#FFD159] hover:opacity-80 transition"
                  >
                    {assignOthers ? <RiToggleFill /> : <RiToggleLine className="text-neutral-700" />}
                  </button>
                </div>

                {assignOthers && (
                  <div className="grid grid-cols-1 gap-6 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {attendees.map((person, i) => (
                      <div key={i} className="p-8 bg-neutral-900/50 border border-neutral-800 rounded-[2rem] space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD159]">
                          Attendee {i + 1}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <input
                              placeholder="Full Name"
                              className={`bg-black/40 border p-4 rounded-xl text-sm outline-none transition
                                ${attendeeErrors[i]?.name ? "border-red-500/60" : "border-neutral-800 focus:border-[#FFD159]"}`}
                              value={person.name}
                              onChange={(e) => updateAttendee(i, "name", e.target.value)}
                            />
                            {attendeeErrors[i]?.name && (
                              <p className="text-xs text-red-400 pl-1">{attendeeErrors[i].name}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <input
                              placeholder="Email"
                              className={`bg-black/40 border p-4 rounded-xl text-sm outline-none transition
                                ${attendeeErrors[i]?.email ? "border-red-500/60" : "border-neutral-800 focus:border-[#FFD159]"}`}
                              value={person.email}
                              onChange={(e) => updateAttendee(i, "email", e.target.value)}
                            />
                            {attendeeErrors[i]?.email && (
                              <p className="text-xs text-red-400 pl-1">{attendeeErrors[i].email}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <input
                              placeholder="Phone"
                              className={`bg-black/40 border p-4 rounded-xl text-sm outline-none transition
                                ${attendeeErrors[i]?.phone ? "border-red-500/60" : "border-neutral-800 focus:border-[#FFD159]"}`}
                              value={person.phone}
                              onChange={(e) => updateAttendee(i, "phone", e.target.value)}
                            />
                            {attendeeErrors[i]?.phone && (
                              <p className="text-xs text-red-400 pl-1">{attendeeErrors[i].phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <aside>
            <div className="lg:sticky lg:top-32">
              <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FFD159]/5 blur-[80px] rounded-full" />

                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-1">Order Summary</h3>
                  <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold">Review your purchase</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Ticket Quantity</span>
                    <span className="font-bold">{qty}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Service Fee</span>
                    <span className="text-green-500 font-bold uppercase text-[10px] tracking-widest">Included</span>
                  </div>
                  <div className="h-px bg-neutral-800 mt-4" />
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-xs text-neutral-500 uppercase font-black tracking-widest">Total</span>
                    <span className="text-3xl font-bold tracking-tighter text-[#FFD159]">
                      ₦{new Intl.NumberFormat("en-NG").format(data.total)}
                    </span>
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
                  <Button loading={loading} onClick={handlePayment} className="w-full">
                    Initialize Payment
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

const CheckoutPage = () => (
  <Suspense fallback={<div className="min-h-screen bg-black" />}>
    <CheckoutContent />
  </Suspense>
);

export default CheckoutPage;