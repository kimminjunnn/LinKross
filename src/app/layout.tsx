import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "LinKross",
  title: {
    default: "LinKross",
    template: "%s | LinKross",
  },
  description: "비개발 조직을 위한 외주 개발 선정·합의·검증 워크스페이스",
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
