# 검수 가능성 평가 · after-chunking

완료조건 **40개** · 3회 반복

**automation_ready 평균 68.3%** (최소 65% ~ 최대 72.5%, 폭 7.5%p)

회차별: 1회 65% · 2회 67.5% · 3회 72.5%

## 경로별 분포 (전 회차 합계)

| 결과 | 합계 |
| --- | ---: |
| atom 조합으로 자동화 | 73 |
| 조합 실패 → 사람 확인 | 38 |
| 고정 프리셋으로 자동화 | 9 |

## 조합 거부 사유 (전 회차 합계)

| 사유 | 합계 | 뜻 |
| --- | ---: | --- |
| `schema_rejected` | 38 | 엄격 파서 불통과 — 조합이 실행 가능한 형태가 아님 |

### 거부 지점 (무엇을 고쳐야 하는지)

| 지점 | 합계 |
| --- | ---: |
| atom 변환 실패: atom=expect_visible role=(빈 값) name=(빈 값) | 13 |
| atom 변환 실패: atom=expect_visible text=(빈 값) | 8 |
| atom 변환 실패: atom=expect_text 대상 없음 | 6 |
| atom 변환 실패: atom=fill field=(빈 값) valueKind=literal value=… | 3 |
| atom 변환 실패: atom=expect_visible 대상 없음 | 3 |
| atom 변환 실패: atom=fill field=password valueKind=none value=(빈 값) | 2 |
| atom 변환 실패: atom=click 대상 없음 | 2 |
| atom 변환 실패: atom=expect_every_text 대상 없음 | 1 |

## 판단 기준

이번 측정의 편차 폭은 7.5%p다. 앞으로 어떤 변경의 효과를 주장하려면 평균이 이 폭보다 뚜렷하게 움직여야 한다.