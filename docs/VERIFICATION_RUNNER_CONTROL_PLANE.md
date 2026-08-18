# Verification Runner 제어 계층

## 목적

이 계층은 `queued` 검수 실행을 신뢰된 Runner 조정기가 하나씩 선점하고, 상태와 완료조건별 결과·증거 메타데이터를 LinKross에 돌려주기 위한 서버 경계다. 제출 코드를 Next.js 서버에서 실행하지 않고 비영속 Vercel Sandbox에서만 설치·빌드한다.

## 보안 경계

- `VERIFICATION_RUNNER_SECRET`과 `SUPABASE_SERVICE_ROLE_KEY`는 Next.js 서버와 신뢰된 Runner 조정기 경계에만 둔다.
- 작업별 lease 원문은 claim 응답에서 한 번만 전달하고 DB에는 SHA-256 해시만 저장한다.
- lease 해시는 사용자 API에서 접근할 수 없는 `private.verification_run_leases`에 저장한다.
- 조정기는 Sandbox에 manifest만 전달한다. 공용 Runner secret, lease token, GitHub token과 Supabase key를 전달하지 않는다.
- manifest에는 저장소 좌표, PR, 고정 Commit SHA와 완료조건만 포함한다.
- Sandbox 내부에서도 저장소 코드는 `linkross-app`, 테스트 하네스는 `linkross-verifier` 사용자로 분리한다. 앱 사용자는 권한이 제한된 verifier 홈의 테스트 입력·결과·스크린샷 파일을 읽거나 덮어쓸 수 없다.
- 로그·스크린샷 같은 증거는 `{projectId}/{runId}/...` 경로에 업로드한 뒤 메타데이터만 완료 API로 제출한다.
- 일반 증거는 LinKross 저장소 경로가 필수이며, `preview`만 HTTPS 외부 URL을 사용할 수 있다.

## 적용

1. [`supabase/verification_runner_control_plane.sql`](../supabase/verification_runner_control_plane.sql)을 Supabase SQL Editor에서 적용한다.
2. 서버 환경에 `SUPABASE_SERVICE_ROLE_KEY`를 설정한다.
3. 최소 32자의 무작위 `VERIFICATION_RUNNER_SECRET`을 설정한다.
4. 같은 secret을 신뢰된 Runner 조정기에만 설정한다.
5. Vercel 배포에서는 OIDC를 사용한다. 로컬 또는 외부 조정기에서는 `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`를 함께 설정한다.
6. `npm run sandbox:snapshot`으로 Playwright 1.62.1과 Chromium이 포함된 snapshot을 만들고 출력된 ID를 `VERIFICATION_SANDBOX_SNAPSHOT_ID`에 설정한다. 이 명령은 Vercel Sandbox 자원을 생성하므로 비용이 발생할 수 있다.

아직 이 SQL은 원격 Supabase에 자동 적용되지 않는다.

## API 흐름

모든 요청은 다음 헤더를 사용한다.

```text
Authorization: Bearer <VERIFICATION_RUNNER_SECRET>
```

### 1. 작업 선점

```http
POST /api/verification/runner/claim
Content-Type: application/json

{"workerId":"runner-coordinator-01"}
```

응답의 `job.manifest`와 `job.lease` 중 Sandbox에는 `manifest`만 전달한다. 대기 작업이 없으면 `job`은 `null`이다. 선점 시 상태는 `queued → provisioning`으로 바뀐다. 5분 동안 heartbeat가 없으면 다른 조정기가 만료 작업을 재선점할 수 있다.

### 2. Heartbeat

```http
POST /api/verification/runner/runs/{runId}/heartbeat
X-Runner-Id: runner-coordinator-01
X-Verification-Lease: <job.lease.token>
```

긴 설치·빌드·테스트 동안 60초 이내 간격으로 호출한다.

### 3. 상태 전이

```http
POST /api/verification/runner/runs/{runId}/transition
X-Runner-Id: runner-coordinator-01
X-Verification-Lease: <job.lease.token>
Content-Type: application/json

{
  "expectedStatus":"provisioning",
  "nextStatus":"installing",
  "environmentProvider":"sandbox-provider",
  "environmentReference":"opaque-environment-id"
}
```

정상 진행 순서는 다음과 같다.

