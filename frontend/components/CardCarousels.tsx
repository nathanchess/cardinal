"use client";

import Image from "next/image";
import {
  BACKGROUND_CARDS,
  CAROUSEL_ROWS,
  type BackgroundCard,
  type CarouselRowConfig,
} from "@/data/floating-cards";

function rotateCards(cards: BackgroundCard[], offset: number) {
  const n = cards.length;
  const start = ((offset % n) + n) % n;
  return [...cards.slice(start), ...cards.slice(0, start)];
}

function CarouselRow({ row }: { row: CarouselRowConfig }) {
  const cards = rotateCards(BACKGROUND_CARDS, row.offset);
  const strip = [...cards, ...cards];

  return (
    <div className="relative w-full shrink-0 overflow-hidden">
      <div
        className={`flex w-max gap-4 sm:gap-5 ${
          row.direction === "left"
            ? "animate-marquee-left"
            : "animate-marquee-right"
        }`}
        style={{ animationDuration: `${row.duration}s` }}
      >
        {strip.map((card, index) => (
          <div
            key={`${row.id}-${card.id}-${index}`}
            className="relative h-[140px] w-[222px] shrink-0 overflow-hidden rounded-[12px] shadow-[0_12px_32px_rgba(28,28,25,0.14)] sm:h-[180px] sm:w-[286px] sm:rounded-[14px]"
          >
            <Image
              src={card.src}
              alt=""
              fill
              sizes="286px"
              className="object-cover"
              priority={row.id === "row-1" && index < 4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardCarousels() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex scale-[1.06] flex-col justify-center gap-4 opacity-[0.22] sm:gap-5 sm:opacity-[0.26]">
        {CAROUSEL_ROWS.map((row) => (
          <CarouselRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
