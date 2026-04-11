"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HiOutlineUser, HiOutlinePhone, HiOutlineTicket, HiOutlineShieldCheck } from "react-icons/hi2";
import { RiToggleLine, RiToggleFill } from "react-icons/ri";
import { CgMail } from "react-icons/cg";
import CryptoJS  from 'crypto-js';
import { initializePayment, InitializePayment } from "@/app/actions/events";
import Button from "@/components/ui/Button";

const CheckoutContent = () => {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false)
  
//   const qty = Number(params.get("qty") || 1);
const data = useMemo(() => {
    const encrypted = params.get("data");

    if (!encrypted) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(
        decodeURIComponent(encrypted),
        "devave-query-secret"
      );

      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      return JSON.parse(decrypted);
    } catch (err) {
      console.error("Failed to decrypt:", err);
      return null;
    }
  }, [params]);

const eventId = data.eventId;
  const ticketId = data.ticketId;




const qty = data.qty;

  const [assignOthers, setAssignOthers] = useState(false);
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", eventId, ticketId });

  const [attendees, setAttendees] = useState(
    Array.from({ length: qty-1 }, () => ({ name: "", email: "", phone: "", eventId, ticketId }))
  );

  const updateAttendee = (index: number, field: string, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    setAttendees(updated);
  };


const buildPayload = (): InitializePayment[] => {
  const qtyNumber = Number(qty);

  const base = {
    eventId: Number(eventId),
    ticketId: ticketId || "",
  };

  // CASE 1: NOT assigning to others → duplicate buyer
  if (!assignOthers) {
    return Array.from({ length: qtyNumber }, () => ({
      ...buyer,
      ...base,
    }));
  }

  const filledAttendees = attendees.filter(
    (a) => a.name || a.email || a.phone
  );

  // CASE 2: no attendees filled → duplicate buyer
  if (filledAttendees.length === 0) {
    return Array.from({ length: qtyNumber }, () => ({
      ...buyer,
      ...base,
    }));
  }

  // CASE 3: mix buyer + attendees
  const people = [buyer, ...filledAttendees];

  return Array.from({ length: qtyNumber }, (_, i) => ({
    ...(people[i] || buyer),
    ...base,
  }));
};


const handlePayment = async () => {
    setLoading(true)
  const payload = buildPayload();


const res = await initializePayment(payload);
window.location.href = res.payment.authorization_url
//    console.log(res);
};







  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 antialiased selection:bg-[#FFD159] selection:text-black">
      
      {/* HEADER - Minimalist */}
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

          {/* LEFT: FORM FLOW */}
          <div className="space-y-12">
            
            {/* STEP 1: BUYER */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-[#FFD159]">01</span>
                <h2 className="text-lg font-bold tracking-tight">Your Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#FFD159] transition" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-neutral-900/50 border border-neutral-800 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-[#FFD159] focus:bg-neutral-900 transition"
                    value={buyer.name}
                    onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                  />
                </div>
                <div className="relative group">
                  <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#FFD159] transition" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full bg-neutral-900/50 border border-neutral-800 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-[#FFD159] focus:bg-neutral-900 transition"
                    value={buyer.phone}
                    onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                  />
                </div>
                <div className="relative group md:col-span-2">
                  <CgMail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-[#FFD159] transition" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full bg-neutral-900/50 border border-neutral-800 p-4 pl-12 rounded-2xl text-sm outline-none focus:border-[#FFD159] focus:bg-neutral-900 transition"
                    value={buyer.email}
                    onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* STEP 2: MULTI-TICKET LOGIC */}
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
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD159]">Attendee {i + 1}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            placeholder="Full Name"
                            className="bg-black/40 border border-neutral-800 p-4 rounded-xl text-sm outline-none focus:border-[#FFD159] transition"
                            value={person.name}
                            onChange={(e) => updateAttendee(i, "name", e.target.value)}
                          />
                          <input
                            placeholder="Email"
                            className="bg-black/40 border border-neutral-800 p-4 rounded-xl text-sm outline-none focus:border-[#FFD159] transition"
                            value={person.email}
                            onChange={(e) => updateAttendee(i, "email", e.target.value)}
                          />
                          <input
                            placeholder="Phone"
                            className="bg-black/40 border border-neutral-800 p-4 rounded-xl text-sm outline-none focus:border-[#FFD159] transition"
                            value={person.phone}
                            onChange={(e) => updateAttendee(i, "phone", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY STICKY */}
          <aside>
            <div className="lg:sticky lg:top-32">
              <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                {/* Decorative background element */}
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
                    <span className="text-3xl font-bold tracking-tighter text-[#FFD159]">₦{new Intl.NumberFormat("en-NG").format(data.total)}</span>
                  </div>
                </div>

                <div className="space-y-4 w-full">
                  <Button loading={loading}  onClick={handlePayment} className="w-full">
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

// Next.js requires Suspense for useSearchParams
const CheckoutPage = () => (
  <Suspense fallback={<div className="min-h-screen bg-black" />}>
    <CheckoutContent />
  </Suspense>
);

export default CheckoutPage;