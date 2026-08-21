/**
 * SOW 생성 프롬프트의 단일 정의.
 *
 * 이 프롬프트는 `src/app/actions/analyze.ts`와 네 개의 평가 스크립트
 * (`sow_evaluations/{test_live_run,test_model_v2,run_exp7_eval,benchmark_105_dataset}.mjs`)에
 * 각각 복사되어 있었다. 그래서 평가에서 측정한 프롬프트와 실제 화면에서 쓰이는
 * 프롬프트가 같다는 보장이 없었고, 한쪽만 고치면 다른 쪽 측정값은 조용히
 * 의미를 잃었다. 프롬프트를 여기 한 곳에 두고 양쪽이 이것을 가져다 쓴다.
 *
 * 규칙 본문은 CLAUDE.md §5의 "SOW 작성 시 8대 절대 준수 규칙"과 같은 의미를
 * 유지해야 한다. 여기를 고치면 CLAUDE.md와 AGENTS.md도 함께 갱신한다.
 */

export const SOW_PROMPT_VERSION = "2026-08-22.baseline" as const;

export interface SowPromptInput {
  workDetail: string;
  startDate: string;
  endDate: string;
}

export function buildSowPrompt({ workDetail, startDate, endDate }: SowPromptInput): string {
  return `
당신은 매우 엄격한 QA 엔지니어이자 외주 개발 계약(SOW) 전문가입니다.
사용자가 작성한 한국어 '업무 상세 내용'을 분석하여 다음 사항을 추출하고 구성하되, 아래의 [필수 규칙]을 반드시 엄수하십시오.

[필수 규칙 - 절대 누락 금지]
1. 화면 단위 분할 (기술 용어 금지): 마일스톤을 "DB 설계", "API 개발" 등 개발 프로세스나 기술 레이어로 잡지 말고, 비개발 발주자가 브라우저에서 직접 확인할 수 있는 '사용자 화면 및 행동(Feature) 단위'로 나누세요.
2. 마이크로 세분화: 원문에 명시된 기능 범위 내에서 기능을 뭉뚱그리지 말고 핵심 흐름, 제한/마감 처리, 예외 상황을 각각 별도 마일스톤 및 세부 DoD로 분리하세요.
3. 조건별 독립적 분리 (단일 검증 원자화): 여러 조건이나 다단계 상태 전이를 절대 한 문장에 묶지 마세요. 입력 필드 활성화, 입력값 반영, 마스킹 여부 등 사소한 단위도 독립된 1개 DoD로 쪼개세요.
4. 정확한 URL 라우팅 필수 명시: 모든 DoD 문장에는 사용자 행동 위치나 이동 목적지를 \`/login\`, \`/signup\`, \`/orders\`, \`/addresses\`, \`/admin\` 등 **구체적 URL(경로)**로 반드시 시작하거나 포함하세요.
5. 관찰 가능한 상태 변화 묘사 및 명사 단어형 종결 (체언 종결): 모든 문장의 끝은 반드시 '~한다', '~된다' 등의 서술형을 쓰지 말고, 순수 명사 단어('확인', '가능', '완료', '노출', '유지', '이동', '표시', '차단', '제한' 등)로 끝내세요. 또한 눈에 보이는 UI 컴포넌트의 상태 변화(버튼 텍스트 변화, 에러 문구 표시 등)를 명확히 서술하세요.
6. 상태 파이프라인 부정 전이(Negative Path) 및 비인가 접근 차단 구체화: 상태 진행 순서가 있는 경우 "정해진 순서대로만 진행됨" 같은 추상적 서술을 절대 금지합니다. 반드시 "‘A’ 상태에서 허용되지 않은 ‘C’ 상태로 직접 변경 시도 시 변경 거부 및 오류 메시지 표시 확인", "일반 고객 계정으로 \`/admin\` 직접 접근 시 접근 차단 및 권한 오류 안내 표시 확인"과 같이 구체적 출발 상태, 비정상 목표 상태, 거부 및 오류 표시를 명시하세요.
7. 원문 범위 엄격 준수 및 임의 기능 확장 완전 차단 [절대 규칙]: 
   - 모든 마일스톤과 DoD는 반드시 원문 텍스트에 명시된 요구사항에만 1:1로 근거(Grounded)해야 합니다.
   - 일반적인 웹 서비스에 상식적으로 필요해 보이는 기능(예: 비밀번호 재설정, 소셜 로그인, 회원 탈퇴, 수정/삭제, 파일 첨부 등)이라도 원문 텍스트에 직접적인 언급이 없다면 절대로 임의 창작/추가(Hallucination)하지 마세요.
   - 원문에 없는 대칭적/유사 조건(예: 원문에 '이메일 미입력 시 차단'만 있고 '비밀번호 미입력'은 언급이 없는 경우, '비밀번호 미입력'을 임의 추가 금지)을 상상하여 추가하지 마세요.
8. UI 디자인 및 내부 기술 구현 단정 금지 (과잉 명세 방지):
   - 원문에 없는 색상/스타일(예: "붉은색 텍스트", "우측 상단 토스트")을 임의로 단정하지 말고, 브라우저에서 관찰 가능한 사실("오류 메시지 표시", "안내 문구 노출")로만 서술하세요.
   - 내부 상태 코드(401, 403)나 네트워크 세부 스펙(API 호출 횟수 1회 등)을 사용자 DoD 문장에 직접 강제하지 말고, 브라우저 관찰 결과(접근 차단, 로그인 화면 리다이렉트, 중복 제출 차단)로 서술하세요.
9. 비기능/시스템 예외(세션유지, 연타방지, 오류/빈화면)의 원문 종속적 분리:
   - 세션 유지, 연타/중복 클릭 방지, 빈 상태(Empty State), 서버 오류 처리는 **원문 요구사항에 포함되어 있거나 직접 연관된 화면/동작 범위 내에서만** 작성하세요.
   - 원문에 전혀 없는 화면이나 시나리오를 비기능 검증을 이유로 임의 창작하지 마세요.
10. 예산의 차등 분배 (기계적 균등 분배 금지): 마일스톤 예산을 단순 N분의 1로 나누지 마십시오. 난이도 높은 마일스톤에 가중치를 더 부여하세요.
11. 마무리 범위 보존: 원문에 없는 작업(QA, 배포 등)이나 비용은 임의로 추가하지 마세요.

[작성 예시 (Gold Standard DoD 형식 - 문장 구조 참고용)]
- /signup에서 비밀번호 입력 시 마스킹 표시 확인
- /signup에서 가입 정보 입력 후 제출 시 /login으로 이동 확인
- /login에서 비밀번호를 틀리게 입력 후 로그인 시도 시 오류 메시지 표시 확인
- /orders에서 페이지 새로고침 시 로그인 세션 유지 확인
- 픽업 요청 버튼을 빠르게 여러 번 클릭 시 중복 생성 차단 확인
- “픽업 대기” 상태에서 "배송 완료"로 직접 변경 시도 시 변경 거부 및 오류 메시지 표시 확인
- 일반 고객 계정으로 /admin 직접 접근 시 접근 차단 및 안내 표시 확인
[추출 항목]
1. 마일스톤 분할 및 세부 정보: (최소 5개 ~ 최대 10개)
   - period: 전체 기간(${startDate} ~ ${endDate}) 내에서 비율에 맞게 'YY.MM.DD - YY.MM.DD' 배분
   - amount: 전체 예산을 난이도에 맞게 차등 배분 (숫자 단위)
   - dods: 위 규칙에 따른 Playwright E2E 테스트 시나리오(액션+검증) 형태의 완료 조건 배열 (각 마일스톤 당 최소 1개 이상 필수이며, 최대 개수 제한은 없으므로 구체적인 검증이 필요하다면 최대한 상세하게 분리해서 작성하세요. 단일 문장에 여러 조건을 섞지 마세요)

중요: 추출되는 모든 텍스트는 반드시 **한국어**로 작성되어야 합니다.

분석할 업무 상세 텍스트:
"""
${workDetail}
"""
`;
}

/** 프로덕션과 평가가 같은 응답 구조를 쓰도록 스키마도 여기서 정의한다. */
export const SOW_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    milestones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique ID (e.g. m-1, m-2)" },
          code: { type: "string", description: "Milestone code (e.g. M1, M2)" },
          title: { type: "string", description: "Milestone title" },
          period: { type: "string", description: "Duration string (e.g. 24.10.01 - 24.10.31)" },
          amount: { type: "string", description: "Budget allocation for this milestone" },
          dods: {
            type: "array",
            items: {
              type: "string",
              description: "Playwright E2E testable Definition of Done checklist item",
            },
          },
        },
        required: ["id", "code", "title", "period", "amount", "dods"],
        additionalProperties: false,
      },
    },
  },
  required: ["milestones"],
  additionalProperties: false,
} as const;

export const SOW_SYSTEM_MESSAGE = "You are an expert IT Project Manager and System Analyst." as const;
