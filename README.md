# LinKross

> 사람을 고르고, 일을 합의하고, 결과물을 검증한다.

LinKross는 사내 CTO나 전문 QA가 없는 초기 스타트업이 외주 개발자를 선정하고, 업무 범위를 합의하고, 제출된 결과물이 실제로 작동하는지 검수하도록 돕는 B2B 프로젝트 검증 워크스페이스입니다.

코드 제출 여부만 확인하는 것이 아니라 `원본 요구사항 → 수행 제안서 → 승인된 SOW → Commit SHA → 검수 증거 → 사람의 최종 결정 → 지급 기록`을 하나의 감사 가능한 흐름으로 연결합니다.

## 핵심 제품 흐름

```text
프로젝트 및 요구사항 등록
        ↓
자유 형식 수행 제안서 접수·원문 검토
        ↓
프리랜서 1명 선정
        ↓
AI 지원 SOW·마일스톤·완료조건 작성
        ↓
기업과 프리랜서가 동일 버전 승인
        ↓
GitHub PR 제출 및 Commit SHA 고정
        ↓
격리 환경에서 설치·빌드·실행·검수
        ↓
완료조건별 결과·로그·스크린샷·Preview 확인
        ↓
발주자의 승인 또는 수정 요청
        ↓
인보이스·지급 상태·통합 증빙 연결
```

LinKross의 자동 검수는 최종 승인이나 지급을 대신하지 않습니다. 자동화 결과는 의사결정을 위한 근거이며, 최종 승인은 발주자가 직접 내립니다.

## 주요 기능

### 1. 프로젝트 모집과 프리랜서 선정

- 목표, 요구사항, 일정, 예산, 참고자료와 모집 기간을 포함한 프로젝트 등록
- 지원자의 자유 형식 수행 제안서 제출 및 제출 당시 원문 보존
- 기업의 지원자별 제안서 원문 검토와 프로젝트당 1명 선정
- 기업·프리랜서 역할별 프로젝트 및 지원 현황 대시보드
- 모집 마감, 중복 제출, 선정 이후 변경을 고려한 서버 권한 검증

MVP에서는 지원자에 대한 AI 요약, 자동 점수, 비교표 또는 추천을 제공하지 않습니다.

### 2. AI 지원 SOW와 완료조건

- 원본 요구사항과 선정된 수행 제안서를 근거로 SOW 초안 생성
- 목표, 범위, 제외사항, 결과물, 일정, 금액, Acceptance Criteria, Definition of Done 구조화
- 비개발자가 브라우저에서 확인할 수 있는 화면·행동·결과 단위의 완료조건 작성
- 자동 검수 가능 여부와 사람 확인 필요 여부 분리
- 기업과 프리랜서의 동일 `content_hash` 승인
- 수정 요청과 새 SOW 버전을 append-only 이력으로 보존
- 확정된 시연 입력에는 재현 가능한 SOW 프리셋 사용

운영 SOW 생성에는 서버 전용 Gemini API를 사용합니다. 프리셋 원문은 충분히 유사한 입력에 대해 LLM 호출 없이 고정 결과를 반환합니다.

### 3. GitHub 기반 실행 검수

- 프로젝트별 GitHub App 설치 및 저장소 연결
- PR의 40자리 head Commit SHA를 불변 검수 대상으로 저장
- 동일 완료조건을 기준으로 새 커밋 재검수 및 attempt 이력 보존
- 완료조건별 `대기`, `검수 중`, `통과`, `실패`, `확인 필요` 상태와 근거 제공
- 발주자의 항목별 수동 판정, 마일스톤 승인 또는 수정 요청
- GitHub webhook HMAC 검증과 delivery ID 중복 처리 방지

관리형 실행기는 고정 SHA의 소스 아카이브를 Vercel Sandbox에 전달해 설치, 빌드, 서버 실행과 Playwright 검수를 수행합니다. 현재 자동 E2E 프리셋은 로그인 MVP의 네 가지 흐름을 우선 지원하며, 선언형 실행 스펙이 없는 조건은 `needs_review`로 남깁니다.

### 4. 지급 상태와 통합 증빙

- 승인된 마일스톤에 인보이스 제출·검토 연결
- 지급 요청, 처리 중, 지급 완료 상태 관리
- 계좌이체·카드·기타 수동 확인 및 Base Sepolia 테스트넷 지갑 송금 시연
- 프리랜서 플랫폼 수수료와 기업 구독 상태 관리
- SOW, Commit SHA, 검수 결과, 최종 승인, 인보이스와 지급 기록을 묶는 증빙 번들

