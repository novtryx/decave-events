"use client";

import { ReactNode } from "react";
import { MdConfirmationNumber } from "react-icons/md";

type AuthWrapperProps = {
  children: ReactNode;
};

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  return (
    <div className="min-h-screen w-full flex bg-[#0f0f0f]">
      
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] shrink-0 p-12 relative overflow-hidden bg-[#121212] border-r border-[#1f1f1f]">

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FFD159]/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#FFD159]/5 blur-3xl rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFD159] flex items-center justify-center">
            <MdConfirmationNumber className="text-black text-lg" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">
            De Cave<span className="text-[#FFD159]">.</span>
          </span>
        </div>

        {/* Main message */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-white font-extrabold text-4xl leading-tight tracking-tight">
              Create. Sell.
              <br />
              Experience events.
            </h2>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Build and manage your events effortlessly. From ticket sales to attendee tracking — everything in one place.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3 mt-2">
            {[
              "Create events in minutes",
              "Sell tickets globally",
              "Track attendees in real-time",
              "Instant payouts & insights",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-[#FFD159]/20">
                  <span className="w-2 h-2 bg-[#FFD159] rounded-full" />
                </span>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom card */}
        <div className="relative z-10 bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#1f1f1f] p-5 rounded-2xl">
          <p className="text-gray-300 text-sm">
            “Managing events used to be stressful. Now everything — tickets, payments, attendees — just works.”
          </p>

          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 rounded-full bg-[#FFD159] flex items-center justify-center text-black text-xs font-bold">
              KO
            </div>
            <div>
              <p className="text-white text-sm font-medium">Kemi O.</p>
              <p className="text-gray-500 text-xs">Event Organizer</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#FFD159] flex items-center justify-center">
            <MdConfirmationNumber className="text-black" />
          </div>
          <span className="text-xl font-extrabold text-white">
            De Cave<span className="text-[#FFD159]">.</span>
          </span>
        </div>

        {/* Form container */}
        <div className="w-full max-w-md bg-[#121212] border border-[#1f1f1f] rounded-2xl p-6 sm:p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;
