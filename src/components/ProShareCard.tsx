import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Share2, X } from "lucide-react";

export type ShareRatio = "1:1" | "4:5" | "9:16" | "16:9";
export type ShareTemplate = "broadcast" | "podium" | "stat" | "minimal";

export interface ProShareStat {
  label: string;
  value: string;
}

export interface ProShareData {
  eyebrow: string;
  title: string;
  subtitle?: string;
  stats: ProShareStat[];
  /** Ordered podium / leaderboard rows, used by the podium template. */
  rows?: { rank: string; name: string; detail?: string }[];
  accent?: string;
  fileName?: string;
}

const RATIOS: Record<ShareRatio, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
};

const TEMPLATES: { id: ShareTemplate; label: string }[] = [
  { id: "broadcast", label: "Broadcast" },
  { id: "podium", label: "Podium" },
  { id: "stat", label: "Stat wall" },
  { id: "minimal", label: "Minimal" },
];

const DISPLAY = "Bebas Neue, Barlow Condensed, system-ui, sans-serif";
const TEXT = "Barlow Condensed, system-ui, sans-serif";

function drawCarbon(ctx: CanvasRenderingContext2D, W: number, H: number, accent: string) {
  ctx.fillStyle = "#0B0B0D";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 2;
  for (let i = -H; i < W; i += 14) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  const grad = ctx.createRadialGradient(W * 0.15, H * 0.12, 0, W * 0.15, H * 0.12, Math.max(W, H));
  grad.addColorStop(0, `${accent}38`);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, Math.round(W * 0.013), H);
}

function drawFooter(ctx: CanvasRenderingContext2D, W: number, H: number, accent: string, pad: number) {
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
  ctx.fillStyle = accent;
  ctx.font = `400 ${Math.round(W * 0.055)}px ${DISPLAY}`;
  ctx.fillText("APEXO", pad, H - pad * 0.6);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `500 ${Math.round(W * 0.026)}px ${TEXT}`;
  ctx.fillText("Formula 1 companion", pad + W * 0.2, H - pad * 0.6);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.toUpperCase().split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      cy += lh;
      line = w;
    } else line = test;
  }
  ctx.fillText(line, x, cy);
  return cy;
}

