"use client";

import { getEventByName } from "@/app/actions/events";
import Button from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import { underscoreToSpace } from "@/lib/generalFunction";


type Ticket = {
  id: string;
  type: string;
  price: number;
  qtySold: number;
  startQty: number;
  startDate: string;
  stopdate: string;
};

type Event = {
  id: number;
  title: string;
  type: string;
  eventDate: string;
  venue: string;
  address: string;
  theme: string;
  description: string;
  banner: string | null;
  otherImages: string[] | null; // 👈 added
  visibilty: boolean;
  organizerPays: boolean;
  tickets: Ticket[];
  user: {
    id: number;
    name: string;
    email: string;
    businessName: string;
  };
  approved: boolean;
};

const MAX_TICKETS = 5;

const EventPage = () => {
  const params = useParams();
  const router = useRouter();
  const eventName = decodeURIComponent(params.eventName as string);

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: ["event", eventName],
    queryFn: () => getEventByName(underscoreToSpace(eventName)),
  });

 useEffect(() => {
  if (!event?.id) return; // ⛔ wait until event is loaded

  const trackVisit = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/visit`,
        {
          method: "POST",
        }
      );
    } catch (err) {
      // silent fail (don’t break UX if analytics fails)
      console.error("Visit tracking failed", err);
    }
  };

  trackVisit();
}, [event?.id]);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null); // 👈 lightbox state

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading event...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-red-400 text-sm">Something went wrong</p>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Event not found</p>
    </div>
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-NG", {
      hour: "2-digit", minute: "2-digit",
    });

  const initials = event.user?.name
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const selectTicket = (ticketId: string) => {
    if (selectedTicketId === ticketId) return;
    setSelectedTicketId(ticketId);
    setQty(1);
  };

  const changeQty = (delta: number) => {
    setQty((prev) => Math.max(1, Math.min(MAX_TICKETS, prev + delta)));
  };

  const selectedTicket = event.tickets?.find((t) => t.id === selectedTicketId);
  const total = selectedTicket ? selectedTicket.price * qty : 0;
  const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

  const hasOtherImages = event.otherImages && event.otherImages.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* LIGHTBOX */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/60 hover:text-white text-3xl leading-none"
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
          <img
            src={lightboxImg}
            alt="Full view"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* HERO BANNER */}
      <div className="relative w-full h-[480px] md:h-[520px] overflow-hidden">
        {event.banner ? (
          <img
            src={event.banner}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#111] flex items-center justify-center text-6xl">
            🎪
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-[#0a0a0a]" />

        <div className="absolute top-5 left-5">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/70 text-sm bg-black/30 backdrop-blur-sm px-3 py-2 rounded-xl hover:text-white transition"
          >
            ← Back
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFD159] text-black uppercase tracking-wide">
              {event.type}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full border border-white/20 text-white/70 uppercase tracking-wide">
              {event.visibilty ? "Public Event" : "Private Event"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-2">
            {event.title}
          </h1>
          <p className="text-white/50 text-sm">
            by <span className="text-white/80">{event.user?.name}</span> · {event.user?.businessName}
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] min-h-screen">

        {/* LEFT */}
        <div className="p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-[#1e1e1e]">

          {/* INFO STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1e1e1e] border border-[#1e1e1e] rounded-2xl overflow-hidden mb-8">
            {[
              {
                icon: "📅", label: "Date",
                val: new Date(event.eventDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }),
                sub: new Date(event.eventDate).toLocaleDateString("en-NG", { weekday: "long" }),
              },
              { icon: "🕖", label: "Time", val: formatTime(event.eventDate), sub: "WAT" },
              { icon: "📍", label: "Venue", val: event.venue, sub: event.address },
            ].map((item) => (
              <div key={item.label} className="bg-[#111] p-4 md:p-5 col-span-1 last:col-span-2 md:last:col-span-1">
                <div className="text-xl mb-2">{item.icon}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-white leading-snug">{item.val}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* ABOUT */}
          <div className="mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">About this event</p>
            <p className="text-gray-400 text-base leading-relaxed">{event.description}</p>
          </div>

          {/* THEME */}
          {event.theme && (
            <div className="mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Theme</p>
              <p className="text-gray-400 text-base">{event.theme}</p>
            </div>
          )}

          {/* OTHER IMAGES GALLERY */}
          {hasOtherImages && (
            <div className="mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
                Gallery · {event.otherImages!.length} photo{event.otherImages!.length > 1 ? "s" : ""}
              </p>

              {event.otherImages!.length === 1 && (
                <div
                  className="rounded-2xl overflow-hidden border border-[#1e1e1e] cursor-zoom-in group"
                  onClick={() => setLightboxImg(event.otherImages![0])}
                >
                  <img
                    src={event.otherImages![0]}
                    alt="Event photo"
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {event.otherImages!.length === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {event.otherImages!.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden border border-[#1e1e1e] cursor-zoom-in group"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img
                        src={img}
                        alt={`Event photo ${i + 1}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {event.otherImages!.length === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  {/* first image spans full width */}
                  <div
                    className="col-span-2 rounded-2xl overflow-hidden border border-[#1e1e1e] cursor-zoom-in group"
                    onClick={() => setLightboxImg(event.otherImages![0])}
                  >
                    <img
                      src={event.otherImages![0]}
                      alt="Event photo 1"
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* remaining two side by side */}
                  {event.otherImages!.slice(1).map((img, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden border border-[#1e1e1e] cursor-zoom-in group"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img
                        src={img}
                        alt={`Event photo ${i + 2}`}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {event.otherImages!.length === 4 && (
                <div className="grid grid-cols-2 gap-2">
                  {event.otherImages!.map((img, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden border border-[#1e1e1e] cursor-zoom-in group"
                      onClick={() => setLightboxImg(img)}
                    >
                      <img
                        src={img}
                        alt={`Event photo ${i + 1}`}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORGANIZER */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Organized by</p>
            <div className="flex items-center gap-4 p-4 bg-[#111] border border-[#1e1e1e] rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-[#FFD159]/10 border border-[#FFD159]/20 flex items-center justify-center text-[#FFD159] font-black text-sm flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="font-semibold text-white">{event.user?.name}</p>
                <p className="text-gray-500 text-sm">{event.user?.businessName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — TICKETS */}
        <div className="p-6 md:p-8 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight mb-1">{event.approved ? "Get Tickets":"Ticket Purchase Not Allowed"}</h2>
            <p className="text-gray-500 text-sm">{event.approved ? "One type per order · max 5 tickets" : "This Event is Yet to be Approved By DeCave Management" }</p>
          </div>

          {/* TICKET CARDS */}
          {
            event.approved && 
           <div className="flex flex-col gap-3 mb-4">
            {event.tickets?.map((ticket) => {
              const isSelected = selectedTicketId === ticket.id;
              const now = new Date(new Date().getTime() + 1 * 60 * 60 * 1000); 

              const isDimmed =
                (selectedTicketId !== null && !isSelected) ||
                new Date(ticket.startDate) > now || new Date(ticket.stopdate) < now; 
                const remaining = ticket.startQty - ticket.qtySold;
              const soldPct = Math.round((ticket.qtySold / ticket.startQty) * 100);

              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                const now = new Date(new Date().getTime() + 1 * 60 * 60 * 1000); 


                const hasStarted = new Date(ticket.startDate) <= now;
  const notEnded = new Date(ticket.stopdate) >= now;
                if (hasStarted && notEnded) {
                  selectTicket(ticket.id);
                }
              }}
                  className={`border rounded-2xl p-5 transition-all duration-200 ${isSelected
                      ? "border-[#FFD159] bg-[#FFD159]/5 cursor-pointer"
                      : isDimmed
                        ? "border-[#1e1e1e] bg-[#111] opacity-35 cursor-default"
                        : "border-[#1e1e1e] bg-[#111] hover:border-[#333] cursor-pointer"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-black tracking-tight">{ticket.type}</span>
                        {ticket.type === "VIP" && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFD159] text-black uppercase tracking-wide">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs">
                        {ticket.type === "VIP" ? "Premium experience" : "General admission"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#FFD159] text-xl font-black">{fmt(ticket.price)}</p>
                      <p className="text-gray-600 text-xs">per ticket</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1.5"> {new Date(ticket.startDate)>= now ? "Ticket is not yet on Sales": new Date(ticket.stopdate) <= now ? "SOLD OUT" :"Limited tickets remaining"} </p>
                    {
                        new Date(ticket.stopdate) >= now &&
                    <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FFD159] rounded-full"
                        style={{ width: `${100 - soldPct}%` }}
                      />
                    </div>
                    }
                  </div>

                  {isSelected && (
                    <div
                      className="flex items-center justify-between mt-4 pt-4 border-t border-[#1e1e1e]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm text-gray-400">
                        Qty <span className="text-gray-600 text-xs">(max 5)</span>
                      </span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => changeQty(-1)}
                          disabled={qty <= 1}
                          className="w-9 h-9 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] text-white text-xl flex items-center justify-center disabled:opacity-20 hover:border-[#FFD159] transition"
                        >
                          −
                        </button>
                        <span className="text-xl font-black w-5 text-center">{qty}</span>
                        <button
                          onClick={() => changeQty(1)}
                          disabled={qty >= MAX_TICKETS}
                          className="w-9 h-9 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] text-white text-xl flex items-center justify-center disabled:opacity-20 hover:border-[#FFD159] transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
           
          }
         

          {/* SUMMARY */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            {selectedTicket ? (
              <>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{selectedTicket.type} × {qty}</span>
                  <span className="text-white font-medium">{fmt(selectedTicket.price)} each</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mb-3">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{fmt(total)}</span>
                </div>
                <div className="h-px bg-[#1e1e1e] mb-3" />
              </>
            ) : (
              <p className="text-gray-600 text-sm text-center mb-3">No ticket selected yet</p>
            )}

            <div className="flex justify-between items-baseline mb-4">
              <span className="text-base font-bold">Total</span>
              <span className="text-2xl font-black text-[#FFD159]">{fmt(total)}</span>
            </div>

            <Button
              onClick={() => {
                const data = {
                  eventId: event.id,
                  ticketId: selectedTicket?.id,
                  qty,
                  total,
                  orgPays: event.organizerPays,
                };
                const encrypted = CryptoJS.AES.encrypt(
                  JSON.stringify(data),
                  "devave-query-secret"
                ).toString();
                router.push(`/events/checkout?data=${encodeURIComponent(encrypted)}`);
              }}
              disabled={!selectedTicketId}
              className="w-full py-4 rounded-xl bg-[#FFD159] text-black text-base font-black tracking-tight disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {selectedTicketId
                ? `Purchase ${qty} ticket${qty > 1 ? "s" : ""} · ${fmt(total)}`
                : "Select a ticket to continue"}
            </Button>

            {event.organizerPays && selectedTicketId && (
              <p className="text-center text-xs mt-3">
                <span className="text-green-400">✓</span>{" "}
                <span className="text-gray-500">Organizer covers all fees</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
