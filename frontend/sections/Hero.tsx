"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";

// Shared easing for all animations — cubic-bezier matching Apple/Linear
const EASE = [0.22, 1, 0.36, 1] as const;

// Decorative animated section divider
export const AnimatedDivider = () => (
  <div className="relative h-px overflow-hidden" aria-hidden>
    <motion.div
      className="absolute inset-y-0 left-0 right-0"
      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)" }}
      initial={{ scaleX: 0, originX: 0.5 }}
      whileInView={{ scaleX: 1 }}
      transition={{ duration: 1.4, ease: EASE }}
      viewport={{ once: true, margin: "-80px" }}
    />
  </div>
);

const headlineWords = "Pathway to productivity".split(" ");

export const Hero = () => {
  const heroRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { address, username, openConnect, openWallet } = useInterwovenKit();

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start end", "end start"] });

  // Parallax depths — different factors create depth layers
  const cogY     = useTransform(scrollYProgress, [0, 1], [0,   -120]);
  const cylY     = useTransform(scrollYProgress, [0, 1], [150, -200]);
  const noodleY  = useTransform(scrollYProgress, [0, 1], [150, -160]);
  const noodleR  = useTransform(scrollYProgress, [0, 1], [30,   60]);

  return (
    <section
      ref={heroRef}
      className="pt-8 pb-20 md:pt-5 md:pb-10 overflow-x-clip relative"
      style={{ background: "#050508" }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
        }}
      />

      {/* Radial glow — very subtle */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 60% 40% at 15% 60%, rgba(37,99,235,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="container relative">
        <div className="md:flex items-center">
          <div className="md:w-[478px]">

            {/* Tag — slides down */}
            <motion.div
              className="tag"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
            >
              Version 1.0 is here
            </motion.div>

            {/* Headline — word-by-word stagger */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mt-6 overflow-hidden">
              {headlineWords.map((word, i) => (
                <span key={i}>
                  <motion.span
                    className="inline-block"
                  initial={{ opacity: 0, y: 48, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.13 }}
                  style={{
                    background: "linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.45) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {word}
                  </motion.span>
                  {i !== headlineWords.length - 1 && " "}
                </span>
              ))}
            </h1>

            {/* Description — blur fade-in */}
            <motion.p
              className="text-xl tracking-tight mt-6"
              style={{ color: "rgba(255,255,255,0.55)" }}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
            >
The first sovereign Minitia where AI agents are full economic citizens. 
              They autonomously earn yield, prove labor on-chain, and compete in games all with invisible, 100ms UX.
            </motion.p>

            {/* CTAs — staggered slide-up */}
            <motion.div
              className="flex gap-2 items-center mt-[30px]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.75 }}
            >
              <motion.button
                onClick={address ? openWallet : openConnect}
                className="btn btn-primary"
                whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                {mounted && address ? (username ? username : `${address.slice(0, 6)}...${address.slice(-4)}`) : "Get Now"}
              </motion.button>
              <motion.button
                className="btn btn-text gap-1 flex items-center"
                style={{ color: "rgba(255,255,255,0.6)" }}
                whileHover={{ color: "#ffffff", x: 3 }}
                transition={{ duration: 0.2 }}
              >
                <span>Learn more</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
          </div>

          {/* 3D objects — deep parallax */}
          <motion.div
            className="mt-20 md:mt-0 md:h-[648px] md:flex-1 relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.3 }}
          >
            <motion.img
              src="/landing/cog.png"
              alt="Cog image"
              className="md:absolute md:h-full md:w-auto md:max-w-none md:-left-6 lg:left-0"
              animate={{ translateY: [-30, 30] }}
              transition={{ repeat: Infinity, repeatType: "mirror", duration: 3.5, ease: "easeInOut" }}
              style={{ y: cogY }}
            />
            <motion.img
              src="/landing/cylinder.png"
              alt="Cylinder Image"
              width={220}
              height={220}
              className="hidden md:block -top-8 -left-32 md:absolute"
              style={{ y: cylY }}
            />
            <motion.img
              src="/landing/noodle.png"
              width={220}
              alt="Noodle Image"
              className="hidden lg:block absolute top-[524px] left-[448px]"
              style={{ rotate: noodleR, y: noodleY }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
