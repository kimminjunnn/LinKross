# LinKross 백엔드 연결 감사 결과

기준일: 2026-08-16

## 실제 데이터로 연결한 범위

- 기업 프로젝트 등록, 서버 임시 저장, 요구사항 v1과 참고자료 Storage 업로드
- 공개 모집 목록·상세·시간 제한 첨부파일 URL
- 프리랜서 수행 제안서 제출, 원문 보존, 지원 현황, 기업 원문 검토와 한 명 선정
- 기업/프리랜서 프로젝트 목록과 실제 상태 기반 대시보드
- SOW 초안·마일스톤·완료조건 저장, 검토 요청, 동일 content hash 양측 승인, append-only 수정 요청
- 입력 원문에 근거한 서버 측 OpenAI 마일스톤 분석·영문 SOW 초안 생성
- GitHub App 설치 흐름, 공개·비공개 공식 저장소와 PR 확인, 40자리 head Commit SHA 고정 제출
- 저장소 단위 Installation Access Token 발급·즉시 폐기, webhook HMAC 검증과 delivery ID 중복 방지 기록
- 검수 실행 요청의 멱등 대기열 기록, 재실행 attempt, 조건별 결과·증거 조회, 발주자 수정 요청·승인
- 승인 마일스톤 인보이스 제출·기업 검토, 실제 지급 상태와 증빙 번들 조회
- 기업·프리랜서 프로필 조회와 수정

구형 `src/data/*`, 후보 점수/추천 mock, localStorage 기반 지원·비교·SOW 승인 fallback, 하드코딩 M1/M2 테스트넷 지급 화면과 API는 제거했다. 후보 선정에는 AI 점수나 추천을 사용하지 않는다.

## 의도적으로 기기에만 남는 상태

- 로그인 전에 작성한 온보딩 정보를 로그인 직후 프로필로 넘기는 `sessionStorage` handoff
- DB 제출 전 수행 제안서 작성 중인 브라우저 초안. 제출된 원문과 상태는 DB만 사용한다.

## 외부 인프라가 있어야 완료할 수 있는 범위

- GitHub App 운영 설정: Private Key·webhook secret 등록, App 설치, webhook 공개 HTTPS URL과 Supabase migration 적용
- webhook 후속 처리: 현재는 검증된 delivery를 중복 없이 기록하며, 새 Commit 자동 감지와 연결 상태 동기화는 별도 작업이다.
- 실제 코드 실행: Vercel Sandbox 기반 install/build/start 경계와 로그인 MVP용 LinKross 관리 Playwright 시나리오 4개를 구현했다. 원격 인증 설정, Playwright snapshot 생성과 프레임워크별 합성 DB 연결은 아직 필요하다.
- Runner 결과 쓰기: Runner secret, 작업별 lease, 원자적 선점·상태 전이·결과 저장 API와 비공개 lease 테이블을 구현했다. 원격 SQL 적용은 아직 필요하다.
- 격리 실행: Vercel Sandbox에 고정 SHA archive를 직접 업로드하고 설치 후 egress를 차단하는 npm install/build/start 실행기를 구현했다. 저장소와 verifier OS 사용자를 분리하고 관리형 Playwright 결과·마스킹 스크린샷을 수집한다. 실제 원격 실행과 합성 DB 연결은 아직 필요하다.
- 통합 증빙 파일: PDF/ZIP 생성 Worker, 비공개 Storage 보관·만료 정책. 현재 화면은 DB의 번들 생성 상태만 읽는다.
- 실제 지급: 외부 결제 파트너와 수신 계좌/지갑 데이터 모델. 현재는 DB에 적재된 상태와 외부 참조만 표시한다.
- 알림·멤버 초대: 발송 공급자, 조직 멤버십과 초대 모델이 필요하다.
- 원격 Supabase 타입 생성/마이그레이션 적용 확인: 프로젝트 참조와 CLI 인증이 있는 배포 절차에서 수행한다.

## 검증 결과

- `npm run typecheck`: 통과
- `npm run lint`: 통과
- `npm exec next build -- --webpack`: 통과
- 기본 Turbopack 빌드는 코드 오류가 아니라 실행 환경의 로컬 포트 바인딩 금지로 panic이 발생했다. 같은 소스를 webpack 프로덕션 빌드로 검증했다.
