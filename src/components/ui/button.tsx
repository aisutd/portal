import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Colour treatment:
   * - "primary"  solid blue
   * - "accent"   orange
   * - "auth"     onboarding submit (self-contained padding/radius)
   * - "soft"     tinted purple ("Learn more")
   * - "ghost"    white w/ soft border ("Learn more" / secondary)
   */
  variant?: "primary" | "accent" | "auth" | "soft" | "ghost" | "danger" | "outline";
  /** "md" large CTAs, "sm" compact RSVP, "lg" the Discord pill. */
  size?: "md" | "sm" | "lg";
  /** Force a full pill radius. Defaults on for accent, off otherwise. */
  pill?: boolean;
  /** Stretch to the parent width. */
  block?: boolean;
  /** Render as a navigation link instead of a button. */
  href?: string;
};

const base =
  "inline-flex cursor-pointer items-center justify-center gap-[8px] border border-transparent font-black text-center " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 " +
  "focus-visible:outline-none focus-visible:ring-4 " +
  "disabled:pointer-events-none disabled:opacity-45";

// Each variant carries its own hover / active / focus-ring treatment so every
// button in the app responds to the pointer the same way.
const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "font-body bg-brand text-white [filter:drop-shadow(0px_5px_7px_rgba(47,95,232,0.3))] " +
    "hover:bg-brand-mid active:bg-brand-dark focus-visible:ring-brand-soft",
  accent:
    "font-body bg-orange text-orange-ink [filter:drop-shadow(0px_5px_7px_rgba(242,169,104,0.34))] " +
    "hover:bg-orange-soft active:bg-orange focus-visible:ring-orange-soft",
  auth:
    "font-grotesk bg-brand-button text-white rounded-[8px] px-[13px] pb-[14px] pt-[13px] text-[15px] leading-[normal] " +
    "hover:bg-brand-mid active:bg-brand-dark focus-visible:ring-brand-soft",
  soft:
    "font-body bg-purple-soft border-purple-border text-purple-ink " +
    "hover:bg-purple-border hover:border-purple-ink/25 focus-visible:ring-purple-soft",
  ghost:
    "font-body bg-white border-border-soft text-ink [filter:drop-shadow(0px_1px_0px_rgba(0,0,0,0.03))] " +
    "hover:bg-row-soft hover:border-ink-faint/50 focus-visible:ring-brand-soft",
  danger:
    "font-body bg-white border-danger-border text-danger-ink [filter:drop-shadow(0px_1px_0px_rgba(0,0,0,0.03))] " +
    "hover:bg-danger-ink/10 focus-visible:ring-danger-ink/25",
  outline:
    "font-body bg-transparent border-ink text-ink " +
    "hover:bg-ink hover:text-white focus-visible:ring-ink/20",
};

// Padding + type scale per size (radius handled separately to avoid clashes).
const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "px-[21px] py-[13px] text-[15px] leading-[15px]",
  sm: "px-[15px] py-[9px] text-[13px] leading-[13px]",
  lg: "px-[29px] py-[16px] text-[17px] leading-[17px]",
};

export function Button({
  variant = "primary",
  size = "md",
  pill,
  block = false,
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const isAuth = variant === "auth";
  // Accent reads as a pill by default; every other variant is square-ish.
  const isPill = pill ?? variant === "accent";

  const radius = isAuth
    ? ""
    : isPill
      ? "rounded-full"
      : size === "sm"
        ? "rounded-[8px]"
        : "rounded-[10px]";

  const classes = cn(
    base,
    variantClasses[variant],
    !isAuth && sizeClasses[size],
    radius,
    block && "w-full",
    className
  );

  if (href) {
    const linkProps = props as Omit<
      React.ComponentProps<typeof Link>,
      "href" | "className" | "children"
    >;

    return (
      <Link className={classes} href={href} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