실제 법정화폐 송금, 에스크로, 전자계약과 법률·세무 판단은 LinKross의 범위가 아닙니다. 통합 증빙 파일을 생성·보관하는 PDF/ZIP Worker도 별도 운영 인프라가 필요합니다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Web | Next.js 16 App Router, React 19, TypeScript 5 |
| UI | Tailwind CSS 4, Lucide React |
| 인증·DB·파일 | Supabase Auth, PostgreSQL, Row Level Security, Supabase Storage |
| AI | Google Gemini (`@google/genai`) |
| GitHub | GitHub App, Installation Token, Webhook HMAC 검증 |
| 실행 검수 | Vercel Sandbox, Playwright 1.62 |
| 테스트넷 지급 시연 | ethers 6, Base Sepolia, USDC |
| 품질 검사 | Node.js test runner, ESLint 9, TypeScript |

## 구조

```text
src/
├── app/
│   ├── (workspaces)/company/       # 기업용 프로젝트·선정·SOW·검수·증빙 화면
│   ├── (workspaces)/freelancer/    # 프리랜서용 지원·프로젝트·인보이스 화면
│   ├── api/github/app/             # GitHub App 설치·설정·webhook API
│   ├── api/verification/runner/    # Runner 선점·heartbeat·상태 전이·완료 API
│   ├── actions/                    # 화면에서 호출하는 Server Actions
│   ├── opportunities/              # 공개 프로젝트 목록과 상세
│   └── login, onboarding/          # 인증과 역할별 온보딩
├── components/                     # 공통 UI와 도메인 컴포넌트
├── config/                         # 역할·상태·내비게이션·요금 중앙 정의
├── data/                           # 검수 번역 사전 데이터
└── lib/
    ├── backend/                    # 권한·검증을 포함한 도메인 서비스 계층
    ├── github/                     # GitHub App 및 webhook 처리
    ├── llm/                        # Gemini 클라이언트와 모델 fallback
    ├── sow-presets/                # 재현 가능한 시연 SOW 생성물
    ├── supabase/                   # 브라우저·서버·관리자 클라이언트
    └── verification-runner/        # Sandbox 실행과 Playwright 하네스

supabase/                            # 스키마, RLS, RPC, 후속 보정 SQL과 시드
eval/                                # SOW·DoD·판정·모델 비교 평가 도구
scripts/                             # 테스트 hook과 Sandbox snapshot 도구
docs/                                # 데이터·검수·백엔드·수익 모델 설계 문서
sow_evaluations/                     # SOW 품질 실험 데이터와 결과
public/brand/                        # 로고와 브랜드 자산
```

페이지는 Supabase 테이블을 직접 수정하지 않고 `src/app/actions`와 `src/lib/backend`의 서버 경계를 통과합니다. 권한은 UI의 버튼 노출 여부가 아니라 `user_roles`, 프로젝트 소유자, 선정된 제안서 관계와 RLS를 기준으로 다시 검사합니다.

## 시작하기

### 요구 사항

- Node.js 20.9 이상
- npm
- 전체 기능 사용 시 Supabase 프로젝트
- SOW 자동 생성 사용 시 Gemini API 키
- GitHub 검수 사용 시 GitHub App
- 관리형 실행 검수 사용 시 Vercel Sandbox 접근 권한

### 1. 설치

```bash
git clone <repository-url>
cd LinKross
npm install
cp .env.example .env.local
```

### 2. 환경 변수 설정

`.env.local`에 필요한 값만 설정합니다. 키 원문, GitHub Private Key와 service role key는 Git 또는 브라우저에 노출하지 않습니다.

| 변수 | 용도 | 필요한 기능 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 인증·DB |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저용 publishable key | 인증·DB |
| `SUPABASE_SERVICE_ROLE_KEY` | webhook·Runner 제어 계층의 서버 전용 DB 접근 | GitHub·검수 |
| `GEMINI_API_KEY` | SOW·완료조건 분석과 영문 초안 생성 | AI SOW |
| `GEMINI_MODEL` | 주 분석 모델 재정의 | 선택 |
| `GEMINI_MODEL_LIGHT` | 경량 분석 모델 재정의 | 선택 |
| `GEMINI_THINKING_LEVEL` | Gemini 사고 수준 | 선택 |
| `GITHUB_APP_ID` | GitHub App 식별자 | GitHub 연동 |
| `GITHUB_APP_PRIVATE_KEY_BASE64` | 배포용 Private Key의 Base64 값 | GitHub 연동 |
| `GITHUB_APP_PRIVATE_KEY_PATH` | 로컬 개발용 PEM 경로 | GitHub 연동 |
| `GITHUB_WEBHOOK_SECRET` | webhook 서명 검증 secret | GitHub 연동 |
| `VERIFICATION_RUNNER_SECRET` | 신뢰된 Runner API 인증용 32자 이상 secret | 실행 검수 |
| `VERCEL_TOKEN` | 로컬·외부 조정기의 Vercel 인증 | Sandbox |
| `VERCEL_TEAM_ID` | Vercel 팀 식별자 | Sandbox |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 식별자 | Sandbox |
| `VERIFICATION_SANDBOX_SNAPSHOT_ID` | Playwright·Chromium 포함 snapshot | 자동 E2E |

