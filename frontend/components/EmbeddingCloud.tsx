"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

const TOOLTIP_PAD = 8;
const TOOLTIP_GAP = 10;
const TOOLTIP_FALLBACK_W = 320;
const TOOLTIP_FALLBACK_H = 220;
/** Enter / stay / switch thresholds — exit radius is much larger than enter. */
const HIT_RADIUS = 26;
const HIT_STICKY_RADIUS = 56;
const HIT_SWITCH_MARGIN = 16;

function clampTooltipPosition(
  anchorX: number,
  anchorY: number,
  containerW: number,
  containerH: number,
  tipW: number,
  tipH: number,
  mode: "hover" | "pinned",
): { left: number; top: number } {
  let left: number;
  let top: number;

  if (mode === "pinned") {
    // Attach to the top-right of the selected point.
    left = anchorX + TOOLTIP_GAP + 6;
    top = anchorY - tipH - TOOLTIP_GAP;
    if (left + tipW > containerW - TOOLTIP_PAD) {
      left = anchorX - tipW - TOOLTIP_GAP - 6;
    }
    if (top < TOOLTIP_PAD) {
      top = anchorY + TOOLTIP_GAP;
    }
  } else {
    left = anchorX - tipW / 2;
    top = anchorY - tipH - TOOLTIP_GAP;
    if (top < TOOLTIP_PAD) {
      top = anchorY + TOOLTIP_GAP;
    }
  }

  left = Math.max(
    TOOLTIP_PAD,
    Math.min(left, containerW - tipW - TOOLTIP_PAD),
  );
  top = Math.max(
    TOOLTIP_PAD,
    Math.min(top, containerH - tipH - TOOLTIP_PAD),
  );

  return { left, top };
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0.4);
  const rafRef = useRef(0);
  const screenRef = useRef<ScreenPoint[]>([]);
  const angleAnimRef = useRef(0);
  const pinnedRef = useRef(false);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(selectedId);
  const pointerOverRef = useRef(false);
  const frozenHoverRef = useRef<{ id: string; sx: number; sy: number } | null>(
    null,
  );
  const anchorRef = useRef({ x: 0, y: 0 });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const [anchorDot, setAnchorDot] = useState({ x: 0, y: 0 });

  const activeId = selectedId ?? hoveredId;
  const activePoint = points.find((p) => p.id === activeId) ?? null;
  const isPinned = Boolean(selectedId);

  const placeTooltip = (
    anchorX: number,
    anchorY: number,
    mode: "hover" | "pinned",
  ) => {
    anchorRef.current = { x: anchorX, y: anchorY };
    setAnchorDot((prev) =>
      Math.abs(prev.x - anchorX) > 0.5 || Math.abs(prev.y - anchorY) > 0.5
        ? { x: anchorX, y: anchorY }
        : prev,
    );
    const wrap = wrapRef.current;
    if (!wrap) {
      setTooltipPos({ left: anchorX, top: anchorY });
      return;
    }
    const tip = tooltipRef.current;
    const { width: cw, height: ch } = wrap.getBoundingClientRect();
    const tipW = tip?.offsetWidth || TOOLTIP_FALLBACK_W;
    const tipH = tip?.offsetHeight || TOOLTIP_FALLBACK_H;
    const next = clampTooltipPosition(
      anchorX,
      anchorY,
      cw,
      ch,
      tipW,
      tipH,
      mode,
    );
    setTooltipPos((prev) =>
      Math.abs(prev.left - next.left) > 0.5 ||
      Math.abs(prev.top - next.top) > 0.5
        ? next
        : prev,
    );
  };

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
    if (!selectedId) return;
    const match = screenRef.current.find((p) => p.id === selectedId);
    if (match) placeTooltip(match.sx, match.sy, "pinned");
  }, [selectedId, points]);

  useLayoutEffect(() => {
    if (!activePoint?.blurb) return;
    const { x, y } = anchorRef.current;
    placeTooltip(x, y, selectedId ? "pinned" : "hover");
  }, [activePoint?.id, activePoint?.blurb, selectedId]);

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

      const focusId = selectedIdRef.current ?? hoveredIdRef.current;
      // Freeze the cloud while the pointer is over it or a card is focused,
      // so points don't slide out from under the cursor at the hit border.
      const paused =
        Boolean(focusId) || pointerOverRef.current || pinnedRef.current;
      if (!paused) angleRef.current += 0.004;

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

      if (focusId) {
        const match = drawn.find((p) => p.id === focusId);
        if (match) {
          // While hovering, keep the tooltip locked to the position captured
          // when the hover started so micro-motion can't flicker the UI.
          const frozen = frozenHoverRef.current;
          const useFrozen =
            !selectedIdRef.current &&
            frozen &&
            frozen.id === focusId;
          const ax = useFrozen ? frozen.sx : match.sx;
          const ay = useFrozen ? frozen.sy : match.sy;
          placeTooltip(
            ax,
            ay,
            selectedIdRef.current ? "pinned" : "hover",
          );
        }
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
        // Prefer frozen coords for the active hover target so rotation
        // (if any) can't yank the hit target out from under the cursor.
        const frozen = frozenHoverRef.current;
        const sx =
          frozen && frozen.id === p.id ? frozen.sx : p.sx;
        const sy =
          frozen && frozen.id === p.id ? frozen.sy : p.sy;
        const d = Math.hypot(sx - mx, sy - my);
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
        const frozen = frozenHoverRef.current;
        const current = screenRef.current.find((p) => p.id === currentId);
        if (current || (frozen && frozen.id === currentId)) {
          const sx = frozen?.id === currentId ? frozen.sx : current!.sx;
          const sy = frozen?.id === currentId ? frozen.sy : current!.sy;
          const currentDist = Math.hypot(sx - mx, sy - my);
          // Stay on the current point until the cursor clearly leaves.
          if (currentDist <= HIT_STICKY_RADIUS) {
            if (
              nearest.point.id !== currentId &&
              nearest.dist + HIT_SWITCH_MARGIN < currentDist
            ) {
              return nearest.point;
            }
            return current ?? nearest.point;
          }
          // Outside sticky radius — drop hover (don't snap to a neighbor
          // unless it's inside the enter radius).
          return nearest.dist <= HIT_RADIUS ? nearest.point : null;
        }
      }

      return nearest.dist <= HIT_RADIUS ? nearest.point : null;
    };

    const setHover = (point: ScreenPoint | null) => {
      const nextId = point?.id ?? null;
      if (nextId !== hoveredIdRef.current) {
        hoveredIdRef.current = nextId;
        if (point) {
          frozenHoverRef.current = {
            id: point.id,
            sx: point.sx,
            sy: point.sy,
          };
        } else {
          frozenHoverRef.current = null;
        }
        setHoveredId(nextId);
      }
      if (point) {
        const frozen = frozenHoverRef.current;
        placeTooltip(
          frozen?.id === point.id ? frozen.sx : point.sx,
          frozen?.id === point.id ? frozen.sy : point.sy,
          "hover",
        );
      }
    };

    const onEnter = () => {
      pointerOverRef.current = true;
    };

    const onMove = (e: MouseEvent) => {
      pointerOverRef.current = true;
      if (pinnedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const best = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      setHover(best);
    };

    const onLeave = () => {
      pointerOverRef.current = false;
      if (pinnedRef.current) return;
      frozenHoverRef.current = null;
      hoveredIdRef.current = null;
      setHoveredId(null);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const best = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (best) {
        frozenHoverRef.current = null;
        onSelectedIdChange?.(best.id);
        placeTooltip(best.sx, best.sy, "pinned");
      }
    };

    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [highlightTop, onSelectedIdChange]);

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair rounded-[12px]"
        aria-label="Embedding space visualization"
      />
      {activePoint?.blurb && isPinned ? (
        <svg
          className="pointer-events-none absolute inset-0 z-[15]"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <line
            x1={anchorDot.x}
            y1={anchorDot.y}
            x2={
              tooltipPos.left < anchorDot.x
                ? tooltipPos.left +
                  (tooltipRef.current?.offsetWidth || TOOLTIP_FALLBACK_W)
                : tooltipPos.left
            }
            y2={tooltipPos.top + 18}
            stroke="rgba(35,131,226,0.45)"
            strokeWidth="1.25"
            strokeDasharray="4 3"
          />
          <circle
            cx={anchorDot.x}
            cy={anchorDot.y}
            r="3.5"
            fill="#2383E2"
          />
        </svg>
      ) : null}
      {activePoint?.blurb ? (
        <div
          ref={tooltipRef}
          className="pointer-events-auto absolute z-20"
          style={{ left: tooltipPos.left, top: tooltipPos.top }}
        >
          <CardDetailTooltip
            cardId={activePoint.id}
            blurb={activePoint.blurb}
            score={activePoint.score}
            angleDeg={activePoint.angleDeg}
            pinned={isPinned}
            onClose={isPinned ? () => onSelectedIdChange?.(null) : undefined}
            className="w-[min(340px,calc(100vw-48px))] max-w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
