"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";

export const Header = () => {
  const [showBanner, setShowBanner] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { address, username, openConnect, openWallet } = useInterwovenKit();

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar — blue gradient */}
      {showBanner && (
        <div className="relative flex justify-center items-center py-2.5 text-white text-xs gap-2" style={{ background: "linear-gradient(90deg, #1d4ed8 0%, #1e40af 100%)" }}>
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="text-white/80">Live on Initiation-2 Testnet · Chain ID: neuralis-1</span>
            <span className="hidden md:inline text-white/30 mx-1">—</span>
            <Link href="/vault" className="hidden md:inline-flex items-center gap-1 text-white font-medium hover:underline underline-offset-2">
              Start earning now →
            </Link>
          </div>
          
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors duration-200 group"
            aria-label="Close announcement"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/50 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main nav — black glass */}
      <div className="border-b border-white/[0.06]" style={{ background: "rgba(5,5,8,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="container">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer relative">
              <div className="w-8 h-8 flex items-center justify-center relative">
                {/* Crystal Glow Backdrop */}
                <div className="absolute inset-0 bg-[#2563eb] blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-700 rounded-full scale-150" />
                
                <Image 
                  src="/landing/logo.png" 
                  alt="NEURALIS Logo" 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-contain relative z-10 transition-all duration-500 filter drop-shadow-[0_0_0_rgba(37,99,235,0)] group-hover:drop-shadow-[0_0_12px_rgba(37,99,235,0.8)]" 
                />
              </div>
              <span className="font-bold text-base tracking-tight text-white transition-colors duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200">
                NEURALIS
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              <a href="#features"     className="hover:text-white transition-colors duration-150">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors duration-150">How It Works</a>
              <a href="#architecture" className="hover:text-white transition-colors duration-150">Pricing</a>
              <a href="#economy"      className="hover:text-white transition-colors duration-150">Economy</a>
            </nav>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                Dashboard
              </Link>
              <button
                onClick={address ? openWallet : openConnect}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}
              >
                {mounted && address ? (username ? username : `${address.slice(0, 6)}...${address.slice(-4)}`) : "Connect Wallet"}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
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
