# Step 1: recruitment-and-workspace-reads

## 결과

- 모집, 제안서, 선정, 기업/프리랜서 목록과 대시보드를 실제 DB 조회로 교체했다.
- 프로젝트 참고자료를 Storage와 `project_files`에 연결했다.
- 구형 mock 데이터와 legacy assessment 화면은 제거하거나 실제 경로로 redirect했다.

## 검증

- 비개발자용 기업 화면은 다음 행동을 한국어로, 프리랜서 화면은 영어로 표시한다.
- 제안서 원문과 제출 후 상태는 DB만 사용한다.
