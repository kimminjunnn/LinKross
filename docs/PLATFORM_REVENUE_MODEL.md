# LinKross 플랫폼 수익 모델

작성일: 2026-08-20 · 브랜치: `feat/restore-wallet-payment`

이 문서는 LinKross **자체 매출** 구조(기업 구독료 + 프리랜서 수수료)를 정리한다. 발주자→프리랜서 간 마일스톤 지급(§5 결제 상태)과는 별개로, LinKross가 플랫폼 운영 대가로 받는 돈을 다룬다. LinKross는 에스크로를 보유하지 않는다는 원칙(CLAUDE.md §9)은 이 수익 모델에도 그대로 적용된다 — 실제 자금 흐름은 밖에서 일어나고, LinKross는 상태와 금액만 기록한다.

## 1. 한눈에 보는 구조

| 대상 | 항목 | 방식 |
|---|---|---|
| 기업(발주자) | 구독료 | 상태/금액만 추적, 실결제 연동 없음, 아무것도 강제하지 않음 |
| 프리랜서 | 플랫폼 수수료 | 마일스톤 지급액의 **7%**, 지급 완료 시 자동 청구 생성, 자진신고 납부 |

둘 다 실제 PG(결제대행) 연동이 없는 **MVP 단계**다. 실제 돈은 오가지 않고, "이만큼 내야 한다"는 기록과 화면만 존재한다.

## 2. 프리랜서 수수료

### 2.1 언제, 얼마나 청구되나
- 마일스톤 지급(`payments.status`)이 `completed`가 되는 순간, DB 트리거가 자동으로 `commission_charges` 행을 만든다.
- 청구액 = 마일스톤 지급액(공급가액) × **7%**.
- VAT는 별도로 10% 더 계산해서 같이 보여준다 — 단, **LinKross는 아직 사업자등록 전이라 실제 과세 근거는 없다.** "일반과세자라면 이럴 것이다"를 가정한 **가안(假案) 표시**이며, 실제 서비스처럼 보이게 하려는 데모/포트폴리오 목적이다. 사업자등록 여부가 정해지면 이 부분부터 다시 정리해야 한다.

```
수수료 공급가액 (7%)   140,000원
부가세 (10%, 가안)      14,000원
──────────────────────────────
합계                   154,000원
```

### 2.2 어떻게 납부하나
LinKross가 에스크로를 쥐고 있지 않아서 실제 입금을 자동으로 검증할 방법이 없다. 그래서 **자진신고제**로 설계했다:
1. 프리랜서가 `/freelancer/commissions` 화면에서 미납 청구 목록을 본다.
2. 자기 방식(계좌이체 등)으로 납부한다.
3. 화면에서 납부확인번호(이체 메모, 영수증 번호 등)를 입력하고 "납부완료 신고"를 누른다.
4. 회사/관리자의 별도 확인 단계는 **없다** — 자진신고가 그대로 최종 상태가 된다.

`reviewed_by`/`reviewed_at` 컬럼은 스키마에 미리 만들어뒀다. 나중에 확인 단계를 추가하고 싶으면 마이그레이션 없이 그 컬럼을 쓰면 된다.

### 2.3 미납 시 제재 — 설계는 됐지만 지금은 꺼둔 상태

원래 설계한 단계적 제재:
1. 연체 즉시 → 새 프로젝트 지원(수행 제안서 제출) 차단
2. 14일 유예 후에도 미납 → 이미 진행 중인 프로젝트의 새 마일스톤 제출까지 차단

발주자는 잘못이 없는데 마일스톤 제출이 막히면 피해를 보니, 두 단계를 나눠서 초반엔 신규 관계에만 영향을 주고 진행 중인 프로젝트는 최대한 늦게 건드리도록 설계했다.

