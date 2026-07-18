"use client";

import Image from "next/image";
import {
  Lightbulb,
  Mountain,
  Rocket,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ProjectMission() {
  return (
    <article className="pt-6 text-left">
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        Project name
      </p>
      <h2 className="mb-5 font-wordmark text-[36px] font-medium tracking-[-0.06em] text-[var(--ink)]">
        Cardinal
      </h2>

      <p className="mb-3 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
        Americans waste hours researching credit cards and often still leave
        thousands a year on the table. Most people keep a mismatched card or
        chase the loudest point bonus, because comparing fees, categories, and
        credits by hand is exhausting.
      </p>
      <p className="mb-3 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
        Cardinal turns your bank spending into clear picks: using OpenAI
        embedding models to transform your spending habits into a vector,
        finding similar cards with Redis Vector Search (kNN), and forecasting
        net annual savings.
      </p>
      <p className="mb-10 max-w-2xl text-[15px] font-semibold leading-relaxed text-[var(--ink)]">
        Less research. More money kept.
      </p>

      <MissionSection icon={Lightbulb} title="Inspiration">
        <p>
          Choosing a credit card should take minutes. Instead, it is hours of
          comparing fees, categories, credits, and bonuses that change
          constantly. The average U.S. household holds about four cards and
          still leaves hundreds of dollars a year on the table, especially
          travelers, renters, grocery-heavy households, small-business owners,
          and anyone without time to research. Comparison sites dump tables;
          almost nothing starts from how you already spend. Cardinal turns bank
          spending into a clear pick, so people save time and save money.
        </p>
      </MissionSection>

      <MissionSection icon={Target} title="Our Solution">
        <p className="mb-4">
          Cardinal helps you find the perfect credit card not based on welcome
          offers or just higher point multipliers, but holistically by comparing
          credit cards to your real spending habits. We do this in a 2-step
          process:
        </p>

        <h4 className="mb-2 text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          Step 1: Pre-processing of Live Credit Cards
        </h4>
        <ul className="mb-4 list-disc space-y-1.5 pl-5">
          <li>
            Use the Cursor Firecrawl extension to crawl through 65+ real credit
            card issuers and extract metadata in JSON format, including point
            rates, welcome bonuses, benefits, and more.
          </li>
          <li>
            Convert this JSON metadata for each card into a structured string to
            pass into text-embedding-3-small (OpenAI Embedding Model).
          </li>
          <li>
            Append this embedding and associated card metadata into Redis (an
            in-memory DB) to leverage built-in vector search capabilities and
            in-memory design for low-latency fetches and similarity searches.
          </li>
        </ul>

        <ArchitectureFigure
          src="/Preprocessing_Architecture.png"
          alt="Pre-processing and embedding matching architecture: Firecrawl scrape, card metadata, OpenAI embeddings, Redis vector index, then cosine similarity kNN"
          caption="Pre-processing architecture: scrape → metadata → embed → Redis vector search"
        />

        <h4 className="mb-2 mt-8 text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          Step 2: User Similarity Search (Personalization)
        </h4>
        <ul className="mb-4 list-disc space-y-1.5 pl-5">
          <li>
            Ingest bank statements with PII redaction for privacy, then pass
            spending history into text-embedding-3-small (OpenAI embedding
            model).
          </li>
          <li>
            Using this vector embedding (which represents user spending history
            in high dimension), we use k-Nearest Neighbor cosine similarity
            search with Redis Vector Search to find cards that share general
            attributes based on your spending habits.
          </li>
          <li>
            Re-rank top-K results using a deterministic value assignment
            algorithm that scores earn rates against category spend, prices
            benefits, subtracts annual fees, and returns a transparent net
            annual savings breakdown.
          </li>
        </ul>

        <ArchitectureFigure
          src="/Value_Assignment_Algorithm.png"
          alt="Value assignment algorithm: top-K cards from embedding matching enter deterministic value assignment and exit as personalized net-value and points/benefits breakdowns"
          caption="Value assignment algorithm: deterministic re-rank of top-K cards into forecasted savings"
        />
      </MissionSection>

      <MissionSection icon={Mountain} title="Challenges We Ran Into">
        <ol className="list-decimal space-y-4 pl-5">
          <li>
            <span className="font-semibold text-[var(--ink)]">
              Embedding numbers (magnitude blindness | tokenization error):
            </span>{" "}
            Putting exact rates and dollar amounts into the embedding text
            backfired. Magnitude blindness means 1.5% vs 5% cash back barely
            differs as “similar text,” even though the economics are night and
            day. Tokenization can also scramble numbers (15,000 vs 150,000 may
            split differently and distort weight). Worse, “high” is ambiguous: a
            high APR and a high welcome bonus are both large, but one hurts. We
            strip numbers from the persona strings so embeddings find spend-style
            clusters (cashback vs points, dining vs travel, fee tier) and leave
            exact rates to the math re-ranker.
          </li>
          <li>
            <span className="font-semibold text-[var(--ink)]">
              Exploratory data analysis (Firecrawl | validation):
            </span>{" "}
            Issuer pages are messy HTML with inconsistent layouts. Firecrawl
            gave us clean, LLM-oriented extracts, but we still had to validate
            fields against the structured catalog, checking missing rates, odd
            fees, and incomplete benefits, so Redis wasn’t indexing junk. That
            QA loop was as important as the crawl itself.
          </li>
        </ol>
      </MissionSection>

      <MissionSection
        icon={Trophy}
        title="Accomplishments That We're Proud Of"
      >
        <p>
          Shipping an end-to-end path from spend → embed → Redis kNN → dollar
          savings, with a clear split of responsibility: embeddings for persona
          clusters, hard filters for absolute no-gos, and deterministic math for
          forecasted savings. The live pipeline 3D visualization makes that
          split visible instead of hiding it in a black box.
        </p>
      </MissionSection>

      <MissionSection icon={Sparkles} title="What We Learned">
        <p>
          Retrieval and ranking solve different problems. Stuffing rates into
          embeddings fails for the same reasons magnitude blindness and
          tokenization fail. Category-level, privacy-redacted spend is enough to
          personalize. Trust comes from showing users why a card ranked, not
          only that an embedding said so.
        </p>
      </MissionSection>

      <MissionSection icon={Rocket} title="What’s Next">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Live bank connection to providers like Plaid.</li>
          <li>
            Scheduled Firecrawl refreshes with re-embed only when stable terms
            change.
          </li>
          <li>
            Boost aligned welcome offers at rank time without baking churny
            promos into the index; and multi-card portfolio recommendations with
            eval of recall/precision against labeled personas.
          </li>
        </ol>
      </MissionSection>
    </article>
  );
}

function MissionSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[#FAFAF8] text-[var(--ink)]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {title}
        </h3>
      </div>
      <div className="max-w-2xl text-[15px] leading-relaxed text-[var(--muted)] [&_li]:text-[var(--muted)]">
        {children}
      </div>
    </section>
  );
}

function ArchitectureFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white shadow-[0_8px_28px_rgba(17,17,17,0.06)]">
      <div className="relative w-full bg-[#FAFAF8] p-3 sm:p-4">
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={900}
          unoptimized
          className="h-auto w-full rounded-[8px] border border-[var(--border)] bg-white object-contain"
        />
      </div>
      <figcaption className="border-t border-[var(--border)] px-4 py-3 text-[12px] leading-snug text-[var(--muted)]">
        {caption}
      </figcaption>
    </figure>
  );
}
