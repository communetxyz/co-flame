"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS, LIGHTER_ABI, TOKEN_ABI } from "@/lib/contracts";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", mobile: "🏠" },
  { href: "/shop", label: "Shop", mobile: "🛒" },
  { href: "/my-lighters", label: "My Lighters", mobile: "🔥" },
  { href: "/scan", label: "Scan", mobile: "📱" },
  { href: "/claim", label: "Claim", mobile: "💰" },
  { href: "/token", label: "$CFLAME", mobile: "🪙" },
  { href: "/governance", label: "Governance", mobile: "🗳️" },
];

export default function Navbar() {
  const { address } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is admin
  const { data: lighterOwner } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "owner",
    query: { enabled: !!address },
  });

  const { data: tokenOwner } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "owner",
    query: { enabled: !!address },
  });

  const isAdmin = address && (
    address.toLowerCase() === (lighterOwner as string)?.toLowerCase() ||
    address.toLowerCase() === (tokenOwner as string)?.toLowerCase()
  );

  const allLinks = isAdmin 
    ? [...links, { href: "/admin", label: "⚙️ Admin", mobile: "⚙️" }]
    : links;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link 
          href="/" 
          className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent"
          onClick={() => setMobileMenuOpen(false)}
        >
          🔥 Co-Flame
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {allLinks.map((l) => (
            <Link 
              key={l.href} 
              href={l.href} 
              className={`text-sm transition ${
                l.href === "/admin" 
                  ? "text-orange-400 hover:text-orange-300" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ConnectButton />
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="px-4 py-2 space-y-1">
            {allLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  l.href === "/admin"
                    ? "text-orange-400 hover:bg-orange-900/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">{l.mobile}</span>
                <span>{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}