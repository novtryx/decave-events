"use client";

import React, { useState } from "react";
import { MdArrowBack, MdCheck, MdClose } from "react-icons/md";

type Event = {
  id: number;
  title: string;
  date: string;
  attendees: Attendee[];
};

type Attendee = {
  id: number;
  name: string;
  email: string;
  ticket: string;
  status: "Checked In" | "Pending";
};

// Dummy data
const eventsData: Event[] = [
  {
    id: 1,
    title: "Summer Gala 2026",
    date: "2026-06-15",
    attendees: [
      { id: 1, name: "John Doe", email: "john@example.com", ticket: "VIP", status: "Checked In" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", ticket: "General", status: "Pending" },
    ],
  },
  {
    id: 2,
    title: "Tech Conference 2026",
    date: "2026-07-20",
    attendees: [
      { id: 3, name: "Alice Johnson", email: "alice@example.com", ticket: "Early Bird", status: "Checked In" },
      { id: 4, name: "Bob Brown", email: "bob@example.com", ticket: "VIP", status: "Pending" },
    ],
  },
];

const AttendeesPage = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const toggleCheckIn = (attendeeId: number) => {
    if (!selectedEvent) return;
    selectedEvent.attendees = selectedEvent.attendees.map((a) =>
      a.id === attendeeId
        ? { ...a, status: a.status === "Checked In" ? "Pending" : "Checked In" }
        : a
    );
    setSelectedEvent({ ...selectedEvent });
  };

  if (!selectedEvent) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold text-white">Events</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsData.map((event) => (
            <div
              key={event.id}
              className="p-4 bg-[#121212] border border-[#1f1f1f] rounded-2xl hover:bg-[#1a1a1a] cursor-pointer transition"
              onClick={() => setSelectedEvent(event)}
            >
              <h2 className="text-lg font-semibold text-white">{event.title}</h2>
              <p className="text-gray-400 text-sm mt-1">Date: {event.date}</p>
              <p className="text-gray-400 text-sm mt-1">
                Attendees: {event.attendees.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedEvent(null)}
          className="p-2 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white transition"
        >
          <MdArrowBack size={20} />
        </button>

        <h1 className="text-2xl font-extrabold text-white">
          {selectedEvent.title}
        </h1>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border border-[#1f1f1f] rounded-2xl">
        <table className="min-w-full bg-[#121212] divide-y divide-[#1f1f1f]">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Ticket
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1f1f1f]">
            {selectedEvent.attendees.map((attendee) => (
              <tr key={attendee.id} className="hover:bg-[#1a1a1a] transition">
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                  {attendee.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {attendee.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {attendee.ticket}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attendee.status === "Checked In"
                        ? "bg-[#FFD159]/10 text-[#FFD159]"
                        : "bg-[#1f1f1f] text-gray-400"
                    }`}
                  >
                    {attendee.status}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => toggleCheckIn(attendee.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-medium transition ${
                      attendee.status === "Checked In"
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "bg-[#FFD159]/10 text-[#FFD159] hover:bg-[#FFD159]/20"
                    }`}
                  >
                    {attendee.status === "Checked In" ? <MdClose /> : <MdCheck />}
                    {attendee.status === "Checked In" ? "Undo" : "Check In"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectedEvent.attendees.length === 0 && (
          <p className="text-gray-500 text-center py-10">
            No attendees for this event yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default AttendeesPage;
