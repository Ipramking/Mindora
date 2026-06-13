import Link from "next/link";

const GRADIENTS = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-orange-500 via-rose-500 to-fuchsia-500",
  "from-blue-500 via-indigo-500 to-violet-500",
  "from-amber-400 via-orange-500 to-red-500",
  "from-teal-400 via-emerald-500 to-lime-400",
  "from-fuchsia-500 via-violet-500 to-indigo-500",
  "from-rose-400 via-red-500 to-orange-400",
];

/** Deterministically pick a gradient for a card based on a stable seed (e.g. an id). */
export function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function GlowCard({
  seed,
  href,
  className,
  children,
}: {
  seed: string;
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const gradient = gradientFor(seed);

  const baseClassName =
    "group relative isolate block overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900";

  const inner = (
    <>
      <div
        className={`pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl transition-all duration-500 group-hover:opacity-40 group-hover:scale-110`}
      />
      <div className="relative z-10">{children}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClassName} ${className ?? ""}`}>
        {inner}
      </Link>
    );
  }

  return <div className={`${baseClassName} ${className ?? ""}`}>{inner}</div>;
}
