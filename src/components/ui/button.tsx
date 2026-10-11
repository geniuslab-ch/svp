import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-40 select-none";
const variants: Record<Variant, string> = {
  primary: "bg-lime text-ink-950 hover:bg-lime-300 active:scale-[.98]",
  secondary: "bg-ivory text-ink-950 hover:bg-white active:scale-[.98]",
  outline: "border border-ink-600 text-ivory hover:border-ivory-400 hover:bg-ink-800",
  ghost: "text-ivory-200 hover:bg-ink-800 hover:text-ivory",
  danger: "border border-clay/50 text-clay hover:bg-clay/10",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(base, variants[variant], sizes[size], className);

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  function Button({ variant = "primary", size = "md", className, ...props }, ref) {
    return <button ref={ref} className={buttonClass(variant, size, className)} {...props} />;
  },
);

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
