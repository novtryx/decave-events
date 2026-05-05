"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserEvents } from "@/app/actions/events";
import { deleteEvent } from "@/app/actions/events"; // adjust import path as needed
import { spaceToUnderscore } from "@/lib/generalFunction";
import { MdShare, MdCheck, MdClose, MdWarning } from "react-icons/md";

// ── Confirmation Modal ───────────────────────────────────────────────────────
interface DeleteModalProps {
  event: any;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteModal = ({ event, onConfirm, onCancel, isDeleting }: DeleteModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
  >
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

    {/* Dialog */}
    <div className="relative bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl shadow-black/60 overflow-hidden animate-in">
      {/* Red top strip */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 to-red-400" />

      <div className="p-6 flex flex-col gap-5">
        {/* Icon + heading */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <MdWarning size={20} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base leading-tight">
              Delete Event
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Event preview */}
        <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl px-4 py-3 flex items-center gap-3">
          {event?.banner ? (
            <img
              src={event.banner}
              alt={event.title}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#252525] flex items-center justify-center text-lg flex-shrink-0">
              🎪
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{event?.title}</p>
            <p className="text-gray-500 text-xs truncate">{event?.venue}</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">"{event?.title}"</span>? All
          associated tickets and attendee data will be permanently removed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-gray-300 text-sm font-medium 
            hover:bg-[#1f1f1f] hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium 
            transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete Event"
            )}
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onCancel}
        disabled={isDeleting}
        className="absolute top-4 right-4 text-gray-500 hover:text-white transition disabled:opacity-50"
      >
        <MdClose size={18} />
      </button>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const Events = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Delete modal state
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-events"],
    queryFn: getUserEvents,
  });

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-red-400 p-6">Something went wrong</p>;

  const filteredEvents = (data ?? []).filter((event: any) => {
    const matchQ =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.venue?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || event.type === typeFilter;
    return matchQ && matchType;
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const handleShare = async (event: any) => {
    const slug = spaceToUnderscore(event.title);
    const url = `${window.location.origin}/events/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on ${formatDate(event.eventDate)} at ${event.venue}`,
          url,
        });
      } catch {
        // user cancelled — do nothing
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // silent fail
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await deleteEvent(String(eventToDelete.id));
      await queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setEventToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* DELETE CONFIRMATION MODAL */}
      {eventToDelete && (
        <DeleteModal
          event={eventToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeleting && setEventToDelete(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Your Events</h1>
          <Link
            href="/dashboard/events/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD159] hover:opacity-90 text-black rounded-xl text-sm font-medium transition"
          >
            + Create Event
          </Link>
        </div>

        {/* SEARCH / FILTER */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#121212] border border-[#1f1f1f] text-white rounded-xl px-4 py-2 
            placeholder:text-gray-500 focus:ring-1 focus:ring-[#FFD159] outline-none transition"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#121212] border border-[#1f1f1f] text-white rounded-xl px-3 py-2 
            focus:ring-1 focus:ring-[#FFD159] outline-none transition"
          >
            <option value="">All Types</option>
            <option value="music">Music</option>
            <option value="tech">Tech</option>
            <option value="art">Art</option>
            <option value="food">Food</option>
          </select>
        </div>

        {/* EVENTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event: any) => {
            const isCopied = copiedId === event?.id;

            return (
              <div
                key={event?.id}
                className="relative bg-[#121212] rounded-2xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition flex flex-col overflow-hidden"
              >
                {/* APPROVAL BADGE */}
                <div className="absolute top-3 right-3 z-10">
                  {event?.approved ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black text-green-400 border border-green-500/20">
                      <MdCheck size={12} />
                      Approved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-black text-yellow-400 border border-yellow-500/20">
                      Not Approved
                    </span>
                  )}
                </div>

                {/* BANNER */}
                {event?.banner ? (
                  <img
                    src={event?.banner}
                    alt={event?.title}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-[#1a1a1a] flex items-center justify-center text-3xl">
                    🎪
                  </div>
                )}

                {/* BODY */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-white text-base leading-tight">
                      {event?.title}
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#FFD159] text-black whitespace-nowrap">
                      {event?.type}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      📅 {formatDate(event?.eventDate)} · {formatTime(event?.eventDate)}
                    </p>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      📍 {event?.venue}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg">
                      👥 <span className="font-semibold text-white">{event?.attendeesCount}</span> attendees
                    </span>
                    <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg">
                      🎟 <span className="font-semibold text-white">{event?.tickets?.length ?? 0}</span> ticket types
                    </span>
                    <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg">
                      👁 <span className="font-semibold text-white">{event?.visitsCount ?? 0}</span> views
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {event?.organizerPays && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                        ✓ organizer pays fees
                      </span>
                    )}
                    <span className="text-xs flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${
                          event?.visibilty ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <span className="text-gray-400">
                        {event?.visibilty ? "Public" : "Private"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="flex items-center border-t border-[#1f1f1f]">
                  <Link
                    href={`/events/${spaceToUnderscore(event?.title)}`}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-[#FFD159] hover:bg-[#1a1a1a] transition"
                  >
                    View
                  </Link>
                  <div className="w-px h-5 bg-[#1f1f1f]" />
                  <Link
                    href={`/dashboard/events/edit/${spaceToUnderscore(event?.title)}`}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-gray-400 hover:text-[#FFD159] hover:bg-[#1a1a1a] transition"
                  >
                    Edit
                  </Link>
                  <div className="w-px h-5 bg-[#1f1f1f]" />
                  <button
                    onClick={() => handleShare(event)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-gray-400 hover:text-[#FFD159] hover:bg-[#1a1a1a] transition"
                  >
                    {isCopied ? (
                      <>
                        <MdCheck size={14} className="text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <MdShare size={14} />
                        Share
                      </>
                    )}
                  </button>
                  <div className="w-px h-5 bg-[#1f1f1f]" />
                  {/* DELETE — now opens modal */}
                  <button
                    onClick={() => setEventToDelete(event)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-red-400 hover:bg-[#1a1a1a] transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <p className="text-gray-500 text-center py-10">No events found.</p>
        )}
      </div>
    </>
  );
};

export default Events;