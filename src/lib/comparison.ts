export interface PenaltyInfo {
  score: number;
  reason: string;
  appliedAt: string;
}

export interface CandidateComparisonItem {
  id: string;
  name: string;
  avatar: string;
  rating: number; // e.g. 4.8
  submissionTime: string; // e.g. "42분"
  scores: {
    requirements: number; // 요구사항 이해
    questions: number; // 질문
    workPlan: number; // 작업 계획
    risk: number; // 리스크 대응
  };
  baseScore: number;
  penalty: PenaltyInfo | null;
  finalScore: number;
  isRecommended?: boolean;
  status: 'submitted' | 'selected' | 'rejected';
}

export interface AiAnalysis {
  summary: string;
  strengths: string[];
  potentialConcern: string;
  disclaimer: string;
}

const STORAGE_KEY_SELECTED = 'linkross_selected_candidate_id';

export const INITIAL_CANDIDATES: CandidateComparisonItem[] = [
  {
    id: 'cand_gupta_haep',
    name: 'Gupta Haep',
    avatar: 'GH',
    rating: 4.8,
    submissionTime: '42분',
    scores: {
      requirements: 95,
      questions: 92,
      workPlan: 90,
      risk: 88,
    },
    baseScore: 91.3,
    penalty: null,
    finalScore: 91.3,
    isRecommended: true,
    status: 'submitted',
  },
  {
    id: 'cand_alex_kim',
    name: 'Alex Kim',
    avatar: 'AK',
    rating: 4.2,
    submissionTime: '55분',
    scores: {
      requirements: 82,
      questions: 76,
      workPlan: 85,
      risk: 72,
    },
    baseScore: 78.8,
    penalty: {
      score: -5,
      reason: '필수 질문 항목 일부 미작성',
      appliedAt: '2026-08-11 11:20:00',
    },
    finalScore: 73.8,
    isRecommended: false,
    status: 'submitted',
  },
  {
    id: 'cand_david_lee',
    name: 'David Lee',
    avatar: 'DL',
    rating: 3.7,
    submissionTime: '63분',
    scores: {
      requirements: 71,
      questions: 68,
      workPlan: 70,
      risk: 65,
    },
    baseScore: 68.5,
    penalty: {
      score: -10,
      reason: '제출 제한시간 초과',
      appliedAt: '2026-08-11 11:35:00',
    },
    finalScore: 58.5,
    isRecommended: false,
    status: 'submitted',
  },
];

export const MOCK_AI_ANALYSIS: AiAnalysis = {
  summary:
    'Gupta Haep은 요구사항의 핵심 기능과 기술적 제약사항을 정확하게 파악했으며, 데이터베이스 구조와 인증 방식에 대한 구체적인 확인 질문을 제시했습니다.',
  strengths: [
    '요구사항 이해도 우수 (95점)',
    '구체적인 질문 및 기술적 검증 질문 제시',
    '체계적인 주차별 작업 계획 수립',
  ],
  potentialConcern: 'Deployment strategy requires additional confirmation (배포 전략 관련 추가 확인 필요)',
  disclaimer: 'AI 평가 보조 결과이며 최종 선정은 발주자가 결정합니다.',
};

export function getSelectedCandidateId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_SELECTED);
  } catch (e) {
    return null;
  }
}

export function saveSelectedCandidateId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED, id);
  } catch (e) {
    console.error('Failed to save selected candidate ID:', e);
  }
}
