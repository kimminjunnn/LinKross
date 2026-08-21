# 판정 정확도 평가 · precondition

픽스처 완료조건 8개를 정상판과 고장판에 실제로 실행한 결과입니다.

| 지표 | 목표 | 측정값 | 달성 |
| --- | ---: | ---: | :---: |
| 실행 가능한 스펙 비율 | — | 79.2% (19/24) | — |
| **False FAIL** (정상판 오판) | 0% | 26.3% (5/19) | ❌ |
| False PASS (고장판 통과) | ≤ 10% | 0% (0) | ✅ |

## 완료조건별

| 완료조건 | 스펙 | 정상판 | 고장판 | 판정 |
| --- | --- | :---: | :---: | --- |
| login-fields | preset | 통과 | 통과 | 정상 |
| login-success-redirect | composed | 통과 | 실패 | 정상 |
| login-bad-password-error | preset | 통과 | 실패 | 정상 |
| login-email-required | composed | 통과 | 실패 | 정상 |
| todo-add | composed | 실패 | 실패 | **False FAIL** |
| todo-check | composed | 실패 | 실패 | **False FAIL** |
| todos-auth-guard | composed | 통과 | 실패 | 정상 |
| session-persist | composed | 통과 | 실패 | 정상 |
| login-fields | preset | 통과 | 통과 | 정상 |
| login-success-redirect | composed | 통과 | 실패 | 정상 |
| login-bad-password-error | preset | 통과 | 실패 | 정상 |
| login-email-required | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-add | composed | 실패 | 실패 | **False FAIL** |
| todo-check | composed | 실패 | 실패 | **False FAIL** |
| todos-auth-guard | composed | 통과 | 실패 | 정상 |
| session-persist | — | — | — | 자동화 안 됨 (schema_rejected) |
| login-fields | preset | 통과 | 통과 | 정상 |
| login-success-redirect | composed | 통과 | 실패 | 정상 |
| login-bad-password-error | preset | 통과 | 실패 | 정상 |
| login-email-required | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-add | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-check | composed | 실패 | 실패 | **False FAIL** |
| todos-auth-guard | composed | 통과 | 실패 | 정상 |
| session-persist | — | — | — | 자동화 안 됨 (schema_rejected) |

정상판은 모두 통과, 고장판은 결함이 있는 항목이 모두 실패해야 합니다.
`brokenBy`가 없는 대조군은 두 판 모두 통과해야 합니다.

## False FAIL 상세 (가장 중요)

정상 동작하는 앱을 실패로 판정한 항목입니다. 하네스가 남긴 관찰 결과를 그대로 옮깁니다.

- **todo-add**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **todo-check**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **todo-add**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **todo-check**: 브라우저 시나리오 실행 중 오류가 발생했습니다.
- **todo-check**: 브라우저 시나리오 실행 중 오류가 발생했습니다.