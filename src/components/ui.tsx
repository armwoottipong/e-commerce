import Link from "next/link";
import type { ComponentProps } from "react";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";

const control =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[2px] px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay disabled:cursor-not-allowed disabled:opacity-45";

type ButtonTone = "primary" | "secondary";
type LinkTone = "primary" | "light";
type GhostTone = "outline" | "inverse" | "filled";

export function Button({
  className,
  tone = "primary",
  ...props
}: ComponentProps<"button"> & { tone?: ButtonTone }) {
  const toneClass =
    tone === "primary"
      ? "bg-ink text-white hover:bg-clay"
      : "border border-ink/25 bg-white text-ink hover:border-ink/50 hover:bg-paper";

  return <button className={clsx(control, toneClass, className)} {...props} />;
}

export function LinkButton({
  className,
  tone = "primary",
  ...props
}: ComponentProps<typeof Link> & { tone?: LinkTone }) {
  const toneClass =
    tone === "primary"
      ? "bg-ink text-white hover:bg-clay"
      : "bg-white text-ink hover:bg-paper";

  return <Link className={clsx(control, toneClass, className)} {...props} />;
}

export function GhostLink({
  className,
  tone = "outline",
  ...props
}: ComponentProps<typeof Link> & { tone?: GhostTone }) {
  const tones = {
    outline:
      "border border-ink/25 bg-transparent text-ink hover:border-ink/50 hover:bg-white",
    inverse:
      "border border-white/55 bg-black/15 text-white hover:border-white hover:bg-white/10",
    filled:
      "border border-ink bg-ink text-white hover:border-clay hover:bg-clay",
  };
  return <Link className={clsx(control, tones[tone], className)} {...props} />;
}

export function Field(props: ComponentProps<"input"> & { label: string }) {
  const { label, className, ...rest } = props;

  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <input
        className={clsx(
          "h-11 w-full min-w-0 rounded-[2px] border border-ink/15 bg-white px-3 text-ink shadow-line focus:border-clay focus:outline-none disabled:bg-linen/70",
          className,
        )}
        {...rest}
      />
    </label>
  );
}

export function TextArea(
  props: ComponentProps<"textarea"> & { label: string },
) {
  const { label, className, ...rest } = props;

  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <textarea
        className={clsx(
          "min-h-28 w-full min-w-0 rounded-[2px] border border-ink/15 bg-white px-3 py-2 text-ink shadow-line focus:border-clay focus:outline-none disabled:bg-linen/70",
          className,
        )}
        {...rest}
      />
    </label>
  );
}

export function Select(props: ComponentProps<"select"> & { label: string }) {
  const { label, className, children, ...rest } = props;

  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <select
        className={clsx(
          "h-11 w-full min-w-0 rounded-[2px] border border-ink/15 bg-white px-3 text-ink shadow-line focus:border-clay focus:outline-none disabled:bg-linen/70",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

export function StatusPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full border border-ink/20 bg-paper px-2.5 py-1 text-center font-mono text-[10px] uppercase leading-none text-ink/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-ink/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function MetricLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-36 flex-col justify-between border-t border-ink/15 py-5 transition hover:border-clay"
    >
      <span className="font-mono text-[11px] uppercase text-ink/65">
        {label}
      </span>
      <span className="flex items-end justify-between gap-4 font-display text-3xl">
        {value}
        <ArrowRight className="mb-1 h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function DashboardMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between border-t border-ink/15 py-5">
      <span className="font-mono text-[11px] uppercase text-ink/65">
        {label}
      </span>
      <div>
        <p className="font-display text-3xl leading-none sm:text-4xl">
          {value}
        </p>
        {detail && <p className="mt-2 text-xs text-ink/60">{detail}</p>}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-y border-ink/10 py-12 text-center">
      <p className="font-display text-2xl">{title}</p>
      {detail && (
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/65">{detail}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
