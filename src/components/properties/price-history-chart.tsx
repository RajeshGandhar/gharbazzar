"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

interface PricePoint {
  old_price: number | null;
  new_price: number;
  changed_at: string;
}

interface PriceHistoryChartProps {
  history: PricePoint[];
  currentPrice: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export function PriceHistoryChart({ history, currentPrice }: PriceHistoryChartProps) {
  if (history.length === 0) return null;

  // Build price timeline: initial price → each change → current
  const sorted = [...history].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
  );

  const points: { price: number; date: string }[] = [];

  // First recorded old_price is the starting price
  const firstOld = sorted[0].old_price;
  if (firstOld != null) {
    points.push({ price: firstOld, date: sorted[0].changed_at });
  }

  // Each change
  for (const entry of sorted) {
    points.push({ price: entry.new_price, date: entry.changed_at });
  }

  // If current price differs from last change, add it
  if (points.length > 0 && points[points.length - 1].price !== currentPrice) {
    points.push({ price: currentPrice, date: new Date().toISOString() });
  }

  if (points.length < 2) return null;

  const firstPrice = points[0].price;
  const lastPrice = points[points.length - 1].price;
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
  const trend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat";

  // SVG chart dimensions
  const width = 400;
  const height = 120;
  const padX = 10;
  const padY = 15;

  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const svgPoints = points.map((p, i) => ({
    x: padX + (i / (points.length - 1)) * (width - padX * 2),
    y: padY + (1 - (p.price - minP) / range) * (height - padY * 2),
  }));

  const pathD = svgPoints.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const areaD = `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${height - padY} L ${svgPoints[0].x} ${height - padY} Z`;

  const lineColor = trend === "down" ? "#16a34a" : trend === "up" ? "#ef4444" : "#6b7280";
  const fillColor = trend === "down" ? "#16a34a" : trend === "up" ? "#ef4444" : "#6b7280";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Price history</h3>
        <div className="flex items-center gap-1.5">
          {trend === "down" && <TrendingDown className="h-4 w-4 text-green-600" />}
          {trend === "up" && <TrendingUp className="h-4 w-4 text-red-500" />}
          {trend === "flat" && <Minus className="h-4 w-4 text-muted-foreground" />}
          <span
            className={`text-xs font-semibold ${
              trend === "down" ? "text-green-600" : trend === "up" ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            {changePercent > 0 ? "+" : ""}
            {changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Gradient fill under the line */}
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#priceGrad)" />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {svgPoints.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="white" stroke={lineColor} strokeWidth="2" />
        ))}
      </svg>

      {/* Timeline labels */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>

      {/* Change log */}
      <div className="mt-3 space-y-1.5">
        {sorted.map((entry, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{formatDate(entry.changed_at)}</span>
            <div className="flex items-center gap-2">
              {entry.old_price != null && (
                <span className="text-muted-foreground line-through">{formatPrice(entry.old_price)}</span>
              )}
              <span className="font-medium text-foreground">{formatPrice(entry.new_price)}</span>
              {entry.old_price != null && (
                <span
                  className={`text-[10px] font-semibold ${
                    entry.new_price < entry.old_price ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {entry.new_price < entry.old_price ? "" : "+"}
                  {(((entry.new_price - entry.old_price) / entry.old_price) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
