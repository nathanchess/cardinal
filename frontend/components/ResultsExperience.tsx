"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { resolveCardArt } from "@/data/card-art";
import cardUrls from "@/data/card-urls.json";
import {
  buildMockSavingsReport,
  type PipelineHit,
} from "@/data/mock-savings";
import { formatMoney } from "@/data/transactions";

const ease = [0.22, 1, 0.36, 1] as const;

type ResultsExperienceProps = {
  personaId: string;
  hits: PipelineHit[];
};

type NavTab = "recommended" | "mission";

export function ResultsExperience({ personaId, hits }: ResultsExperienceProps) {
  const [tab, setTab] = useState<NavTab>("recommended");
  const [index, setIndex] = useState(0);
  const list = hits.length ? hits : [];
  const hit = list[index] ?? null;

  const report = useMemo(
    () => (hit ? buildMockSavingsReport(personaId, hit, index) : null),
    [personaId, hit, index],
  );

  const go = (dir: -1 | 1) => {
    if (!list.length) return;
    setIndex((i) => (i + dir + list.length) % list.length);
  };

  return (
    <motion.div
      className="relative z-10 min-h-[100svh] w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease }}
    >
      <motion.nav
        className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm"
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.55, ease }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink
              active={tab === "recommended"}
              onClick={() => setTab("recommended")}
            >
              Recommended Cards
            </NavLink>
            <NavLink
              active={tab === "mission"}
              onClick={() => setTab("mission")}
            >
              Project Mission
            </NavLink>
          </div>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--ink)] transition hover:border-[var(--ink)]"
            aria-label="GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.586 2 12.253c0 4.537 2.865 8.374 6.839 9.725.5.095.683-.223.683-.496 0-.245-.01-1.052-.014-1.908-2.782.62-3.369-1.16-3.369-1.16-.454-1.184-1.11-1.5-1.11-1.5-.908-.638.069-.625.069-.625 1.004.072 1.532 1.06 1.532 1.06.892 1.57 2.341 1.116 2.91.854.091-.662.35-1.116.636-1.372-2.22-.26-4.555-1.143-4.555-5.085 0-1.123.39-2.041 1.029-2.76-.103-.26-.446-1.302.098-2.714 0 0 .84-.276 2.75 1.055A9.3 9.3 0 0 1 12 6.84a9.3 9.3 0 0 1 2.504.347c1.909-1.331 2.747-1.055 2.747-1.055.546 1.412.203 2.454.1 2.714.64.719 1.028 1.637 1.028 2.76 0 3.952-2.339 4.822-4.566 5.076.359.318.679.945.679 1.904 0 1.373-.012 2.48-.012 2.817 0 .276.18.596.688.494C19.138 20.623 22 16.787 22 12.253 22 6.586 17.523 2 12 2z" />
            </svg>
          </a>
        </div>
      </motion.nav>

      <div className="mx-auto max-w-3xl px-5 pb-24 pt-24 sm:px-8">
        <AnimatePresence mode="wait">
          {tab === "mission" ? (
            <motion.div
              key="mission"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease }}
              className="pt-6 text-left"
            >
              <h2 className="mb-3 font-wordmark text-[32px] font-medium tracking-[-0.06em] text-[var(--ink)]">
                Project Mission
              </h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
                Cardinal matches how you already spend to cards that fit —
                embedding your redacted activity, retrieving similar cards with
                Redis vector search, then re-ranking for personalized projected
                value.
              </p>
            </motion.div>
          ) : hit && report ? (
            <FeaturedCardReport
              key={hit.id}
              hit={hit}
              report={report}
              index={index}
              total={list.length}
              onPrev={() => go(-1)}
              onNext={() => go(1)}
            />
          ) : (
            <p className="pt-8 text-[var(--muted)]">No recommendations yet.</p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function NavLink({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[8px] px-3 py-1.5 text-[13px] font-semibold tracking-[-0.01em] transition sm:text-[14px] ${
        active
          ? "bg-[#F4F4F1] text-[var(--ink)]"
          : "text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function FeaturedCardReport({
  hit,
  report,
  index,
  total,
  onPrev,
  onNext,
}: {
  hit: PipelineHit;
  report: ReturnType<typeof buildMockSavingsReport>;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const art = resolveCardArt(hit.id);
  const applyHref =
    hit.officialUrl ||
    (cardUrls as Record<string, string>)[hit.id] ||
    "#";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease }}
      className="text-left"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--ink)] transition hover:border-[var(--ink)]"
          aria-label="Previous card"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          {index + 1} / {total}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--ink)] transition hover:border-[var(--ink)]"
          aria-label="Next card"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="relative h-[120px] w-[192px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--ink)] shadow-[0_12px_32px_rgba(17,17,17,0.14)]">
          {art ? (
            <Image
              src={art}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="192px"
            />
          ) : (
            <div className="flex h-full flex-col justify-between p-3 text-white">
              <span className="text-[11px] uppercase tracking-wide text-white/70">
                {hit.issuer}
              </span>
              <span className="text-[13px] font-semibold">{hit.name}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            {hit.issuer}
          </p>
          <h2 className="mb-3 text-[24px] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[28px]">
            {hit.name}
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                Rank score
              </p>
              <p className="text-[36px] font-semibold leading-none tracking-tight text-[var(--ink)]">
                {report.rankScore}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                Est. annual net
              </p>
              <p className="text-[22px] font-semibold tabular-nums text-[#1B6BC4]">
                {formatMoney(report.annualSavings)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Projected savings
          </h3>
          <p className="text-[11px] text-[var(--muted)]">
            Points → $ at {report.cpp}¢ / pt
          </p>
        </div>
        <div className="rounded-[12px] border border-[var(--border)] bg-[#FAFAF8] px-2 pb-2 pt-3 sm:px-4 sm:pt-4">
          <SavingsAreaChart monthly={report.monthly} />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          How this was calculated
        </h3>
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-[var(--muted)]">
          {report.methodNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ol>
        <ul className="divide-y divide-[var(--border)] rounded-[12px] border border-[var(--border)] bg-white">
          {report.breakdown.map((row) => (
            <li
              key={row.label}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--ink)]">
                  {row.label}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--muted)]">
                  {row.detail}
                </p>
              </div>
              <p
                className={`shrink-0 text-[14px] font-semibold tabular-nums ${
                  row.amount < 0 ? "text-[var(--muted)]" : "text-[var(--ink)]"
                }`}
              >
                {row.amount < 0 ? "−" : "+"}
                {formatMoney(Math.abs(row.amount))}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
          {report.disclaimer}
        </p>
      </section>

      <a
        href={applyHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--ink)] underline decoration-[var(--border)] underline-offset-4 transition hover:decoration-[var(--ink)]"
      >
        Apply for Card
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
      </a>
    </motion.article>
  );
}