Supabase 공개 환경 변수를 비워 두면 인증 프록시는 로컬 UI 개발을 위해 보호를 건너뜁니다. 이 동작은 개발 편의를 위한 것이며 운영 구성으로 사용하면 안 됩니다.

### 3. Supabase 구성

이 저장소의 SQL은 자동 migration 디렉터리가 아니라 기존 Supabase 프로젝트에 순차 적용해 온 증분 스크립트 모음입니다. `mvp_domain_schema.sql`은 깨끗한 DB를 처음부터 만드는 bootstrap 파일이 아니며, `profiles`, `user_roles`, 역할별 프로필, `projects`, `proposals`, `selections`, `payments` 테이블이 이미 있어야 합니다.

기존 LinKross Supabase 프로젝트의 MVP 도메인 스키마 기준 순서는 다음과 같습니다.

1. `supabase/mvp_domain_schema.sql`
2. `supabase/mvp_schema_fix_v2.sql`
3. `supabase/mvp_schema_fix_v3_sow_revision_requests.sql`

그 뒤 사용하는 기능에 맞는 후속 SQL을 커밋 순서대로 적용해야 합니다. 특히 현재 앱 전체 흐름에는 프로젝트 초안, GitHub webhook, Runner 제어 계층, SOW 수정 읽음 상태, 지급·증빙, 수수료·구독과 수동 판정 관련 SQL이 필요합니다. 상세한 기준과 검증 쿼리는 [MVP 데이터 스키마](docs/DATA_SCHEMA_MVP.md), [Runner 제어 계층](docs/VERIFICATION_RUNNER_CONTROL_PLANE.md), [플랫폼 수익 모델](docs/PLATFORM_REVENUE_MODEL.md)을 참고하세요.

새 Supabase 프로젝트용으로 정리된 단일 migration은 아직 없습니다. 깨끗한 DB를 구성할 때는 `schema.sql`, `onboarding_profiles.sql`, `payments.sql`, `multi_role_profiles.sql`, `projects_recruitment.sql` 등 역사적 기반 스크립트와 후속 보정 SQL의 의존성을 함께 검토해야 합니다. 반대로 이미 운영 중인 DB에는 이 기반 스크립트를 다시 실행하지 않습니다. `seed_*.sql`은 데모 데이터가 필요할 때만 사용합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 주요 화면

| 경로 | 설명 | 접근 |
| --- | --- | --- |
| `/` | 제품 소개 및 역할 진입 | 공개 |
| `/login`, `/onboarding` | 로그인·회원 역할 및 프로필 설정 | 공개 |
| `/opportunities` | 모집 중 프로젝트 목록·상세·지원 | 공개 조회, 제출은 프리랜서 |
| `/company/projects` | 기업 프로젝트 목록과 등록 | 기업 |
| `/company/assessments` | 모집 프로젝트와 지원자 검토 | 기업 |
| `/company/projects/[projectId]/sow` | SOW 작성·검토 요청 | 기업 |
| `/company/projects/[projectId]/approval` | 양측 승인 상태와 수정 요청 | 프로젝트 참여자 |
| `/company/projects/[projectId]/verification` | PR 제출, 자동·수동 검수, 마일스톤 결정 | 프로젝트 참여자 |
| `/company/projects/[projectId]/evidence` | 인보이스·지급·증빙 번들 | 프로젝트 참여자 |
| `/freelancer/applications` | 지원 내역 | 프리랜서 |
| `/freelancer/projects` | 선정된 프로젝트와 제출·검수 | 프리랜서 |
| `/freelancer/invoices` | 인보이스 내역 | 프리랜서 |
| `/freelancer/commissions` | 플랫폼 수수료 내역 | 프리랜서 |

## 검수 Runner 구성

Runner를 사용할 때는 다음 보안 경계를 유지합니다.

- 제출된 저장소 코드는 신뢰하지 않는 코드로 취급
- Next.js 서버가 아닌 비영속 Sandbox에서만 설치·빌드·실행
- GitHub token, Supabase key, Runner secret과 lease token을 Sandbox에 전달하지 않음
- 저장소 코드 사용자와 검수 하네스 사용자를 분리
- 설치 후 외부 네트워크 차단
- 로그와 스크린샷의 입력값·토큰 패턴 마스킹
- 결과와 증거 메타데이터를 한 트랜잭션으로 고정
- 완료 후 Preview 만료 및 Sandbox 폐기

Playwright와 Chromium이 포함된 Sandbox snapshot은 다음 명령으로 만듭니다. Vercel 자원이 생성되어 비용이 발생할 수 있습니다.

