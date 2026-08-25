import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const BUILD = "/Users/mj/Dev/LinKross/.tmp/system-architecture-slide";
const OUT = `${BUILD}/output`;
const FINAL_PNG = "/Users/mj/Dev/LinKross/System_Architecture_Slide.png";
const LOGO = "/Users/mj/Dev/LinKross/public/brand/linkross-lockup-light.png";

const ASSETS = {
  next: "/Users/mj/Dev/LinKross/public/presentation/backend-vibe/assets/logos/nextjs.svg",
  typescript: "/Users/mj/Dev/LinKross/public/presentation/backend-vibe/assets/logos/typescript.svg",
  supabase: "/Users/mj/Dev/LinKross/public/presentation/backend-vibe/assets/logos/supabase.svg",
  gemini: `${BUILD}/googlegemini.svg`,
  postgres: `${BUILD}/postgresql.svg`,
  github: `${BUILD}/github.svg`,
  vercel: `${BUILD}/vercel.svg`,
  playwright: "/Users/mj/Dev/LinKross/node_modules/playwright-core/lib/vite/recorder/playwright-logo.svg",
  base: `${BUILD}/base.svg`,
};

const C = {
  orange: "#F97316",
  orangeSoft: "#FFF4EB",
  ink: "#18181B",
  muted: "#6B7280",
  line: "#E5E7EB",
  warm: "#F8F7F4",
  white: "#FFFFFF",
};

const font = "Pretendard";

function rect(slide, left, top, width, height, fill, radius = "rounded-xl", line = null) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left, top, width, height },
    fill,
    line: line ?? { style: "solid", fill: "none", width: 0 },
    ...(radius ? { borderRadius: radius } : {}),
  });
}

function textBox(slide, text, left, top, width, height, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: options.fontFamily ?? font,
    fontSize: options.fontSize ?? 16,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    alignment: options.align ?? "left",
    verticalAlignment: options.valign ?? "top",
    autoFit: "shrinkText",
    wrap: "square",
    insets: options.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
  };
  return shape;
}

async function addIcon(slide, path, left, top, size, alt) {
  const bytes = new Uint8Array(await fs.readFile(path));
  slide.images.add({
    blob: bytes,
    contentType: path.endsWith(".svg") ? "image/svg+xml" : "image/png",
    alt,
    fit: "contain",
    position: { left, top, width: size, height: size },
  });
}

