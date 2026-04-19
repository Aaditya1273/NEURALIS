"use client";

import Link from "next/link";
import { useState } from "react";

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar — blue gradient */}
      <div className="flex justify-center items-center py-2.5 text-white text-xs gap-2" style={{ background: "linear-gradient(90deg, #1d4ed8 0%, #1e40af 100%)" }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
        <span className="text-white/80">Live on Initiation-2 Testnet · Chain ID: neuralis-1</span>
        <span className="hidden md:inline text-white/30 mx-1">—</span>
        <Link href="/vault" className="hidden md:inline-flex items-center gap-1 text-white font-medium hover:underline underline-offset-2">
          Start earning now →
        </Link>
      </div>

      {/* Main nav — black glass */}
      <div className="border-b border-white/[0.06]" style={{ background: "rgba(5,5,8,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="container">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
                ⬡
              </div>
              <span className="font-bold text-base tracking-tight text-white">NEURALIS</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              <a href="#features"     className="hover:text-white transition-colors duration-150">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors duration-150">How It Works</a>
              <a href="#architecture" className="hover:text-white transition-colors duration-150">Architecture</a>
              <a href="#economy"      className="hover:text-white transition-colors duration-150">Economy</a>
            </nav>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                Dashboard
              </Link>
              <Link
                href="/vault"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}
              >
                Launch App
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="md:hidden border-t py-4 flex flex-col gap-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <a href="#features"     className="text-sm font-medium hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }} onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="text-sm font-medium hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }} onClick={() => setMenuOpen(false)}>How It Works</a>
              <a href="#architecture" className="text-sm font-medium hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }} onClick={() => setMenuOpen(false)}>Architecture</a>
              <a href="#economy"      className="text-sm font-medium hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }} onClick={() => setMenuOpen(false)}>Economy</a>
              <Link href="/vault" className="inline-flex items-center justify-center text-sm font-semibold text-white px-5 py-3 rounded-xl mt-1"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", boxShadow: "0 0 16px rgba(37,99,235,0.35)" }}
                onClick={() => setMenuOpen(false)}>
                Launch App →
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
