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
| **M1** | System Architecture & ERD | Approved Technical Spec Document & DB Schema | YYYY-MM-DD |
| **M2** | Core API Development | Backend APIs for User & Payment Services | YYYY-MM-DD |
| **M3** | Final Acceptance Testing | QA Test execution & bug fixes (Defect Rate < 2%) | YYYY-MM-DD |

## 4. Acceptance Criteria & Definition of Done (DoD)
* **Acceptance Criteria:**
  * Given valid credentials, when a user logs in, then a JWT token with appropriate RBAC permissions must be returned within 200ms.
* **Definition of Done (DoD):**
  * Unit test coverage >= 80%.
  * All REST APIs documented in OpenAPI Specification (Swagger).
  * Data encryption (AES-256) applied to PII fields.

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