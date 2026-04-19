"use client";

import { motion } from "framer-motion";
import { AnimatedDivider } from "./Hero";

const EASE = [0.22, 1, 0.36, 1] as const;

const pricingTiers = [
  {
    title: "Free", monthlyPrice: 0, buttonText: "Start building",
    popular: false, inverse: false,
    features: ["1 YieldMind Agent instance", "Standard RPC access (Rate-limited)", "10,000 compute units / mo", "Community Discord support", "Testnet deployment"],
  },
  {
    title: "Pro", monthlyPrice: 9, buttonText: "Deploy Vault",
    popular: true, inverse: true,
    features: ["Unlimited AI Agent instances", "Zero-latency smart contract execution", "Automated portfolio rebalancing", "Priority transaction sequencing", "24/7 Engineering SLA"],
  },
  {
    title: "Enterprise", monthlyPrice: 29, buttonText: "Apply process",
    popular: false, inverse: false,
    features: ["Full Validator Node provisioning", "100% MEV capture capabilities", "Direct L1 orderbook access", "Custom bespoke yield strategies", "Dedicated protocol integration team", "Hardware wallet multisig setup"],
  },
];

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const Pricing = () => {
  return (
    <>
      <AnimatedDivider />
      <section className="py-24 relative" style={{ background: "#050508" }}>
        <div className="container">

          {/* Heading */}
          <motion.div
            className="section-heading"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            viewport={{ once: true, margin: "-60px" }}
          >
            <h2 className="section-title">Infrastructure Pricing</h2>
            <p className="section-description mt-5">
              Secure institutional yields, automate strategies, and scale seamlessly with tiered appchain capacity.
            </p>
          </motion.div>

          {/* Cards — staggered reveal */}
          <div className="flex flex-col gap-6 items-center mt-10 lg:flex-row lg:items-end lg:justify-center">
            {pricingTiers.map(({ title, monthlyPrice, buttonText, popular, inverse, features }, index) => (
              <motion.div
                key={title}
                className="p-10 max-w-xs w-full rounded-3xl"
                initial={{ opacity: 0, y: 60, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: EASE, delay: index * 0.15 }}
                viewport={{ once: true, margin: "-40px" }}
                whileHover={inverse ? {
                  scale: 1.03,
                  boxShadow: "0 0 60px rgba(255,255,255,0.15)",
                  transition: { duration: 0.25 },
                } : {
                  scale: 1.02,
                  borderColor: "rgba(255,255,255,0.15)",
                  transition: { duration: 0.25 },
                }}
                style={
                  inverse
                    ? { background: "#ffffff", color: "#000000", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 0 40px rgba(255,255,255,0.08)" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }
                }
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold" style={{ color: inverse ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)" }}>
                    {title}
                  </h3>
                  {popular && (
                    <div className="inline-flex text-sm px-4 py-1.5 rounded-xl border border-white/20">
                      <motion.span
                        animate={{ backgroundPositionX: "100%" }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                        className="bg-[linear-gradient(to_right,#DD7DDF,#E1CD86,#BBCB92,#71C2EF,#3BFFFF,#DD7DDF)] [background-size:200%] text-transparent bg-clip-text font-medium"
                      >
                        Popular
                      </motion.span>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-[30px]">
                  <motion.span
                    className="text-4xl font-bold tracking-tighter leading-none"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE, delay: index * 0.15 + 0.3 }}
                    viewport={{ once: true }}
                  >
                    ${monthlyPrice}
                  </motion.span>
                  <span className="tracking-tight font-bold" style={{ color: inverse ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)" }}>/month</span>
                </div>
                <button
                  className="w-full mt-[30px] py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90"
                  style={inverse
                    ? { background: "#000000", color: "#ffffff" }
                    : { background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.12)" }
                  }
                >
                  {buttonText}
                </button>
                <ul className="flex flex-col gap-5 mt-8">
                  {features.map((feature) => (
                    <li key={feature} className="text-sm flex items-center gap-3" style={{ color: inverse ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.6)" }}>
                      <span style={{ color: inverse ? "#000000" : "#2563eb" }}><CheckIcon /></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
