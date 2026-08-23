import type { DodVerificationDesign, VerificationMethod } from "@/lib/backend/contracts";
import type { EnglishSowDraft } from "@/lib/sow-english-prompt";
import type { SowSummaryResult } from "@/lib/sow-summary-prompt";

/**
 * 시연용 SOW 프리셋의 자료 구조.
 *
 * 프리셋은 "발주자가 이 원문을 붙여넣으면 이 완료조건과 이 실행 스펙을 쓴다"는
 * 고정 대응표다. 화면에서 AI 분석을 누를 때마다 LLM이 다시 문장을 짓고 검수
 * 계약을 다시 조합하면, 같은 원문에서도 매번 다른 완료조건이 나오고 시연이
 * 재현되지 않는다. 그래서 확정된 결과를 파일로 얼려 둔다.
 *
 * `testSpec`은 `unknown`으로 둔다. 생성 시점에 이미 엄격 파서를 통과한 값이지만,
 * 파일이 손으로 수정될 수 있으므로 사용하는 쪽에서 다시 파싱해 실행 가능한
 * 스펙만 채택한다(`loadSowPresets`).
 */
export interface SowPresetDod {
  /** 화면과 검수 계약에 그대로 저장되는 완료조건 문장. */
  description: string;
  verificationMethod: VerificationMethod;
  /** `completion_criteria.test_spec`에 저장할 실행 스펙. 검수 설계는 저장 시점에 덧붙는다. */
  testSpec: unknown;
  design: DodVerificationDesign;
}

export interface SowPresetMilestone {
  code: string;
  title: string;
  /** 프리셋 확정 당시의 기간. 실제 프로젝트 기간이 있으면 같은 비율로 다시 나눈다. */
  period: string;
  /** 프리셋 확정 당시의 금액. 실제 예산이 있으면 같은 비율로 다시 나눈다. */
  amount: string;
  dods: SowPresetDod[];
}

export interface SowPreset {
  id: string;
  label: string;
  /** 이 프리셋을 고르는 기준이 되는 발주자 원문. */
  sourceText: string;
  /**
   * 확정해 둔 `sourceText`의 영문. SOW 승인 화면의 `Korean Work Details` 절이
   * 이것을 꺼내 쓴다. 프리랜서가 문서를 열 때마다 8천 자 원문을 다시 번역하지
   * 않기 위한 것이다. 없으면 평소의 번역 경로로 간다.
   */
  sourceTextEn?: string;
  /** 프리셋을 만든 근거. 어느 실행 결과에서 확정했는지 남긴다. */
  provenance: string;
  milestones: SowPresetMilestone[];
  /**
   * 확정해 둔 영문 SOW 초안. "AI 영문 명세 생성" 버튼이 이것을 꺼내 쓴다.
   *
   * 기간·금액·프로젝트명·용어집은 여기 없다. 실행 시점 값이거나 결정적으로
   * 계산되는 값이라 얼려 두면 오히려 틀린 값을 보여주게 된다.
   * 없으면 평소의 LLM 경로로 간다.
   */
  englishSow?: EnglishSowDraft;
  /** 승인 화면 요약. 없으면 평소의 LLM 경로로 간다. */
  sowSummary?: SowSummaryResult;
}

export interface SowPresetMatch {
  preset: SowPreset;
  /** 0~1. `SOW_PRESET_MATCH_THRESHOLD` 이상일 때만 채택한다. */
  similarity: number;
}
