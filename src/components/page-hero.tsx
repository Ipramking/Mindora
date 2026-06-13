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
    <div className="hero-glow rounded-3xl border border-zinc-200 p-4 sm:p-6 dark:border-zinc-800">
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span
            className={`inline-block h-1.5 w-10 rounded-full bg-gradient-to-r ${gradient}`}
          />
          <Link
            href={backHref}
            className="mt-2 block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← {backLabel}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-col gap-2 sm:flex-shrink-0 sm:flex-row sm:flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
