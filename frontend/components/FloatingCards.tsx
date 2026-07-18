"use client";

import Image from "next/image";
import { FLOATING_CARDS } from "@/data/floating-cards";

export function FloatingCards() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {FLOATING_CARDS.map((card) => (
        <div
          key={card.id}
          className={`absolute will-change-transform animate-card-drift ${card.className}`}
          style={{
            animationDuration: `${card.duration}s`,
            animationDelay: `${card.delay}s`,
          }}
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
        </div>
      ))}
    </div>
  );
}
