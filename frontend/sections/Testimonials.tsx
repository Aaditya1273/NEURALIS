"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import React from "react";
import { AnimatedDivider } from "./Hero";

const EASE = [0.22, 1, 0.36, 1] as const;

const testimonials = [
  { text: "As a seasoned designer always on the lookout for innovative tools, Framer.com instantly grabbed my attention.", imageSrc: "/landing/avatar-1.png", name: "Jamie Rivera", username: "@jamietechguru00" },
  { text: "Our team's productivity has skyrocketed since we started using this tool.", imageSrc: "/landing/avatar-2.png", name: "Josh Smith", username: "@jjsmith" },
  { text: "This app has completely transformed how I manage my projects and deadlines.", imageSrc: "/landing/avatar-3.png", name: "Morgan Lee", username: "@morganleewhiz" },
  { text: "I was amazed at how quickly we were able to integrate this app into our workflow.", imageSrc: "/landing/avatar-4.png", name: "Casey Jordan", username: "@caseyj" },
  { text: "Planning and executing events has never been easier. This app helps me keep track of all the moving parts, ensuring nothing slips through the cracks.", imageSrc: "/landing/avatar-5.png", name: "Taylor Kim", username: "@taylorkimm" },
  { text: "The customizability and integration capabilities of this app are top-notch.", imageSrc: "/landing/avatar-6.png", name: "Riley Smith", username: "@rileysmith1" },
  { text: "Adopting this app for our team has streamlined our project management and improved communication across the board.", imageSrc: "/landing/avatar-7.png", name: "Jordan Patels", username: "@jpatelsdesign" },
  { text: "With this app, we can easily assign tasks, track progress, and manage documents all in one place.", imageSrc: "/landing/avatar-8.png", name: "Sam Dawson", username: "@dawsontechtips" },
  { text: "Its user-friendly interface and robust features support our diverse needs.", imageSrc: "/landing/avatar-9.png", name: "Casey Harper", username: "@casey09" },
];

const firstColumn  = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn  = testimonials.slice(6, 9);

const TestimonialsColumn = ({ className, testimonials, duration = 10 }: { className?: string; testimonials: typeof testimonials; duration?: number }) => (
  <div className={className}>
    <motion.div
      animate={{ translateY: "-50%" }}
      transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
      className="flex flex-col gap-6 pb-6"
    >
      {[...new Array(2)].fill(0).map((_, index) => (
        <React.Fragment key={index}>
          {testimonials.map(({ text, imageSrc, name, username }) => (
            <motion.div
              key={text}
              className="p-6 rounded-3xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              whileHover={{
                background: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.12)",
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{text}</p>
              <div className="flex items-center gap-2 mt-5">
                <Image src={imageSrc} alt={name} width={40} height={40} className="h-10 w-10 rounded-full" />
                <div className="flex flex-col">
                  <div className="font-medium tracking-tight leading-5 text-white text-sm">{name}</div>
                  <div className="leading-5 tracking-tight text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{username}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </React.Fragment>
      ))}
    </motion.div>
  </div>
);

export const Testimonials = () => {
  return (
    <>
      <AnimatedDivider />
      <section className="py-24" style={{ background: "#050508" }}>
        <div className="container">
          <motion.div
            className="section-heading"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="flex justify-center">
              <div className="tag">Testimonials</div>
            </div>
            <h2 className="section-title mt-5">What our users say</h2>
            <p className="section-description">
              From intuitive design to powerful features, our app has become an
              essential tool for users around the world.
            </p>
          </motion.div>

          <motion.div
            className="flex justify-center gap-6 mt-10 max-h-[738px] overflow-hidden"
            style={{ maskImage: "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <TestimonialsColumn testimonials={firstColumn}  duration={15} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={thirdColumn}  className="hidden lg:block" duration={17} />
          </motion.div>
        </div>
      </section>
    </>
  );
};