function render(
  canvas: HTMLCanvasElement,
  data: ProShareData,
  template: ShareTemplate,
  ratio: ShareRatio,
) {
  const { w: W, h: H } = RATIOS[ratio];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const accent = data.accent ?? "#E8002D";
  const pad = Math.round(W * 0.085);

  drawCarbon(ctx, W, H, accent);
  ctx.textAlign = "left";

  // Eyebrow
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 ${Math.round(W * 0.026)}px ${TEXT}`;
  ctx.letterSpacing = `${Math.round(W * 0.009)}px`;
  ctx.fillText(data.eyebrow.toUpperCase(), pad, pad * 1.5);
  ctx.letterSpacing = "0px";

  // Title
  const titleSize = Math.round(W * (template === "minimal" ? 0.145 : 0.115));
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `400 ${titleSize}px ${DISPLAY}`;
  let y = wrap(ctx, data.title, pad, pad * 1.5 + titleSize * 1.25, W - pad * 2, titleSize * 0.98);

  if (data.subtitle) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `500 ${Math.round(W * 0.032)}px ${TEXT}`;
    y += Math.round(W * 0.055);
    ctx.fillText(data.subtitle, pad, y);
  }

  const bodyTop = y + Math.round(H * 0.07);
  const bodyBottom = H - pad * 1.6;

  if (template === "podium" && data.rows?.length) {
    const rows = data.rows.slice(0, 5);
    const rh = Math.min(Math.round(W * 0.135), (bodyBottom - bodyTop) / rows.length - 12);
    let ry = bodyTop;
    rows.forEach((r, i) => {
      ctx.fillStyle = i === 0 ? `${accent}26` : "rgba(255,255,255,0.05)";
      ctx.fillRect(pad, ry, W - pad * 2, rh);
      ctx.fillStyle = accent;
      ctx.fillRect(pad, ry, Math.round(W * 0.006), rh);
      ctx.fillStyle = i === 0 ? accent : "rgba(255,255,255,0.75)";
      ctx.font = `400 ${Math.round(rh * 0.62)}px ${DISPLAY}`;
      ctx.fillText(r.rank, pad + W * 0.035, ry + rh * 0.72);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `400 ${Math.round(rh * 0.5)}px ${DISPLAY}`;
      ctx.fillText(r.name.toUpperCase(), pad + W * 0.16, ry + rh * 0.66);
      if (r.detail) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `500 ${Math.round(rh * 0.24)}px ${TEXT}`;
        ctx.textAlign = "right";
        ctx.fillText(r.detail.toUpperCase(), W - pad * 1.2, ry + rh * 0.66);
        ctx.textAlign = "left";
      }
      ry += rh + 12;
    });
  } else if (template === "stat") {
    const cells = data.stats.slice(0, 6);
    const cols = ratio === "16:9" ? 3 : 2;
    const rowsN = Math.ceil(cells.length / cols);
    const gap = Math.round(W * 0.022);
    const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
    const ch = Math.min(Math.round(W * 0.2), (bodyBottom - bodyTop - gap * (rowsN - 1)) / rowsN);
    cells.forEach((s, i) => {
      const cx = pad + (i % cols) * (cw + gap);
      const cy = bodyTop + Math.floor(i / cols) * (ch + gap);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(cx, cy, cw, ch);
      ctx.fillStyle = accent;
      ctx.fillRect(cx, cy, cw, Math.round(W * 0.004));
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `600 ${Math.round(W * 0.022)}px ${TEXT}`;
      ctx.letterSpacing = `${Math.round(W * 0.005)}px`;
      ctx.fillText(s.label.toUpperCase(), cx + W * 0.028, cy + ch * 0.32);
      ctx.letterSpacing = "0px";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `400 ${Math.round(ch * 0.46)}px ${DISPLAY}`;
      ctx.fillText(s.value, cx + W * 0.028, cy + ch * 0.82);
    });
  } else if (template === "broadcast") {
    const cells = data.stats.slice(0, 5);
    const rh = Math.min(Math.round(W * 0.11), (bodyBottom - bodyTop) / Math.max(1, cells.length) - 14);
    let sy = bodyTop;
    for (const s of cells) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(pad, sy, W - pad * 2, rh);
      ctx.fillStyle = accent;
      ctx.fillRect(pad, sy, Math.round(W * 0.005), rh);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `600 ${Math.round(W * 0.024)}px ${TEXT}`;
      ctx.letterSpacing = `${Math.round(W * 0.005)}px`;
      ctx.fillText(s.label.toUpperCase(), pad + W * 0.035, sy + rh * 0.42);
      ctx.letterSpacing = "0px";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `400 ${Math.round(rh * 0.55)}px ${DISPLAY}`;
      ctx.textAlign = "right";
      ctx.fillText(s.value, W - pad * 1.2, sy + rh * 0.72);
      ctx.textAlign = "left";
      sy += rh + 14;
    }
  } else {
    // minimal — one hero stat
    const hero = data.stats[0];
    if (hero) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `600 ${Math.round(W * 0.026)}px ${TEXT}`;
      ctx.letterSpacing = `${Math.round(W * 0.008)}px`;
      ctx.fillText(hero.label.toUpperCase(), pad, bodyTop);
      ctx.letterSpacing = "0px";
      ctx.fillStyle = accent;
      ctx.font = `400 ${Math.round(W * 0.24)}px ${DISPLAY}`;
      ctx.fillText(hero.value, pad, bodyTop + W * 0.22);
    }
  }

  drawFooter(ctx, W, H, accent, pad);
}

/**
 * Pro share cards — multi-template, multi-aspect-ratio broadcast graphics.
 * Everything renders on a canvas so exports look identical everywhere.
 */
export function ProShareCard({ data, className, label = "Share card" }: { data: ProShareData; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState<ShareTemplate>(data.rows?.length ? "podium" : "broadcast");
  const [ratio, setRatio] = useState<ShareRatio>("4:5");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const accent = data.accent ?? "#E8002D";
  const ratios = useMemo(() => Object.keys(RATIOS) as ShareRatio[], []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    render(canvas, data, template, ratio);
    setPreview(canvas.toDataURL("image/png"));
  }, [data, template, ratio]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(paint);
    return () => window.cancelAnimationFrame(id);
  }, [open, paint]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const download = async () => {
    setBusy(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      const name = `${data.fileName ?? "apexo-card"}-${template}-${ratio.replace(":", "x")}.png`;
      const file = new File([blob], name, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: data.title });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* share sheet dismissed */
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground " +
          (className ?? "")
        }
      >
        <Share2 className="h-3.5 w-3.5" /> {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create a share card"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl glass-elevated border border-border p-5 sm:rounded-2xl motion-safe:animate-slide-up">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-70" />
            <div className="flex items-start gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Share card</div>
                <h2 className="font-display text-2xl leading-none">{data.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="ml-auto grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_200px]">
              <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-border bg-surface/40 p-3">
                {preview ? (
                  <img
                    src={preview}
                    alt={`${data.title} share card preview`}
                    className="max-h-[52dvh] w-auto rounded-lg shadow-broadcast"
                  />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>

              <div className="space-y-4">
                <fieldset>
                  <legend className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Template</legend>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {TEMPLATES.filter((t) => t.id !== "podium" || data.rows?.length).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplate(t.id)}
                        aria-pressed={template === t.id}
                        className={
                          "rounded-lg border px-2 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors " +
                          (template === t.id
                            ? "border-accent/60 bg-accent/10 text-foreground"
                            : "border-border bg-surface/50 text-muted-foreground hover:text-foreground")
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Aspect ratio</legend>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {ratios.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRatio(r)}
                        aria-pressed={ratio === r}
                        className={
                          "rounded-lg border px-1 py-2 font-timing text-[11px] tabular-nums transition-colors " +
                          (ratio === r
                            ? "border-accent/60 bg-accent/10 text-foreground"
                            : "border-border bg-surface/50 text-muted-foreground hover:text-foreground")
                        }
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <button
                  type="button"
                  onClick={download}
                  disabled={busy || !preview}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground shadow-broadcast transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  style={{ backgroundImage: "var(--gradient-accent)" }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {busy ? "Rendering" : "Download / share"}
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Rendered at full resolution with the Apexo carbon livery in{" "}
                  <span style={{ color: accent }}>your team accent</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
