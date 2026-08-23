# 시연 프리셋

시연을 매번 새로 만들지 않고 고정된 입력으로 되돌릴 수 있게 모아둔 것이다.
대상 저장소는 `kimminjunnn/linkross-github-app-test` 하나다.

프리셋은 두 가지로 쓰인다.

1. **화면에서**: SOW 작성 화면에 원문을 붙여넣고 'AI 분석 실행'을 누르면, LLM을
   부르지 않고 확정된 마일스톤·완료조건·실행 스펙을 그대로 되돌려 준다.
2. **스크립트에서**: 이미 만들어 둔 시연 프로젝트의 SOW를 확정본으로 되돌린다.

## 1. 화면에서 쓰는 프리셋

### 왜 고정하는가

같은 원문을 넣어도 LLM은 실행할 때마다 다른 문장과 다른 검수 계약을 만든다.
시연은 재현되어야 하고, 완료조건마다 붙는 질문·조합 호출은 그대로 대기 시간이
된다. 그래서 한 번 확정한 결과를 파일로 얼려 두고 화면은 그것을 읽기만 한다.
프리셋 경로에는 LLM 호출이 하나도 없다.

### 흐름

```
업무 상세 붙여넣기
  → matchSowPreset(원문)            유사도 0.9 이상이면 프리셋 채택
  → toPresetMilestoneInputs()       마일스톤·완료조건·검수 설계를 화면에 즉시 표시
  → saveSowDraft()                  findPresetDod(문장)으로 확정된 실행 스펙을 저장
```

유사도는 공백을 지운 3글자 조각의 Dice 계수다. 오타 몇 개나 줄바꿈 차이는
넘어가고, 원문의 절반만 붙여넣으면 임계값에 못 미쳐 평소의 LLM 경로로 간다.
화면이 앞에 붙이는 `예산: N USDC` 머리말은 비교 전에 걷어낸다.

완료조건 문장을 한 글자라도 고치면 `findPresetDod`가 찾지 못하고, 그 조건만
평소의 분석·조합 경로로 내려간다. 고친 문장은 더 이상 프리셋이 보증한 조건이
아니기 때문이다.

### 파일

| 파일 | 쓰임 |
| --- | --- |
| `asset-rental.txt` | 발주자 원문. SOW 화면의 '업무 상세'에 그대로 붙여넣는다 |
| `asset-rental.preset-source.json` | **사람이 고치는 자리.** 완료조건 문장·검수 계약·실행 스펙·사람 확인 안내 |
| `build-sow-preset.mjs` | 원천 파일 → `src/lib/sow-presets/data/<id>.ts` 생성 |
| `verify-preset-locally.mjs` | 실행 스펙을 로컬 브라우저로 직접 돌려 통과 여부 확인 |
| `asset-rental.expected.json` | 원문에서 뽑은 검증 원자 34개. SOW 생성 품질 채점 기준 |
| `asset-rental.sow.json` | 2026-08-23 검수 실행으로 확인한 이전 확정본. 이력용 |

`src/lib/sow-presets/data/*.ts`는 생성 파일이다. 손으로 고치지 말고 원천 파일을
고친 뒤 생성기를 다시 돌린다.

```bash
node --experimental-strip-types --import ./scripts/register-test-hooks.mjs \
  eval/presets/build-sow-preset.mjs asset-rental
```

생성기는 자동으로 표시된 완료조건의 실행 스펙을 프로덕션과 같은 엄격 파서로
확인하고, 하나라도 해석하지 못하면 파일을 쓰지 않고 멈춘다.

### 프리셋 A — 사내 비품 대여 관리

| 마일스톤 | 완료조건 | 자동 | 사람 확인 | PR | 브랜치 | head SHA | 금액 |
| --- | ---: | ---: | ---: | --- | --- | --- | ---: |
| M1 로그인과 비품 목록 화면 | 11 | 11 | 0 | #5 | `feat/m1-auth` | `a5466b9` | 3000 |
| M2 비품 신청과 내 신청 내역 화면 | 16 | 15 | 1 | #6 | `feat/m2-rental` | `7f10d0f` | 2500 |
| M3 총무팀 승인 화면 | 20 | 15 | 5 | #7 | `feat/m3-admin` | `8a5f838` | 3500 |
| 합계 | 47 | 41 | 6 | | | | 9000 |

