/**
 * 프리셋 SOW 채점기.
 *
 * 골든셋(`eval/presets/<preset>.expected.json`)의 검증 원자가 생성된 DoD에
 * 실제로 나타났는지 세고, 원자화 실패와 원문 밖 창작을 함께 잡는다.
 *
 *   커버   원자 하나 이상과 맞은 원자의 비율. 누락을 잡는다.
 *   뭉침   원자 두 개 이상과 맞은 DoD. "'전체','대여 가능','대여중' 필터 확인"
 *          처럼 여러 조건을 한 문장에 넣은 경우다(8대 규칙 2번 위반).
 *   창작   어떤 원자와도 맞지 않은 DoD. 원문에 없는 것을 만들어 냈을 후보다.
 *   배치   맞은 DoD가 골든셋이 지정한 마일스톤에 들어 있는지. PR 매핑이 걸린다.
 *
 * 사용법: node eval/score-preset.mjs <골든셋> <생성결과.json> [...]
 */
import fs from "node:fs";

const norm = (s) =>
  s.replace(/[''‘’`]/g, "'").replace(/[""“”]/g, '"').replace(/\s+/g, " ").trim();

function matches(atom, dod) {
  const text = norm(dod);
  for (const token of atom.must ?? []) if (!text.includes(norm(token))) return false;
  const groups = [...(atom.anyOf ?? []), ...(atom.anyOfAll ?? [])];
  for (const group of groups) if (!group.some((t) => text.includes(norm(t)))) return false;
  return true;
}

const [, , goldPath, ...resultPaths] = process.argv;
const gold = JSON.parse(fs.readFileSync(goldPath, "utf8"));

for (const resultPath of resultPaths) {
  const raw = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  const milestones = raw.results?.[0]?.milestones ?? raw.milestones;
  const flat = milestones.flatMap((m) => m.dods.map((d) => ({ code: m.code, text: d })));

  const hitsPerAtom = new Map();
  const hitsPerDod = flat.map(() => []);
  for (const atom of gold.atoms) {
    const hits = [];
    flat.forEach((d, i) => {
      if (matches(atom, d.text)) {
        hits.push(i);
        hitsPerDod[i].push(atom.id);
      }
    });
    hitsPerAtom.set(atom.id, hits);
  }

  const missing = gold.atoms.filter((a) => hitsPerAtom.get(a.id).length === 0);
  const fused = hitsPerDod.map((ids, i) => ({ i, ids })).filter((x) => x.ids.length >= 2);
  const invented = hitsPerDod.map((ids, i) => ({ i, ids })).filter((x) => x.ids.length === 0);
  const misplaced = gold.atoms
    .filter((a) => hitsPerAtom.get(a.id).length > 0)
    .filter((a) => !hitsPerAtom.get(a.id).some((i) => flat[i].code === a.milestone));

  const covered = gold.atoms.length - missing.length;
  // URL 대신 화면 이름으로만 지칭한 DoD. 검수 계약이 goto 경로를 정하지 못한다.
  const aliases = gold.screenAliases ?? [];
  const noUrl = flat.filter(
    (d) => !/\/[a-z][a-z0-9_-]*/i.test(d.text) || aliases.some((a) => norm(d.text).includes(norm(a))),
  );
  const amounts = milestones.map((m) => String(m.amount).replace(/[^\d]/g, ""));
  const uniformBudget = new Set(amounts).size === 1;

  console.log(`\n### ${resultPath}`);
  console.log(`마일스톤 ${milestones.length}개 · DoD ${flat.length}개 · 예산 ${amounts.join(" / ")}${uniformBudget ? "  ⚠ 균등 분배" : ""}`);
  console.log(`커버 ${covered}/${gold.atoms.length} (${((covered / gold.atoms.length) * 100).toFixed(0)}%) · 뭉침 ${fused.length} · 창작 ${invented.length} · 배치오류 ${misplaced.length} · 화면이름 ${noUrl.length}`);
  if (noUrl.length) for (const d of noUrl) console.log(`    ⛔ URL 대신 화면이름 · ${d.code} · ${d.text}`);

  if (missing.length) {
    console.log(`\n  누락 (${missing.length})`);
    for (const a of missing) console.log(`    ✗ ${a.id} [${a.milestone}] ${a.desc}`);
  }
  if (fused.length) {
    console.log(`\n  뭉침 (${fused.length})`);
    for (const f of fused) console.log(`    ⚠ [${f.ids.join("+")}] ${flat[f.i].code} · ${flat[f.i].text}`);
  }
  if (misplaced.length) {
    console.log(`\n  배치오류 (${misplaced.length})`);
    for (const a of misplaced) {
      const where = hitsPerAtom.get(a.id).map((i) => flat[i].code).join(",");
      console.log(`    ⚠ ${a.id} 기대 ${a.milestone} → 실제 ${where} · ${a.desc}`);
    }
  }
  if (invented.length) {
    console.log(`\n  창작 후보 (${invented.length})`);
    for (const x of invented) console.log(`    ? ${flat[x.i].code} · ${flat[x.i].text}`);
  }
}
