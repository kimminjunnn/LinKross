import Link from "next/link";

export function BrandLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 rounded-control"
      aria-label="LinKross 대시보드로 이동"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-[0.55rem] bg-brand-500 text-sm font-black text-white shadow-sm"
      >
        LK
      </span>
      <span className="text-lg font-black tracking-[-0.035em] text-app-foreground">
        LinKross
      </span>
    </Link>
  );
}
