export type Project = {
  id: string;
  name: string;
  status: string;
  tone: "brand" | "accent" | "success" | "neutral" | "danger" | "warning";
  assignee: string;
  period: string;
  amount: string;
  current: string;
  next: string;
  progress: number;
  total: number;
};

export const PROJECTS: Project[] = [
  {
    id: "project-a",
    name: "고객 포털 MVP",
    status: "준비 중",
    tone: "brand",
    assignee: "김해피",
    period: "2026.08.10 – 10.31",
    amount: "$12,000",
    current: "업무 명세서 작성",
    next: "영문 명세서 검토",
    progress: 1,
    total: 4,
  },
  {
    id: "project-b",
    name: "정산 자동화 백오피스",
    status: "진행 중",
    tone: "accent",
    assignee: "Sarah Lee",
    period: "2026.07.15 – 10.20",
    amount: "$15,000",
    current: "M3 · API 연동 검수",
    next: "실행 결과 확인 · D-6",
    progress: 3,
    total: 6,
  },
  {
    id: "project-c",
    name: "브랜드 사이트 리뉴얼",
    status: "완료",
    tone: "success",
    assignee: "박프리",
    period: "2026.05.01 – 07.31",
    amount: "$8,500",
    current: "최종 승인 완료",
    next: "통합 증빙 보관",
    progress: 3,
    total: 3,
  },
];
