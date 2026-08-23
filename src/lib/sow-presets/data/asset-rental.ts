/**
 * 생성 파일 — 손으로 고치지 마세요.
 *
 * eval/presets/asset-rental.preset-source.json와 eval/presets/asset-rental.txt에서 eval/presets/build-sow-preset.mjs가 만들었습니다.
 * 완료조건이나 실행 스펙을 바꾸려면 원천 파일을 고치고 생성기를 다시 돌립니다.
 */
import type { SowPreset } from "@/lib/sow-presets/types";

const SOURCE_TEXT = `저희는 직원 20명 정도 되는 회사인데, 공용으로 쓰는 노트북과 모니터, 촬영용 카메라,
회의실 프로젝터 같은 비품을 총무팀 한 명이 엑셀로 관리하고 있습니다.

지금은 슬랙에 "이번 주에 카메라 쓸 수 있나요?" 하고 물어보면 총무 담당자가 엑셀을
열어보고 답해주는 식입니다. 담당자가 외근이면 아무도 모르고, 빌려주고 나서 엑셀에
적는 걸 깜빡하면 같은 장비를 두 사람이 빌려간 걸로 되어 있는 일이 한 달에 두세 번은
생깁니다. 그때마다 누가 먼저 말했느냐로 얼굴을 붉히게 됩니다.

거창한 자산관리 시스템을 원하는 게 아닙니다. 직원이 스스로 "이거 지금 빌릴 수 있나,
누가 갖고 있나"를 확인하고 신청까지 넣고, 총무팀은 들어온 신청을 승인하거나 반려하기만
하면 되는 화면 몇 개면 충분합니다.

전체 흐름은 이렇게 생각하고 있습니다. 사원이 로그인해서 비품 목록을 보고, 필요한 걸
골라 사유를 적어 신청하면, 총무팀이 승인 화면에서 승인하거나 반려합니다. 승인된 비품은
목록에서 대여중으로 남고, 반려된 비품은 다시 대여 가능으로 풀립니다.

저희 쪽에 개발을 아는 사람이 없어서, 한 번에 다 만들어서 주시면 무엇이 되고 무엇이
안 되는지 저희가 확인할 방법이 없습니다. 그래서 아래처럼 세 단계로 나눠서 단계마다
Pull Request 하나씩 올려주시고, 저희가 그 단계만 확인한 뒤 다음으로 넘어가는 방식으로
진행하고 싶습니다.


[1단계] 로그인과 비품 목록 화면

회원가입은 필요 없습니다. 직원 계정은 저희가 미리 만들어 드릴 테니 이메일과 비밀번호로
로그인만 되면 됩니다. 로그인에 성공하면 곧바로 비품 목록 화면이 열렸으면 합니다.

비밀번호를 잘못 입력했는데 화면에 아무 반응이 없으면 저희에게 문의가 옵니다. 왜 로그인이
안 되는지 오류 메시지가 화면에 보여야 합니다. 이메일을 아예 비워둔 채로 로그인을 눌렀을
때도 그냥 넘어가지 않고, 마찬가지로 오류 메시지를 보여주면서 막아 주세요.

그리고 이건 꼭 지켜졌으면 하는 부분인데, 로그인하지 않은 사람이 주소를 알아내서 비품
목록 화면으로 바로 들어오는 일이 없어야 합니다. 사내 장비 현황이라 외부에 보이면
곤란합니다. 그런 경우에는 로그인 화면으로 돌려보내 주세요.

목록 화면에는 비품을 표로 보여주시면 됩니다. 컬럼은 '비품명', '분류', '상태' 세 개면
충분하고, 상태는 '대여 가능'과 '대여중' 두 가지로만 보여주세요.

목록 위에는 '전체', '대여 가능', '대여중' 버튼을 두어 걸러 볼 수 있으면 좋겠습니다.
'대여 가능'을 누르면 빌릴 수 있는 비품만, '대여중'을 누르면 이미 나가 있는 비품만,
'전체'를 누르면 모든 비품이 보이는 식입니다. 직원들이 가장 많이 쓸 기능이 "지금 빌릴
수 있는 것만 보기"라서 이건 꼭 있어야 합니다.


[2단계] 비품 신청과 내 신청 내역 화면

목록 화면에 '비품 신청' 버튼을 두고, 누르면 신청 창이 뜨는 형태를 생각하고 있습니다.
신청 창에서는 '비품'을 고르고 '신청 사유'를 적게 해주세요. 이미 나가 있는 장비를 고를
수 있으면 의미가 없으니, 비품을 고르는 목록에는 '대여 가능'인 것만 나오고 '대여중'인
비품은 아예 보이지 않아야 합니다.

비품을 고르지 않은 상태에서는 '신청하기' 버튼을 누를 수 없게 해주세요. 마찬가지로
'신청 사유'를 적지 않은 상태에서도 '신청하기'를 누를 수 없어야 합니다. 사유가 빈 신청이
올라오면 총무팀이 판단할 근거가 없습니다. 반대로 사유를 너무 길게 쓰는 것도 곤란해서,
100자를 넘겨서 '신청하기'를 누르면 신청을 받지 말고 오류 문구를 보여주세요.

신청을 넣고 나서 접수가 된 건지 아닌지 몰라 같은 신청을 또 하는 일이 없도록,
"신청이 접수되었습니다" 처럼 접수됐다는 문구를 보여주세요. 화면을 옮길 필요는 없고
비품 목록 화면에 그대로 보이면 됩니다. 그리고 신청이 들어간 비품은 목록에서 곧바로
'대여중'으로 바뀌어야 합니다. 그래야 다른 직원이 같은 장비를 중복으로 신청하지 않습니다.

내가 넣은 신청을 확인하는 화면도 필요합니다. 컬럼은 '비품명', '신청 사유', '상태'로
하고, 상태는 '승인 대기', '승인 완료', '반려됨' 세 가지로 구분해 주세요. 여기는 본인이
낸 신청만 보여야 하고, 다른 직원이 무엇을 신청했는지는 보이면 안 됩니다.

마음이 바뀌는 경우도 있어서, 아직 총무팀이 처리하지 않은 '승인 대기' 상태의 신청에는
'취소' 버튼이 있어서 본인이 무를 수 있으면 합니다. 취소한 비품은 비품 목록에서 다시
'대여 가능'으로 돌아가야 합니다.

아직 아무것도 신청하지 않은 직원이 이 화면에 들어오면 빈 표만 덩그러니 보일 텐데,
고장 난 줄 알 것 같습니다. "아직 신청한 비품이 없습니다" 같은 문구를 보여주세요.

이 화면도 로그인하지 않은 상태로 주소를 직접 입력해서 들어올 수 없어야 하고, 그런
경우에는 로그인 화면으로 돌려보내 주세요.


[3단계] 총무팀 승인 화면

총무 담당자가 쓸 화면입니다. 직원들이 넣은 신청을 전부 보여주는데, '신청자', '비품명',
'신청 사유', '상태'가 한 줄에 다 보여야 합니다. 아직 아무 신청도 들어오지 않았다면
"아직 들어온 신청이 없습니다" 같은 문구를 보여주세요.

'승인 대기'인 건에는 '승인'과 '반려' 버튼을 두고, 이미 처리한 건에는 두 버튼 다 없어야
합니다. 버튼이 그대로 남아 있으면 담당자가 실수로 또 누르게 됩니다. '승인'을 누르면 그
건의 상태가 '승인 완료'로 바뀌고, '반려'를 누르면 '반려됨'으로 바뀝니다.

반려한 비품은 비품 목록에서 다시 '대여 가능'으로 풀려서 다른 직원이 신청할 수 있어야
하고, 승인한 비품은 '대여중'으로 남아 있어야 합니다.

총무팀이 처리를 끝낸 뒤에는 사원이 그 신청을 무를 수 없어야 합니다. 내 신청 내역에서
'승인 완료'나 '반려됨'이 된 건에는 '취소' 버튼이 없어야 합니다. 총무팀이 승인했는데
뒤에서 사라지면 관리가 안 됩니다.

이 화면은 총무팀만 쓰는 화면입니다. 일반 직원 계정으로는 상단 메뉴에 '승인 관리'가 아예
보이지 않아야 합니다. 메뉴에 없다고 끝이 아니라, 주소를 직접 입력해서 들어오려고 해도
막고 비품 목록 화면으로 돌려보내면서 왜 막혔는지 안내 문구를 보여주세요. 직원 인사 관련
사유가 적힌 신청도 있을 수 있어서 이 부분은 꼭 확인하고 싶습니다.


[이번 범위에서 빼는 것]

회원가입과 비밀번호 재설정은 필요 없습니다. 계정은 저희가 직접 넣겠습니다. 비품을 새로
등록하거나 수정, 삭제하는 화면도 이번에는 만들지 않습니다. 비품 종류가 자주 바뀌지 않아서
당분간은 저희가 데이터를 직접 넣어도 됩니다. 반납 처리와 대여 기간, 연체 관리도 이번에는
빼겠습니다. 알림이나 사진 첨부도 지금은 필요 없습니다.


[화면 주소]

개발하시면서 물어보실 것 같아 화면 주소를 미리 정해뒀습니다. 이대로 만들어 주세요.

- /login : 로그인 화면
- /items : 비품 목록 화면
- /requests : 내 신청 내역 화면
- /admin : 총무팀 승인 화면
`;
const SOURCE_TEXT_EN = `We are a company of about 20 employees. Currently, a single member of our general affairs team manages shared equipment—such as laptops, monitors, cameras, and meeting room projectors—using an Excel spreadsheet.

Right now, the process involves someone asking on Slack, "Can I use the camera this week?" and the manager opening the Excel file to check and reply. If the manager is out of the office, no one knows the status. Furthermore, if they forget to log a rental in Excel after lending something out, we end up with double-bookings two or three times a month. Every time this happens, it leads to awkward conflicts over who requested it first.

We do not need a massive asset management system. A few simple screens will suffice: employees should be able to check "Is this available right now, and who has it?" and submit a request, while the general affairs team simply approves or rejects incoming requests.

We envision the overall flow as follows: An employee logs in, views the equipment list, selects an item, writes a reason, and submits a request. The general affairs team then approves or rejects it from an approval screen. Approved equipment remains marked as "Rented" on the list, while rejected equipment becomes "Available" again.

Since we do not have any developers on our team, we won't be able to verify what works and what doesn't if everything is built and delivered all at once. Therefore, we would like to divide the project into the following three phases, with one Pull Request submitted per phase so we can verify each step before moving on to the next.


### [Phase 1] Login and Equipment List Screen

We do not need a sign-up feature. We will pre-create employee accounts, so users only need to log in with their email and password. Upon a successful login, they should be redirected immediately to the equipment list screen.

If a user enters an incorrect password and nothing happens on the screen, they will contact us for support. Therefore, an error message explaining why the login failed must be displayed on the screen. Similarly, if they click log in with the email field left blank, prevent the submission and display an error message.

Crucially, users who are not logged in must not be able to access the equipment list screen directly by typing in the URL. Since this contains internal company equipment status, it must not be exposed externally. In such cases, redirect them back to the login screen.

On the list screen, display the equipment in a table. Three columns are sufficient: 'Equipment Name', 'Category', and 'Status'. The status should only have two values: 'Available' and 'Rented'.

At the top of the list, please provide 'All', 'Available', and 'Rented' buttons to filter the view. Clicking 'Available' should show only items that can be borrowed, 'Rented' should show only items currently checked out, and 'All' should show everything. Since "viewing only what is currently available" is the feature employees will use most, this is a must-have.


### [Phase 2] Equipment Request and My Requests Screen

We would like to have a 'Request Equipment' button on the list screen that opens a request modal or window when clicked. In this window, users should select the 'Equipment' and enter a 'Reason for Request'. It makes no sense to allow users to select equipment that is already checked out, so the selection dropdown must only display items that are 'Available' and completely hide those that are 'Rented'.

Prevent users from clicking the 'Submit Request' button if no equipment is selected. Similarly, they must not be able to submit if the 'Reason for Request' is left blank. If a request is submitted without a reason, the general affairs team has no basis for approval. Conversely, we want to avoid excessively long reasons, so if a user tries to submit a request exceeding 100 characters, block the submission and display an error message.

To prevent users from submitting duplicate requests because they are unsure if their submission went through, display a confirmation message such as "Your request has been submitted." There is no need to redirect the user; displaying this message on the equipment list screen is sufficient. Additionally, the requested equipment's status must immediately change to 'Rented' on the list so other employees cannot submit duplicate requests for the same item.

We also need a screen where employees can check their own requests. The columns should be 'Equipment Name', 'Reason for Request', and 'Status', with the status categorized into 'Pending Approval', 'Approved', and 'Rejected'. This screen must only display requests made by the logged-in user; they should not be able to see other employees' requests.

Since people sometimes change their minds, we want a 'Cancel' button for requests that are still 'Pending Approval' (not yet processed by the general affairs team) so users can retract them. Once canceled, the equipment's status must revert to 'Available' on the equipment list.

If an employee who hasn't requested anything yet visits this screen, a blank table might make them think the system is broken. Please display a message like "You have not requested any equipment yet."

This screen must also be inaccessible via direct URL entry if the user is not logged in; redirect unauthorized users to the login screen.


### [Phase 3] General Affairs Approval Screen

This screen is for the general affairs manager. It should display all requests submitted by employees, showing 'Requester', 'Equipment Name', 'Reason for Request', and 'Status' all in a single row. If no requests have been submitted yet, display a message like "No requests received yet."

For requests that are 'Pending Approval', display 'Approve' and 'Reject' buttons. Once a request has been processed, both buttons must disappear to prevent the manager from accidentally clicking them again. Clicking 'Approve' changes the status to 'Approved', and clicking 'Reject' changes it to 'Rejected'.

Rejected equipment must be released back to 'Available' on the equipment list so other employees can request it, while approved equipment must remain 'Rented'.

Once the general affairs team has processed a request, the employee must not be able to retract it. The 'Cancel' button must disappear for requests marked 'Approved' or 'Rejected' on the employee's "My Requests" screen. If a request disappears after being approved, it becomes impossible to manage.

This screen is strictly for the general affairs team. For regular employee accounts, the 'Approval Management' menu must not be visible in the top navigation bar. Furthermore, if they attempt to access the page by typing the URL directly, block the access, redirect them to the equipment list screen, and display an explanation of why they were blocked. We want to ensure this is secure, as some requests may contain sensitive HR-related reasons.


### [Out of Scope for This Version]

Sign-up and password reset features are not required; we will populate the accounts directly. Screens for registering, editing, or deleting equipment are also out of scope for now, as our inventory does not change frequently and we can manage the data directly for the time being. Return processing, rental periods, overdue management, notifications, and photo attachments are also excluded from this scope.


### [Page URLs]

To avoid any confusion during development, we have pre-defined the page URLs. Please build them accordingly:

- \`/login\` : Login Screen
- \`/items\` : Equipment List Screen
- \`/requests\` : My Requests Screen
- \`/admin\` : General Affairs Approval Screen`;


