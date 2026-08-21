# 판정 정확도 평가 · repair-check

픽스처 완료조건 8개를 정상판과 고장판에 실제로 실행한 결과입니다.

| 지표 | 목표 | 측정값 | 달성 |
| --- | ---: | ---: | :---: |
| 실행 가능한 스펙 비율 | — | 50% (4/8) | — |
| **False FAIL** (정상판 오판) | 0% | 0% (0/4) | ✅ |
| False PASS (고장판 통과) | ≤ 10% | 0% (0) | ✅ |

## 완료조건별

| 완료조건 | 스펙 | 정상판 | 고장판 | 판정 |
| --- | --- | :---: | :---: | --- |
| login-fields | preset | 통과 | 통과 | 정상 |
| login-success-redirect | composed | 통과 | 실패 | 정상 |
| login-bad-password-error | preset | 통과 | 실패 | 정상 |
| login-email-required | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-add | — | — | — | 자동화 안 됨 (schema_rejected) |
| todo-check | — | — | — | 자동화 안 됨 (schema_rejected) |
| todos-auth-guard | composed | 통과 | 실패 | 정상 |
| session-persist | — | — | — | 자동화 안 됨 (schema_rejected) |

정상판은 모두 통과, 고장판은 결함이 있는 항목이 모두 실패해야 합니다.
`brokenBy`가 없는 대조군은 두 판 모두 통과해야 합니다.