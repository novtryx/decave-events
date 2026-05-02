"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import {
    MdDashboard,
    MdEvent,
    MdPeople,
    MdPayments,
    MdSettings,
    MdAdd,
    MdMenu,
    MdClose,
} from "react-icons/md";
import { usePathname } from "next/navigation";
import { UserBadge } from "@/components/ui/UserBadge"; 
import Image from "next/image";

type Props = {
    children: ReactNode;
};

const navLinks = [
    { label: "Overview", href: "/dashboard", icon: <MdDashboard /> },
    { label: "Events", href: "/dashboard/events", icon: <MdEvent /> },
    { label: "Create Event", href: "/dashboard/events/create", icon: <MdAdd /> },
    { label: "Attendees", href: "/dashboard/attendees", icon: <MdPeople /> },
    { label: "Payouts", href: "/dashboard/payouts", icon: <MdPayments /> },
    { label: "Settings", href: "/dashboard/settings", icon: <MdSettings /> },
    { label: "Vote", href: "/dashboard/voting", icon: <MdSettings /> },
    { label: "Create Voting", href: "/dashboard/voting/create-vote", icon: <MdSettings /> },
];

const OrganizerLayout = ({ children }: Props) => {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const NavItems = () => (
        <>
            {navLinks.map((link) => {
                const isActive =
                    link.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === link.href || pathname.startsWith(link.href + "/");

                return (
                    <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                            ${isActive
                                ? "bg-[#FFD159]/10 text-[#FFD159]"
                                : "text-gray-400 hover:bg-[#1f1f1f] hover:text-white"
                            }`}
                    >
                        <span className="text-lg">{link.icon}</span>
                        {link.label}
                    </Link>
                );
            })}
        </>
    );

    return (
        <div className="min-h-screen flex overflow-y-hidden bg-[#0f0f0f]">

            {/* ── Sidebar (Desktop) ── */}
            <aside className="hidden md:flex flex-col w-64 bg-[#121212] border-r border-[#1f1f1f]">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-[#1f1f1f]">
                    <span className="flex items-center gap-2 font-extrabold text-lg text-white">
                        <Image src="/logo.svg" width={20} height={20} alt="logo"/>
                        De Cave<span className="text-[#FFD159]">.</span>
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
                    <NavItems />
                </nav>
            </aside>

            {/* ── Mobile Sidebar ── */}
            {open && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="relative w-64 bg-[#121212] h-full shadow-xl p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <span className="flex items-center gap-2 font-extrabold text-base text-white">
                               <Image src="/logo.svg" width={30} height={30} alt="logo"/>
                                De Cave<span className="text-[#FFD159]">.</span>
                            </span>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-white transition"
                            >
                                <MdClose size={22} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-1">
                            <NavItems />
                        </nav>
                    </div>
                </div>
            )}

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col max-h-full">

                {/* ── Topbar ── */}
                <header className="h-fit py-3 bg-[#121212] border-b border-[#1f1f1f] flex items-center justify-between px-4 sm:px-6">

                    {/* Left */}
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden text-gray-400 hover:text-white transition"
                            onClick={() => setOpen(true)}
                        >
                            <MdMenu size={24} />
                        </button>

                        {/* Logo on mobile */}
                        <span className="flex md:hidden items-center gap-2 font-extrabold text-base text-white">
                            <Image src="/logo.svg" width={30} height={30} alt="logo"/>
                            De Cave<span className="text-[#FFD159]">.</span>
                        </span>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/events/create"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-black bg-[#FFD159] hover:opacity-90 transition"
                        >
                            <MdAdd size={16} />
                            New Event
                        </Link>

                        <div className="hidden sm:block w-px h-6 bg-[#2a2a2a]" />

                        <UserBadge />
                    </div>
                </header>

                {/* Content */}
                <main className="p-4 sm:p-6 h-full overflow-y-auto bg-[#0f0f0f]">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
};

export default OrganizerLayout;