export const ASSET_RENTAL_PRESET: SowPreset = {
    "id": "asset-rental",
    "label": "사내 비품 대여 관리",
    "provenance": "eval/presets/asset-rental.preset-source.json에서 생성. 대상 저장소 kimminjunnn/linkross-github-app-test. 자동 41개는 eval/presets/verify-preset-locally.mjs로 실제 브라우저 통과를 확인했다. 영문 초안·요약은 gemini-3.5-flash로 2026-08-23에 생성. 사람이 읽고 확정한 값이다.",
    "sourceText": SOURCE_TEXT,
    "sourceTextEn": SOURCE_TEXT_EN,
    "milestones": [
      {
        "code": "M1",
        "title": "로그인과 비품 목록 화면",
        "period": "26.08.22 - 26.08.28",
        "amount": "3000",
        "dods": [
          {
            "description": "/login에서 이메일과 비밀번호 입력 후 로그인 시 /items로 이동 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/login",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/login",
              "testContract": {
                "version": 1,
                "startPath": "/login",
                "scenario": "navigation",
                "precondition": "로그아웃 상태",
                "fixture": "테스트 계정의 이메일과 비밀번호",
                "action": "로그인 버튼 클릭",
                "target": "로그인 버튼",
                "input": "테스트 계정의 이메일과 비밀번호",
                "expected": "/items로 이동"
              },
              "testHint": "scenario: navigation / startPath: /login / precondition: 로그아웃 상태 / fixture: 테스트 계정의 이메일과 비밀번호 / action: 로그인 버튼 클릭 / target: 로그인 버튼 / input: 테스트 계정의 이메일과 비밀번호 / expected: /items로 이동 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/login에서 비밀번호를 잘못 입력 후 로그인 시도 시 오류 메시지 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/login",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "invalidPassword"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/login"
                },
                {
                  "atom": "expect_error_feedback"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/login",
              "testContract": {
                "version": 1,
                "startPath": "/login",
                "scenario": "validation_error",
                "precondition": "로그아웃 상태",
                "fixture": "테스트 계정의 이메일과 잘못된 비밀번호",
                "action": "로그인 버튼 클릭",
                "target": "로그인 버튼",
                "input": "잘못된 비밀번호",
                "expected": "/login에 머무르며 오류 메시지 표시"
              },
              "testHint": "scenario: validation_error / startPath: /login / precondition: 로그아웃 상태 / fixture: 테스트 계정의 이메일과 잘못된 비밀번호 / action: 로그인 버튼 클릭 / target: 로그인 버튼 / input: 잘못된 비밀번호 / expected: /login에 머무르며 오류 메시지 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/login에서 이메일 미입력 상태로 로그인 시도 시 오류 메시지 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/login",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/login"
                },
                {
                  "atom": "expect_error_feedback"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/login",
              "testContract": {
                "version": 1,
                "startPath": "/login",
                "scenario": "validation_error",
                "precondition": "로그아웃 상태",
                "fixture": "비밀번호만 입력한 로그인 폼",
                "action": "로그인 버튼 클릭",
                "target": "로그인 버튼",
                "input": "이메일 미입력",
                "expected": "/login에 머무르며 오류 메시지 표시"
              },
              "testHint": "scenario: validation_error / startPath: /login / precondition: 로그아웃 상태 / fixture: 비밀번호만 입력한 로그인 폼 / action: 로그인 버튼 클릭 / target: 로그인 버튼 / input: 이메일 미입력 / expected: /login에 머무르며 오류 메시지 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에 로그인하지 않은 상태로 접근 시 /login으로 리다이렉트 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/items"
                },
                {
                  "atom": "expect_path",
                  "path": "/login"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "access_control",
                "precondition": "로그아웃 상태",
                "action": "/items 주소 직접 입력",
                "target": "비품 목록 화면",
                "expected": "/login으로 리다이렉트"
              },
              "testHint": "scenario: access_control / startPath: /items / precondition: 로그아웃 상태 / fixture:  / action: /items 주소 직접 입력 / target: 비품 목록 화면 / input:  / expected: /login으로 리다이렉트 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '비품명' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "expect_text",
                  "contains": "비품명",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "비품 목록 표 확인",
                "target": "비품 목록 표",
                "expected": "'비품명' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 비품 목록 표 확인 / target: 비품 목록 표 / input:  / expected: '비품명' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '분류' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "expect_text",
                  "contains": "분류",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "비품 목록 표 확인",
                "target": "비품 목록 표",
                "expected": "'분류' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 비품 목록 표 확인 / target: 비품 목록 표 / input:  / expected: '분류' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '상태' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "expect_text",
                  "contains": "상태",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "비품 목록 표 확인",
                "target": "비품 목록 표",
                "expected": "'상태' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 비품 목록 표 확인 / target: 비품 목록 표 / input:  / expected: '상태' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '전체' 버튼 클릭 시 '대여 가능' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "전체"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "대여 가능",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "list_filter",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'전체' 버튼 클릭",
                "target": "'전체' 필터 버튼",
                "expected": "비품 표에 '대여 가능' 문구 표시"
              },
              "testHint": "scenario: list_filter / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '전체' 버튼 클릭 / target: '전체' 필터 버튼 / input:  / expected: 비품 표에 '대여 가능' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '전체' 버튼 클릭 시 '대여중' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "전체"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "대여중",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "list_filter",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'전체' 버튼 클릭",
                "target": "'전체' 필터 버튼",
                "expected": "비품 표에 '대여중' 문구 표시"
              },
              "testHint": "scenario: list_filter / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '전체' 버튼 클릭 / target: '전체' 필터 버튼 / input:  / expected: 비품 표에 '대여중' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '대여 가능' 버튼 클릭 시 비품 표에 '대여중' 문구 미표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "대여 가능"
                  }
                },
                {
                  "atom": "expect_none_text",
                  "contains": "대여중",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "list_filter",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'대여 가능' 버튼 클릭",
                "target": "'대여 가능' 필터 버튼",
                "expected": "비품 표에 '대여중' 문구 미표시"
              },
              "testHint": "scenario: list_filter / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '대여 가능' 버튼 클릭 / target: '대여 가능' 필터 버튼 / input:  / expected: 비품 표에 '대여중' 문구 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '대여중' 버튼 클릭 시 비품 표에 '대여 가능' 문구 미표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "대여중"
                  }
                },
                {
                  "atom": "expect_none_text",
                  "contains": "대여 가능",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "list_filter",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'대여중' 버튼 클릭",
                "target": "'대여중' 필터 버튼",
                "expected": "비품 표에 '대여 가능' 문구 미표시"
              },
              "testHint": "scenario: list_filter / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '대여중' 버튼 클릭 / target: '대여중' 필터 버튼 / input:  / expected: 비품 표에 '대여 가능' 문구 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          }
        ]
      },
      {
        "code": "M2",
        "title": "비품 신청과 내 신청 내역 화면",
        "period": "26.08.29 - 26.09.04",
        "amount": "2500",
        "dods": [
          {
            "description": "/items에서 '비품 신청' 버튼 클릭 시 신청 창 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "expect_visible",
                  "target": {
                    "role": "dialog"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'비품 신청' 버튼 클릭",
                "target": "'비품 신청' 버튼",
                "expected": "신청 창 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '비품 신청' 버튼 클릭 / target: '비품 신청' 버튼 / input:  / expected: 신청 창 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 신청 창의 비품 선택 목록에 '대여 가능' 비품 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "맥북 프로 16인치",
                  "target": {
                    "role": "combobox"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "list_filter",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "신청 창의 비품 선택 목록 확인",
                "target": "비품 선택 목록",
                "expected": "'대여 가능' 상태 비품 표시"
              },
              "testHint": "scenario: list_filter / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 신청 창의 비품 선택 목록 확인 / target: 비품 선택 목록 / input:  / expected: '대여 가능' 상태 비품 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 신청 창의 비품 선택 목록에 '대여중' 비품 미표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "expect_none_text",
                  "contains": "회의용 무선 마이크",
                  "target": {
                    "role": "combobox"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "list_filter",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "신청 창의 비품 선택 목록 확인",
                "target": "비품 선택 목록",
                "expected": "'대여중' 상태 비품 미표시"
              },
              "testHint": "scenario: list_filter / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 신청 창의 비품 선택 목록 확인 / target: 비품 선택 목록 / input:  / expected: '대여중' 상태 비품 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 비품 미선택 상태로 '신청 사유' 입력 시 '신청하기' 버튼 비활성화 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "expect_disabled",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "validation_error",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'신청 사유'만 입력",
                "target": "'신청하기' 버튼",
                "input": "비품 미선택",
                "expected": "'신청하기' 버튼 비활성화"
              },
              "testHint": "scenario: validation_error / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '신청 사유'만 입력 / target: '신청하기' 버튼 / input: 비품 미선택 / expected: '신청하기' 버튼 비활성화 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '신청 사유' 미입력 상태에서 '신청하기' 버튼 비활성화 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "expect_disabled",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "validation_error",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "신청 창 열기",
                "target": "'신청하기' 버튼",
                "input": "'신청 사유' 미입력",
                "expected": "'신청하기' 버튼 비활성화"
              },
              "testHint": "scenario: validation_error / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 신청 창 열기 / target: '신청하기' 버튼 / input: '신청 사유' 미입력 / expected: '신청하기' 버튼 비활성화 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 '신청 사유' 100자 초과 입력 후 신청 시 오류 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용하기 위해 신청합니다. 촬영 업무에 사용하기 위해 신청합니다. 촬영 업무에 사용하기 위해 신청합니다. 촬영 업무에 사용하기 위해 신청합니다. 촬영 업무에 사용하기 위해 신청합니다. 촬영 업무에 사용하기 위해 신청합니다."
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "expect_error_feedback"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "validation_error",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'신청하기' 버튼 클릭",
                "target": "'신청하기' 버튼",
                "input": "100자를 넘는 신청 사유",
                "expected": "오류 문구 표시"
              },
              "testHint": "scenario: validation_error / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '신청하기' 버튼 클릭 / target: '신청하기' 버튼 / input: 100자를 넘는 신청 사유 / expected: 오류 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 신청 완료 시 '신청이 접수되었습니다' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "신청이 접수되었습니다"
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "취소"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "form_submission",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'신청하기' 버튼 클릭",
                "target": "'신청하기' 버튼",
                "expected": "'신청이 접수되었습니다' 문구 표시"
              },
              "testHint": "scenario: form_submission / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '신청하기' 버튼 클릭 / target: '신청하기' 버튼 / input:  / expected: '신청이 접수되었습니다' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 신청 완료 시 해당 비품 상태 '대여중'으로 변경 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "대여중"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "맥북 프로 16인치",
                  "target": {
                    "role": "table"
                  }
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "취소"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "state_change",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'신청하기' 버튼 클릭",
                "target": "신청한 비품의 상태",
                "expected": "'대여중'으로 변경"
              },
              "testHint": "scenario: state_change / startPath: /items / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '신청하기' 버튼 클릭 / target: 신청한 비품의 상태 / input:  / expected: '대여중'으로 변경 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/requests에서 본인이 신청한 내역만 표시 확인",
            "verificationMethod": "manual",
            "testSpec": {
              "version": 1,
              "kind": "manual_guidance",
              "location": "/requests 내 신청 내역",
              "method": "서로 다른 두 계정으로 각각 신청을 넣은 뒤 한 계정으로 로그인해 목록을 봅니다.",
              "expected": "로그인한 사람이 낸 신청만 보이고 다른 직원의 신청은 보이지 않습니다."
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "access_control",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "내 신청 내역 확인",
                "target": "신청 목록",
                "expected": "본인 신청만 표시"
              },
              "testHint": "scenario: access_control / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 내 신청 내역 확인 / target: 신청 목록 / input:  / expected: 본인 신청만 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "human_review_required",
              "humanReviewAccepted": true,
              "message": "발주자가 직접 확인하는 항목으로 확정했습니다."
            }
          },
          {
            "description": "/requests에서 '비품명' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "expect_text",
                  "contains": "비품명",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "내 신청 내역 표 확인",
                "target": "내 신청 내역 표",
                "expected": "'비품명' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 내 신청 내역 표 확인 / target: 내 신청 내역 표 / input:  / expected: '비품명' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/requests에서 '신청 사유' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "expect_text",
                  "contains": "신청 사유",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "내 신청 내역 표 확인",
                "target": "내 신청 내역 표",
                "expected": "'신청 사유' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 내 신청 내역 표 확인 / target: 내 신청 내역 표 / input:  / expected: '신청 사유' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/requests에서 '상태' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "expect_text",
                  "contains": "상태",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "내 신청 내역 표 확인",
                "target": "내 신청 내역 표",
                "expected": "'상태' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: 내 신청 내역 표 확인 / target: 내 신청 내역 표 / input:  / expected: '상태' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/requests에서 '승인 대기' 상태 신청에 '취소' 버튼 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "expect_text",
                  "contains": "승인 대기",
                  "target": {
                    "role": "table"
                  }
                },
                {
                  "atom": "expect_visible",
                  "target": {
                    "role": "button",
                    "name": "취소"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "취소"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'승인 대기' 상태 신청 줄 확인",
                "target": "'취소' 버튼",
                "expected": "'취소' 버튼 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '승인 대기' 상태 신청 줄 확인 / target: '취소' 버튼 / input:  / expected: '취소' 버튼 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/requests에서 '취소' 버튼 클릭 후 /items에서 해당 비품 상태 '대여 가능'으로 변경 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "취소"
                  }
                },
                {
                  "atom": "goto",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "대여 가능"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "맥북 프로 16인치",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "state_change",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'취소' 버튼 클릭",
                "target": "신청한 비품의 상태",
                "expected": "'대여 가능'으로 변경"
              },
              "testHint": "scenario: state_change / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '취소' 버튼 클릭 / target: 신청한 비품의 상태 / input:  / expected: '대여 가능'으로 변경 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/requests에 신청 내역이 없을 때 '아직 신청한 비품이 없습니다' 안내 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "expect_text",
                  "contains": "아직 신청한 비품이 없습니다",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "empty_state",
                "precondition": "신청 내역이 없는 계정으로 로그인한 상태",
                "action": "내 신청 내역 화면 열기",
                "target": "내 신청 내역 표",
                "expected": "'아직 신청한 비품이 없습니다' 안내 문구 표시"
              },
              "testHint": "scenario: empty_state / startPath: /requests / precondition: 신청 내역이 없는 계정으로 로그인한 상태 / fixture:  / action: 내 신청 내역 화면 열기 / target: 내 신청 내역 표 / input:  / expected: '아직 신청한 비품이 없습니다' 안내 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/requests에 로그인하지 않은 상태로 접근 시 /login으로 리다이렉트 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "expect_path",
                  "path": "/login"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "access_control",
                "precondition": "로그아웃 상태",
                "action": "/requests 주소 직접 입력",
                "target": "내 신청 내역 화면",
                "expected": "/login으로 리다이렉트"
              },
              "testHint": "scenario: access_control / startPath: /requests / precondition: 로그아웃 상태 / fixture:  / action: /requests 주소 직접 입력 / target: 내 신청 내역 화면 / input:  / expected: /login으로 리다이렉트 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          }
        ]
      },
      {
        "code": "M3",
        "title": "총무팀 승인 화면",
        "period": "26.09.05 - 26.09.12",
        "amount": "3500",
        "dods": [
          {
            "description": "/admin에서 '신청자' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "신청자",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "승인 관리 표 확인",
                "target": "승인 관리 표",
                "expected": "'신청자' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: 승인 관리 표 확인 / target: 승인 관리 표 / input:  / expected: '신청자' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '비품명' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "비품명",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "승인 관리 표 확인",
                "target": "승인 관리 표",
                "expected": "'비품명' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: 승인 관리 표 확인 / target: 승인 관리 표 / input:  / expected: '비품명' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '신청 사유' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "신청 사유",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "승인 관리 표 확인",
                "target": "승인 관리 표",
                "expected": "'신청 사유' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: 승인 관리 표 확인 / target: 승인 관리 표 / input:  / expected: '신청 사유' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '상태' 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "상태",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "승인 관리 표 확인",
                "target": "승인 관리 표",
                "expected": "'상태' 문구 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: 승인 관리 표 확인 / target: 승인 관리 표 / input:  / expected: '상태' 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에 신청 내역이 없을 때 '아직 들어온 신청이 없습니다' 안내 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "아직 들어온 신청이 없습니다",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "empty_state",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "승인 관리 화면 열기",
                "target": "승인 관리 표",
                "expected": "'아직 들어온 신청이 없습니다' 안내 문구 표시"
              },
              "testHint": "scenario: empty_state / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: 승인 관리 화면 열기 / target: 승인 관리 표 / input:  / expected: '아직 들어온 신청이 없습니다' 안내 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '승인 대기' 상태 신청에 '승인' 버튼 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "승인 대기",
                  "target": {
                    "role": "table"
                  }
                },
                {
                  "atom": "expect_visible",
                  "target": {
                    "role": "button",
                    "name": "승인"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'승인 대기' 상태 신청 줄 확인",
                "target": "'승인' 버튼",
                "expected": "'승인' 버튼 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '승인 대기' 상태 신청 줄 확인 / target: '승인' 버튼 / input:  / expected: '승인' 버튼 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '승인 대기' 상태 신청에 '반려' 버튼 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "승인 대기",
                  "target": {
                    "role": "table"
                  }
                },
                {
                  "atom": "expect_visible",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'승인 대기' 상태 신청 줄 확인",
                "target": "'반려' 버튼",
                "expected": "'반려' 버튼 표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '승인 대기' 상태 신청 줄 확인 / target: '반려' 버튼 / input:  / expected: '반려' 버튼 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '승인' 버튼 클릭 시 해당 신청 상태 '승인 완료'로 변경 확인",
            "verificationMethod": "manual",
            "testSpec": {
              "version": 1,
              "kind": "manual_guidance",
              "location": "/admin 승인 관리",
              "method": "'승인 대기' 상태 신청의 '승인' 버튼을 누릅니다.",
              "expected": "그 신청의 상태가 '승인 완료'로 바뀝니다."
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "state_change",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'승인' 버튼 클릭",
                "target": "신청 상태",
                "expected": "'승인 완료'로 변경"
              },
              "testHint": "scenario: state_change / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '승인' 버튼 클릭 / target: 신청 상태 / input:  / expected: '승인 완료'로 변경 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "human_review_required",
              "humanReviewAccepted": true,
              "message": "발주자가 직접 확인하는 항목으로 확정했습니다."
            }
          },
          {
            "description": "/admin에서 '반려' 버튼 클릭 시 해당 신청 상태 '반려됨'으로 변경 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "반려됨",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "state_change",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'반려' 버튼 클릭",
                "target": "신청 상태",
                "expected": "'반려됨'으로 변경"
              },
              "testHint": "scenario: state_change / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '반려' 버튼 클릭 / target: 신청 상태 / input:  / expected: '반려됨'으로 변경 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '승인 완료' 상태 신청에 '승인' 버튼 미표시 확인",
            "verificationMethod": "manual",
            "testSpec": {
              "version": 1,
              "kind": "manual_guidance",
              "location": "/admin 승인 관리",
              "method": "이미 처리되어 '승인 완료' 상태가 된 신청 줄을 봅니다.",
              "expected": "그 줄에는 '승인' 버튼이 표시되지 않습니다."
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'승인 완료' 상태 신청 줄 확인",
                "target": "'승인' 버튼",
                "expected": "'승인' 버튼 미표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '승인 완료' 상태 신청 줄 확인 / target: '승인' 버튼 / input:  / expected: '승인' 버튼 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "human_review_required",
              "humanReviewAccepted": true,
              "message": "발주자가 직접 확인하는 항목으로 확정했습니다."
            }
          },
          {
            "description": "/admin에서 '승인 완료' 상태 신청에 '반려' 버튼 미표시 확인",
            "verificationMethod": "manual",
            "testSpec": {
              "version": 1,
              "kind": "manual_guidance",
              "location": "/admin 승인 관리",
              "method": "이미 처리되어 '승인 완료' 상태가 된 신청 줄을 봅니다.",
              "expected": "그 줄에는 '반려' 버튼이 표시되지 않습니다."
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'승인 완료' 상태 신청 줄 확인",
                "target": "'반려' 버튼",
                "expected": "'반려' 버튼 미표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '승인 완료' 상태 신청 줄 확인 / target: '반려' 버튼 / input:  / expected: '반려' 버튼 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "human_review_required",
              "humanReviewAccepted": true,
              "message": "발주자가 직접 확인하는 항목으로 확정했습니다."
            }
          },
          {
            "description": "/admin에서 '반려됨' 상태 신청에 '승인' 버튼 미표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "반려됨",
                  "target": {
                    "role": "table"
                  }
                },
                {
                  "atom": "expect_hidden",
                  "target": {
                    "role": "button",
                    "name": "승인"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'반려됨' 상태 신청 줄 확인",
                "target": "'승인' 버튼",
                "expected": "'승인' 버튼 미표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '반려됨' 상태 신청 줄 확인 / target: '승인' 버튼 / input:  / expected: '승인' 버튼 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에서 '반려됨' 상태 신청에 '반려' 버튼 미표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "반려됨",
                  "target": {
                    "role": "table"
                  }
                },
                {
                  "atom": "expect_hidden",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "generic_ui",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "'반려됨' 상태 신청 줄 확인",
                "target": "'반려' 버튼",
                "expected": "'반려' 버튼 미표시"
              },
              "testHint": "scenario: generic_ui / startPath: /admin / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: '반려됨' 상태 신청 줄 확인 / target: '반려' 버튼 / input:  / expected: '반려' 버튼 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 반려된 비품 상태 '대여 가능'으로 변경 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                },
                {
                  "atom": "goto",
                  "path": "/items"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "대여 가능"
                  }
                },
                {
                  "atom": "expect_text",
                  "contains": "맥북 프로 16인치",
                  "target": {
                    "role": "table"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "state_change",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "반려 처리 후 비품 목록 확인",
                "target": "반려된 비품의 상태",
                "expected": "'대여 가능'으로 변경"
              },
              "testHint": "scenario: state_change / startPath: /items / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: 반려 처리 후 비품 목록 확인 / target: 반려된 비품의 상태 / input:  / expected: '대여 가능'으로 변경 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 승인된 비품 상태 '대여중'으로 유지 확인",
            "verificationMethod": "manual",
            "testSpec": {
              "version": 1,
              "kind": "manual_guidance",
              "location": "/admin 승인 관리 → /items 비품 목록",
              "method": "신청을 승인한 뒤 비품 목록 화면으로 이동합니다.",
              "expected": "승인한 비품의 상태가 '대여중'으로 남아 있습니다."
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "state_persistence",
                "precondition": "총무팀 계정으로 로그인한 상태",
                "action": "승인 처리 후 비품 목록 확인",
                "target": "승인된 비품의 상태",
                "expected": "'대여중' 유지"
              },
              "testHint": "scenario: state_persistence / startPath: /items / precondition: 총무팀 계정으로 로그인한 상태 / fixture:  / action: 승인 처리 후 비품 목록 확인 / target: 승인된 비품의 상태 / input:  / expected: '대여중' 유지 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "human_review_required",
              "humanReviewAccepted": true,
              "message": "발주자가 직접 확인하는 항목으로 확정했습니다."
            }
          },
          {
            "description": "/requests에서 '승인 완료' 상태 신청에 '취소' 버튼 미표시 확인",
            "verificationMethod": "manual",
            "testSpec": {
              "version": 1,
              "kind": "manual_guidance",
              "location": "/requests 내 신청 내역",
              "method": "총무팀이 처리해 '승인 완료' 상태가 된 신청 줄을 봅니다.",
              "expected": "그 줄에는 '취소' 버튼이 표시되지 않습니다."
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'승인 완료' 상태 신청 줄 확인",
                "target": "'취소' 버튼",
                "expected": "'취소' 버튼 미표시"
              },
              "testHint": "scenario: generic_ui / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '승인 완료' 상태 신청 줄 확인 / target: '취소' 버튼 / input:  / expected: '취소' 버튼 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "human_review_required",
              "humanReviewAccepted": true,
              "message": "발주자가 직접 확인하는 항목으로 확정했습니다."
            }
          },
          {
            "description": "/requests에서 '반려됨' 상태 신청에 '취소' 버튼 미표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/requests",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "비품 신청"
                  }
                },
                {
                  "atom": "select_option",
                  "target": {
                    "role": "combobox"
                  },
                  "value": {
                    "literal": "맥북 프로 16인치"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "label": "신청 사유"
                  },
                  "value": {
                    "literal": "촬영 업무에 사용"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "신청하기"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "literal": "admin@example.com"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "literal": "Admin1234!"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "반려"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "role": "button",
                    "name": "로그아웃"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/requests"
                },
                {
                  "atom": "expect_text",
                  "contains": "반려됨",
                  "target": {
                    "role": "table"
                  }
                },
                {
                  "atom": "expect_hidden",
                  "target": {
                    "role": "button",
                    "name": "취소"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/requests",
              "testContract": {
                "version": 1,
                "startPath": "/requests",
                "scenario": "generic_ui",
                "precondition": "테스트 계정으로 로그인한 상태",
                "action": "'반려됨' 상태 신청 줄 확인",
                "target": "'취소' 버튼",
                "expected": "'취소' 버튼 미표시"
              },
              "testHint": "scenario: generic_ui / startPath: /requests / precondition: 테스트 계정으로 로그인한 상태 / fixture:  / action: '반려됨' 상태 신청 줄 확인 / target: '취소' 버튼 / input:  / expected: '취소' 버튼 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/items에서 일반 직원 계정 로그인 시 상단 메뉴에 '승인 관리' 미표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/items",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "expect_hidden",
                  "target": {
                    "role": "link",
                    "name": "승인 관리"
                  }
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/items",
              "testContract": {
                "version": 1,
                "startPath": "/items",
                "scenario": "access_control",
                "precondition": "일반 직원 계정으로 로그인한 상태",
                "action": "상단 메뉴 확인",
                "target": "'승인 관리' 메뉴",
                "expected": "'승인 관리' 메뉴 미표시"
              },
              "testHint": "scenario: access_control / startPath: /items / precondition: 일반 직원 계정으로 로그인한 상태 / fixture:  / action: 상단 메뉴 확인 / target: '승인 관리' 메뉴 / input:  / expected: '승인 관리' 메뉴 미표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에 일반 직원 계정으로 직접 접근 시 /items로 이동 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "access_control",
                "precondition": "일반 직원 계정으로 로그인한 상태",
                "action": "/admin 주소 직접 입력",
                "target": "승인 관리 화면",
                "expected": "/items로 이동"
              },
              "testHint": "scenario: access_control / startPath: /admin / precondition: 일반 직원 계정으로 로그인한 상태 / fixture:  / action: /admin 주소 직접 입력 / target: 승인 관리 화면 / input:  / expected: /items로 이동 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          },
          {
            "description": "/admin에 일반 직원 계정으로 직접 접근 시 차단 안내 문구 표시 확인",
            "verificationMethod": "automated_e2e",
            "testSpec": {
              "version": 3,
              "kind": "managed_browser",
              "startPath": "/admin",
              "steps": [
                {
                  "atom": "goto",
                  "path": "/login"
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "email"
                  },
                  "value": {
                    "ref": "email"
                  }
                },
                {
                  "atom": "fill",
                  "target": {
                    "field": "password"
                  },
                  "value": {
                    "ref": "password"
                  }
                },
                {
                  "atom": "click",
                  "target": {
                    "field": "submit"
                  }
                },
                {
                  "atom": "expect_path",
                  "path": "/items"
                },
                {
                  "atom": "goto",
                  "path": "/admin"
                },
                {
                  "atom": "expect_text",
                  "contains": "총무팀만 볼 수 있는 화면입니다"
                }
              ],
              "syntheticCredentials": {
                "email": "test@example.com",
                "password": "Test1234!",
                "invalidPassword": "wrong-password"
              }
            },
            "design": {
              "startPath": "/admin",
              "testContract": {
                "version": 1,
                "startPath": "/admin",
                "scenario": "access_control",
                "precondition": "일반 직원 계정으로 로그인한 상태",
                "action": "/admin 주소 직접 입력",
                "target": "비품 목록 화면",
                "expected": "차단 안내 문구 표시"
              },
              "testHint": "scenario: access_control / startPath: /admin / precondition: 일반 직원 계정으로 로그인한 상태 / fixture:  / action: /admin 주소 직접 입력 / target: 비품 목록 화면 / input:  / expected: 차단 안내 문구 표시 / cleanup: ",
              "requirements": [],
              "conversation": [],
              "questionSetLocked": true,
              "status": "automation_ready",
              "humanReviewAccepted": false,
              "message": "이 완료조건으로 실행할 자동 테스트가 준비되었습니다."
            }
          }
        ]
      }
    ],
    "englishSow": {
      "background": "A company with about 20 employees manages shared equipment (laptops, monitors, cameras, projectors) via an Excel sheet maintained by a single general affairs staff member. Inquiries made over Slack require manual spreadsheet checks, leading to double-booking and disputes. The client needs a simple web system so employees can self-check availability and submit requests, while the general affairs team can easily approve or reject incoming requests.",
      "objective": "Build a multi-stage web application that enables employees to view available equipment and submit requests, while allowing general affairs staff to approve or reject requests and manage availability statuses.",
      "inScope": [
        "Stage 1: Login (/login) with email and password, validation error display, unauthenticated route protection, and equipment list screen (/items) with status filtering ('All', 'Available', 'In Use').",
        "Stage 2: Equipment request modal on /items (restricted to available items, required item selection, mandatory request reason under 100 characters), submission confirmation notice, status updates to 'In Use', user request history screen (/requests) with cancellation capability for pending requests, and empty state messaging.",
        "Stage 3: General affairs approval screen (/admin) listing all requests, approval and rejection actions, automatic status updating (rejections reset equipment to 'Available', approvals maintain 'In Use'), removal of cancel options on processed requests, and role-based access control hiding/blocking /admin for standard employees."
      ],
      "outOfScope": [
        "User registration / sign-up flow",
        "Password reset functionality",
        "Equipment registration, editing, or deletion screens (CRUD)",
        "Return processing workflows",
        "Rental period limits or overdue management",
        "Notifications (email, push, Slack, etc.)",
        "Photo attachment features"
      ],
      "translatedMilestones": [
        {
          "titleEn": "Stage 1: Login and Equipment List Screen",
          "dodsEn": [
            "Verify redirection to /items after logging in with email and password at /login.",
            "Verify error message display upon entering an incorrect password at /login.",
            "Verify error message display when attempting login without entering an email at /login.",
            "Verify redirection to /login when accessing /items while unauthenticated.",
            "Verify presence of '비품명' text on /items.",
            "Verify presence of '분류' text on /items.",
            "Verify presence of '상태' text on /items.",
            "Verify display of '대여 가능' text when clicking '전체' button on /items.",
            "Verify display of '대여중' text when clicking '전체' button on /items.",
            "Verify absence of '대여중' text in equipment table when clicking '대여 가능' button on /items.",
            "Verify absence of '대여 가능' text in equipment table when clicking '대여중' button on /items."
          ]
        },
        {
          "titleEn": "Stage 2: Equipment Request and My Request History Screen",
          "dodsEn": [
            "Verify equipment request modal displays upon clicking '비품 신청' button on /items.",
            "Verify equipment selection list in request modal displays '대여 가능' items on /items.",
            "Verify equipment selection list in request modal excludes '대여중' items on /items.",
            "Verify '신청하기' button is disabled when reason is entered without selecting an item on /items.",
            "Verify '신청하기' button is disabled when request reason is empty on /items.",
            "Verify error message display when submitting a reason exceeding 100 characters on /items.",
            "Verify notice message '신청이 접수되었습니다' appears upon successful request submission on /items.",
            "Verify item status changes to '대여중' upon successful request submission on /items.",
            "Verify /requests displays only the logged-in user's requests.",
            "Verify presence of '비품명' text on /requests.",
            "Verify presence of '신청 사유' text on /requests.",
            "Verify presence of '상태' text on /requests.",
            "Verify display of '취소' button for '승인 대기' status requests on /requests.",
            "Verify item status updates to '대여 가능' on /items after clicking '취소' button on /requests.",
            "Verify display of '아직 신청한 비품이 없습니다' notice on /requests when no request history exists.",
            "Verify redirection to /login when accessing /requests while unauthenticated."
          ]
        },
        {
          "titleEn": "Stage 3: General Affairs Approval Screen",
          "dodsEn": [
            "Verify presence of '신청자' text on /admin.",
            "Verify presence of '비품명' text on /admin.",
            "Verify presence of '신청 사유' text on /admin.",
            "Verify presence of '상태' text on /admin.",
            "Verify display of '아직 들어온 신청이 없습니다' notice on /admin when no requests exist.",
            "Verify display of '승인' button for '승인 대기' status requests on /admin.",
            "Verify display of '반려' button for '승인 대기' status requests on /admin.",
            "Verify request status updates to '승인 완료' upon clicking '승인' button on /admin.",
            "Verify request status updates to '반려됨' upon clicking '반려' button on /admin.",
            "Verify absence of '승인' button for '승인 완료' status requests on /admin.",
            "Verify absence of '반려' button for '승인 완료' status requests on /admin.",
            "Verify absence of '승인' button for '반려됨' status requests on /admin.",
            "Verify absence of '반려' button for '반려됨' status requests on /admin.",
            "Verify rejected equipment status changes to '대여 가능' on /items.",
            "Verify approved equipment status remains '대여중' on /items.",
            "Verify absence of '취소' button for '승인 완료' status requests on /requests.",
            "Verify absence of '취소' button for '반려됨' status requests on /requests.",
            "Verify '승인 관리' menu is hidden from top navigation when logged in as a standard employee on /items.",
            "Verify redirection to /items when a standard employee directly accesses /admin.",
            "Verify access blocked notice displays when a standard employee directly accesses /admin."
          ]
        }
      ],
      "acceptanceCriteria": [
        "Each of the 3 stages is delivered via an individual Pull Request, verified sequentially by the client prior to starting the next stage.",
        "Unauthenticated users attempting to access /items, /requests, or /admin are redirected to /login.",
        "Standard employee accounts cannot view '승인 관리' in navigation and are blocked with a notification message and redirected to /items if attempting direct URL access to /admin.",
        "Equipment status dynamically reflects request states: pending/approved requests mark items '대여중', while cancellations and rejections return items to '대여가능'.",
        "Request submissions require both an item selection and a request reason under 100 characters."
      ],
      "definitionOfDone": [
        "All routes (/login, /items, /requests, /admin) are implemented per specification.",
        "All milestone completion conditions are tested and confirmed functional.",
        "Code for each stage is submitted via individual Pull Requests and explicitly approved by human review."
      ],
      "clientResponsibilities": "Pre-populate user account credentials (email and password) and initial equipment database records since registration and item management screens are out of scope. Review and approve each Pull Request stage sequentially.",
      "vendorResponsibilities": "Develop the web application according to specified routes (/login, /items, /requests, /admin) and stage requirements. Deliver work in three separate Pull Requests and resolve any reported UI/functional bugs within scope.",
      "unmappedContent": [
        "Period: 2026-08-22 to 2026-09-12"
      ]
    },
    "sowSummary": {
      "coreScope": "20인 규모 회사의 비품 중복 대여 문제를 해결하기 위해 로그인, 비품 목록 조회, 비품 신청 및 내 내역 조회, 총무팀 승인·반려 관리 기능을 3단계 PR 방식으로 구축하는 프로젝트입니다.",
      "keyAcceptance": "비인가 사용자의 인가되지 않은 경로 접근 차단, 신청 사유 100자 제한 및 입력 검증, 그리고 승인·반려·취소 상태에 따른 비품 대여 상태의 실시간 연동 검증을 완료해야 합니다.",
      "needsReview": "총무팀 승인 화면(/admin)에 대한 일반 직원 접근 권한 제한 동작과 각 순차적 단계별 PR 단위 검수 방식을 주의 깊게 확인해야 합니다.",
      "english": {
        "coreScope": "This project builds a equipment reservation system across 3 sequential PR stages to resolve double-booking issues for a 20-person company, covering authentication, item listings, request submissions, and administrative approval/rejection workflows.",
        "keyAcceptance": "Verification must cover blocking unauthorized route access, applying request reason validations under 100 characters, and ensuring real-time status sync of equipment availability based on approval, rejection, or cancellation actions.",
        "needsReview": "Special attention should be given to validating strict access controls blocking standard employees from the general affairs approval page (/admin) and confirming the sequential PR review process for each delivery stage."
      }
    }
  };
