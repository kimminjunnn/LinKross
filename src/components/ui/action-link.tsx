import Link from "next/link";

type ActionLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function ActionLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-bold transition-colors ${
        variant === "primary"
          ? "bg-brand-500 text-white hover:bg-brand-600"
          : "border border-app-border-strong bg-app-surface text-app-foreground hover:border-brand-300 hover:text-brand-700"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
