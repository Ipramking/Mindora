import Link from "next/link";
import { gradientFor } from "@/components/glow-card";

export function PageHero({
  seed,
  backHref,
  backLabel,
  title,
  subtitle,
  actions,
}: {
  seed: string;
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const gradient = gradientFor(seed);

  return (
    <div className="hero-glow rounded-3xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className={`inline-block h-1.5 w-10 rounded-full bg-gradient-to-r ${gradient}`}
          />
          <Link
            href={backHref}
            className="mt-2 block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← {backLabel}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
          {subtitle && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