```text
queued → provisioning → installing → building → running
```

활성 상태에서는 `failed`, `timed_out`, `cancelled`로 종료할 수 있다. `passed`, `failed`, `needs_review` 판정과 조건별 결과 저장은 완료 API를 사용한다. 인프라 오류처럼 조건별 결과가 없는 실패만 상태 전이 API의 `failed`를 사용한다.

### 4. 결과 완료

```http
POST /api/verification/runner/runs/{runId}/complete
X-Runner-Id: runner-coordinator-01
X-Verification-Lease: <job.lease.token>
Content-Type: application/json

{
  "status":"passed",
  "durationMs":12000,
  "results":[
    {
      "criterionId":"<criterion-uuid>",
      "status":"passed",
      "observedResult":"Expected navigation was observed.",
      "durationMs":1800,
      "evidence":[
        {
          "type":"screenshot",
          "storagePath":"<projectId>/<runId>/login-success.png",
          "mimeType":"image/png",
          "sizeBytes":24512,
          "sha256":"<64-character-hex>",
          "isRedacted":true
        }
      ]
    }
  ]
}
```

제출에 포함된 모든 완료조건이 한 번씩 있어야 하며, 결과와 증거 저장 및 실행 종료는 하나의 DB 트랜잭션에서 처리된다. 완료된 실행은 다시 덮어쓸 수 없다.

### 5. LinKross 관리형 Vercel Sandbox 실행

```http
POST /api/verification/runner/execute
Authorization: Bearer <VERIFICATION_RUNNER_SECRET>
Content-Type: application/json

{"workerId":"linkross-sandbox-01"}
```

이 엔드포인트는 한 작업만 선점해 다음 순서로 실행한다.

현재 Vercel Hobby 배포의 함수 실행 한도에 맞춰 요청 최대 실행시간은 300초다. 5분을 넘는 검수는 이 동기 엔드포인트에서 처리하지 않고 외부 비동기 조정기로 분리해야 한다.

1. GitHub App Installation Token을 Next.js 서버 메모리에서만 발급한다.
2. 선택 저장소의 고정 Commit SHA archive를 최대 100MB로 내려받고 SHA-256을 계산한다.
3. archive와 token 없는 manifest를 1 vCPU, 12분 제한의 비영속 Vercel Sandbox에 업로드한다.
4. `package-lock.json`을 기준으로 lifecycle script를 끈 `npm ci --ignore-scripts`를 수행한다.
5. 패키지 다운로드가 끝나면 Sandbox egress를 `deny-all`로 변경하고 `npm rebuild`로 lifecycle script를 실행한다.
6. 외부 포트를 열지 않은 상태로 `npm run build`와 `npm run start`를 실행하고 내부 `127.0.0.1:3000`에서만 앱 준비 상태를 확인한다.
7. 저장소 테스트 대신 LinKross가 주입한 Playwright 스크립트로 로그인 완료조건을 각각 독립된 browser context에서 실행한다.
8. 입력값과 토큰 패턴을 지운 스크린샷과 마스킹 로그를 `linkross-evidence` 버킷에 저장하고 조건별 결과를 완료 API로 고정한다.
9. 성공과 실패에 관계없이 Sandbox를 중지한다.

저장소 자체의 E2E 스크립트는 실행하지 않는다. 현재 LinKross 관리형 `automated_e2e` 프리셋은 로그인 입력란, 정상 로그인 후 `/dashboard` 이동, 잘못된 비밀번호 오류, 이메일 필수 입력 네 가지다. SOW 생성 시 해당 문장을 선언형 `test_spec`으로 고정하며, 기존 로그인 MVP 문장은 실행 시 같은 프리셋으로 해석한다. 임의 selector, JavaScript 또는 셸 명령은 `test_spec`에 허용하지 않는다. `manual`, `document` 조건과 프리셋이 없는 자동 조건은 `needs_review`로 남긴다.

## 아직 남은 작업

- 로그인 외 완료조건을 위한 선언형 Playwright 시나리오 모델과 검토 UI
- 프레임워크별 합성 DB와 seed 규약
- Playwright trace·영상 업로드와 Preview 접근
- 배포 환경의 rate limit, OIDC 기반 조정기 인증과 운영 모니터링
