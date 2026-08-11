export interface PenaltyInfo {
  score: number;
  reason: string;
  appliedAt: string;
}

export interface CandidateDetailedProfile {
  role: string;
  experience: string;
  skills: string[];
  assessmentTime: string;
  evaluatorComments: {
    questions: string;
    summary: string;
    workPlan: string;
    risk: string;
  };
  timeline: string[];
  detailedRisks: Array<{
    risk: string;
    impact: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }>;
  strengths: string[];
  potentialConcern: string;
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
  details?: CandidateDetailedProfile;
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
    submissionTime: '42분 18초',
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
    details: {
      role: 'Full-stack Developer',
      experience: '7 years',
      skills: ['React', 'Node.js', 'PostgreSQL'],
      assessmentTime: '42분 18초',
      evaluatorComments: {
        questions: '프로젝트 범위와 기술 구현에 직접 영향을 주는 적절한 질문입니다.',
        summary: '핵심 기능과 주요 제약사항을 정확하게 파악함.',
        workPlan: '단계별 개발 로드맵이 논리적이고 현실적으로 수립됨.',
        risk: '예상 리스크 및 사전 예외 처리가 명확하게 정의됨.',
      },
      timeline: [
        '환경 구성',
        'DB Schema',
        'Backend API',
        'Frontend',
        'Integration',
        'Testing',
        'Deployment',
      ],
      detailedRisks: [
        {
          risk: '결제 API 연동 지연',
          impact: 'High',
          mitigation: 'Mock API로 선개발',
        },
        {
          risk: 'DB 구조 변경',
          impact: 'Medium',
          mitigation: '초기 Schema 확정',
        },
        {
          risk: '인증 오류',
          impact: 'High',
          mitigation: 'JWT 테스트 시나리오 작성',
        },
      ],
      strengths: [
        '요구사항 분석 능력',
        '실무적인 질문',
        '단계적인 작업 계획',
        '리스크 사전 대응',
      ],
      potentialConcern: '실제 개발 속도는 프로젝트 진행 중 확인 필요',
    },
  },
  {
    id: 'cand_alex_kim',
    name: 'Alex Kim',
    avatar: 'AK',
    rating: 4.2,
    submissionTime: '55분 10초',
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
    details: {
      role: 'Backend Developer',
      experience: '5 years',
      skills: ['Node.js', 'PostgreSQL', 'Docker'],
      assessmentTime: '55분 10초',
      evaluatorComments: {
        questions: '질문 항목 중 일부 미작성 부분이 감점 요인임.',
        summary: '전반적인 백엔드 요구사항 구조를 양호하게 요약함.',
        workPlan: 'API 중심 작업 계획이 잘 수립됨.',
        risk: '인프라 및 서버 가동 리스크에 집중됨.',
      },
      timeline: ['환경 구성', 'DB Schema', 'Backend API', 'Integration', 'Deployment'],
      detailedRisks: [
        {
          risk: '서버 과부하',
          impact: 'Medium',
          mitigation: '로터리 밸런서 설정',
        },
      ],
      strengths: ['백엔드 설계 능력', '구체적인 DB 스키마 지식'],
      potentialConcern: '프론트엔드 연동 부분 확인 필요',
    },
  },
  {
    id: 'cand_david_lee',
    name: 'David Lee',
    avatar: 'DL',
    rating: 3.7,
    submissionTime: '63분 45초',
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
    details: {
      role: 'Frontend Developer',
      experience: '4 years',
      skills: ['React', 'TypeScript', 'Tailwind'],
      assessmentTime: '63분 45초',
      evaluatorComments: {
        questions: '기초적인 내용 질문 위주로 구성됨.',
        summary: '요구사항 단순 요약 제출.',
        workPlan: '프론트엔드 작업에 과도하게 치중됨.',
        risk: '제한시간 초과 및 작성 미흡.',
      },
      timeline: ['환경 구성', 'Frontend', 'Integration'],
      detailedRisks: [
        {
          risk: '일정 지연',
          impact: 'High',
          mitigation: '기능 축소 연동',
        },
      ],
      strengths: ['UI 마크업 디자인 이해도'],
      potentialConcern: '제한시간 준수 및 리스크 대응 능력 부족',
    },
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