**다만 지금은 이 제재가 실제로 작동하지 않는다.** 팀이 직접 검수/QA하는 단계라 미납 수수료 때문에 실수로 막히면 오히려 방해가 되기 때문이다. [`src/config/commission-status.ts`](../src/config/commission-status.ts)의 `COMMISSION_ENFORCEMENT_ENABLED = false`로 꺼놨고, DB 트리거/RLS도 [`fix_disable_commission_enforcement.sql`](../supabase/fix_disable_commission_enforcement.sql)로 원래대로 되돌려놨다. 미납 표시·자진신고·대시보드 배너 같은 **추적용 UI는 그대로 다 동작**하고, 실제로 막는 부분만 비활성화된 상태다.

나중에 실제로 켜려면:
- `COMMISSION_ENFORCEMENT_ENABLED`를 `true`로 변경
- `fix_add_commission_and_subscription.sql`에 있던 `prepare_proposal_insert()` 트리거 / `proposals_freelancer_insert` RLS 정의를 다시 실행

## 3. 기업 구독료

- ~~플랜 티어는 안 만든다~~ → **프로젝트 개수 기준 3단계 티어제로 변경** ([`src/config/subscription-plan.ts`](../src/config/subscription-plan.ts)). 처음엔 요청받은 적 없어서 상태/금액만 추적하는 단일 레코드로 시작했는데, 이후에 "구독 저장 화면에 지금 어떤 플랜을 쓰는지 보여달라"는 요청으로 다시 넣었다.

| 플랜 | 기준 | 월 금액 |
|---|---|---|
| Starter | 프로젝트 1개 | 49,000원 |
| Growth | 프로젝트 2~5개 | 99,000원 |
| Scale | 프로젝트 6개 이상 | 199,000원 |

- 회사의 **현재 프로젝트 개수**를 실시간으로 세서 추천 플랜을 계산하고(`recommendedPlanId`), `/company/settings`에서 3개 플랜 카드와 함께 보여준다. 추천 플랜과 실제 구독 중인 플랜이 다르면(예: 프로젝트를 추가로 만들어서 등급이 바뀜) "추천 플랜으로 갱신" 버튼이 뜬다.
- `subscriptions` 테이블은 회사당 1행 — 실제로 구독을 "확정"한 시점의 `plan_id`/금액/상태(`active`/`past_due`/`cancelled`)를 스냅샷으로 저장한다. 금액은 항상 플랜별 고정가(`SUBSCRIPTION_PLAN_TIERS`)에서 가져오고, 사용자가 직접 숫자를 입력하지 않는다.
- **이번 스코프에서는 구독 상태가 아무것도 막지 않는다.** 나중에 "구독 만료 시 접근 제한" 같은 로직을 붙일 확장 지점으로만 존재한다.
- 여전히 실제 결제 연동은 없다 — "구독 시작하기"를 눌러도 상태값만 기록된다.

### 3.1 가격을 얼마로 잡을지 (참고용 추천치)

AI 사용 지점 4곳(SOW 초안 생성, 검수 가이드 생성, 완료조건→테스트 변환: gpt-4o / 프리랜서 화면 번역: gpt-4o-mini)의 원가를 대략 계산하면:

- 프로젝트 1건(SOW~마일스톤 8개 검수 완료)당 AI 원가 약 **$0.5**
- 안전마진 포함해도 프로젝트당 약 1,500~2,000원 수준
- 기업이 월 1~2개 프로젝트를 굴린다고 가정하면 **AI 원가는 기업당 월 3,000~5,000원 정도** — 인프라 원가(Supabase, 호스팅 등)를 더해도 월 1만원 안쪽

즉 가격은 원가가 아니라 "PM/QA 인력 없이 외주를 검증하는 가치"로 매기는 게 맞다. COGS 대비 최소 10배 마진이 SaaS 업계 관행인 걸 감안해서, 프로젝트 개수가 늘수록(=플랫폼 의존도가 높아질수록) 가격도 같이 올라가는 3단계 구조(Starter 49,000원 / Growth 99,000원 / Scale 199,000원)로 확정했다. MVP가 아직 시장 검증 전이라, 초기 몇 달은 무료 체험 또는 더 낮은 가격으로 어답션을 우선하는 것도 고려할 만하다.

