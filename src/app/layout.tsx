import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "LinKross",
  description: "비개발 조직을 위한 해외 외주 개발 검증 플랫폼",
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
