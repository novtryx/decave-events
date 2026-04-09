"use client";

import Link from "next/link";
import { MdEvent, MdPeople, MdConfirmationNumber, MdAttachMoney } from "react-icons/md";

const overviewStats = [
  { label: "Events", value: 12, icon: <MdEvent className="text-3xl text-[#FFD159]" /> },
  { label: "Tickets Sold", value: 245, icon: <MdConfirmationNumber className="text-3xl text-[#FFD159]" /> },
  { label: "Revenue", value: "$5,230", icon: <MdAttachMoney className="text-3xl text-[#FFD159]" /> },
  { label: "Attendees", value: 198, icon: <MdPeople className="text-3xl text-[#FFD159]" /> },
];

const upcomingEvents = [
  { id: 1, title: "Summer Music Festival", date: "Apr 12, 2026", tickets: 120 },
  { id: 2, title: "Tech Conference 2026", date: "May 05, 2026", tickets: 200 },
  { id: 3, title: "Art Exhibition", date: "May 20, 2026", tickets: 50 },
];

const DashboardOverview = () => {

 
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
        {overviewStats.map((stat) => (
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
        ))}
      </div>

      {/* UPCOMING EVENTS */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
        <div className="flex flex-col gap-3">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#121212] p-4 rounded-2xl border border-[#1f1f1f] hover:bg-[#1a1a1a] transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-white font-semibold">{event.title}</span>
                <span className="text-gray-400 text-sm">{event.date}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="text-sm text-gray-400">{event.tickets} Tickets Sold</span>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="text-[#FFD159] font-medium text-sm hover:underline"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ANALYTICS */}
      <div className="bg-[#121212] p-6 rounded-2xl border border-[#1f1f1f]">
        <h2 className="text-lg font-semibold text-white mb-3">
          Recent Activity / Analytics
        </h2>
        <p className="text-gray-400 text-sm">
          Charts or activity feed can go here. You can show revenue trends, ticket sales, or attendee stats.
        </p>
      </div>
    </div>
  );
};

export default DashboardOverview;
