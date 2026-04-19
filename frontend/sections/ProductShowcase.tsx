"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AnimatedDivider } from "./Hero";

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 40, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

export const ProductShowcase = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const translateY  = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const imgScale    = useTransform(scrollYProgress, [0, 0.4], [0.92, 1]);
  const imgOpacity  = useTransform(scrollYProgress, [0, 0.3], [0,   1]);

  return (
    <>
      <AnimatedDivider />
      <section
        ref={sectionRef}
        className="py-24 overflow-x-clip relative"
        style={{ background: "linear-gradient(180deg, #050508 0%, #0a0a0f 100%)" }}
      >
        {/* Vertical accent line left */}
        <motion.div
          className="absolute left-8 top-1/4 w-px"
          style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)" }}
          initial={{ scaleY: 0, originY: 0 }}
          whileInView={{ scaleY: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
          viewport={{ once: true }}
        />
        {/* Vertical accent line right */}
        <motion.div
          className="absolute right-8 top-1/4 w-px"
          style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)" }}
          initial={{ scaleY: 0, originY: 0 }}
          whileInView={{ scaleY: 1 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.1 }}
          viewport={{ once: true }}
        />

        <div className="container relative">
          {/* Heading — staggered children */}
          <motion.div
            className="section-heading"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.div className="flex justify-center items-center" variants={itemVariants}>
              <div className="tag">Full On-Chain Visibility</div>
            </motion.div>
            <motion.h2 className="section-title mt-5" variants={itemVariants}>
              The command center for your agent economy
            </motion.h2>
            <motion.p className="section-description mt-5" variants={itemVariants}>
              Monitor real-time agent execution, track institutional vaults, and seamlessly 
              audit sovereign transactions through a precise, zero-latency dashboard.
            </motion.p>

            {/* Decorative draw-in line under heading */}
            <motion.div
              className="mx-auto mt-8 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
              viewport={{ once: true }}
            />
          </motion.div>

          {/* Product showcase video — scale + opacity reveal on scroll */}
          <div className="relative">
            <motion.div
              className="mt-10 overflow-hidden rounded-2xl shadow-[0_0_80px_rgba(37,99,235,0.12)]"
              style={{ 
                scale: imgScale, 
                opacity: imgOpacity,
                border: "1px solid rgba(255,255,255,0.15)"
              }}
            >
              <video
                src="/landing/loop.webm"
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                className="w-full h-auto block"
              />
            </motion.div>

            <motion.div
              className="hidden md:block absolute -right-36 -top-32 z-10"
              style={{ y: translateY }}
            >
              <motion.img
                src="/landing/pyramid.png"
                alt="Pyramid Image"
                width={262}
                height={262}
                animate={{ translateY: [-15, 15] }}
                transition={{ repeat: Infinity, repeatType: "mirror", duration: 4, ease: "easeInOut" }}
              />
            </motion.div>
            <motion.div
              className="hidden md:block absolute bottom-24 -left-36 z-10"
              style={{ y: translateY }}
            >
              <motion.img
                src="/landing/tube.png"
                alt="Tube Image"
                width={248}
                height={248}
                animate={{ translateY: [-15, 15] }}
                transition={{ repeat: Infinity, repeatType: "mirror", duration: 3.5, ease: "easeInOut", delay: 0.5 }}
              />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};
