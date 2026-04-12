"use client";

import Link from "next/link";
import { MdEvent, MdPeople, MdConfirmationNumber, MdAttachMoney } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview } from "@/app/actions/events"; // 👈 adjust path
import { spaceToUnderscore } from "@/lib/generalFunction";

// ─── Types ────────────────────────────────────────────────────────────────────

type DashboardStats = {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalAttendees: number;
};

type UpcomingEvent = {
  id: number;
  title: string;
  eventDate: string;
  venue: string;
  ticketsSold: number;
};

type DashboardOverview = {
  stats: DashboardStats;
  upcomingEvents: UpcomingEvent[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] animate-pulse"
        >
          <div className="w-12 h-12 bg-[#1f1f1f] rounded-xl" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-16 bg-[#1f1f1f] rounded" />
            <div className="h-3 w-24 bg-[#1f1f1f] rounded" />
          </div>
        </div>
      ))}
    </>
  );
}

function EventsSkeleton() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex justify-between bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] animate-pulse"
        >
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 bg-[#1f1f1f] rounded" />
            <div className="h-3 w-24 bg-[#1f1f1f] rounded" />
          </div>
          <div className="h-4 w-20 bg-[#1f1f1f] rounded" />
        </div>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DashboardOverview = () => {
  const { data, isLoading, error } = useQuery<DashboardOverview>({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
    staleTime: 30_000,
  });

  const stats = [
    {
      label: "Events",
      value: data?.stats.totalEvents ?? 0,
      icon: <MdEvent className="text-3xl text-[#FFD159]" />,
    },
    {
      label: "Tickets Sold",
      value: data?.stats.totalTicketsSold ?? 0,
      icon: <MdConfirmationNumber className="text-3xl text-[#FFD159]" />,
    },
    {
      label: "Revenue",
      value: formatAmount(data?.stats.totalRevenue ?? 0),
      icon: <MdAttachMoney className="text-3xl text-[#FFD159]" />,
    },
    {
      label: "Attendees",
      value: data?.stats.totalAttendees ?? 0,
      icon: <MdPeople className="text-3xl text-[#FFD159]" />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-white">Overview</h1>
        <Link
          href="/dashboard/events/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD159] hover:opacity-90 text-black rounded-xl text-sm font-medium transition"
        >
          + Create Event
        </Link>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <StatsSkeleton />
        ) : error ? (
          <p className="text-red-400 text-sm col-span-4">
            Failed to load stats. Please refresh.
          </p>
        ) : (
          stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] hover:bg-[#1a1a1a] transition cursor-pointer"
            >
              <div className="p-3 bg-[#FFD159]/10 rounded-xl flex items-center justify-center">
                {stat.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">{stat.value}</span>
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPCOMING EVENTS */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <EventsSkeleton />
          ) : error ? (
            <p className="text-red-400 text-sm">Failed to load upcoming events.</p>
          ) : data?.upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming events.</p>
          ) : (
            data?.upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] hover:bg-[#1a1a1a] transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-white font-semibold">{event.title}</span>
                  <span className="text-gray-400 text-sm">
                    {formatDate(event.eventDate)}
                  </span>
                  <span className="text-gray-600 text-sm hidden sm:block">·</span>
                  <span className="text-gray-500 text-sm">{event.venue}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <span className="text-sm text-gray-400">
                    {event.ticketsSold} Tickets Sold
                  </span>
                  <Link
                    href={`/events/${spaceToUnderscore(event.title) }`}
                    className="text-[#FFD159] font-medium text-sm hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ANALYTICS */}
      <div className="bg-[#121212] p-6 rounded-2xl border border-[#1f1f1f]">
        <h2 className="text-lg font-semibold text-white mb-3">
          Recent Activity / Analytics
        </h2>
        <p className="text-gray-400 text-sm">
          Charts or activity feed can go here. You can show revenue trends, ticket
          sales, or attendee stats.
        </p>
      </div>
    </div>
  );
};

export default DashboardOverview;