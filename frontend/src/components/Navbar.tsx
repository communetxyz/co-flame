"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/my-lighters", label: "My Lighters" },
  { href: "/scan", label: "Scan" },
  { href: "/claim", label: "Claim" },
  { href: "/token", label: "$CFLAME" },
  { href: "/governance", label: "Governance" },
];

export default function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🔥 Co-Flame
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-zinc-400 hover:text-white transition">
              {l.label}
            </Link>
          ))}
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
