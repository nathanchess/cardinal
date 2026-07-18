"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FLOATING_CARDS } from "@/data/floating-cards";

const FLY_AWAY = [
  { x: -520, y: -220, rotate: -28 },
  { x: 540, y: -200, rotate: 26 },
  { x: -480, y: 320, rotate: 18 },
  { x: 500, y: 340, rotate: -22 },
  { x: -360, y: -380, rotate: 14 },
  { x: 380, y: -360, rotate: -16 },
  { x: 60, y: 420, rotate: 10 },
  { x: -80, y: -440, rotate: -12 },
] as const;

/** Push-in (toward center) then release outward. */
export const CARD_FLY_DURATION_MS = 1100;

type FloatingCardsProps = {
  flyAway?: boolean;
};

export function FloatingCards({ flyAway = false }: FloatingCardsProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {FLOATING_CARDS.map((card, index) => {
        const exit = FLY_AWAY[index % FLY_AWAY.length];
        const pushX = -exit.x * 0.1;
        const pushY = -exit.y * 0.1;

        return (
          <motion.div
            key={card.id}
            className={`absolute will-change-transform ${card.className} ${
              flyAway ? "" : "animate-card-drift"
            }`}
            style={
              flyAway
                ? undefined
                : {
                    animationDuration: `${card.duration}s`,
                    animationDelay: `${card.delay}s`,
                  }
            }
            initial={false}
            animate={
              flyAway
                ? {
                    x: [0, pushX, exit.x],
                    y: [0, pushY, exit.y],
                    scale: [1, 0.9, 0.65],
                    rotate: [0, exit.rotate * 0.15, exit.rotate],
                    opacity: [1, 1, 0],
                  }
                : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
            }
            transition={
              flyAway
                ? {
                    duration: CARD_FLY_DURATION_MS / 1000,
                    times: [0, 0.28, 1],
                    ease: [
                      [0.33, 1, 0.68, 1],
                      [0.22, 1, 0.36, 1],
                    ],
                    delay: index * 0.035,
                  }
                : { duration: 0.3 }
            }
          >
            <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-[12px] shadow-[0_28px_70px_rgba(28,28,25,0.18),0_2px_6px_rgba(28,28,25,0.08)]">
              <Image
                src={card.src}
                alt=""
                fill
                sizes="230px"
                className="object-cover"
                priority={
                  card.id.includes("sapphire-preferred") ||
                  card.id.includes("amex")
                }
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
