"use client";
import "../../../globals.css";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import React from "react";

export default function TutorLayout({ children }) {
    const locale = useLocale();
    const pathname = usePathname();

    const navLinks = [
        { href: `/${locale}/tutor/sessions`, label: "My Sessions", icon: Calendar },
        { href: `/${locale}/tutor/availability`, label: "Availability", icon: Clock },
    ];

    return (
        <>
            <Navbar />
            {/* <div className="border-y border-gray-200 bg-white fixed top-16 left-0 right-0 z-20">
                <div className="flex items-center gap-1 py-2 container mx-auto px-4">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                pathname.includes(href.split("/").pop())
                                    ? "bg-slate-100 text-slate-700"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-gray-50"
                            }`}
                        >
                            <Icon size={13} /> {label}
                        </Link>
                    ))}
                </div>
            </div> */}
            <div className=" container mx-auto px-4 pb-12">
                {children}
            </div>
        </>
    );
}
