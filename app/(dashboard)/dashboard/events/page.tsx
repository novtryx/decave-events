"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getUserEvents } from "@/app/actions/events";
import { spaceToUnderscore } from "@/lib/generalFunction";

const Events = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

  return (
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
        {filteredEvents.map((event: any) => (
          <div
            key={event.id}
            className="bg-[#121212] rounded-2xl border border-[#1f1f1f] hover:border-[#2a2a2a] transition flex flex-col overflow-hidden"
          >
            {/* BANNER */}
            {event.banner ? (
              <img
                src={event.banner}
                alt={event.title}
                className="w-full h-36 object-cover"
              />
            ) : (
              <div className="w-full h-36 bg-[#1a1a1a] flex items-center justify-center text-3xl">
                🎪
              </div>
            )}

            {/* BODY */}
            <div className="p-4 flex flex-col gap-3 flex-1">
              {/* TITLE + TYPE */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-white text-base leading-tight">
                  {event.title}
                </h2>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#FFD159] text-black whitespace-nowrap">
                  {event.type}
                </span>
              </div>

              {/* DATE + VENUE */}
              <div className="flex flex-col gap-1">
                <p className="text-gray-400 text-xs flex items-center gap-1">
                  📅 {formatDate(event.eventDate)} · {formatTime(event.eventDate)}
                </p>
                <p className="text-gray-400 text-xs flex items-center gap-1">
                  📍 {event.venue}
                </p>
              </div>

              {/* STATS */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg">
                  👥 <span className="font-semibold text-white">{event.attendeesCount}</span> attendees
                </span>
                <span className="text-xs bg-[#1a1a1a] text-gray-300 px-3 py-1 rounded-lg">
                  🎟 <span className="font-semibold text-white">{event.tickets?.length ?? 0}</span> ticket types
                </span>
              </div>

              {/* BADGES */}
              <div className="flex gap-2 flex-wrap">
                {event.organizerPays && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                    ✓ organizer pays fees
                  </span>
                )}
                <span className="text-xs flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      event.visibilty ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                  <span className="text-gray-400">
                    {event.visibilty ? "Public" : "Private"}
                  </span>
                </span>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center border-t border-[#1f1f1f]">
              <Link
                href={`/events/${spaceToUnderscore(event.title)}`}
                className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-[#FFD159] hover:bg-[#1a1a1a] transition"
              >
                View
              </Link>
              <div className="w-px h-5 bg-[#1f1f1f]" />
              <Link
                href={`/dashboard/events/${event.id}/edit`}
                className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-gray-400 hover:text-[#FFD159] hover:bg-[#1a1a1a] transition"
              >
                Edit
              </Link>
              <div className="w-px h-5 bg-[#1f1f1f]" />
              <button className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium text-red-400 hover:bg-[#1a1a1a] transition">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <p className="text-gray-500 text-center py-10">No events found.</p>
      )}
    </div>
  );
};

export default Events;