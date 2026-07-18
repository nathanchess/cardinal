"use client";

import Image from "next/image";
import { X } from "lucide-react";
import type { CardBlurb } from "@/components/EmbeddingCloud";
import { resolveCardArt } from "@/data/card-art";

type CardDetailTooltipProps = {
  cardId: string;
  blurb: CardBlurb;
  score?: number;
  angleDeg?: number;
  pinned?: boolean;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export function CardDetailTooltip({
  cardId,
  blurb,
  score,
  angleDeg,
  pinned,
  onClose,
  className,
  style,
}: CardDetailTooltipProps) {
  const art = resolveCardArt(cardId);

  return (
    <div
      className={`w-[min(340px,90vw)] max-w-full rounded-[12px] border border-[var(--border)] bg-white p-4 text-left shadow-[0_16px_40px_rgba(17,17,17,0.14)] ${className ?? ""}`}
      style={style}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="relative h-[52px] w-[84px] shrink-0 overflow-hidden rounded-[8px] bg-[var(--ink)] shadow-[0_4px_12px_rgba(17,17,17,0.12)]">
          {art ? (
            <Image
              src={art}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="84px"
            />
          ) : (
            <div className="flex h-full w-full flex-col justify-between p-1.5">
              <span className="text-[8px] font-semibold uppercase tracking-wide text-white/70">
                {blurb.issuer}
              </span>
              <span className="truncate text-[9px] font-medium text-white">
                {blurb.name}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            {blurb.issuer}
          </p>
          <p className="text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ink)]">
            {blurb.name}
          </p>
        </div>
        {pinned && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
        {typeof score === "number" ? (
          <span className="rounded-[4px] bg-[#F4F4F1] px-1.5 py-0.5 font-semibold tabular-nums text-[var(--ink)]">
            cos {score.toFixed(3)}
          </span>
        ) : null}
        {typeof angleDeg === "number" ? (
          <span className="rounded-[4px] bg-[#E8F1FB] px-1.5 py-0.5 font-semibold tabular-nums text-[#1B6BC4]">
            θ {angleDeg.toFixed(1)}°
          </span>
        ) : null}
        {blurb.annualFee != null ? (
          <span className="rounded-[4px] bg-[#F4F4F1] px-1.5 py-0.5 font-medium text-[var(--muted)]">
            {blurb.annualFee === 0
              ? "No annual fee"
              : `$${blurb.annualFee}/yr`}
          </span>
        ) : null}
      </div>

      <p className="mb-2 text-[12px] leading-relaxed text-[var(--muted)]">
        {blurb.summary}
      </p>
      {blurb.earnHighlight.length ? (
        <ul className="mb-2 space-y-1">
          {blurb.earnHighlight.map((e) => (
            <li key={e} className="text-[12px] font-medium text-[var(--ink)]">
              {e}
            </li>
          ))}
        </ul>
      ) : null}
      {blurb.benefits.length ? (
        <ul className="space-y-1 border-t border-[var(--border)] pt-2">
          {blurb.benefits.map((b) => (
            <li key={b} className="text-[11px] text-[var(--muted)]">
              {b}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
