"use client";

import { useEffect, useRef, useState } from "react";
import { CardDetailTooltip } from "@/components/CardDetailTooltip";

export type CardBlurb = {
  name: string;
  issuer: string;
  annualFee: number | null;
  earnHighlight: string[];
  benefits: string[];
  summary: string;
};

export type VizPoint = {
  id: string;
  name: string;
  issuer?: string;
  x: number;
  y: number;
  z: number;
  isTop?: boolean;
  score?: number;
  angleDeg?: number;
  blurb?: CardBlurb | null;
};

type EmbeddingCloudProps = {
  points: VizPoint[];
  userPoint?: { x: number; y: number; z: number } | null;
  showUser?: boolean;
  highlightTop?: boolean;
  showAngles?: boolean;
  /** Externally pinned card (e.g. from top-10 list click). */
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  className?: string;
};

type ScreenPoint = VizPoint & {
  sx: number;
  sy: number;
  depth: number;
  r: number;
};

/** Enter / stay / switch thresholds — exit radius is much larger than enter. */
const HIT_RADIUS = 26;
const HIT_STICKY_RADIUS = 56;
const HIT_SWITCH_MARGIN = 16;

export function EmbeddingCloud({
  points,
  userPoint,
  showUser = false,
  highlightTop = false,
  showAngles = false,
  selectedId = null,
  onSelectedIdChange,
  className,
}: EmbeddingCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0.4);
  const rafRef = useRef(0);
  const screenRef = useRef<ScreenPoint[]>([]);
  const angleAnimRef = useRef(0);
  const pinnedRef = useRef(false);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeId = selectedId ?? hoveredId;
  const activePoint = points.find((p) => p.id === activeId) ?? null;
  const isPinned = Boolean(selectedId);

  useEffect(() => {
    pinnedRef.current = isPinned;
  }, [isPinned]);

  useEffect(() => {
    hoveredIdRef.current = hoveredId;
  }, [hoveredId]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const project = (x: number, y: number, z: number, w: number, h: number) => {
      const a = angleRef.current;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const xr = x * cos - z * sin;
      const zr = x * sin + z * cos;
      const yr = y;
      const scale = (Math.min(w, h) * 0.42) / (1.65 + zr * 0.35);
      return {
        sx: w / 2 + xr * scale,
        sy: h / 2 + yr * scale * 0.95,
        depth: zr,
        r: Math.max(1.6, 3.2 + zr * 0.7),
      };
    };

    const drawAxes = (w: number, h: number) => {
      const origin = project(0, 0, 0, w, h);
      const tips = [
        { p: project(1.05, 0, 0, w, h), label: "x" },
        { p: project(0, 1.05, 0, w, h), label: "y" },
        { p: project(0, 0, 1.05, w, h), label: "z" },
      ];
      for (const tip of tips) {
        ctx.beginPath();
        ctx.moveTo(origin.sx, origin.sy);
        ctx.lineTo(tip.p.sx, tip.p.sy);
        ctx.strokeStyle = "rgba(17,17,17,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = "600 11px var(--font-cardinal), sans-serif";
        ctx.fillStyle = "rgba(17,17,17,0.45)";
        ctx.fillText(tip.label, tip.p.sx + 4, tip.p.sy - 4);
      }
    };

    const draw = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(
        w / 2,
        h / 2,
        20,
        w / 2,
        h / 2,
        w * 0.6,
      );
      g.addColorStop(0, "rgba(244,244,241,0.95)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Graph always spins — tooltip is fixed top-right and never tracks points.
      angleRef.current += 0.004;

      if (showAngles) {
        angleAnimRef.current = Math.min(1, angleAnimRef.current + 0.018);
      } else {
        angleAnimRef.current = 0;
      }

      drawAxes(w, h);

      const drawn: ScreenPoint[] = points.map((p) => ({
        ...p,
        ...project(p.x, p.y, p.z, w, h),
      }));
      drawn.sort((a, b) => a.depth - b.depth);
      screenRef.current = drawn;

      let userScreen: { sx: number; sy: number } | null = null;
      if (showUser && userPoint) {
        const u = project(userPoint.x, userPoint.y, userPoint.z, w, h);
        userScreen = { sx: u.sx, sy: u.sy };
      }

      if (showAngles && userScreen && highlightTop) {
        const t = angleAnimRef.current;
        for (const p of drawn) {
          if (!p.isTop) continue;
          const mx = (userScreen.sx + p.sx) / 2;
          const my = (userScreen.sy + p.sy) / 2;
          ctx.beginPath();
          ctx.moveTo(userScreen.sx, userScreen.sy);
          ctx.lineTo(
            userScreen.sx + (p.sx - userScreen.sx) * t,
            userScreen.sy + (p.sy - userScreen.sy) * t,
          );
          ctx.strokeStyle = `rgba(35, 131, 226, ${0.25 + 0.35 * t})`;
          ctx.lineWidth = 1.25;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          if (t > 0.55) {
            const angle = p.angleDeg ?? 0;
            ctx.beginPath();
            ctx.arc(userScreen.sx, userScreen.sy, 18, 0, (angle * Math.PI) / 180);
            ctx.strokeStyle = "rgba(35, 131, 226, 0.55)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font = "600 10px var(--font-cardinal), sans-serif";
            ctx.fillStyle = "rgba(35, 131, 226, 0.95)";
            ctx.textAlign = "center";
            ctx.fillText(`θ ${angle.toFixed(1)}°`, mx, my - 8);
          }
        }
      }

      const focusId = selectedIdRef.current ?? hoveredIdRef.current;

      for (const p of drawn) {
        const top = highlightTop && p.isTop;
        const isFocus = focusId === p.id;
        ctx.beginPath();
        ctx.arc(
          p.sx,
          p.sy,
          top ? p.r * (isFocus ? 2.4 : 1.9) : p.r,
          0,
          Math.PI * 2,
        );
        if (top) {
          ctx.shadowColor = "rgba(35, 131, 226, 0.9)";
          ctx.shadowBlur = isFocus ? 26 : 18;
          ctx.fillStyle = "rgba(35, 131, 226, 0.95)";
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(17,17,17,0.22)";
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        if (top && (p.score ?? 0) > 0) {
          ctx.font = "600 10px var(--font-cardinal), sans-serif";
          ctx.fillStyle = "#1B6BC4";
          ctx.textAlign = "center";
          ctx.fillText(
            (p.score ?? 0).toFixed(3),
            p.sx,
            p.sy - (isFocus ? 16 : 12),
          );
        }
      }

      if (showUser && userScreen) {
        ctx.beginPath();
        ctx.arc(userScreen.sx, userScreen.sy, 8, 0, Math.PI * 2);
        ctx.shadowColor = "rgba(17,17,17,0.45)";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#111111";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(userScreen.sx, userScreen.sy, 13, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(17,17,17,0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = "600 12px var(--font-cardinal), sans-serif";
        ctx.fillStyle = "#111";
        ctx.textAlign = "center";
        ctx.fillText("You", userScreen.sx, userScreen.sy - 18);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [points, userPoint, showUser, highlightTop, showAngles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const nearestTop = (mx: number, my: number) => {
      let best: ScreenPoint | null = null;
      let bestDist = Infinity;
      for (const p of screenRef.current) {
        if (!highlightTop || !p.isTop) continue;
        const d = Math.hypot(p.sx - mx, p.sy - my);
        if (d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
      return best ? { point: best, dist: bestDist } : null;
    };

    const hitTest = (mx: number, my: number) => {
      const nearest = nearestTop(mx, my);
      if (!nearest) return null;

      const currentId = hoveredIdRef.current;
      if (currentId) {
        const current = screenRef.current.find((p) => p.id === currentId);
        if (current) {
          const currentDist = Math.hypot(current.sx - mx, current.sy - my);
          if (currentDist <= HIT_STICKY_RADIUS) {
            if (
              nearest.point.id !== currentId &&
              nearest.dist + HIT_SWITCH_MARGIN < currentDist
            ) {
              return nearest.point;
            }
            return current;
          }
          return nearest.dist <= HIT_RADIUS ? nearest.point : null;
        }
      }

      return nearest.dist <= HIT_RADIUS ? nearest.point : null;
    };

    const setHover = (point: ScreenPoint | null) => {
      const nextId = point?.id ?? null;
      if (nextId !== hoveredIdRef.current) {
        hoveredIdRef.current = nextId;
        setHoveredId(nextId);
      }
    };

    const onMove = (e: MouseEvent) => {
      if (pinnedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      setHover(hitTest(e.clientX - rect.left, e.clientY - rect.top));
    };

    const onLeave = () => {
      if (pinnedRef.current) return;
      hoveredIdRef.current = null;
      setHoveredId(null);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const best = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (best) onSelectedIdChange?.(best.id);
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [highlightTop, onSelectedIdChange]);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair rounded-[12px]"
        aria-label="Embedding space visualization"
      />
      {activePoint?.blurb ? (
        <div className="pointer-events-none absolute right-3 top-3 z-20 w-[min(300px,calc(100%-1.5rem))]">
          <CardDetailTooltip
            cardId={activePoint.id}
            blurb={activePoint.blurb}
            score={activePoint.score}
            angleDeg={activePoint.angleDeg}
            pinned={isPinned}
            onClose={isPinned ? () => onSelectedIdChange?.(null) : undefined}
            className={`max-w-full shadow-[0_16px_40px_rgba(17,17,17,0.18)] ${
              isPinned ? "pointer-events-auto" : "pointer-events-none"
            }`}
          />
        </div>
      ) : null}
    </div>
  );
}