자동 41개는 검수 실행기와 같은 Playwright 하니스로 각 마일스톤 커밋에서 실제로
통과하는 것을 확인했다(2026-08-23).

### 상태가 필요한 조건을 자동으로 만드는 방법

신청·승인·반려처럼 사전 상태가 필요한 조건은 **스펙이 그 상태를 스스로 만들고
끝나면 되돌린다.** 그래서 완료조건 사이에 순서 의존이 거의 생기지 않는다.

- 신청을 만든 스펙은 마지막에 `/requests`에서 '취소'를 누른다. 취소는 신청을
  지우고 비품을 '대여 가능'으로 되돌린다.
- 관리자 화면을 보는 스펙은 로그아웃한 뒤 저장소에 하드코딩된 합성 관리자 계정
  (`admin@example.com`)으로 다시 로그인한다. 실행기는 계정 하나만 주입하므로
  관리자 자격증명은 `literal` 값으로 넣는다. 모두 공개된 합성 계정이다.
- 관리자 스펙은 마지막에 '반려'를 눌러 비품을 되돌린다. 승인은 비품을 영구히
  '대여중'으로 만들어 되돌릴 수 없다.

**남은 순서 규칙은 하나다.** 빈 상태 조건(`/admin에 신청 내역이 없을 때`)은
신청을 만드는 조건보다 **앞 자리**에 있어야 한다. 반려된 신청은 목록에 남기
때문이다. M3에서 빈 상태는 5번, 신청을 만드는 조건은 6번부터다.

### 아직 사람이 확인하는 6개

`사람 확인`은 결함이 아니라 설계된 상태다(CLAUDE.md §5). 남은 6개의 이유는
두 가지다.

- **승인은 되돌릴 수 없다.** 비품이 4개(초기 대여 가능 3개)뿐인데 승인하면
  그 비품은 영구히 '대여중'이 된다. 승인 이후를 확인하는 조건 5개(M3 8, 10,
  11, 15, 16)를 각각 자기 완결로 만들면 비품이 모자라고, 하나의 승인 건을 여러
  조건이 나눠 쓰면 앞 조건이 실패할 때 뒤가 연쇄로 흔들린다. 그래서 사람이
  확인한다.
- **계정이 두 개 필요하다.** `/requests에서 본인이 신청한 내역만 표시`(M2 9)는
  두 사람이 각각 신청한 상태를 만들어야 하는데, 준비 단계가 원자 24개 상한을
  넘는다.

두 제약 중 하나라도 풀리면(비품 데이터 확장, 원자 상한 조정) 그만큼 더
자동화할 수 있다.

### 실행 스펙을 로컬에서 검증하기

Vercel Sandbox를 쓰지 않고, 검수 실행기와 **같은** 하니스를 로컬 브라우저로
돌린다. 하니스 원문에서 바꾸는 것은 playwright 모듈 경로 하나뿐이다.

```bash
gh repo clone kimminjunnn/linkross-github-app-test /tmp/demo-app
cd /tmp/demo-app && npm install && cd -
node --experimental-strip-types --conditions=react-server \
  --import ./scripts/register-test-hooks.mjs \
  eval/presets/verify-preset-locally.mjs \
  --app /tmp/demo-app --commit a5466b9 --preset asset-rental --milestone M1
```

`--preset`은 앱에 실린 프리셋 데이터에서 스펙을 그대로 읽는다. 후보 스펙을
시험할 때는 `--specs <파일>`로 넘긴다. 마일스톤마다 커밋이 다르므로
`--commit`을 함께 준다(M1 `a5466b9`, M2 `7f10d0f`, M3 `8a5f838`).

### 알아 둘 것

