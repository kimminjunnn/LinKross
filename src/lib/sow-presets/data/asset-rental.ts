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

export const ASSET_RENTAL_PRESET: SowPreset = {
    "id": "asset-rental",
    "label": "사내 비품 대여 관리",
    "provenance": "eval/presets/asset-rental.preset-source.json에서 생성. 대상 저장소 kimminjunnn/linkross-github-app-test. 자동 41개는 eval/presets/verify-preset-locally.mjs로 실제 브라우저 통과를 확인했다.",
    "sourceText": SOURCE_TEXT,
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
    ]
  };
