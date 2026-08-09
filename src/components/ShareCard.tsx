import { useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";

export interface ShareStat {
  label: string;
  value: string;
}

/**
 * Shareable card — renders an Apexo-branded PNG on a 2x canvas so exports stay
 * crisp on phones, then downloads (or uses the native share sheet).
 */
export function ShareCard({
  eyebrow,
  title,
  subtitle,
  stats,
  accent = "#E8002D",
  fileName = "apexo-card",
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  stats: ShareStat[];
  accent?: string;
  fileName?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = () => {
    const W = 1080;
    const H = 1350;
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // carbon base
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

    // accent aura
    const grad = ctx.createRadialGradient(W * 0.15, H * 0.1, 0, W * 0.15, H * 0.1, W);
    grad.addColorStop(0, `${accent}33`);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // accent rail
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 14, H);

    // eyebrow
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 30px Barlow Condensed, system-ui, sans-serif";
    ctx.letterSpacing = "10px";
    ctx.fillText(eyebrow.toUpperCase(), 90, 170);

    // title
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "400 132px Bebas Neue, Barlow Condensed, system-ui, sans-serif";
    const words = title.toUpperCase().split(" ");
    let line = "";
    let y = 320;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > W - 180 && line) {
        ctx.fillText(line, 90, y);
        y += 128;
        line = w;
      } else line = test;
    }
    ctx.fillText(line, 90, y);

    if (subtitle) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "500 38px Barlow Condensed, system-ui, sans-serif";
      ctx.fillText(subtitle, 90, y + 66);
    }

    // stats
    let sy = y + 170;
    for (const s of stats.slice(0, 5)) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(90, sy, W - 180, 118);
      ctx.fillStyle = accent;
      ctx.fillRect(90, sy, 5, 118);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "600 26px Barlow Condensed, system-ui, sans-serif";
      ctx.letterSpacing = "6px";
      ctx.fillText(s.label.toUpperCase(), 126, sy + 48);

      ctx.letterSpacing = "0px";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "400 64px Bebas Neue, Barlow Condensed, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(s.value, W - 130, sy + 82);
      ctx.textAlign = "left";
      sy += 134;
    }

    // footer wordmark
    ctx.fillStyle = accent;
    ctx.font = "400 64px Bebas Neue, Barlow Condensed, system-ui, sans-serif";
    ctx.fillText("APEXO", 90, H - 90);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "500 30px Barlow Condensed, system-ui, sans-serif";
    ctx.fillText("Formula 1 companion", 300, H - 90);

    return canvas;
  };

  const onShare = async () => {
    setBusy(true);
    try {
      const canvas = draw();
      if (!canvas) return;
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });

      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* user dismissed the share sheet */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      className={
        "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground disabled:opacity-60 " +
        (className ?? "")
      }
    >
      {busy ? <Download className="h-3.5 w-3.5 animate-pulse" /> : <Share2 className="h-3.5 w-3.5" />}
      {busy ? "Rendering" : "Share card"}
    </button>
  );
}