- 스펙은 시연 저장소의 초기 데이터에 기대고 있다(`맥북 프로 16인치`가 대여 가능,
  `회의용 무선 마이크`가 대여중, 관리자 계정 `admin@example.com`/`Admin1234!`).
  저장소의 초기 데이터나 계정을 바꾸면 프리셋을 다시 검증해야 한다.
- 한 번의 검수 실행에서 완료조건들은 **같은 서버 프로세스**를 공유한다. 실행기는
  `position` 오름차순으로 돌리므로(`src/lib/verification-runner/service.ts`)
  원천 파일의 순서가 곧 실행 순서다.
- 스펙 하나가 중간에 실패하면 그 스펙의 정리 단계도 실행되지 않는다. 뒤따르는
  조건이 비품 부족으로 함께 흔들릴 수 있으므로, 실패가 보이면 그 스펙부터 고친다.
- 원자는 스펙당 24개가 상한이다(`MAX_ATOM_STEPS`). 준비 단계가 긴 스펙은
  로그인 뒤 `expect_path`를 생략해 자리를 만든다. 다음 원자가 대상 요소를
  기다리므로 같은 효과가 난다.

### 새 프리셋 추가

1. `eval/presets/<id>.txt`에 발주자 원문을 둔다.
2. `eval/presets/<id>.preset-source.json`에 마일스톤과 완료조건을 쓴다.
   자동 항목은 `verification: "auto"`와 `testSpec`을, 사람 확인 항목은
   `verification: "manual"`과 `guidance`를 준다.
3. `verify-preset-locally.mjs --specs`로 스펙이 실제로 통과하는지 확인한다.
4. `build-sow-preset.mjs <id>`로 데이터 파일을 만든다.
5. `src/lib/sow-presets/index.ts`의 `REGISTERED_PRESETS`에 추가한다.
6. `npm test`로 `src/lib/__tests__/sow-presets.test.ts`를 돌린다.

## 2. 시연 프로젝트를 확정본으로 되돌리기

| | |
| --- | --- |
| 프로젝트 | `057f6e3a-f141-486f-9633-ba8a3d0d144c` |
| 발주자 | sesac2024ai11 (새싹컴퍼니) |
| 프리랜서 | onemore990109 (Messi) |
| SOW 화면 | `/company/projects/057f6e3a-f141-486f-9633-ba8a3d0d144c/sow` |

마일스톤과 PR은 1:1이다. base를 앞 마일스톤 브랜치로 잡아 PR diff에 해당
마일스톤 변경분만 남기고, 검수는 head SHA 시점의 트리 전체를 받아 실행한다.

| 파일 | 쓰임 |
| --- | --- |
| `apply-asset-rental-sow.mjs` | `asset-rental.sow.json`을 프로젝트에 적용(기존 draft 교체) |
| `patch-dods.mjs` | 완료조건 문장을 고치고 검수 계약을 다시 만든다 |
| `run-asset-rental-verification.mjs` | 마일스톤 하나를 PR 제출 → 검수 실행까지 태운다 |
| `../score-preset.mjs` | 생성된 SOW를 골든셋으로 채점 |

두 스크립트는 LLM을 부른다(`analyzeDodContracts`, `composeVerificationAtoms`).
화면에서 쓰는 프리셋과 달리 결과가 실행마다 달라질 수 있다.

```bash
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

```bash
node --import ./eval/load-env.mjs eval/presets/run-asset-rental-verification.mjs M1
```

배포본(`https://lin-kross.vercel.app`)의 조정기를 호출한다. 로컬에서 돌리려면
`docs/VERIFICATION_RUNNER_CONTROL_PLANE.md`대로 `VERCEL_TOKEN`,
`VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`를 `.env.local`에 넣어야 한다.

2026-08-23 10:15(UTC) 실행분은 Sandbox snapshot에 Playwright 도구가 준비되지
않아 전 항목이 `확인 필요`로 끝났다. 스펙 문제가 아니므로 snapshot을 다시 만든
뒤(`npm run sandbox:snapshot`) 재실행한다.
