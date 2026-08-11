export interface RiskItem {
  id: string;
  risk: string;
  impact: '상' | '중' | '하';
  mitigation: string;
}

export interface CandidateSubmission {
  assessmentId: string;
  candidateName: string;
  candidateEmail: string;
  questions: string[];
  summary: string;
  executionPlan: string;
  risks: RiskItem[];
  status: 'draft' | 'submitted' | 'expired';
  startedAt: string;
  submittedAt?: string;
  durationSeconds?: number;
}

const SUBMISSION_STORAGE_PREFIX = 'linkross_submission_';

export function getDraftSubmission(assessmentId: string): CandidateSubmission {
  if (typeof window === 'undefined') {
    return createInitialSubmission(assessmentId);
  }

  try {
    const raw = localStorage.getItem(`${SUBMISSION_STORAGE_PREFIX}${assessmentId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read draft submission from localStorage:', err);
  }

  const initial = createInitialSubmission(assessmentId);
  saveDraftSubmission(initial);
  return initial;
}

export function createInitialSubmission(assessmentId: string): CandidateSubmission {
  return {
    assessmentId,
    candidateName: '김개발 (지원자)',
    candidateEmail: 'dev.kim@example.com',
    questions: [
      '인증 처리 방식에서 JWT 토큰의 만료 시간 및 Refresh 토큰 보관 위치(Cookie vs LocalStorage)에 대한 기준이 선호되시는 방식이 있으신가요?',
      'PostgreSQL 데이터베이스의 초동 스키마 마이그레이션 도구로 Prisma ORM을 사용하는 것에 동의하시나요?',
      'PG 결제 연동 테스트 시 법인 테스트 키 또는 카카오페이/토스 페이먼츠 샌드박스 중 어떤 환경을 우선 연동하길 원하시나요?',
    ],
    summary:
      '본 프로젝트는 쇼핑몰 MVP 서비스 구축을 목적으로 하며, 핵심 사용자 흐름인 회원가입/로그인, 상품 목록/상세, 장바구니, 주문 결제 및 관리자 관리 페이지를 8주 이내에 구축하는 것을 목표로 합니다. RESTful API와 PostgreSQL DB를 기반으로 확장 가능하고 깔끔한 아키텍처를 설계하겠습니다.',
    executionPlan:
      '1주차: [환경 구성] Next.js 및 TypeScript 개발 환경 초기화, CI/CD 린트 및 파이프라인 구성\n2주차: [DB] PostgreSQL 데이터베이스 스키마 설계 및 ERD 구성, Prisma 마이그레이션 설정\n3-4주차: [API] 회원 인증(Auth) 및 상품/장바구니 RESTful API 엔드포인트 구현\n5-6주차: [Frontend] 사용자 UI 반응형 마크업 및 장바구니/주문 페이지 State 연동\n7주차: [Testing] 백엔드 단위 테스트 및 E2E 핵심 주문 흐름 시나리오 검증\n8주차: [Deployment] Vercel / AWS 인프라 배포 및 최종 운영 점검',
    risks: [
      {
        id: 'r1',
        risk: 'PG 결제 승인 API 외부 연동 지연 및 웹훅 재시도 실패 가능성',
        impact: '상',
        mitigation: '결제 실패 및 타임아웃 예외 처리 로직 구현, 웹훅 멱등성(Idempotency) 보장 키 설계',
      },
      {
        id: 'r2',
        risk: '동시 다발적 상품 주문 시 재고 차감 동시성(Concurrency) 이슈',
        impact: '중',
        mitigation: 'PostgreSQL 트랜잭션 비관적 락(Pessimistic Locking) 또는 레디스 분산락 기법 적용',
      },
    ],
    status: 'draft',
    startedAt: new Date().toISOString(),
  };
}

export function saveDraftSubmission(submission: CandidateSubmission): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(
      `${SUBMISSION_STORAGE_PREFIX}${submission.assessmentId}`,
      JSON.stringify(submission)
    );
    return true;
  } catch (err) {
    console.error('Failed to save draft submission:', err);
    return false;
  }
}

export function finalizeSubmission(
  submission: CandidateSubmission,
  durationSeconds: number
): CandidateSubmission {
  const finalized: CandidateSubmission = {
    ...submission,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    durationSeconds,
  };
  saveDraftSubmission(finalized);
  return finalized;
}
