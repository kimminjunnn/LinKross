export interface EvaluationCriteria {
  requirements: number; // 요구사항 이해
  questions: number; // 확인 질문
  workPlan: number; // 실행 계획
  riskMitigation: number; // 예상 리스크 및 대응방안
}

export interface UploadedFile {
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'completed' | 'error';
  uploadedAt: string;
}

export interface TalentAssessment {
  id: string;
  projectName: string;
  projectType: string;
  budget: string;
  devPeriod: string;
  document: UploadedFile | null;
  timeLimit: string; // e.g. "60분"
  requiredResponses: {
    questions: boolean; // 확인 질문
    summary: boolean; // 요구사항 이해 요약
    plan: boolean; // 실행 계획
    risk: boolean; // 예상 리스크 및 대응방안
  };
  evaluationCriteria: EvaluationCriteria;
  status: 'active' | 'draft' | 'closed';
  createdAt: string;
  applicantCount: number;
}

const STORAGE_KEY = 'linkross_talent_assessments';

export const INITIAL_ASSESSMENTS: TalentAssessment[] = [
  {
    id: 'ast_sample_01',
    projectName: '쇼핑몰 MVP 개발',
    projectType: 'Web Application',
    budget: '$5,000',
    devPeriod: '8주',
    document: {
      name: '프로젝트_쇼핑몰_MVP_요구사항.pdf',
      size: '2.4 MB',
      type: 'application/pdf',
      status: 'completed',
      uploadedAt: '2026-08-11',
    },
    timeLimit: '60분',
    requiredResponses: {
      questions: true,
      summary: true,
      plan: true,
      risk: true,
    },
    evaluationCriteria: {
      requirements: 25,
      questions: 25,
      workPlan: 25,
      riskMitigation: 25,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    applicantCount: 3,
  },
];

export function getAssessments(): TalentAssessment[] {
  if (typeof window === 'undefined') return INITIAL_ASSESSMENTS;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASSESSMENTS));
      return INITIAL_ASSESSMENTS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read assessments from localStorage:', error);
    return INITIAL_ASSESSMENTS;
  }
}

export function getAssessmentById(id: string): TalentAssessment | null {
  const list = getAssessments();
  return list.find((item) => item.id === id) || null;
}

export function saveAssessment(assessment: TalentAssessment): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAssessments();
    const existingIndex = list.findIndex((item) => item.id === assessment.id);
    if (existingIndex >= 0) {
      list[existingIndex] = assessment;
    } else {
      list.unshift(assessment);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Failed to save assessment to localStorage:', error);
  }
}

export function generateAssessmentId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `ast_${timestamp}_${randomStr}`;
}
