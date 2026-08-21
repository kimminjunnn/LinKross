# 검수 가능성 평가 · before-promptfix

완료조건 **40개** · 3회 반복

**automation_ready 평균 67.5%** (최소 62.5% ~ 최대 72.5%, 폭 10%p)

회차별: 1회 72.5% · 2회 62.5% · 3회 67.5%

## 경로별 분포 (전 회차 합계)

| 결과 | 합계 |
| --- | ---: |
| atom 조합으로 자동화 | 72 |
| 조합 실패 → 사람 확인 | 39 |
| 고정 프리셋으로 자동화 | 9 |

## 조합 거부 사유 (전 회차 합계)

| 사유 | 합계 | 뜻 |
| --- | ---: | --- |
| `schema_rejected` | 38 | 엄격 파서 불통과 — 조합이 실행 가능한 형태가 아님 |
| `llm_declined` | 1 | 모델이 자동화 불가로 판단 (§21.4 정상 결론일 수 있음) |

### 거부 지점 (무엇을 고쳐야 하는지)

| 지점 | 합계 |
| --- | ---: |
| atom 변환 실패: atom=fill field=email valueKind=ref value=… | 9 |
| atom 변환 실패: atom=expect_visible text=(빈 값) | 8 |
| atom 변환 실패: atom=expect_visible role=(빈 값) name=(빈 값) | 8 |
| atom 변환 실패: atom=fill field=(빈 값) valueKind=literal value=… | 5 |
| atom 변환 실패: atom=fill field=submit valueKind=ref value=… | 3 |
| atom 변환 실패: atom=fill field=submit valueKind=none value=… | 2 |
| (미기록) | 1 |
| atom 변환 실패: atom=expect_every_text 대상 없음 | 1 |
| atom 변환 실패: atom=expect_visible label=(빈 값) | 1 |
| atom 변환 실패: atom=fill field=password valueKind=none value=… | 1 |

## 판단 기준

이번 측정의 편차 폭은 10%p다. 앞으로 어떤 변경의 효과를 주장하려면 평균이 이 폭보다 뚜렷하게 움직여야 한다.