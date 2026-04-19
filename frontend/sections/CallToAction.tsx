"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AnimatedDivider } from "./Hero";

const EASE = [0.22, 1, 0.36, 1] as const;

const ctaWords = "Sign up for free today".split(" ");

export const CallToAction = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const starY   = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const springY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <>
      <AnimatedDivider />
      <section
        ref={sectionRef}
        className="py-24 overflow-x-clip relative"
        style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #050508 100%)" }}
      >
        {/* Center glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(255,255,255,0.04) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
        />

        <div className="container">
          <div className="section-heading relative">

            {/* Word-by-word headline reveal */}
            <h2 className="section-title overflow-hidden">
              {ctaWords.map((word, i) => (
                <span key={i}>
                  <motion.span
                    className="inline-block"
                  initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, ease: EASE, delay: i * 0.1 }}
                  viewport={{ once: true, margin: "-40px" }}
                >
                  {word}
                  </motion.span>
                  {i !== ctaWords.length - 1 && " "}
                </span>
              ))}
            </h2>

            {/* Horizontal draw-in line */}
            <motion.div
              className="mx-auto mt-6 mb-6 h-px max-w-sm"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}
              viewport={{ once: true }}
            />

            <motion.p
              className="section-description mt-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
              viewport={{ once: true }}
            >
              Celebrate the joy of accomplishment with an app designed to track
              your progress and motivate your efforts.
            </motion.p>

            {/* Parallax decorative images */}
            <motion.img src="/landing/star.png" alt="Star Image" width={360}
              className="absolute -left-[350px] -top-[137px]"
              style={{ y: starY }} />
            <motion.img src="/landing/spring.png" alt="Spring Image" width={360}
              className="absolute -right-[331px] -top-[19px]"
              style={{ y: springY }} />
          </div>

          {/* CTAs */}
          <motion.div
            className="flex gap-3 mt-10 justify-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="inline-flex items-center justify-center text-sm font-semibold px-6 py-3 rounded-xl"
              style={{ background: "#ffffff", color: "#000000" }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 32px rgba(255,255,255,0.25)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              Get for free
            </motion.button>
            <motion.button
              className="inline-flex items-center gap-1.5 text-sm font-medium px-6 py-3 rounded-xl transition-colors"
              style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
              whileHover={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.25)", x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <span>Learn more</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </section>
    </>
  );
};
