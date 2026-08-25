import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const BUILD = "/Users/mj/Dev/LinKross/.tmp/system-architecture-slide";
const OUT = `${BUILD}/output`;
const FINAL_PNG = "/Users/mj/Dev/LinKross/System_Architecture_Slide.png";
const LOGO = "/Users/mj/Dev/LinKross/public/brand/linkross-lockup-light.png";

const C = {
  navy: "#0F172A",
  navy2: "#18243A",
  navy3: "#22324E",
  orange: "#F97316",
  orangeSoft: "#FFF1E8",
  white: "#FFFFFF",
  ink: "#111827",
  muted: "#64748B",
  line: "#D9E2EE",
  surface: "#F6F8FC",
  green: "#27A86F",
};

const font = "Pretendard";
const mono = "Menlo";

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

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const slide = deck.slides.add();
  slide.background.fill = C.white;

  const logo = new Uint8Array(await fs.readFile(LOGO));
  slide.images.add({
    blob: logo,
    contentType: "image/png",
    alt: "LinKross",
    fit: "contain",
    position: { left: 54, top: 31, width: 185, height: 43 },
  });
  textBox(slide, "서비스 기획자/PM을 위한 AI 활용 데이터 실무 프로젝트 과정", 800, 38, 425, 24, {
    fontSize: 13,
    color: C.muted,
    align: "right",
    valign: "middle",
  });

  textBox(slide, "SYSTEM ARCHITECTURE", 64, 93, 240, 22, {
    fontSize: 13,
    bold: true,
    color: C.orange,
    valign: "middle",
  });
  textBox(slide, "요구사항부터 검수·지급 증빙까지 하나의 시스템으로 연결했습니다", 64, 120, 1135, 50, {
    fontSize: 35,
    bold: true,
    color: C.navy,
    valign: "middle",
  });

  // Product journey connector — drawn before nodes.
  rect(slide, 155, 217, 948, 3, C.line, null);
  const journey = [
    ["01", "프로젝트 등록"],
    ["02", "SOW · DoD 생성"],
    ["03", "PR · SHA 제출"],
    ["04", "격리 자동 검수"],
    ["05", "지급 · 통합 증빙"],
  ];
  journey.forEach(([number, label], index) => {
    const center = 150 + index * 244;
    rect(slide, center - 19, 198, 38, 38, index === 4 ? C.orange : C.navy, "rounded-full");
    textBox(slide, number, center - 14, 206, 28, 20, { fontFamily: mono, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle" });
    textBox(slide, label, center - 88, 242, 176, 22, { fontSize: 15, bold: true, color: C.ink, align: "center" });
    if (index < journey.length - 1) {
      textBox(slide, "›", center + 101, 199, 22, 35, { fontSize: 25, bold: true, color: C.orange, align: "center", valign: "middle" });
    }
  });

  // Architecture canvas.
  rect(slide, 64, 286, 1152, 294, C.navy, "rounded-2xl");
  textBox(slide, "LinKross FULL-STACK APPLICATION", 91, 304, 450, 24, { fontSize: 14, bold: true, color: "#FDBA74" });
  textBox(slide, "Next.js 16 · React 19 · TypeScript · Tailwind CSS", 747, 304, 440, 24, { fontSize: 14, color: "#B8C5D8", align: "right" });

  // Backend spine connects every product module.
  rect(slide, 91, 339, 1098, 47, C.orange, "rounded-lg");
  textBox(slide, "BACKEND / API", 111, 351, 170, 24, { fontSize: 17, bold: true, color: C.white, valign: "middle" });
  textBox(slide, "Next.js Server Actions · Route Handlers · 사용자 권한 · 문서 버전 · 상태 전이", 291, 351, 873, 24, { fontSize: 16, bold: true, color: C.white, align: "right", valign: "middle" });

  // Vertical separators first.
  [363, 637, 911].forEach((x) => rect(slide, x, 412, 1, 132, "#42506A", null));

  const modules = [
    {
      x: 91,
      label: "AI 명세 엔진",
      purpose: "업무 명세를 합의 가능한 기준으로 변환",
      stack: "Google Gemini\nPreset · RAG 용어집 · Test Atom",
    },
    {
      x: 377,
      label: "프로젝트 데이터",
      purpose: "권한과 모든 변경 이력을 보존",
      stack: "Supabase Auth · PostgreSQL\nRLS · Private Storage",
    },
    {
      x: 651,
      label: "실행형 검수",
      purpose: "고정된 제출물을 격리 환경에서 실행",
      stack: "GitHub App · Commit SHA\nVercel Sandbox · Playwright",
    },
    {
      x: 925,
      label: "지급 · 증빙",
      purpose: "송금 기록을 프로젝트 이력에 연결",
      stack: "MetaMask · ethers.js\nBase Sepolia · Testnet USDC",
    },
  ];

  modules.forEach((module, index) => {
    textBox(slide, `0${index + 1}`, module.x, 410, 28, 22, { fontFamily: mono, fontSize: 13, bold: true, color: C.orange });
    textBox(slide, module.label, module.x + 37, 407, 215, 28, { fontSize: 20, bold: true, color: C.white });
    textBox(slide, module.purpose, module.x, 448, 246, 40, { fontSize: 15, color: "#C6D1E2" });
    textBox(slide, module.stack, module.x, 500, 246, 45, { fontSize: 15, bold: true, color: index === 3 ? "#FDBA74" : C.white });
  });

  // Payment boundary note inside the architecture canvas.
  rect(slide, 925, 550, 264, 20, C.navy3, "rounded-lg");
  textBox(slide, "테스트넷 시연 · 실제 가치 없음 · 에스크로 아님", 935, 552, 244, 16, { fontSize: 11, color: "#B8C5D8", align: "center", valign: "middle" });

  // End-to-end evidence takeaway.
  rect(slide, 64, 600, 1152, 68, C.surface, "rounded-xl", { style: "solid", fill: C.line, width: 1 });
  rect(slide, 64, 600, 7, 68, C.orange, null);
  textBox(slide, "BACKEND가 연결하는 하나의 이력", 90, 614, 285, 24, { fontSize: 17, bold: true, color: C.orange, valign: "middle" });
  textBox(slide, "요구사항 버전  →  양측 SOW 승인  →  Commit SHA  →  검수 증거  →  지급 기록·통합 증빙", 383, 613, 797, 25, { fontSize: 17, bold: true, color: C.navy, align: "right", valign: "middle" });
  textBox(slide, "온체인 지급은 서버가 USDC 컨트랙트·수신 주소·금액을 다시 검증한 뒤 증빙에 반영", 383, 642, 797, 17, { fontSize: 13, color: C.muted, align: "right" });

  textBox(slide, "새싹 양천 1조 · Passion Five", 64, 688, 280, 18, { fontSize: 11, color: "#94A3B8" });
  textBox(slide, "LinKross", 1118, 688, 98, 18, { fontSize: 11, bold: true, color: "#94A3B8", align: "right" });

  slide.speakerNotes.textFrame.setText(
    "[Sources]\n" +
    "- /Users/mj/Dev/LinKross/package.json (Next.js, React, TypeScript, Supabase, Vercel Sandbox, ethers, Playwright)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/llm/gemini.ts (Google Gemini 명세 엔진)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/backend (Server-side domain logic)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/github/app.ts (GitHub App and Commit SHA archive)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/verification-runner/vercel-sandbox.ts (isolated verification)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/onchain-payment.ts (Base Sepolia USDC transfer verification)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/backend/finance.ts (invoice, payment, evidence bundle)\n" +
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
