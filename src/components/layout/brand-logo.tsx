import Image from "next/image";
import Link from "next/link";

const logoSizeClassNames = {
  default: "h-7 w-auto",
  large: "h-10 w-auto",
} as const;

export function BrandLogo({
  size = "default",
  ariaLabel = "Go to LinKross home",
  href = "/",
}: {
  size?: keyof typeof logoSizeClassNames;
  ariaLabel?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-control"
      aria-label={ariaLabel}
    >
      <Image
        src="/brand/linkross-lockup-on-light.svg"
        alt=""
        width={312}
        height={70}
        className={logoSizeClassNames[size]}
        loading="eager"
        unoptimized
      />
    </Link>
  );
}
