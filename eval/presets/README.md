# 시연 프리셋

시연을 매번 새로 만들지 않고 고정된 입력으로 되돌릴 수 있게 모아둔 것이다.
대상 저장소는 `kimminjunnn/linkross-github-app-test` 하나다.

## 프리셋 A — 사내 비품 대여 관리

| | |
| --- | --- |
| 프로젝트 | `057f6e3a-f141-486f-9633-ba8a3d0d144c` |
| 발주자 | sesac2024ai11 (새싹컴퍼니) |
| 프리랜서 | onemore990109 (Messi) |
| SOW 화면 | `/company/projects/057f6e3a-f141-486f-9633-ba8a3d0d144c/sow` |

마일스톤과 PR은 1:1이다. base를 앞 마일스톤 브랜치로 잡아 PR diff에 해당
마일스톤 변경분만 남기고, 검수는 head SHA 시점의 트리 전체를 받아 실행한다.

| 마일스톤 | PR | 브랜치 | head SHA | 금액 |
| --- | --- | --- | --- | ---: |
| M1 로그인과 비품 목록 화면 | #5 | `feat/m1-auth` | `a5466b9` | 3000 |
| M2 비품 신청과 내 신청 내역 화면 | #6 | `feat/m2-rental` | `7f10d0f` | 2500 |
| M3 총무팀 승인 화면 | #7 | `feat/m3-admin` | `8a5f838` | 3500 |

### 파일

| 파일 | 쓰임 |
| --- | --- |
| `asset-rental.txt` | 발주자가 쓴 요구사항 원문. SOW 화면의 '업무 상세'에 그대로 붙여넣는다 |
| `asset-rental.expected.json` | 원문에서 뽑은 검증 원자 34개. 채점 기준 |
| `asset-rental.sow.json` | 확정된 마일스톤·완료조건. 실제 검수를 통과시킨 문장 그대로다 |
| `apply-asset-rental-sow.mjs` | 확정본을 프로젝트에 적용(기존 draft 교체) |
| `patch-dods.mjs` | 완료조건 문장을 고치고 검수 계약을 다시 만든다 |
| `run-asset-rental-verification.mjs` | 마일스톤 하나를 PR 제출 → 검수 실행까지 태운다 |
| `../score-preset.mjs` | 생성된 SOW를 골든셋으로 채점 |

### 되돌리기

```
node --experimental-strip-types --conditions=react-server \
  --import ./eval/load-env.mjs --import ./scripts/register-test-hooks.mjs \
  eval/presets/apply-asset-rental-sow.mjs
```

기존 마일스톤·완료조건을 지우고 `asset-rental.sow.json`으로 다시 만든다.
지우기 전에 `eval/results/.preset-a-db-backup-*.json`으로 백업한다.
SOW가 `draft`가 아니면 멈춘다(승인된 버전은 덮어쓰지 않는다).

제출·검수 이력이 이미 있으면 완료조건을 지울 수 없다(FK restrict). 그때는
`patch-dods.mjs`로 자리를 찾아 갱신한다.

### 검수 실행

```
node --import ./eval/load-env.mjs eval/presets/run-asset-rental-verification.mjs M1
```

배포본(`https://lin-kross.vercel.app`)의 조정기를 호출한다. 로컬에서 돌리려면
`docs/VERIFICATION_RUNNER_CONTROL_PLANE.md`대로 `VERCEL_TOKEN`,
`VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`를 `.env.local`에 넣어야 한다.

### 확인된 결과 (2026-08-23)

| 마일스톤 | 검수 결과 | 통과 | 확인 필요 | 실패 |
| --- | --- | ---: | ---: | ---: |
| M1 | `passed` | 11 | 0 | 0 |
| M2 | `needs_review` | 8 | 8 | 0 |
| M3 | `needs_review` | 2 | 10 | 0 |
| 합계 | | 21 | 18 | 0 |

`확인 필요`는 결함이 아니라 설계된 상태다(CLAUDE.md §5). 자동 판정이 어려운
조건은 사람이 Preview에서 확인한다.

M3가 대부분 `확인 필요`인 이유는 검수 실행기의 `syntheticCredentials`가
계정 하나(`email`/`password`/`invalidPassword`)뿐이어서 관리자 계정으로
로그인할 수 없기 때문이다(`src/lib/verification-test-spec.ts`). 저장소의
`app/lib/accounts.ts` 주석도 같은 전제를 적어두었다. 관리자 화면의 승인·반려
흐름을 자동 판정하려면 실행기에 두 번째 계정을 넣어야 한다.