function SavingsAreaChart({
  monthly,
}: {
  monthly: { label: string; amount: number; points: number }[];
}) {
  const width = 420;
  const height = 200;
  const padL = 44;
  const padR = 12;
  const padT = 16;
  const padB = 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxY = Math.max(...monthly.map((m) => m.amount), 1);
  const niceMax = niceCeil(maxY);
  const yTicks = [0, 0.5, 1].map((t) => niceMax * t);

  const pts = monthly.map((m, i) => {
    const x =
      padL + (monthly.length === 1 ? plotW / 2 : (i / (monthly.length - 1)) * plotW);
    const y = padT + plotH - (m.amount / niceMax) * plotH;
    return { x, y, ...m };
  });

  const linePath = smoothLine(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1]!.x} ${padT + plotH} L ${pts[0]!.x} ${padT + plotH} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Projected monthly savings over the year"
    >
      <defs>
        <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111111" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => {
        const y = padT + plotH - (tick / niceMax) * plotH;
        return (
          <g key={tick}>
            <line
              x1={padL}
              x2={width - padR}
              y1={y}
              y2={y}
              stroke="#E5E5E1"
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#6B6B66"
            >
              ${Math.round(tick)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#savingsFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#111111"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map((p) => (
        <circle key={p.label} cx={p.x} cy={p.y} r={2.5} fill="#111111" />
      ))}

      {pts.map((p, i) =>
        i % 2 === 0 || i === pts.length - 1 ? (
          <text
            key={`lbl-${p.label}`}
            x={p.x}
            y={height - 12}
            textAnchor="middle"
            fontSize="10"
            fill="#6B6B66"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function niceCeil(n: number) {
  if (n <= 0) return 100;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / exp;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * exp;
}

/** Monotone-ish cubic smooth path through points */
function smoothLine(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
