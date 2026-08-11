/**
 * LinKross RAG (Retrieval-Augmented Generation) SOW Translator Engine
 * IT 외주 전문 한-영 용어집(Glossary) 및 템플릿 룰 기반의 RAG 번역 및 SOW 구조화 모듈
 */

import glossaryData from "@/data/rag-glossary.json";

export type GlossaryItem = {
  koreanPattern: RegExp;
  englishTerm: string;
  category: "architecture" | "feature" | "testing" | "documentation" | "general" | "design";
};

// JSON DB 파싱하여 정규식 객체로 변환
export const RAG_GLOSSARY: GlossaryItem[] = glossaryData.map((item) => ({
  koreanPattern: new RegExp(item.pattern, "i"),
  englishTerm: item.english,
  category: item.category as GlossaryItem["category"],
}));

export type MilestoneInput = {
  id: string;
  code: string; // e.g. M1, M2
  title: string; // e.g. 초기 시스템 구현
  period: string; // e.g. 08.10 - 08.20
  amount: string; // e.g. 1,000 USDC
  dods: string[];
};

export type EnglishSOWResult = {
  version: string;
  header: {
    projectName: string;
    client: string;
    vendor: string;
    effectiveDate: string;
  };
  overview: {
    background: string;
    objective: string;
  };
  scopeOfWork: {
    inScope: string[];
    outOfScope: string[];
  };
  timelineAndMilestones: {
    code: string;
    titleEn: string;
    period: string;
    amount: string;
    dodsEn: string[];
  }[];
  acceptanceCriteria: string[];
  definitionOfDone: string[];
  rolesAndResponsibilities: {
    client: string;
    vendor: string;
  };
  retrievedTerms: { kr: string; en: string }[];
  unmappedContent: string[];
};