**이 숫자는 참고치이며 최종 확정은 팀 논의로 결정해야 한다.**

## 4. 영수증/증빙에 반영된 내용

- 발주자용 지급 영수증([`receipt-document.tsx`](../src/components/project/payment/receipt-document.tsx))에 "플랫폼 수수료 안내" 섹션 추가 — 프리랜서가 부담하는 수수료(공급가액/VAT/합계)를 보여주되, "발주자가 지급한 금액에서 추가로 차감되지 않는다"는 문구로 오해를 방지했다.
- VAT 표시에는 항상 "*LinKross는 아직 사업자등록 전으로 실제 세금계산서 발행 근거는 없습니다"라는 단서를 붙였다.

## 5. 데이터 모델

새로 추가된 테이블 2개 (자세한 컬럼은 SQL 파일 참고):

- **`commission_charges`** — 마일스톤 지급 1건당 1행. `base_amount`(마일스톤 지급액), `commission_rate`(7%, 스냅샷), `commission_amount`, `vat_amount`, `status`(pending/paid/waived), `payment_method`(wallet_testnet/bank_transfer/card/other), `tx_hash`/`to_address`/`block_number`(지갑 결제 시 온체인 검증 정보), `due_at`, `paid_at`, `paid_reference`.
- **`subscriptions`** — 회사당 1행. `plan_id`(starter/growth/scale, 스냅샷), `status`, `amount`, `currency`, `period_start_at`/`period_end_at`.

## 6. 실행해야 할 SQL (순서대로)

Supabase SQL Editor에서 아래 순서로 실행:

1. [`supabase/fix_add_commission_and_subscription.sql`](../supabase/fix_add_commission_and_subscription.sql) — 테이블/트리거/RLS 기본 생성
2. [`supabase/fix_add_commission_vat.sql`](../supabase/fix_add_commission_vat.sql) — VAT 컬럼 추가 + 트리거에 VAT 계산 반영
3. [`supabase/fix_disable_commission_enforcement.sql`](../supabase/fix_disable_commission_enforcement.sql) — 실제 차단 로직을 원래대로 되돌림(QA 편의)
4. [`supabase/fix_backfill_commission_charges.sql`](../supabase/fix_backfill_commission_charges.sql) — 트리거 설치 전에 이미 completed였던 결제 건 소급 처리(일회성)
5. [`supabase/fix_commission_wallet_payment.sql`](../supabase/fix_commission_wallet_payment.sql) — 수수료도 지갑 결제 가능하도록 컬럼 추가
6. [`supabase/fix_add_subscription_plan.sql`](../supabase/fix_add_subscription_plan.sql) — 구독 플랜 티어(`plan_id`) 컬럼 추가

## 7. 이번 스코프에서 명시적으로 제외한 것

- 실제 PG(Stripe/토스페이먼츠 등) 연동, 자동 청구/빌링 루프
- 구독 상태·플랜에 따른 기능 제한(만료 시 접근 제한 등)
- 회사/관리자의 수수료 납부 확인 리뷰 단계 (컬럼만 존재, 로직 없음)
- 프로젝트별/프리랜서별 차등 수수료율 (전역 고정 7%만)
- 미납 제재의 실제 작동 (설계·코드는 있지만 꺼둔 상태)
- 정식 세금계산서 발행 (VAT는 가안 표시일 뿐)

## 8. 팀에서 논의하면 좋을 열린 질문

- 구독 결제 주기(월/분기) 및 프로젝트가 "진행 중"에서 빠질 때(완료/취소) 티어를 어떻게 재계산할지
- LinKross 사업자등록 여부와 시점 — 정해지면 VAT/세금계산서 처리 방식을 다시 설계해야 함
- 미납 제재를 실제로 언제부터 켤지 (베타 오픈 전? 특정 사용자 규모 이후?)
- 수수료 자진신고를 계속 신뢰 기반으로 갈지, 회사/관리자 확인 단계를 넣을지