```bash
npm run sandbox:snapshot
```

출력된 ID를 `VERIFICATION_SANDBOX_SNAPSHOT_ID`에 저장합니다. API 계약과 상태 전이는 [Verification Runner 제어 계층](docs/VERIFICATION_RUNNER_CONTROL_PLANE.md)에 정리되어 있습니다.

## 개발 명령

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | Next.js 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm test` | `src/lib/__tests__`의 Node 테스트 실행 |
| `npm run eval:sow` | SOW 생성 평가 |
| `npm run eval:models` | 모델 비교 평가 |
| `npm run eval:composition` | 완료조건 조합 평가 |
| `npm run eval:judgment` | 검수 방식 판정 평가 |
| `npm run eval:fixture-selftest` | 로컬 Todo 검수 fixture 자체 테스트 |
| `npm run sandbox:snapshot` | Vercel Sandbox 검수 snapshot 생성 |

평가 명령 일부는 Gemini 또는 OpenAI API 키를 사용하고 외부 API 비용과 rate limit의 영향을 받습니다. 결과 파일은 `eval/results`와 `sow_evaluations`에 저장됩니다.

## 시연 프리셋

시연 재현성을 위해 확정된 원문과 충분히 유사한 입력에는 고정된 SOW·완료조건·실행 스펙을 사용합니다.

- 사내 비품 대여 관리
- 사내 비품 현황 조회
- 개인 할 일 CRUD

프리셋의 원본은 `eval/presets/*.preset-source.json`, 앱에서 사용하는 생성물은 `src/lib/sow-presets/data`에 있습니다. 생성물을 직접 수정하지 말고 원본을 고친 뒤 빌드 스크립트를 실행합니다. 추가·검증 절차는 [시연 프리셋 가이드](eval/presets/README.md)를 참고하세요.

## 테스트와 완료 기준

변경 범위에 맞춰 최소한 다음을 확인합니다.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

핵심 검증 대상은 역할별 권한, 제출·승인 원문의 불변성, SOW 버전 고정, Commit SHA 기반 재검수, 검수 상태 전이, 비인가 접근 차단과 민감정보 노출 방지입니다.

## 현재 제한 사항

- MVP는 프로젝트당 단일 외주 개발자와 단일 GitHub 저장소를 우선 지원합니다.
- 관리형 자동 E2E는 현재 로그인 흐름과 검증된 시연 프리셋 중심입니다.
- 프레임워크별 합성 DB·seed 규약, Playwright trace·영상 업로드, 장시간 비동기 Runner 운영은 추가 작업이 필요합니다.
- GitHub webhook은 서명 검증과 중복 방지 기록까지 구현되어 있으며 새 Commit 자동 동기화는 별도 작업입니다.
- 통합 증빙의 PDF/ZIP 생성·비공개 보관 Worker는 별도 인프라가 필요합니다.
- 실제 지급은 외부 결제 수단으로 처리하며 LinKross는 상태와 참조값을 기록합니다.
- 범용 프리랜서 마켓플레이스, 에스크로, 전자계약, 법률·세무 판단, 전체 코드 품질·보안 자동 판정은 MVP 범위가 아닙니다.

## 관련 문서

- [MVP 데이터 스키마](docs/DATA_SCHEMA_MVP.md)
- [백엔드 함수 계약](docs/BACKEND_FUNCTION_CONTRACTS.md)
- [백엔드 연결 감사](docs/BACKEND_GAP_AUDIT.md)
- [GitHub 마일스톤 실행 검수 설계](docs/MILESTONE_VERIFICATION_DESIGN.md)
- [Verification Runner 제어 계층](docs/VERIFICATION_RUNNER_CONTROL_PLANE.md)
- [플랫폼 수익 모델](docs/PLATFORM_REVENUE_MODEL.md)
- [팀 라우트 가이드](docs/TEAM_ROUTE_GUIDE.md)
- [시연 프리셋 가이드](eval/presets/README.md)

## 협업 원칙

- 비개발자가 판단할 수 있는 사용자 행동과 결과를 기술 로그보다 먼저 보여줍니다.
- 승인되거나 제출된 원문을 덮어쓰지 않고 새 버전과 감사 이력을 남깁니다.
- 역할, 승인, 검수와 지급 상태는 `src/config` 및 공통 타입에서 관리합니다.
- 외부 입력, AI 출력, 저장소 코드와 로그를 신뢰하지 않고 서버에서 검증합니다.
- 공통 레이아웃이나 라우트 작업 전 [팀 라우트 가이드](docs/TEAM_ROUTE_GUIDE.md)를 확인합니다.
- 제품 원칙이나 개발 규칙을 바꿀 때는 `AGENTS.md`와 `CLAUDE.md`를 같은 의미로 함께 갱신합니다.