async function iconItem(slide, icon, name, left, top, options = {}) {
  rect(slide, left, top, 76, 76, options.fill ?? C.white, "rounded-xl", {
    style: "solid",
    fill: options.line ?? C.line,
    width: 1,
  });
  await addIcon(slide, icon, left + 14, top + 14, 48, name);
  textBox(slide, name, left - 10, top + 87, 96, 24, {
    fontSize: 15,
    bold: true,
    color: C.ink,
    align: "center",
  });
}

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const slide = deck.slides.add();
  slide.background.fill = C.white;

  const logo = new Uint8Array(await fs.readFile(LOGO));
  slide.images.add({ blob: logo, contentType: "image/png", alt: "LinKross", fit: "contain", position: { left: 54, top: 31, width: 185, height: 43 } });
  textBox(slide, "서비스 기획자/PM을 위한 AI 활용 데이터 실무 프로젝트 과정", 800, 38, 425, 24, { fontSize: 13, color: C.muted, align: "right", valign: "middle" });

  textBox(slide, "TECH STACK", 64, 100, 150, 22, { fontSize: 13, bold: true, color: C.orange });
  textBox(slide, "LinKross를 구성한 기술 스택입니다", 64, 128, 900, 50, { fontSize: 37, bold: true, color: C.ink, valign: "middle" });
  textBox(slide, "Next.js 풀스택을 중심으로 AI 명세, 실행형 검수, 테스트넷 지급을 연결했습니다.", 64, 181, 1050, 28, { fontSize: 18, color: C.muted, valign: "middle" });

  [351, 653, 955].forEach((x) => rect(slide, x, 248, 1, 305, C.line, null));

  textBox(slide, "01", 64, 246, 30, 22, { fontSize: 13, bold: true, color: C.orange });
  textBox(slide, "APPLICATION", 98, 244, 210, 24, { fontSize: 18, bold: true, color: C.ink });
  textBox(slide, "화면과 백엔드를 하나의 앱으로 구성", 64, 278, 250, 24, { fontSize: 15, color: C.muted });
  await iconItem(slide, ASSETS.next, "Next.js", 91, 331);
  await iconItem(slide, ASSETS.typescript, "TypeScript", 207, 331);
  textBox(slide, "Server Actions · Route Handlers", 64, 465, 250, 25, { fontSize: 15, bold: true, color: C.ink, align: "center" });
  textBox(slide, "Frontend + Backend", 64, 498, 250, 22, { fontSize: 14, color: C.orange, align: "center" });

  textBox(slide, "02", 379, 246, 30, 22, { fontSize: 13, bold: true, color: C.orange });
  textBox(slide, "AI & DATA", 413, 244, 210, 24, { fontSize: 18, bold: true, color: C.ink });
  textBox(slide, "명세를 만들고 프로젝트 이력을 보존", 379, 278, 250, 24, { fontSize: 15, color: C.muted });
  await iconItem(slide, ASSETS.gemini, "Gemini", 386, 331, { fill: "#FBF8FF" });
  await iconItem(slide, ASSETS.supabase, "Supabase", 478, 331, { fill: "#F3FBF7" });
  await iconItem(slide, ASSETS.postgres, "PostgreSQL", 570, 331, { fill: "#F5F8FC" });
  textBox(slide, "Preset · RAG · Auth · RLS · Storage", 379, 465, 250, 25, { fontSize: 14, bold: true, color: C.ink, align: "center" });
  textBox(slide, "명세 생성 + 데이터 계층", 379, 498, 250, 22, { fontSize: 14, color: C.orange, align: "center" });

  textBox(slide, "03", 681, 246, 30, 22, { fontSize: 13, bold: true, color: C.orange });
  textBox(slide, "VERIFICATION", 715, 244, 210, 24, { fontSize: 18, bold: true, color: C.ink });
  textBox(slide, "제출 커밋을 실제로 설치하고 실행", 681, 278, 250, 24, { fontSize: 15, color: C.muted });
  await iconItem(slide, ASSETS.github, "GitHub", 688, 331);
  await iconItem(slide, ASSETS.vercel, "Vercel", 780, 331);
  await iconItem(slide, ASSETS.playwright, "Playwright", 872, 331, { fill: "#F6FBF7" });
  textBox(slide, "Commit SHA · Sandbox · Test Atom", 681, 465, 250, 25, { fontSize: 14, bold: true, color: C.ink, align: "center" });
  textBox(slide, "격리 실행 + 검수 증거", 681, 498, 250, 22, { fontSize: 14, color: C.orange, align: "center" });

  textBox(slide, "04", 983, 246, 30, 22, { fontSize: 13, bold: true, color: C.orange });
  textBox(slide, "PAYMENT & EVIDENCE", 1017, 244, 205, 24, { fontSize: 18, bold: true, color: C.ink });
  textBox(slide, "테스트넷 송금 결과를 서버에서 검증", 983, 278, 240, 24, { fontSize: 15, color: C.muted });
  await iconItem(slide, ASSETS.base, "Base Sepolia", 1002, 331, { fill: "#F4F7FF" });
  rect(slide, 1110, 331, 76, 76, C.orangeSoft, "rounded-xl", { style: "solid", fill: "#FED7AA", width: 1 });
  textBox(slide, "USDC", 1120, 350, 56, 37, { fontSize: 20, bold: true, color: C.orange, align: "center", valign: "middle" });
  textBox(slide, "Testnet USDC", 1100, 418, 96, 24, { fontSize: 15, bold: true, color: C.ink, align: "center" });
  textBox(slide, "ethers.js · MetaMask · 온체인 검증", 983, 465, 240, 25, { fontSize: 14, bold: true, color: C.ink, align: "center" });
  textBox(slide, "지급 기록 + 통합 증빙", 983, 498, 240, 22, { fontSize: 14, color: C.orange, align: "center" });

  rect(slide, 64, 575, 1152, 80, C.warm, "rounded-xl", { style: "solid", fill: C.line, width: 1 });
  rect(slide, 64, 575, 7, 80, C.orange, null);
  textBox(slide, "하나의 백엔드가 전체 이력을 연결합니다", 93, 592, 395, 28, { fontSize: 22, bold: true, color: C.ink, valign: "middle" });
  textBox(slide, "요구사항 버전  →  SOW 승인  →  Commit SHA  →  검수 결과  →  지급·통합 증빙", 506, 592, 674, 27, { fontSize: 17, bold: true, color: C.ink, align: "right", valign: "middle" });
  textBox(slide, "Base Sepolia 테스트넷 시연 · 실제 가치 없음 · LinKross가 자금을 보관하는 에스크로 구조 아님", 506, 625, 674, 18, { fontSize: 12, color: C.muted, align: "right" });

  textBox(slide, "새싹 양천 1조 · Passion Five", 64, 688, 280, 18, { fontSize: 11, color: "#9CA3AF" });
  textBox(slide, "LinKross", 1118, 688, 98, 18, { fontSize: 11, bold: true, color: "#9CA3AF", align: "right" });

  slide.speakerNotes.textFrame.setText(
    "[Sources]\n" +
    "- /Users/mj/Dev/LinKross/package.json (technology dependencies)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/backend and src/app/actions (Next.js server layer)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/verification-runner/vercel-sandbox.ts (verification stack)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/onchain-payment.ts (Base Sepolia USDC verification)\n" +
    "- https://simpleicons.org/ (Gemini, PostgreSQL, GitHub, Vercel icons)\n" +
    "- https://github.com/base/brand-kit (official Base logo)\n" +
    "- /Users/mj/Dev/LinKross/public/presentation/backend-vibe/assets/logos (Next.js, TypeScript, Supabase icons)\n" +
    "- /Users/mj/Dev/LinKross/node_modules/playwright-core/lib/vite/recorder/playwright-logo.svg (Playwright icon)\n" +
    "[/Sources]",
  );

  const png = await deck.export({ slide, format: "png", scale: 1.5 });
  await writeBlob(FINAL_PNG, png);
  await writeBlob(`${OUT}/slide-01.png`, png);
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${OUT}/slide-01.layout.json`, await layout.text());
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(`${OUT}/system-architecture-slide.pptx`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
