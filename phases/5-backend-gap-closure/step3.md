# Step 3: github-submission-and-verification-records

## 결과

- 발주자가 공개 공식 저장소를 연결하고 프리랜서가 그 저장소의 PR만 제출한다.
- GitHub API에서 실제 head Commit SHA를 확인해 불변 제출 기록으로 저장한다.
- 검수 요청은 멱등 대기열과 attempt로 기록하며 실제 Runner 결과를 꾸미지 않는다.
- 결과·증거 조회, 수정 요청과 사람의 최종 승인을 연결했다.
