// Lightweight inline SVG charts (no external deps)
import { formatINR } from "@/lib/format";

export function LineChart({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data.length) return <div className="grid h-44 place-items-center text-sm text-slate-400">No data</div>;
  const w = 600;
  const h = height;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const stepX = (w - pad.l - pad.r) / Math.max(data.length - 1, 1);
  const scaleY = (v: number) => h - pad.b - ((v - min) / (max - min)) * (h - pad.t - pad.b);
  const points = data.map((d, i) => `${pad.l + i * stepX},${scaleY(d.value)}`);
  const path = `M ${points.join(" L ")}`;
  const area = `${path} L ${pad.l + (data.length - 1) * stepX},${h - pad.b} L ${pad.l},${h - pad.b} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={pad.l} x2={w - pad.r} y1={pad.t + (h - pad.t - pad.b) * t} y2={pad.t + (h - pad.t - pad.b) * t} stroke="#E2E8F0" strokeDasharray="3 3" />
      ))}
      <path d={area} fill="url(#lineFill)" />
      <path d={path} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={pad.l + i * stepX} cy={scaleY(d.value)} r="3" fill="#FFFFFF" stroke="#F97316" strokeWidth="2" />
      ))}
      {data.map((d, i) =>
        i % Math.ceil(data.length / 8) === 0 || i === data.length - 1 ? (
          <text key={i} x={pad.l + i * stepX} y={h - 8} fontSize="10" textAnchor="middle" fill="#64748B">
            {d.label}
          </text>
        ) : null,
      )}
      {[0, 0.5, 1].map((t, i) => {
        const v = max - (max - min) * t;
        return (
          <text key={i} x={pad.l - 6} y={pad.t + (h - pad.t - pad.b) * t + 3} fontSize="10" textAnchor="end" fill="#94A3B8">
            ₹{v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
          </text>
        );
      })}
    </svg>
  );
}

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return <div className="grid h-44 place-items-center text-sm text-slate-400">No data</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-32 shrink-0 truncate text-xs font-medium text-slate-600">{d.label}</div>
          <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100">
            <div
              className="h-full rounded-md bg-gradient-to-r from-indigo-500 to-purple-600"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="w-20 shrink-0 text-right text-xs font-semibold text-slate-700">{formatINR(d.value, true)}</div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="22" />
        {segments.map((s) => {
          const len = (s.value / total) * circumference;
          const el = (
            <circle
              key={s.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="font-medium text-slate-700">{s.label}</span>
            <span className="text-slate-500">— {formatINR(s.value, true)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
