"use client";

import React, { useState } from "react";
import { MdArrowBack, MdCheck, MdClose } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { getUserEvents, getAttendeesById } from "@/app/actions/events"; // 👈 adjust path

// ─── Types ────────────────────────────────────────────────────────────────────

type Ticket = {
  id: string;
  type: string;
  description: string;
  price: number;
  startQty: number;
  qtySold: number;
  startDate: string;
  stopdate: string;
};

type Event = {
  id: number;
  title: string;
  type: string;
  description: string;
  venue: string;
  visibilty: boolean;
  address: string;
  eventDate: string;
  theme: string | null;
  banner: string | null;
  tickets: Ticket[];
  organizerPays: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
  attendeesCount?: number;
};

type AttendeeEvent = {
  id: number;
  title: string;
  type: string;
  description: string;
  venue: string;
  visibilty: boolean;
  address: string;
  eventDate: string;
  theme: string | null;
};

type Attendee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ticketType: string;
  amount: number;
  checkedIn: boolean;
  qrCode: string | null;
  paystackId: string;
  event: AttendeeEvent;
};

type PaginatedAttendees = {
  data: Attendee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-[#1f1f1f] rounded-xl" />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="p-4 bg-[#121212] border border-[#1f1f1f] rounded-2xl animate-pulse space-y-3"
        >
          <div className="h-5 bg-[#1f1f1f] rounded w-2/3" />
          <div className="h-4 bg-[#1f1f1f] rounded w-1/3" />
          <div className="h-4 bg-[#1f1f1f] rounded w-1/4" />
        </div>
      ))}
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#1f1f1f]">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 rounded-lg text-sm bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 rounded-lg text-sm bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Attendees Table ──────────────────────────────────────────────────────────

function AttendeesTable({ eventId }: { eventId: number }) {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useQuery<PaginatedAttendees>({
    queryKey: ["attendees", eventId, page],
    queryFn: () => getAttendeesById(String(eventId), String(page), String(limit)),
    staleTime: 30_000,
  });

  if (isLoading) return <TableSkeleton />;

  if (error)
    return (
      <p className="text-center text-red-400 py-10 text-sm">
        Failed to load attendees. Please try again.
      </p>
    );

  if (!data?.data.length)
    return (
      <p className="text-gray-500 text-center py-10">
        No attendees for this event yet.
      </p>
    );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-[#121212] divide-y divide-[#1f1f1f]">
          <thead className="bg-[#1a1a1a]">
            <tr>
              {["Name", "Email", "Phone", "Ticket", "Amount", "CheckedIn"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1f1f1f]">
            {data.data.map((attendee) => (
              <tr key={attendee.id} className="hover:bg-[#1a1a1a] transition">
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                  {attendee.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {attendee.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {attendee.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {attendee.ticketType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {formatAmount(attendee.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attendee.checkedIn
                        ? "bg-green-500/10 text-green-400"
                        : "bg-[#1f1f1f] text-gray-400"
                    }`}
                  >
                    {attendee.checkedIn ? "✓ Checked In" : "Awaiting"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={data.totalPages}
        onPageChange={setPage}
      />

      {/* Summary */}
      <div className="px-6 py-3 border-t border-[#1f1f1f]">
        <p className="text-xs text-gray-600">
          Showing {data.data.length} of {data.total} attendees
        </p>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AttendeesPage = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery<Event[]>({
    queryKey: ["user-events"],
    queryFn: getUserEvents,
    staleTime: 60_000,
  });

  // ── Event list ──
  if (!selectedEvent) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold text-white">Events</h1>

        {eventsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
          </div>
        )}

        {eventsError && (
          <p className="text-red-400 text-sm">
            Failed to load events. Please refresh the page.
          </p>
        )}

        {events && events.length === 0 && (
          <p className="text-gray-500 text-sm">
            You have no events yet.
          </p>
        )}

        {events && events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-[#121212] border border-[#1f1f1f] rounded-2xl hover:bg-[#1a1a1a] cursor-pointer transition"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-lg font-semibold text-white leading-tight">
                    {event.title}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFD159]/10 text-[#FFD159] shrink-0">
                    {event.type}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mt-1">
                  📅 {formatDate(event.eventDate)}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  📍 {event.venue}
                </p>
                {event.attendeesCount !== undefined && (
                  <p className="text-gray-500 text-sm mt-1">
                    🎟 {event.attendeesCount} attendees
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Attendees view ──
  return (
    <div className="p-4 sm:p-6 max-w-screen mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedEvent(null)}
          className="p-2 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white transition"
        >
          <MdArrowBack size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {selectedEvent.title}
          </h1>
          <p className="text-gray-500 text-sm">
            {formatDate(selectedEvent.eventDate)} · {selectedEvent.venue}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1f1f1f] rounded-2xl overflow-hidden">
        <AttendeesTable eventId={selectedEvent.id} />
      </div>
    </div>
  );
};

export default AttendeesPage;