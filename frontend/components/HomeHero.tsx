"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FloatingCards } from "@/components/FloatingCards";

const brandEase = [0.22, 1, 0.36, 1] as const;

export function HomeHero() {
  return (
    <main className="relative isolate min-h-[100svh] overflow-x-hidden bg-[var(--bg)]">
      <FloatingCards />

      <section className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 pb-24 pt-20 text-center">
        <motion.div
          className="mb-8 flex items-center gap-[22px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: brandEase }}
        >
          <div className="relative h-[180px] w-[180px] shrink-0">
            <Image
              src="/brand/cardinal-logo.jpg"
              alt="Cardinal"
              fill
              priority
              unoptimized
              sizes="180px"
              className="object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.1)]"
            />
          </div>
          <h1 className="font-wordmark text-[64px] font-medium leading-[0.9] tracking-[-0.06em] text-[var(--ink)] whitespace-nowrap max-sm:text-[48px]">
            Cardinal
          </h1>
        </motion.div>

        <motion.button
          type="button"
          className="inline-flex h-[52px] items-center gap-2.5 rounded-[10px] border border-[var(--ink)] bg-[var(--ink)] px-[22px] text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(17,17,17,0.08)]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: brandEase }}
          whileHover={{
            y: -2,
            boxShadow: "0 4px 12px rgba(17,17,17,0.12)",
          }}
          whileTap={{ y: 1, scale: 0.98 }}
        >
          Find your perfect credit card
          <ArrowRight className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </motion.button>
      </section>
    </main>
  );
}