function sanitizeKoreanEnding(text: string): string {
  let sanitized = text.trim();
  sanitized = sanitized.replace(/([하합]니다|해요|할 것|합시다)\.?$/g, " 진행");
  sanitized = sanitized.replace(/(습니다|입니다|입니다\.|습니다\.)\.?$/g, " 완료");
  sanitized = sanitized.replace(/(주세요|바랍니다|요망)\.?$/g, " 필요");
  sanitized = sanitized.replace(/(만들어|구축해|개발해)(주세요|바랍니다)\.?$/g, " 개발");
  return sanitized.trim();
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseProjectDate(value: string): number | null {
  const match = value.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

function formatProjectDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}.${day}`;
}

function distributeDates(
  startDateStr: string,
  endDateStr: string,
  ratios: number[],
): string[] {
  const emptyPeriods = ratios.map(() => "");
  const start = parseProjectDate(startDateStr);
  const end = parseProjectDate(endDateStr);
  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0);

  if (
    start === null ||
    end === null ||
    start > end ||
    ratios.length === 0 ||
    ratioSum <= 0 ||
    ratios.some((ratio) => ratio <= 0)
  ) {
    return emptyPeriods;
  }

  const totalDays = Math.floor((end - start) / DAY_IN_MS) + 1;
  if (totalDays < ratios.length) return emptyPeriods;

  const periods: string[] = [];
  let periodStartOffset = 0;
  let cumulativeRatio = 0;

  ratios.forEach((ratio, index) => {
    cumulativeRatio += ratio / ratioSum;
    const isLast = index === ratios.length - 1;
    const remainingSegments = ratios.length - index - 1;
    const latestAllowedEndOffset = totalDays - remainingSegments - 1;
    const periodEndOffset = isLast
      ? totalDays - 1
      : Math.max(
          periodStartOffset,
          Math.min(
            latestAllowedEndOffset,
            Math.round(totalDays * cumulativeRatio) - 1,
          ),
        );
    const periodStart = start + periodStartOffset * DAY_IN_MS;
    const periodEnd = start + periodEndOffset * DAY_IN_MS;

    periods.push(
      `${formatProjectDate(periodStart)} - ${formatProjectDate(periodEnd)}`,
    );
    periodStartOffset = periodEndOffset + 1;
  });

  return periods;
}
export type AIAnalysisResult = {
  milestones: MilestoneInput[];
  extractedStartDate?: string;
  extractedEndDate?: string;
  extractedBudget?: string;
};

/**
 * AI 기반 한국어 업무 상세 텍스트 분석 (날짜, 예산, 마일스톤 자동 추출 및 분배)
 */
export function analyzeWorkDetail(workDetail: string, currentStartDate: string, currentEndDate: string): AIAnalysisResult {
  if (!workDetail || !workDetail.trim()) return { milestones: [] };

  const result: AIAnalysisResult = { milestones: [] };

  // 1. Date Extraction (e.g. 2026.10.01)
  const dateRegex = /(20\d{2}[-.\/]\d{1,2}[-.\/]\d{1,2})/g;
  const matches = workDetail.match(dateRegex);
  let sDate = currentStartDate;
  let eDate = currentEndDate;

  if (matches && matches.length >= 2) {
    result.extractedStartDate = matches[0].replace(/[-/]/g, '.');
    result.extractedEndDate = matches[1].replace(/[-/]/g, '.');
    sDate = result.extractedStartDate;
    eDate = result.extractedEndDate;
  } else if (matches && matches.length === 1) {
    result.extractedStartDate = matches[0].replace(/[-/]/g, '.');
    sDate = result.extractedStartDate;
  }

  // 2. Budget Extraction
  const budgetRegex = /([\d,]+)\s*(USDC|\$|달러|원|만원)/i;
  const budgetMatch = workDetail.match(budgetRegex);
  let totalBudgetRaw = 2000;
  let currency = "USDC";

  if (budgetMatch) {
    result.extractedBudget = budgetMatch[0];
    totalBudgetRaw = parseInt(budgetMatch[1].replace(/,/g, ''), 10) || totalBudgetRaw;
    currency = budgetMatch[2].toUpperCase();
    if (currency === "달러") currency = "$";
    if (currency === "원" || currency === "만원") currency = "KRW";
  }

  // 3. Sentences & Logic parsing
  const sentences = workDetail.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
  const coreTaskStr = sentences.join(" ");

  // Decide number of milestones
  let numMilestones = 3;
  if (sentences.length <= 1) {
    numMilestones = 1;
  } else if (sentences.length <= 3) {
    numMilestones = 2;
  }
  
  if (numMilestones === 1) {
    const periods = distributeDates(sDate, eDate, [1]);
    result.milestones.push({
      id: `m-1`,
      code: `M1`,
      title: "단일 프로젝트 완수",
      period: periods[0],
      amount: `${totalBudgetRaw.toLocaleString()} ${currency}`,
      dods: [sanitizeKoreanEnding(sentences[0]) || "요구사항 분석 및 개발 구현 완료"]
    });
  } else if (numMilestones === 2) {
    const periods = distributeDates(sDate, eDate, [0.4, 0.6]);
    const amt1 = Math.floor(totalBudgetRaw * 0.4);
    const amt2 = totalBudgetRaw - amt1;
    result.milestones.push({
      id: `m-1`,
      code: `M1`,
      title: "설계 및 1차 기능 개발",
      period: periods[0],
      amount: `${amt1.toLocaleString()} ${currency}`,
      dods: [sanitizeKoreanEnding(sentences[0]) || "요구사항 분석 및 1차 기능 구현"]
    });
    result.milestones.push({
      id: `m-2`,
      code: `M2`,
      title: "최종 기능 개발 및 검수",
      period: periods[1],
      amount: `${amt2.toLocaleString()} ${currency}`,
      dods: [sanitizeKoreanEnding(sentences[1]) || "기능 최적화 및 오류 수정 완료"]
    });
  } else {
    // 3 milestones
    const periods = distributeDates(sDate, eDate, [0.2, 0.5, 0.3]);
    const amt1 = Math.floor(totalBudgetRaw * 0.2);
    const amt3 = Math.floor(totalBudgetRaw * 0.3);
    const amt2 = totalBudgetRaw - amt1 - amt3;

    result.milestones.push({
      id: `m-1`,
      code: `M1`,
      title: "설계 및 시스템 기초 셋업",
      period: periods[0],
      amount: `${amt1.toLocaleString()} ${currency}`,
      dods: ["프로젝트 개발 환경 및 레포지토리 세팅", "데이터베이스 스키마 및 기본 아키텍처 설계"]
    });

    let m2Title = "주요 기능 개발";
    const m2Dods: string[] = [];
    
    if (coreTaskStr.includes("결제") || coreTaskStr.includes("장바구니")) {
      m2Title = "이커머스 결제 및 핵심 로직 구현";
      m2Dods.push("장바구니 및 상품 관리 시스템 개발", "PG사 연동 및 결제 테스트 통과");
    } else if (coreTaskStr.includes("대시보드") || coreTaskStr.includes("관리자")) {
      m2Title = "어드민 대시보드 및 통계 개발";
      m2Dods.push("관리자 권한 및 통계 차트 구현", "데이터 필터링 및 검색 로직 검증");
    } else if (coreTaskStr.includes("푸시") || coreTaskStr.includes("알림")) {
      m2Title = "알림 시스템 및 백엔드 고도화";
      m2Dods.push("푸시 알림 서버 아키텍처 연동", "앱 클라이언트 수신 테스트 완료");
    } else {
      m2Title = "사용자 요구사항 핵심 기능 구현";
      m2Dods.push(sanitizeKoreanEnding(sentences[0]) || "요구사항 명세에 따른 메인 기능 개발");
      if (sentences.length > 1) m2Dods.push(sanitizeKoreanEnding(sentences[sentences.length - 1]));
    }

    if (m2Dods.length === 0) m2Dods.push("메인 로직 및 API 연동 개발 완료");

    result.milestones.push({
      id: `m-2`,
      code: `M2`,
      title: m2Title,
      period: periods[1],
      amount: `${amt2.toLocaleString()} ${currency}`,
      dods: m2Dods
    });

    result.milestones.push({
      id: `m-3`,
      code: `M3`,
      title: "QA 테스트 및 배포",
      period: periods[2],
      amount: `${amt3.toLocaleString()} ${currency}`,
      dods: ["전체 통합 테스트(E2E) 및 버그 픽스", "클라이언트 최종 검수 및 산출물 인수인계"]
    });
  }

  return result;
}

/**
 * Retrieval Engine: 입력된 한글 요구사항에서 전문 용어 및 DoD 패턴을 검색/추출 (Retrieve)
 */
export function retrieveGlossaryTerms(text: string): { kr: string; en: string }[] {
  const matched: { kr: string; en: string }[] = [];
  
  for (const item of RAG_GLOSSARY) {
    if (item.koreanPattern.test(text)) {
      const match = text.match(item.koreanPattern);
      matched.push({
        kr: match ? match[0] : item.koreanPattern.source,
        en: item.englishTerm,
      });
    }
  }

  // 중복 제거
  const unique = matched.filter((v, i, a) => a.findIndex(t => t.en === v.en) === i);
  return unique;
}

import { translateTextWithMyMemory } from "@/app/actions/translate";

/**
 * 한글 문장을 용어집 맵핑 및 컨텍스트 규칙에 따라 전문 영문 표현으로 변환 (Augmented Generation)
 */
export function translateSentenceWithRAG(koreanText: string): string {
  if (!koreanText || typeof koreanText !== 'string' || !koreanText.trim()) return "N/A";
  
  const matchedTerms: string[] = [];
  
  // 1. 다중 키워드 추출
  for (const item of RAG_GLOSSARY) {
    if (item.koreanPattern.test(koreanText)) {
      matchedTerms.push(item.englishTerm);
    }
  }

  // 2. 키워드 기반 자연스러운 영문 조합 생성
  if (matchedTerms.length > 0) {
    if (matchedTerms.length === 1) {
      // 1개 매칭 시 기본 문장
      return `Implementation and delivery of: ${matchedTerms[0]}`;
    }
    // 2개 이상 매칭 시 And 로 묶어 더 복합적인 문장 생성
    const lastTerm = matchedTerms.pop();
    return `Development, integration, and verification of: ${matchedTerms.join(", ")}, and ${lastTerm}`;
  }

  // 3. 맵핑 안 된 경우 기존 규칙 기반 변환 맵핑
  if (koreanText.includes("로그인") || koreanText.includes("인증")) {
    return "User authentication and authorization workflow implementation";
  }
  if (koreanText.includes("결제") || koreanText.includes("PG")) {
    return "Payment gateway sandbox integration with transactional webhooks";
  }
  if (koreanText.includes("테스트") || koreanText.includes("검수")) {
    return "Automated test execution and verification report generation";
  }
  if (koreanText.includes("문서") || koreanText.includes("인수인계")) {
    return "Complete technical documentation, API specifications, and handover guide";
  }

  return `Implement requirement: ${koreanText.trim()}`;
}

/**
 * 비동기 RAG 번역 함수 (MyMemory API 연동으로 일반 언어까지 번역)
 */
export async function translateSentenceWithRAGAsync(koreanText: string): Promise<string> {
  if (!koreanText || typeof koreanText !== 'string' || !koreanText.trim()) return "N/A";
  
  // 1. 기존 IT 용어집(Glossary) 추출로 RAG 기능 보존
  const matchedTerms: string[] = [];
  for (const item of RAG_GLOSSARY) {
    if (item.koreanPattern.test(koreanText)) {
      matchedTerms.push(item.englishTerm);
    }
  }

  // IT 전문 용어 매칭이 매우 강한 경우 기존 조합 룰 적용
  if (matchedTerms.length >= 2) {
    const lastTerm = matchedTerms.pop();
    return `Development, integration, and verification of: ${matchedTerms.join(", ")}, and ${lastTerm}`;
  }

  // 2. 일반 언어는 인공지능 번역 API (Server Action) 호출
  const apiTranslated = await translateTextWithMyMemory(koreanText);
  
  // 만약 API가 원문 그대로 뱉었다면(오류 등) 기존 Fallback 적용
  if (apiTranslated === koreanText) {
    return translateSentenceWithRAG(koreanText);
  }

  return apiTranslated;
}

/**
 * RAG 파이프라인 메인 실행 함수 (동기형 - 하위 호환)
 */
export function generateSOWWithRAG(
  workDetail: string,
  startDate: string,
  endDate: string,
  milestones: MilestoneInput[]
): EnglishSOWResult {
  // 1. Retrieval Phase: 용어 추출
  const fullText = `${workDetail || ''} ${milestones?.map(m => `${m?.title || ''} ${(m?.dods || []).join(" ")}`).join(" ")}`;
  const retrievedTerms = retrieveGlossaryTerms(fullText || "");

  // 2. Generation Phase: 6대 표준 영문 섹션 생성
  const header = {
    projectName: "LinKross Default Project", // 더미 데이터로 대체됨 (이후 UI 단에서 오버라이드 됨)
    client: "LinKross Client (TBD)",
    vendor: "LinKross Vendor (TBD)",
    effectiveDate: `${startDate} ~ ${endDate}`
  };

  const overview = {
    background: "This project is initiated to build a reliable and scalable software solution leveraging LinKross standard escrow and milestone verification systems.",
    objective: workDetail.trim() ? `Develop and deliver: ${workDetail.trim()}` : "Achieve business goals through MVP deployment and API integration."
  };

  const inScope = [
    "Development of full-stack feature components as defined in milestone deliverables",
    "Integration with GitHub repository for continuous verification and automated testing",
    "Implementation of specified Definition of Done (DoD) criteria for each milestone",
    "Provision of clear deployment instructions and code documentation",
  ];

  if (retrievedTerms.length > 0) {
    retrievedTerms.forEach((term) => {
      inScope.push(`Technical Implementation: ${term.en}`);
    });
  }

  const outOfScope = [
    "Production hosting infrastructure costs beyond designated sandbox environments",
    "Third-party API license fees not explicitly included in budget allocations",
    "Post-handover major architectural changes not covered under agreed milestones",
  ];

  const rolesAndResponsibilities = {
    client: "Provide API keys, design assets (Figma), and review deliverables within 3 business days.",
    vendor: "Execute development, provide weekly status reports, and perform QA testing."
  };

  const timelineAndMilestones = (milestones || []).map((m) => {
    const titleEn = translateSentenceWithRAG(m?.title || "");
    const dodsEn = (m?.dods || []).map((d) => translateSentenceWithRAG(d || ""));

    return {
      code: m.code,
      titleEn,
      period: m.period,
      amount: m.amount,
      dodsEn,
    };
  });

  const acceptanceCriteria = [
    "All specified Definition of Done (DoD) checklist items must achieve automated 'PASS' status in Playwright/isolated sandbox runs.",
    "Every verification milestone must be tied to an immutable GitHub Commit SHA.",
    "No critical blocking security vulnerabilities or uncaught errors during primary user flows.",
    "Both Client PM and Developer must explicitly approve the final evidence package before fund release.",
  ];

  const definitionOfDone = [
    "All code is committed and pushed to the designated GitHub repository branch with clean PR reviews.",
    "Automated build and test pipelines execute cleanly without build-breaking errors.",
    "Client PM successfully verifies feature preview and grants explicit sign-off in LinKross.",
  ];

  return {
    version: "2.0",
    header,
    overview,
    scopeOfWork: {
      inScope,
      outOfScope,
    },
    timelineAndMilestones,
    acceptanceCriteria,
    definitionOfDone,
    rolesAndResponsibilities,
    retrievedTerms,
    unmappedContent: [],
  };
}

/**
 * RAG 파이프라인 메인 실행 함수 (비동기 API 연동형)
 */
export async function generateSOWWithRAGAsync(
  workDetail: string,
  startDate: string,
  endDate: string,
  milestones: MilestoneInput[]
): Promise<EnglishSOWResult> {
  const fullText = `${workDetail || ''} ${milestones?.map(m => `${m?.title || ''} ${(m?.dods || []).join(" ")}`).join(" ")}`;
  const retrievedTerms = retrieveGlossaryTerms(fullText || "");

  const header = {
    projectName: "LinKross Default Project",
    client: "LinKross Client (TBD)",
    vendor: "LinKross Vendor (TBD)",
    effectiveDate: `${startDate} ~ ${endDate}`
  };

  // API를 태워 Background와 Objective도 번역
  const bg = "This project is initiated to build a reliable and scalable software solution leveraging LinKross standard escrow and milestone verification systems.";
  let obj = "Achieve business goals through MVP deployment and API integration.";
  
  const sentences = workDetail.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
  const unmappedContent: string[] = [];
  
  if (workDetail.trim()) {
    const translatedWorkDetail = await translateSentenceWithRAGAsync(sentences[0] || workDetail.trim());
    obj = `Develop and deliver: ${translatedWorkDetail}`;
  }

  // Find unmapped sentences (sentences that don't match our typical templates or glossaries)
  // Simple heuristic: if sentence doesn't contain known IT keywords, mark as unmapped
  sentences.forEach((sentence) => {
    let matched = false;
    for (const item of RAG_GLOSSARY) {
      if (item.koreanPattern.test(sentence)) matched = true;
    }
    if (!matched && sentence.length > 10) {
      // Check if it's budget or date related (already mapped to milestone periods/amounts)
      if (!/(20\d{2}[-.\/])/.test(sentence) && !/([\d,]+)\s*(USDC|\$|달러|원|만원)/i.test(sentence)) {
        unmappedContent.push(sentence);
      }
    }
  });

  const overview = {
    background: bg,
    objective: obj
  };

  const inScope = [
    "Development of full-stack feature components as defined in milestone deliverables",
    "Integration with GitHub repository for continuous verification and automated testing",
    "Implementation of specified Definition of Done (DoD) criteria for each milestone",
    "Provision of clear deployment instructions and code documentation",
  ];

  if (retrievedTerms.length > 0) {
    retrievedTerms.forEach((term) => {
      inScope.push(`Technical Implementation: ${term.en}`);
    });
  }

  const outOfScope = workDetail.includes("제외") || workDetail.includes("Out of Scope") ? [
    "Production hosting infrastructure costs beyond designated sandbox environments",
    "Third-party API license fees not explicitly included in budget allocations",
    "Post-handover major architectural changes not covered under agreed milestones",
  ] : ["TBD"];

  const rolesAndResponsibilities = workDetail.includes("역할") || workDetail.includes("책임") || workDetail.includes("R&R") || workDetail.includes("클라이언트") ? {
    client: "Provide API keys, design assets (Figma), and review deliverables within 3 business days.",
    vendor: "Execute development, provide weekly status reports, and perform QA testing."
  } : {
    client: "TBD",
    vendor: "TBD"
  };

  // Milestone 요소들을 비동기 API 번역으로 전환
  const timelineAndMilestones = await Promise.all(
    (milestones || []).map(async (m) => {
      const titleEn = await translateSentenceWithRAGAsync(m?.title || "");
      const dodsEn = await Promise.all((m?.dods || []).map(async (d) => await translateSentenceWithRAGAsync(d || "")));

      return {
        code: m.code,
        titleEn,
        period: m.period,
        amount: m.amount,
        dodsEn,
      };
    })
  );

  const acceptanceCriteria = workDetail.includes("통과 기준") || workDetail.includes("수용 기준") || workDetail.includes("검수") ? [
    "All specified Definition of Done (DoD) checklist items must achieve automated 'PASS' status in Playwright/isolated sandbox runs.",
    "Every verification milestone must be tied to an immutable GitHub Commit SHA.",
    "No critical blocking security vulnerabilities or uncaught errors during primary user flows.",
    "Both Client PM and Developer must explicitly approve the final evidence package before fund release.",
  ] : ["TBD"];

  const definitionOfDone = [
    "All code is committed and pushed to the designated GitHub repository branch with clean PR reviews.",
    "Automated build and test pipelines execute cleanly without build-breaking errors.",
    "Client PM successfully verifies feature preview and grants explicit sign-off in LinKross.",
  ];

  return {
    version: "2.1",
    header,
    overview,
    scopeOfWork: {
      inScope,
      outOfScope,
    },
    timelineAndMilestones,
    acceptanceCriteria,
    definitionOfDone,
    rolesAndResponsibilities,
    retrievedTerms,
    unmappedContent,
  };
}
