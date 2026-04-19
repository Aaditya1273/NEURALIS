"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export const LogoTicker = () => {
  return (
    <div
      className="py-10 md:py-14"
      style={{
        background: "linear-gradient(180deg, #0a0a0f 0%, #111116 50%, #0a0a0f 100%)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Label */}
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] mb-8" style={{ color: "rgba(255,255,255,0.2)" }}>
        Trusted by teams at
      </p>

      {/* Ticker */}
      <div
        className="flex overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)", opacity: 0.5 }}
      >
        <motion.div
          className="flex gap-16 flex-none pr-16 items-center"
          animate={{ translateX: "-50%" }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        >
            {[...Array(2)].map((_, set) =>
              [
                "logo-neuralis",
                "logo-initia",
                "logo-move",
                "logo-gemini",
                "logo-vercel",
                "logo-claude",
                "logo-github",
              ].map((logo) => (
              <Image
                key={`${set}-${logo}`}
                src={`/landing/${logo}.png`}
                alt={`${logo} logo`}
                width={90}
                height={36}
                className="h-8 w-auto object-contain"
                style={{ filter: "brightness(0) invert(1)", opacity: 0.55 }}
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};
