"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { resolveCardArt } from "@/data/card-art";
import cardUrls from "@/data/card-urls.json";
import type { PipelinePayload } from "@/data/mock-savings";
import { formatMoney } from "@/data/transactions";
import type { CardValue, CategoryBreakdown, PricedBenefit } from "@/lib/calculator";
import type { RankedRecommendation } from "@/lib/ranking";

const ease = [0.22, 1, 0.36, 1] as const;

type ResultsExperienceProps = {
  pipeline: PipelinePayload;
};

type NavTab = "recommended" | "mission";

const CATEGORY_LABELS: Record<string, string> = {
  dining: "Dining",
  groceries: "Groceries",
  gas: "Gas",
  transit: "Transit",
  travel_flights: "Flights",
  travel_hotels: "Hotels",
  travel_other: "Other travel",
  streaming: "Streaming",
  drugstores: "Drugstores",
  online_shopping: "Online shopping",
  wholesale_clubs: "Wholesale clubs",
  utilities: "Utilities",
  entertainment: "Entertainment",
  general: "Everything else",
};

export function ResultsExperience({ pipeline }: ResultsExperienceProps) {
  const [tab, setTab] = useState<NavTab>("recommended");
  const [index, setIndex] = useState(0);
  const list = pipeline.recommendations ?? [];
  const rec = list[index] ?? null;

  const officialUrlById = useMemo(
    () => new Map(pipeline.topK.map((hit) => [hit.id, hit.officialUrl ?? null])),
    [pipeline.topK],
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
                Redis vector search, then re-ranking by projected dollar value
                against the card you have today.
              </p>
            </motion.div>
          ) : rec ? (
            <FeaturedCardReport
              key={rec.card_id}
              rec={rec}
              currentCardValue={pipeline.currentCardValue}
              currentCardName={pipeline.currentCardName}
              officialUrl={officialUrlById.get(rec.card_id) ?? null}
              index={index}
              total={list.length}
              onPrev={() => go(-1)}
              onNext={() => go(1)}
            />
          ) : (
            <p className="pt-8 text-[var(--muted)]">
              No comparable cards found for this profile.
            </p>
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

type BreakdownRow = { label: string; amount: number; detail: string };

type BreakdownSections = {
  earnRateRows: BreakdownRow[];
  earnRateTotal: number;
  benefitRows: BreakdownRow[];
  benefitsTotal: number;
  annualFee: number;
  netValue: number;
};

function buildBreakdownSections(rec: RankedRecommendation): BreakdownSections {
  const earnRateRows: BreakdownRow[] = [];
  const categories = Object.entries(rec.card_value.by_category) as [
    string,
    CategoryBreakdown,
  ][];
  for (const [category, row] of categories) {
    if (row.spend_usd <= 0) continue;
    const label = CATEGORY_LABELS[category] ?? category;
    const unit = row.unit === "percent_cashback" ? "%" : "x";
    const rateText = `${row.rate}${unit}`;
    const detail = row.matched_label
      ? `${rateText} on ${row.matched_label.toLowerCase()}${row.capped ? " (capped, overflow at base rate)" : ""} · $${row.spend_usd.toLocaleString()} spent`
      : `${rateText} base rate · $${row.spend_usd.toLocaleString()} spent`;
    earnRateRows.push({ label, amount: row.reward_value_usd, detail });
  }

  const benefitRows: BreakdownRow[] = [];
  for (const benefit of rec.card_value.priced_benefits as PricedBenefit[]) {
    const parts: string[] = [`$${benefit.value_usd.toLocaleString()} face value`];
    if (benefit.friction_multiplier < 1) parts.push("enrollment required");
    if (benefit.frequency_multiplier < 1) parts.push("every 4 years");
    benefitRows.push({
      label: benefit.name.length > 60 ? `${benefit.name.slice(0, 57)}...` : benefit.name,
      amount: benefit.priced_value_usd,
      detail: parts.join(" · "),
    });
  }

  const earnRateTotal = earnRateRows.reduce((sum, r) => sum + r.amount, 0);
  const benefitsTotal = benefitRows.reduce((sum, r) => sum + r.amount, 0);

  return {
    earnRateRows,
    earnRateTotal,
    benefitRows,
    benefitsTotal,
    annualFee: rec.card_value.annual_fee_usd,
    netValue: rec.card_value.net_annual_value_usd,
  };
}

function BreakdownSection({
  title,
  rows,
  subtotalLabel,
  subtotal,
}: {
  title: string;
  rows: BreakdownRow[];
  subtotalLabel: string;
  subtotal: number;
}) {
  if (!rows.length) return null;
  return (
    <div>
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        {title}
      </p>
      <ul className="divide-y divide-[var(--border)] rounded-[12px] border border-[var(--border)] bg-white">
        {rows.map((row) => (
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
        <li className="flex items-center justify-between gap-4 bg-[#FAFAF8] px-4 py-2.5">
          <p className="text-[13px] font-semibold text-[var(--ink)]">{subtotalLabel}</p>
          <p className="text-[13px] font-semibold tabular-nums text-[var(--ink)]">
            {formatMoney(subtotal)}
          </p>
        </li>
      </ul>
    </div>
  );
}

function TotalLine({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[13px] text-[var(--muted)]">{label}</p>
      <p
        className={`text-[13px] tabular-nums ${
          amount < 0 ? "text-[var(--muted)]" : "text-[var(--ink)]"
        }`}
      >
        {amount < 0 ? "−" : "+"}
        {formatMoney(Math.abs(amount))}
      </p>
    </div>
  );
}

function FeaturedCardReport({
  rec,
  currentCardValue,
  currentCardName,
  officialUrl,
  index,
  total,
  onPrev,
  onNext,
}: {
  rec: RankedRecommendation;
  currentCardValue: CardValue | null;
  currentCardName: string | null;
  officialUrl: string | null;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const art = resolveCardArt(rec.card_id);
  const applyHref = officialUrl || (cardUrls as Record<string, string>)[rec.card_id] || "#";
  const sections = useMemo(() => buildBreakdownSections(rec), [rec]);
  const currentCardLabel = currentCardName ?? "your current card";

  // Cumulative running totals, not a flat per-month figure: each card earns
  // its own net_annual_value_usd / 12 every month, and the two lines diverge
  // as that accumulates, rather than jumping straight to a single average.
  const cumulative = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const currentMonthly = (currentCardValue?.net_annual_value_usd ?? 0) / 12;
    const candidateMonthly = rec.card_value.net_annual_value_usd / 12;
    let currentRunning = 0;
    let candidateRunning = 0;
    return months.map((label) => {
      currentRunning += currentMonthly;
      candidateRunning += candidateMonthly;
      return {
        label,
        current: Math.round(currentRunning),
        candidate: Math.round(candidateRunning),
      };
    });
  }, [rec, currentCardValue]);

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
                {rec.issuer}
              </span>
              <span className="text-[13px] font-semibold">{rec.name}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            {rec.issuer}
          </p>
          <h2 className="mb-3 text-[24px] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[28px]">
            {rec.name}
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                Projected annual savings
              </p>
              <p className="text-[36px] font-semibold leading-none tabular-nums tracking-tight text-[#1B6BC4]">
                {formatMoney(rec.delta_usd)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                Total annual value
              </p>
              <p className="text-[22px] font-semibold tabular-nums text-[var(--ink)]">
                {formatMoney(rec.card_value.total_reward_value_usd)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            Projected savings vs. {currentCardLabel}
          </h3>
        </div>
        <div className="rounded-[12px] border border-[var(--border)] bg-[#FAFAF8] px-2 pb-2 pt-3 sm:px-4 sm:pt-4">
          <SavingsAreaChart
            data={cumulative}
            currentLabel={currentCardLabel}
            candidateLabel={rec.name}
            isWinning={rec.delta_usd >= 0}
          />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          How this was calculated
        </h3>
        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-[var(--muted)]">
          <li>Map your annual spend by category to this card&apos;s real earn rates (respecting spend caps).</li>
          <li>Price every credit and statement benefit on the card at face value, annualized by its cadence.</li>
          <li>Subtract the annual fee to get this card&apos;s total net annual value.</li>
          <li>Compare that to {currentCardLabel}&apos;s net annual value, priced the same way, to get the savings above.</li>
        </ol>
        <div className="space-y-4">
          <BreakdownSection
            title="Earn rate rewards"
            rows={sections.earnRateRows}
            subtotalLabel="Total earn rate value"
            subtotal={sections.earnRateTotal}
          />
          <BreakdownSection
            title="Benefits & credits"
            rows={sections.benefitRows}
            subtotalLabel="Total benefits value"
            subtotal={sections.benefitsTotal}
          />

          <div className="rounded-[12px] border border-[var(--border)] bg-white px-4 py-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              Total calculation
            </p>
            <div className="space-y-1.5">
              <TotalLine label="Earn rate value" amount={sections.earnRateTotal} />
              <TotalLine label="Benefits value" amount={sections.benefitsTotal} />
              <TotalLine label="Annual fee" amount={-sections.annualFee} />
              <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-1.5">
                <p className="text-[14px] font-semibold text-[var(--ink)]">
                  Net annual value
                </p>
                <p className="text-[14px] font-semibold tabular-nums text-[var(--ink)]">
                  {formatMoney(sections.netValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
          Projected from your redacted spend and each card&apos;s published earn
          rates and benefits — assumes full engagement with every credit
          listed. Confirm current terms with the issuer before applying.
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

const CURRENT_COLOR = "#9A9A93";
const CANDIDATE_COLOR = "#1B6BC4";
const LOSING_COLOR = "#E85D4C";

function SavingsAreaChart({
  data,
  currentLabel,
  candidateLabel,
  isWinning,
}: {
  data: { label: string; current: number; candidate: number }[];
  currentLabel: string;
  candidateLabel: string;
  isWinning: boolean;
}) {
  const width = 420;
  const height = 216;
  const padL = 44;
  const padR = 12;
  const padT = 16;
  const padB = 36;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const gapColor = isWinning ? CANDIDATE_COLOR : LOSING_COLOR;

  // Scale both axes to the full range actually present, not just the max --
  // a candidate whose own net_annual_value_usd is negative (a bad fit, not
  // just "worse than current") needs a negative floor too, or its line
  // renders off the bottom of the plot.
  const allValues = data.flatMap((m) => [m.current, m.candidate]);
  const rawMax = Math.max(...allValues, 1);
  const rawMin = Math.min(...allValues, 0);
  const niceMax = niceCeil(rawMax);
  const niceMin = rawMin < 0 ? -niceCeil(-rawMin) : 0;
  const range = niceMax - niceMin || 1;
  const yTicks = [0, 0.5, 1].map((t) => niceMin + t * range);

  const xFor = (i: number) =>
    padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yFor = (amount: number) => padT + plotH - ((amount - niceMin) / range) * plotH;

  const currentPts = data.map((m, i) => ({ x: xFor(i), y: yFor(m.current), ...m }));
  const candidatePts = data.map((m, i) => ({ x: xFor(i), y: yFor(m.candidate), ...m }));

  const currentLine = smoothLine(currentPts);
  const candidateLine = smoothLine(candidatePts);

  // Shaded gap between the two lines, tracing candidate forward then current
  // backward -- valid whichever line is on top, since it's a closed polygon
  // either way. Color (gapColor) carries the winning/losing signal instead.
  const gapPath = `${candidateLine} L ${currentPts[currentPts.length - 1]!.x} ${currentPts[currentPts.length - 1]!.y} ${[...currentPts]
    .reverse()
    .slice(1)
    .map((p) => `L ${p.x} ${p.y}`)
    .join(" ")} Z`;

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 px-1">
        <Legend color={CANDIDATE_COLOR} label={candidateLabel} />
        <Legend color={CURRENT_COLOR} label={currentLabel} />
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Cumulative projected value over the year: ${candidateLabel} vs. ${currentLabel}`}
      >
        <defs>
          <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gapColor} stopOpacity="0.16" />
            <stop offset="100%" stopColor={gapColor} stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke={Math.abs(tick) < 0.01 ? "#C9C9C2" : "#E5E5E1"}
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

        <path d={gapPath} fill="url(#gapFill)" />

        <path
          d={currentLine}
          fill="none"
          stroke={CURRENT_COLOR}
          strokeWidth={2}
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={candidateLine}
          fill="none"
          stroke={CANDIDATE_COLOR}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {currentPts.map((p) => (
          <circle key={`cur-${p.label}`} cx={p.x} cy={p.y} r={2} fill={CURRENT_COLOR} />
        ))}
        {candidatePts.map((p) => (
          <circle key={`cand-${p.label}`} cx={p.x} cy={p.y} r={2.5} fill={CANDIDATE_COLOR} />
        ))}

        {data.map((p, i) =>
          i % 2 === 0 || i === data.length - 1 ? (
            <text
              key={`lbl-${p.label}`}
              x={xFor(i)}
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
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] font-medium text-[var(--muted)]">{label}</span>
    </div>
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
