# 판정 정확도 평가 · named-targets

픽스처 완료조건 14개를 정상판과 고장판에 실제로 실행한 결과입니다.

| 지표 | 목표 | 측정값 | 달성 |
| --- | ---: | ---: | :---: |
| 실행 가능한 스펙 비율 | — | 71.4% (30/42) | — |
| **False FAIL** (정상판 오판) | 0% | 33.3% (10/30) | ❌ |
| False PASS (고장판 통과) | ≤ 10% | 4.2% (1) | ✅ |

## 완료조건별

| 완료조건 | 스펙 | 정상판 | 고장판 | 판정 |
| --- | --- | :---: | :---: | --- |
| login-fields | preset | 통과 | 통과 | 정상 |
| login-success-redirect | composed | 통과 | 실패 | 정상 |
| login-bad-password-error | preset | 통과 | 실패 | 정상 |
| login-email-required | composed | 통과 | 실패 | 정상 |
| signup-fields | preset | 통과 | 통과 | 정상 |
| signup-redirect | composed | 실패 | 실패 | **False FAIL** |
| signup-duplicate-blocked | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-add | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-check | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-empty-state | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-filter-done | — | — | — | 자동화 안 됨 (schema_rejected) |
| todos-auth-guard | composed | 통과 | 실패 | 정상 |
| session-persist | composed | 실패 | 실패 | **False FAIL** |
| logout-clears-session | composed | 실패 | 실패 | **False FAIL** |
| login-fields | preset | 통과 | 통과 | 정상 |
| login-success-redirect | composed | 통과 | 실패 | 정상 |
| login-bad-password-error | preset | 통과 | 실패 | 정상 |
| login-email-required | composed | 실패 | 실패 | **False FAIL** |
| signup-fields | preset | 통과 | 통과 | 정상 |
| signup-redirect | composed | 실패 | 실패 | **False FAIL** |
| signup-duplicate-blocked | composed | 실패 | 실패 | **False FAIL** |
| todo-add | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-check | composed | 실패 | 실패 | **False FAIL** |
| todo-empty-state | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-filter-done | — | — | — | 자동화 안 됨 (schema_rejected) |
| todos-auth-guard | composed | 통과 | 실패 | 정상 |
| session-persist | — | — | — | 자동화 안 됨 (schema_rejected) |
| logout-clears-session | — | — | — | 자동화 안 됨 (schema_rejected) |
| login-fields | preset | 통과 | 통과 | 정상 |
| login-success-redirect | composed | 통과 | 실패 | 정상 |
| login-bad-password-error | preset | 통과 | 실패 | 정상 |
| login-email-required | composed | 통과 | 실패 | 정상 |
| signup-fields | preset | 통과 | 통과 | 정상 |
| signup-redirect | composed | 실패 | 실패 | **False FAIL** |
| signup-duplicate-blocked | composed | 통과 | 실패 | 정상 |
| todo-add | composed | 통과 | 통과 | **False PASS** |
| todo-check | composed | 실패 | 실패 | **False FAIL** |
| todo-empty-state | composed | 통과 | 실패 | 정상 |
| todo-filter-done | — | — | — | 자동화 안 됨 (schema_rejected) |
| todos-auth-guard | composed | 통과 | 실패 | 정상 |
| session-persist | composed | 실패 | 실패 | **False FAIL** |
| logout-clears-session | — | — | — | 자동화 안 됨 (schema_rejected) |

정상판은 모두 통과, 고장판은 결함이 있는 항목이 모두 실패해야 합니다.
`brokenBy`가 없는 대조군은 두 판 모두 통과해야 합니다.

## False FAIL 상세 (가장 중요)

정상 동작하는 앱을 실패로 판정한 항목입니다. 하네스가 남긴 관찰 결과를 그대로 옮깁니다.

- **signup-redirect**: 확인한 동작: /signup 경로 열기 → 이메일 입력란에 값 입력 → 비밀번호 입력란에 값 입력 → 제출 버튼 클릭. 다음 단계에서 기대한 결과를 확인하지 못했습니다: /login 경로에 머무름 또는 이동.
- **session-persist**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **logout-clears-session**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **login-email-required**: 확인한 동작: /login 경로 열기 → 비밀번호 입력란에 값 입력 → 제출 버튼 클릭. 다음 단계에서 기대한 결과를 확인하지 못했습니다: 제출 버튼 검증으로 제출이 차단됨.
- **signup-redirect**: 확인한 동작: /signup 경로 열기 → 이메일 입력란에 값 입력 → 비밀번호 입력란에 값 입력 → 제출 버튼 클릭. 다음 단계에서 기대한 결과를 확인하지 못했습니다: /login 경로에 머무름 또는 이동.
- **signup-duplicate-blocked**: 확인한 동작: /signup 경로 열기 → 이메일 입력란에 값 입력 → 비밀번호 입력란에 값 입력 → 제출 버튼 클릭. 다음 단계에서 기대한 결과를 확인하지 못했습니다: 사용자에게 오류 피드백이 표시됨.
- **todo-check**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **signup-redirect**: 확인한 동작: /signup 경로 열기 → 이메일 입력란에 값 입력 → 비밀번호 입력란에 값 입력 → 제출 버튼 클릭. 다음 단계에서 기대한 결과를 확인하지 못했습니다: /login 경로에 머무름 또는 이동.
- **todo-check**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **session-persist**: 확인한 동작: /login 경로 열기 → 이메일 입력란에 값 입력 → 비밀번호 입력란에 값 입력 → 제출 버튼 클릭 → /todos 경로 열기. 다음 단계에서 기대한 결과를 확인하지 못했습니다: list 요소이 화면에 표시됨.