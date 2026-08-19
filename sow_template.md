# STATEMENT OF WORK (SOW)

**Project Name:** [Project Name]
---
**Client:** [Client Company Name]
---
**Vendor/Provider:** [Vendor Company Name]
---
**Effective Date:** [YYYY-MM-DD]~ [YYYY-MM-DD]
---

## 1. Project Overview & Objectives
- **Background:** Context on why this system/product is being developed.
- **Objective:** Briefly describe the business goal of this project.


## 2. Scope of Work

### 2.1 In-Scope (Included)
* [Feature 1]: e.g., Implement User Authentication via Naver OAuth 2.0 & PASS Verification.
* [Feature 2]: e.g., Build Transactional Approval Workflow with State Machine pattern.
* [Feature 3]: e.g., System performance supporting normal 100 TPS / peak 1,500 TPS.

### 2.2 Out-of-Scope (Excluded)
* Legacy data migration prior to 2020.
* Native mobile app development (Web responsive only).
* Third-party payment gateway integration other than Stripe.

## 3. Milestones

| Milestone ID | Key Deliverable | Description | Target Date |
| :--- | :--- | :--- | :--- |
| **M1** | 회원 가입 및 로그인 기능 | `/signup`, `/login` 화면 접근 및 권한 분리 처리 | YYYY-MM-DD |
| **M2** | 예약 목록 및 잔여 슬롯 조회 | `/reservations` 에서 다가오는/지난 예약 분리 노출 | YYYY-MM-DD |
| **M3** | 예약 접수 및 동시성 예외 처리 | 예약 시간 슬롯 선택 및 중복 신청 차단 기능 | YYYY-MM-DD |

## 4. Acceptance Criteria & Definition of Done (DoD)
* **Definition of Done (DoD) Examples:**
  * **[M1]**: `/login`에서 이메일 폼 누락 시 "이메일을 입력해주세요" 에러 메시지 노출 확인 (실패 조건 분리)
  * **[M1]**: `/login`에서 비밀번호 폼 누락 시 "비밀번호를 입력해주세요" 에러 메시지 노출 확인 (실패 조건 분리)
  * **[M1]**: 정상 로그인 성공 시 `/dashboard` 로 라우팅됨 (정확한 라우팅 명시)
  * **[M3]**: 이미 정원이 꽉 찬 시간 슬롯은 버튼이 비활성화됨 (관찰 가능한 UI 상태 변화)
  * **[M3]**: 정원이 꽉 찬 슬롯의 버튼 텍스트가 '마감'으로 변경됨 (조건별 독립적 분리)
  * **[M3]**: 중복 예약 시도 시 "이미 예약된 시간입니다" 에러 모달 표시 확인
  * **[M3]**: 중복 예약 시도 시 전체 예약 신청 카운트가 증가하지 않음 확인

## 5. Roles & Responsibilities (RACI Matrix)
* **Client Responsibilities:** Provide API keys, design assets (Figma), and review deliverables within 3 business days.
* **Vendor Responsibilities:** Execute development, provide weekly status reports, and perform QA testing.

## 6. Payment Schedule
* **Milestone 1 (Kickoff & Arch Approval):** 30% of total budget
* **Milestone 2 (Beta Release & API Delivery):** 40% of total budget
* **Milestone 3 (Final Sign-off & Production Deployment):** 30% of total budget

---

## 7. Deliverables
* Specific deliverables to be submitted, such as source code, documentation, design files, and test reports.

---
**Signatures:**
Client Representative: _______________ (Date: ________)
Vendor Representative: _______________ (Date: ________)