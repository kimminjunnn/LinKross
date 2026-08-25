import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT_DIR = "/Users/mj/Dev/LinKross/.tmp/test-atom-slide/output";
const FINAL_PNG = "/Users/mj/Dev/LinKross/Test_Atom_Slide.png";
const LOGO = "/Users/mj/Dev/LinKross/public/brand/linkross-lockup-light.png";

const C = {
  navy: "#0F172A",
  navy2: "#17233A",
  orange: "#F97316",
  orangeSoft: "#FFF1E8",
  ink: "#111827",
  muted: "#64748B",
  line: "#DCE3EC",
  surface: "#F7F9FC",
  white: "#FFFFFF",
  green: "#20A36A",
};

const font = "Pretendard";
const mono = "Menlo";

function addRect(slide, left, top, width, height, fill, radius = "rounded-xl", line = "none") {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left, top, width, height },
    fill,
    line: line === "none" ? { style: "solid", fill: "none", width: 0 } : line,
    ...(radius ? { borderRadius: radius } : {}),
  });
}

function addText(slide, text, left, top, width, height, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: opts.fontFamily ?? font,
    fontSize: opts.fontSize ?? 20,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    autoFit: "shrinkText",
    wrap: "square",
    insets: opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
  };
  return shape;
}

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const slide = deck.slides.add();
  slide.background.fill = C.white;

  // top brand strip
  const logoBytes = new Uint8Array(await fs.readFile(LOGO));
  slide.images.add({
    blob: logoBytes,
    contentType: "image/png",
    alt: "LinKross",
    fit: "contain",
    position: { left: 54, top: 34, width: 185, height: 43 },
  });
  addText(slide, "서비스 기획자/PM을 위한 AI 활용 데이터 실무 프로젝트 과정", 800, 39, 425, 24, {
    fontSize: 13,
    color: C.muted,
    align: "right",
    valign: "middle",
  });

  // headline
  addText(slide, "CORE FEATURE 02", 64, 105, 190, 22, {
    fontSize: 13,
    bold: true,
    color: C.orange,
    valign: "middle",
  });
  addText(slide, "Test Atom은 검수 동작을 레고처럼 조립합니다", 64, 132, 1060, 56, {
    fontSize: 38,
    bold: true,
    color: C.navy,
    valign: "middle",
  });
  addText(slide, "예시 DoD  ·  /login에서 잘못된 비밀번호 입력 시 오류 메시지 표시 확인", 64, 192, 1090, 30, {
    fontSize: 18,
    color: C.muted,
    valign: "middle",
  });

  // flow background and connector
  addRect(slide, 58, 250, 1164, 332, C.surface, "rounded-2xl", { style: "solid", fill: "#E8EDF4", width: 1 });
  addRect(slide, 298, 409, 67, 3, C.line, null);
  addText(slide, "→", 313, 392, 32, 38, { fontSize: 25, bold: true, color: C.orange, align: "center", valign: "middle" });

  // STEP 1 — approved DoD
  addText(slide, "01  APPROVED DoD", 82, 278, 235, 22, { fontSize: 13, bold: true, color: C.orange });
  addText(slide, "검수 기준", 82, 311, 232, 32, { fontSize: 22, bold: true, color: C.navy });
  addRect(slide, 82, 356, 216, 150, C.white, "rounded-xl", { style: "solid", fill: C.line, width: 1 });
  addRect(slide, 82, 356, 5, 150, C.orange, null);
  addText(slide, "/login", 103, 376, 95, 23, { fontFamily: mono, fontSize: 14, bold: true, color: C.orange, valign: "middle" });
  addText(slide, "잘못된 비밀번호 입력 시\n오류 메시지 표시 확인", 103, 411, 170, 60, { fontSize: 18, bold: true, color: C.ink });
  addText(slide, "사람이 승인한 완료조건", 82, 526, 216, 22, { fontSize: 14, color: C.muted, align: "center" });

  // STEP 2 — atom composition, dominant center panel
  addRect(slide, 365, 274, 832, 291, C.navy, "rounded-2xl");
  addText(slide, "02  TEST ATOM  ·  Playwright가 순서대로 실행", 393, 294, 650, 22, { fontSize: 13, bold: true, color: "#FDBA74" });

  addText(slide, "준비", 393, 325, 287, 20, { fontSize: 13, bold: true, color: "#AFC0D9", align: "center" });
  addText(slide, "검수 행동", 707, 325, 287, 20, { fontSize: 13, bold: true, color: "#AFC0D9", align: "center" });
  addText(slide, "판정", 1021, 325, 148, 20, { fontSize: 13, bold: true, color: "#FDBA74", align: "center" });

  const atoms = [
    ["goto", "화면 이동", "/login 열기"],
    ["fill", "값 입력", "정상 이메일"],
    ["fill", "값 입력", "잘못된 비밀번호"],
    ["click", "버튼 선택", "로그인 시도"],
    ["expect_*", "결과 확인", "오류 안내 표시"],
  ];
  const startX = 393;
  const atomW = 142;
  const gap = 15;
  atoms.forEach(([code, meaning, detail], index) => {
    const x = startX + index * (atomW + gap);
    const isResult = index === 4;
    addRect(slide, x, 352, atomW, 118, isResult ? C.orange : C.navy2, "rounded-lg", {
      style: "solid",
      fill: isResult ? C.orange : "#34445F",
      width: 1,
    });
    addText(slide, code, x + 10, 366, atomW - 20, 24, { fontFamily: mono, fontSize: code === "expect_*" ? 15 : 17, bold: true, color: isResult ? C.white : "#FDBA74", align: "center" });
    addText(slide, meaning, x + 10, 400, atomW - 20, 22, { fontSize: 16, bold: true, color: C.white, align: "center" });
    addText(slide, detail, x + 8, 434, atomW - 16, 23, { fontSize: detail === "잘못된 비밀번호" ? 13 : 14, color: isResult ? C.white : "#C7D3E5", align: "center" });
    if (index < atoms.length - 1) {
      addText(slide, "›", x + atomW + 2, 390, 12, 35, { fontSize: 24, bold: true, color: "#FDBA74", align: "center", valign: "middle" });
    }
  });
  addRect(slide, 393, 487, 776, 57, "#1F2D46", "rounded-lg");
  addText(slide, "ATOM LIBRARY", 408, 497, 115, 18, { fontSize: 12, bold: true, color: "#FDBA74", valign: "middle" });
  addText(slide, "이동", 535, 496, 58, 18, { fontSize: 13, bold: true, color: C.white, align: "center" });
  addText(slide, "goto", 535, 517, 58, 17, { fontFamily: mono, fontSize: 11, color: "#AFC0D9", align: "center" });
  addText(slide, "입력", 610, 496, 88, 18, { fontSize: 13, bold: true, color: C.white, align: "center" });
  addText(slide, "fill · press", 610, 517, 88, 17, { fontFamily: mono, fontSize: 10, color: "#AFC0D9", align: "center" });
  addText(slide, "선택", 714, 496, 128, 18, { fontSize: 13, bold: true, color: C.white, align: "center" });
  addText(slide, "click · select_option", 714, 517, 128, 17, { fontFamily: mono, fontSize: 9, color: "#AFC0D9", align: "center" });
  addText(slide, "화면 확인", 858, 496, 143, 18, { fontSize: 13, bold: true, color: C.white, align: "center" });
  addText(slide, "expect_visible · text", 858, 517, 143, 17, { fontFamily: mono, fontSize: 9, color: "#AFC0D9", align: "center" });
  addText(slide, "상태 확인", 1017, 496, 137, 18, { fontSize: 13, bold: true, color: C.white, align: "center" });
  addText(slide, "path · count · checked", 1017, 517, 137, 17, { fontFamily: mono, fontSize: 9, color: "#AFC0D9", align: "center" });

  // final measured result band
  addRect(slide, 58, 600, 1164, 78, C.navy, "rounded-xl");
  addRect(slide, 58, 600, 7, 78, C.orange, null);
  addText(slide, "FALSE PASS", 88, 616, 118, 18, { fontSize: 13, bold: true, color: "#FDBA74" });
  addText(slide, "16.7%  →  3.8%", 88, 636, 282, 29, { fontSize: 24, bold: true, color: C.white, valign: "middle" });
  addText(slide, "고장난 결과물을 잘못 통과시키는 비율 12.9%p 감소", 411, 615, 710, 27, { fontSize: 20, bold: true, color: C.white });
  addText(slide, "엄격한 Atom 조합 검증을 통과하지 못하면 자동 판정하지 않고 사람 확인으로 전환", 411, 646, 710, 18, { fontSize: 14, color: "#B8C5D8" });

  addText(slide, "새싹 양천 1조 · Passion Five", 64, 684, 280, 18, { fontSize: 11, color: "#94A3B8" });
  addText(slide, "LinKross", 1120, 684, 98, 18, { fontSize: 11, bold: true, color: "#94A3B8", align: "right" });

  slide.speakerNotes.textFrame.setText(
    "[Sources]\n" +
    "- /Users/mj/Dev/LinKross/src/lib/verification-atom-composer.ts (Test Atom 조합 및 엄격 파서)\n" +
    "- /Users/mj/Dev/LinKross/src/lib/verification-runner/playwright-harness.ts (Atom 실행 의미)\n" +
    "- /Users/mj/Dev/LinKross/eval/results/judgment-compiled-2026-08-21T16-48-20.md (False PASS 16.7%)\n" +
    "- /Users/mj/Dev/LinKross/eval/results/judgment-target-names-2026-08-21T18-27-05.md (False PASS 3.8%)\n" +
    "[/Sources]",
  );

  const png = await deck.export({ slide, format: "png", scale: 1.5 });
  await writeBlob(FINAL_PNG, png);
  await writeBlob(`${OUT_DIR}/slide-01.png`, png);
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${OUT_DIR}/slide-01.layout.json`, await layout.text());
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(`${OUT_DIR}/test-atom-slide.pptx`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
