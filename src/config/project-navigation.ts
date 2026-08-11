export const projectTabs = [
  { label: "업무 명세서", segment: "sow" },
  { label: "마일스톤 · 검수", segment: "verification" },
  { label: "승인 · 증빙", segment: "evidence" },
] as const;

export type ProjectTabSegment = (typeof projectTabs)[number]["segment"];
