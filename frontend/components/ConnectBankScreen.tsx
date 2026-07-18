"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Link2, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const BANKS = [
  {
    id: "chase",
    name: "Chase",
    short: "Chase",
    logo: "/banks/chase.svg",
  },
  {
    id: "discover",
    name: "Discover",
    short: "Discover",
    logo: "/banks/discover.svg",
  },
  {
    id: "amex",
    name: "American Express",
    short: "Amex",
    logo: "/banks/amex.svg",
  },
  {
    id: "citi",
    name: "Citi",
    short: "Citi",
    logo: "/banks/citi.svg",
  },
  {
    id: "capital-one",
    name: "Capital One",
    short: "Cap One",
    logo: "/banks/capital-one.png",
  },
  {
    id: "wells",
    name: "Wells Fargo",
    short: "Wells",
    logo: "/banks/wells.svg",
  },
  {
    id: "bank-of-america",
    name: "Bank of America",
    short: "BofA",
    logo: "/banks/bank-of-america.svg",
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

type ConnectBankScreenProps = {
  onComplete?: () => void;
};

export function ConnectBankScreen({ onComplete }: ConnectBankScreenProps) {
  const [bankIndex, setBankIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const bankTimer = window.setInterval(() => {
      setBankIndex((i) => (i + 1) % BANKS.length);
    }, 1400);
    return () => window.clearInterval(bankTimer);
  }, []);

  useEffect(() => {
    const start = performance.now();
    const duration = 5200;
    let frame = 0;
    let done = false;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(eased * 100);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else if (!done) {
        done = true;
        onComplete?.();
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  const bank = BANKS[bankIndex];

  return (
    <motion.section
      className="relative z-10 mx-auto flex h-[100svh] w-full max-w-lg flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-10 text-center"
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
      transition={{ duration: 0.65, ease }}
    >
      <motion.p
        className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease }}
      >
        Secure connection
      </motion.p>
      <motion.h2
        className="mb-10 max-w-sm text-[28px] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[32px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5, ease }}
      >
        Connecting your bank to Cardinal
      </motion.h2>

      <motion.div
        className="mb-10 flex w-full items-center justify-center gap-3 sm:gap-5"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.55, ease }}
      >
        <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full border border-[var(--border)] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.06)] sm:h-[100px] sm:w-[100px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={bank.id}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3"
              initial={{ y: 36, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -36, opacity: 0 }}
              transition={{ duration: 0.45, ease }}
            >
              <span className="relative h-10 w-10 sm:h-11 sm:w-11">
                <Image
                  src={bank.logo}
                  alt=""
                  fill
                  unoptimized
                  className="object-contain"
                />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-[var(--ink)]">
                {bank.short}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Packet travels left → right, fades, restarts */}
        <div className="relative h-10 w-20 overflow-hidden sm:w-28">
          <div className="absolute inset-y-[50%] left-0 right-0 border-t border-dashed border-[var(--ink)]/20" />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(17,17,17,0.08)]"
            initial={{ left: "-12%", opacity: 0 }}
            animate={{
              left: ["-12%", "78%", "78%"],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.55,
              times: [0, 0.72, 0.88, 1],
              ease: ["easeOut", "linear", "easeIn"],
              repeat: Infinity,
              repeatDelay: 0.25,
            }}
          >
            <Link2 className="h-3.5 w-3.5 text-[var(--ink)]" strokeWidth={1.75} />
          </motion.div>
        </div>

        <motion.div
          className="flex h-[88px] w-[88px] flex-col items-center justify-center overflow-hidden rounded-full border border-[var(--ink)] bg-white shadow-[0_8px_24px_rgba(17,17,17,0.08)] sm:h-[100px] sm:w-[100px]"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative mb-0.5 h-10 w-10">
            <Image
              src="/brand/cardinal-logo.jpg"
              alt=""
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          <span className="font-wordmark text-[12px] font-medium tracking-[-0.04em] text-[var(--ink)]">
            Cardinal
          </span>
        </motion.div>
      </motion.div>

      <motion.p
        className="mb-8 max-w-md text-[15px] leading-relaxed text-[var(--muted)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease }}
      >
        We only view your bank statements to understand spending patterns—never
        to move money. Credentials stay with your bank.
      </motion.p>

      <motion.ul
        className="mb-10 w-full space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.5, ease }}
      >
        <SecurityRow
          icon={Eye}
          text="Read-only access to transactions and balances"
        />
        <SecurityRow
          icon={Lock}
          text="We never see your username, password, or full account numbers"
        />
        <SecurityRow
          icon={ShieldCheck}
          text="Encrypted in transit. You can disconnect anytime."
        />
      </motion.ul>

      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45, ease }}
      >
        <div className="mb-2 flex items-center justify-between text-[12px]">
          <span className="font-medium text-[var(--ink)]">
            Linking {bank.name}…
          </span>
          <span className="tabular-nums text-[var(--muted)]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <motion.div
            className="h-full rounded-full bg-[var(--ink)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[var(--muted)]">
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ink)]"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
          Verifying secure connection
        </div>
      </motion.div>
    </motion.section>
  );
}

function SecurityRow({
  icon: Icon,
  text,
}: {
  icon: typeof Lock;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-white px-3.5 py-3 text-left">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F4F1]">
        <Icon className="h-3.5 w-3.5 text-[var(--ink)]" strokeWidth={1.75} />
      </span>
      <span className="flex min-h-7 items-center text-[13px] leading-snug text-[var(--ink)]">
        {text}
      </span>
    </li>
  );
}
