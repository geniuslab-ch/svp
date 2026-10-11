import { cn } from "@/lib/cn";

const PALETTES = [
  ["#C8F04B", "#F1ECE2", "#2B2B26"],
  ["#E07A5F", "#F1ECE2", "#22221E"],
  ["#8FB39A", "#C8F04B", "#1B1B18"],
  ["#7F95B5", "#F1ECE2", "#1B1B18"],
  ["#E6B655", "#E07A5F", "#22221E"],
  ["#F1ECE2", "#8FB39A", "#151513"],
];

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * Deterministic generative cover art. Used instead of stock imagery so listings never show
 * a product screenshot that isn't real.
 */
export function VentureCover({ seed, alias, className, monogram = true }: { seed: number; alias: string; className?: string; monogram?: boolean }) {
  const r = rng(seed + 7);
  const [a, b, bg] = PALETTES[seed % PALETTES.length];
  const variant = seed % 5;
  const id = `g${seed}`;
  const letter = alias.trim().charAt(0).toUpperCase() || "·";
  const shapes: React.ReactNode[] = [];

  if (variant === 0) {
    for (let i = 0; i < 7; i++)
      shapes.push(<circle key={i} cx={300 + r() * 40} cy={250} r={40 + i * 34} fill="none" stroke={i % 2 ? b : a} strokeOpacity={0.15 + i * 0.06} strokeWidth={1.2} />);
  } else if (variant === 1) {
    for (let x = 0; x < 16; x++)
      for (let y = 0; y < 10; y++) {
        const on = r() > 0.55;
        shapes.push(<circle key={`${x}-${y}`} cx={20 + x * 26} cy={22 + y * 26} r={on ? 3.2 : 1.4} fill={on ? a : b} fillOpacity={on ? 0.9 : 0.25} />);
      }
  } else if (variant === 2) {
    for (let i = 0; i < 14; i++)
      shapes.push(<rect key={i} x={i * 30} y={260 - r() * 200} width={18} height={400} fill={i % 3 === 0 ? a : b} fillOpacity={i % 3 === 0 ? 0.85 : 0.12} />);
  } else if (variant === 3) {
    shapes.push(<circle key="c1" cx={140 + r() * 80} cy={160} r={110} fill={a} fillOpacity={0.9} />);
    shapes.push(<circle key="c2" cx={280 + r() * 60} cy={170} r={95} fill={b} fillOpacity={0.55} style={{ mixBlendMode: "screen" }} />);
    shapes.push(<rect key="l" x={0} y={232} width={420} height={1} fill={b} fillOpacity={0.4} />);
  } else {
    for (let i = 0; i < 9; i++) {
      const y = 30 + i * 28;
      shapes.push(
        <path key={i} d={`M0 ${y} C 120 ${y - 40 * r()}, 280 ${y + 50 * r()}, 420 ${y}`} fill="none" stroke={i === 4 ? a : b} strokeOpacity={i === 4 ? 1 : 0.22} strokeWidth={i === 4 ? 2.4 : 1} />,
      );
    }
  }

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: bg }}>
      <svg viewBox="0 0 420 280" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id={id} cx="0.8" cy="0.1" r="1">
            <stop offset="0" stopColor={a} stopOpacity="0.18" />
            <stop offset="1" stopColor={bg} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="420" height="280" fill={`url(#${id})`} />
        {shapes}
      </svg>
      {monogram && (
        <span className="serif absolute bottom-2 right-4 select-none text-[86px] italic leading-none text-ivory/90 mix-blend-difference" aria-hidden>
          {letter}
        </span>
      )}
      <div className="grain pointer-events-none absolute inset-0" />
    </div>
  );
}
