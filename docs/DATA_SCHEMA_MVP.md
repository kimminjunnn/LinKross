# LinKross MVP 데이터 스키마

기준일: 2026-08-13

## MVP 결정

- `organizations`, `organization_members`는 만들지 않는다.
- `projects.company_id`가 프로젝트를 등록한 기업 사용자의 `profiles.id`를 가리킨다.
- 한 사용자는 `user_roles`를 통해 기업과 프리랜서 역할을 모두 보유할 수 있다.
- `profiles.active_role`은 기본 진입 화면일 뿐 권한의 근거로 사용하지 않는다.
- 권한은 `user_roles`, 프로젝트 소유자, 선정된 제안서 관계로 판단한다.

## 데이터 흐름

```text
profiles / user_roles
  ├─ company_profiles
  └─ freelancer_profiles

projects
  ├─ project_requirement_versions
  ├─ project_files
  ├─ proposals
  │    └─ selections
  └─ sow_versions
       ├─ sow_approvals
       ├─ sow_revision_requests
       ├─ milestones
       │    ├─ completion_criteria
       │    ├─ milestone_submissions
       │    │    ├─ milestone_submission_criteria
       │    │    └─ verification_runs
       │    │         ├─ criterion_results
       │    │         └─ evidence_artifacts
       │    ├─ milestone_decisions
       │    └─ invoices
       │         └─ payments
       └─ project_repositories

projects
  ├─ evidence_bundles
  └─ audit_events
```

## 핵심 규칙

### 프로젝트와 요구사항

- `create_project_with_requirements` RPC가 프로젝트와 요구사항 `v1`을 한 트랜잭션에서 생성한다.
- 모집 중 요구사항 변경은 `update_project_requirements` RPC가 새 버전 생성과 현재 버전 포인터 갱신을 한 번에 처리한다.
- 지원자는 제출 당시의 `requirement_version_id`에 연결된다.
- 이미 발행된 요구사항 버전은 수정하거나 삭제할 수 없다.

### 수행 제안서와 선정

- 프로젝트와 프리랜서 조합은 한 번만 제출할 수 있다.
- 제출된 `content`와 프로필 스냅샷은 수정할 수 없다.
- 철회는 원문을 삭제하지 않고 `withdrawn` 상태로 남긴다.
- 프로젝트당 선정 기록은 한 건만 허용한다.
- `(proposal_id, project_id)` 복합 FK로 다른 프로젝트의 제안서를 선정할 수 없다.

### SOW와 승인

- SOW는 `draft → in_review → approved` 또는 `draft → in_review → revision_requested`로 관리한다.
- 마일스톤과 완료조건은 SOW 초안일 때만 수정할 수 있다.
- 모든 완료조건은 반드시 하나의 마일스톤에 속한다. 프로젝트 전체 공통 조건은 마지막 마일스톤에 배정한다.
- 기업과 선정 프리랜서가 동일한 `content_hash`를 승인해야 고정된다.
- 양측 승인 후 프로젝트는 `in_progress`로 전환된다.
- 승인된 마일스톤은 상태만 바꿀 수 있고 일정·금액·완료조건은 변경할 수 없다.
- SOW 수정 요청은 `sow_revision_requests`에 결정자, 역할, 당시 `content_hash`, 사유와 시각을 append-only로 남긴다.
- 수정 요청된 SOW 버전은 고정하며 수정 내용을 반영할 때는 새 `sow_versions` 행을 만든다.
- 같은 역할은 한 SOW 버전에 승인 또는 수정 요청 중 하나의 검토 결정만 남길 수 있다.

### 검수

- 프로젝트당 GitHub 저장소 한 개를 우선 지원한다.
- 마일스톤 제출은 PR과 40자리 Commit SHA에 고정한다.
- 재제출은 기존 행을 수정하지 않고 `attempt_number`를 증가시킨다.
- 재검수도 새 `verification_runs` 행을 만든다.
- 완료조건별 결과와 스크린샷·영상·Trace·로그를 별도 저장한다.
- 자동 결과는 최종 승인을 만들지 않는다. `milestone_decisions`에 사람의 결정을 기록한다.

### 지급과 증빙

- 인보이스 상태와 지급 상태를 분리한다.
- 기존 `payments.milestone_id text`는 호환을 위해 유지한다.
- 새 코드는 `project_id`, `milestone_record_id`, `invoice_id`를 함께 저장한다.
- 기존의 전체 로그인 사용자 지급 조회 정책은 프로젝트 참여자 기준으로 교체한다.

## 상태 구분

`projects.status`는 모집 상태다.

```text
recruiting → closed
```

`projects.lifecycle_stage`는 선정 이후 프로젝트 진행 상태다.

```text
preparing → in_progress → completed
                    ├─ cancelled
                    └─ archived
```

검수 상태와 지급 상태는 서로 다른 enum을 사용한다.

## Storage 경로 규칙

모든 비공개 파일은 첫 번째 폴더를 프로젝트 UUID로 사용한다.

```text
linkross-project-files/{project_id}/{file_uuid}-{original_name}
linkross-evidence/{project_id}/{verification_run_id}/{artifact_name}
linkross-invoices/{project_id}/{invoice_id}/{file_name}
```

## 적용 방법

1. Supabase Dashboard에서 SQL Editor를 연다.
2. `supabase/mvp_domain_schema.sql` 전체를 붙여넣는다.
3. Run을 한 번 누른다.
4. `supabase/mvp_schema_fix_v2.sql` 전체를 새 Query에 붙여넣고 Run을 한 번 누른다.
5. v2 마지막 결과가 `true`, `true`, `0`인지 확인한다.
6. `supabase/mvp_schema_fix_v3_sow_revision_requests.sql` 전체를 새 Query에 붙여넣고 Run을 한 번 누른다.
7. v3 마지막 결과가 `true`, `false`, `false`, `true`, `0`인지 확인한다.
8. 오류가 발생하면 반복 실행하지 말고 오류 전문을 공유한다. 각 스크립트가 트랜잭션으로 묶여 있어 오류 시 해당 실행의 변경은 롤백된다.

v2 적용 후 프로젝트 등록 내용의 단일 진실 소스는 `project_requirement_versions`다.
`projects`에는 소유권, 모집·진행 상태와 `current_requirement_version_id`만 남는다.
새 프로젝트 생성과 요구사항 수정은 각각 `create_project_with_requirements`,
`update_project_requirements` RPC를 사용한다.

기존 `schema.sql`, `onboarding_profiles.sql`, `payments.sql`은 다시 실행하지 않는다.

## 애플리케이션 연결 우선순위

1. `projects`, `project_requirement_versions`, `project_files`
2. `proposals`, `selections`
3. `sow_versions`, `milestones`, `completion_criteria`, `sow_approvals`
4. `project_repositories`, `milestone_submissions`, `verification_runs`
5. `criterion_results`, `evidence_artifacts`, `milestone_decisions`
6. `invoices`, `payments`, `evidence_bundles`

스키마를 모두 생성하더라도 내일 구현 목표는 1~2번 흐름까지로 제한한다.
