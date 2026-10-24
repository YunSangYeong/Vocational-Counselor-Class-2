# 구현·검증·배포 기록

작성일 2026-10-24. 작업 디렉터리 `/workspace/Vocational-Counselor-Class-2`.

## 출발점

최초 파일은 README.md 한 개, AGENTS.md 없음, Git 변경 없음. 로컬 `work`의 HEAD와 원격 main은 `478026e0e86699b99efaadbd587c9a7d9b73c285`였다.

최신 표준 조회 main: `76b990b8720adfa85c22a0a8f699b17094aa357b` (v1.4.0). `.agents/skills/cbt-site-standard/`의 SKILL.md와 references 7개를 전부 읽고 폴더 전체를 복사했다. 파일별 바이트 일치 확인. 기존 AGENTS.md는 없었으므로 표준을 연결하는 새 파일을 만들었다. 계정 공통 스킬 설치를 뜻하지 않는다.

실제 앱은 표준이 지정한 `b9a682ccff1b460334b78d5bfad9375b7ec4fbb6`의 React·TypeScript·Vite 코드, 스타일, 모델, 의존성 lockfile, 브라우저 시나리오 및 workflow를 재사용했다. 전기 문항과 생성 스크립트는 사용하지 않았다. 제목·과목·100문항·150분·과락·페이지 base·저장 namespace·양식·검사를 대상에 맞게 수정했다. 구판의 상단 상태 안내는 제거했다.

## 실제 실행

| 검사 | 결과 |
|---|---|
| Node / npm | v24.19.0 / 11.9.0 |
| `npm ci --cache /tmp/cbt-npm-cache` | 종료 0, 110 packages. 최초 기본 캐시 경로 쓰기 오류는 /tmp 캐시로 해결. TLS·integrity 검증 유지 |
| `npm test` | 종료 0, 116 tests 통과 |
| `npm run build` | 종료 0, TypeScript + Vite 프로덕션 빌드 |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 종료 0, 30 tests 통과 (PC 15 + 모바일 프로젝트 15) |
| 원고 재생성 | SHA256 일치, 총100·각20·부족900 |
| 개발 서버 | `npm run dev -- --port 5173 --strictPort` 시작, HTML·JSON 양식 HTTP 요청과 실제 브라우저 렌더링 확인 |
| Git | 최종 상태와 원격 보존은 아래 배포 기록 및 최종 보고 참조 |

단위 검사는 데이터 구조와 중복, 합격 60점 양쪽 경계, 과목 40점 양쪽 경계, 평균 합격·한 과목 과락, 무응답, 답안 변경·마감, 중복 제출, 복원 거부, family 보충의 ID 중복 방지, 랜덤 순회, 오답 해제, 결과30회·응답5000 보존을 포함한다.

브라우저는 Chromium headless이며 PC와 Pixel 7 에뮬레이션이다. 100문항 실제 답안 조작, 과목별12개 정답으로 평균60점·과락 없는 결과, 오답40개와 복습, 북마크·통계·재접속·마감·자동 제출·파일 등록·검수·CSV·초기화·손상 원본 보존·저장 실패 경고를 확인했다. 실제 keydown/keyup으로 두 모드 Space·포커스·마지막 문제·미응답·수정키·네이티브 버튼 동작을 검사했다.

메뉴 검사는 390×480과 740×360에서 메뉴 애니메이션 종료 후 마우스 휠 및 CDP touchStart/move/end 입력으로 아래 이동→백업 다운로드·초기화 대화상자→위 이동→대시보드 선택을 수행한다. `scrollTop`을 강제로 대입하지 않는다. 글자 확대 및 높이 축소에서 휠 접근도 확인한다. 실제 모바일 기기·Safari·Firefox·블로그 iframe은 미실행이다. PC/모바일 대시보드와 메뉴 스크린샷도 로컬에서 확인했다.

초기 브라우저 실행에서 배너 검사가 허용된 푸터의 비공식 문구까지 상단 배너로 오인해 2개 실패했다. 앱에서 푸터는 유지하고 검사 범위를 실제 상단 안내 영역으로 수정했다. 최종 전체 재실행은 30개 통과했다. 로컬 테스트 수정·재검증은 배포 재시도가 아니다.

## 배포 첫 차단

필수 사전 확인 명령:
`gh api repos/YunSangYeong/Vocational-Counselor-Class-2 --jq '{full_name,default_branch,permissions,has_pages}'`

종료 1, 실제 오류:
`Get "https://api.github.com/repos/YunSangYeong/Vocational-Counselor-Class-2": Forbidden`

이것은 GitHub API 접근 차단 증거이며 관리자 권한 부족이나 Pages 미설정을 확인한 결과가 아니다. Git HTTPS 읽기 성공은 API 접근·쓰기·Pages 권한을 보장하지 않는다. API를 다른 도구로 재요청하지 않았다. API 권한·Pages Source·기존 게시 상태는 미확인이다.

사용자의 첫 차단 중단 지시에 따라 main push, workflow_dispatch, 재실행, 다른 배포 경로, 배포를 유발하는 추가 푸시는 실행하지 않았다. 이번 CI·Pages 배포는 시작하지 않았다. 공개 화면은 확인하지 않았다. 이미 배포된 원본 electrician-cbt 프로젝트는 읽기 전용으로만 참조했다.

코드는 `feat/vocational-counselor-cbt` 브랜치로만 보존한다. 제공 workflow의 push 대상은 main이고 PR은 만들지 않으므로 이 브랜치 푸시는 해당 Pages workflow를 시작하지 않는다. main 통합이나 배포 재시도는 사용자의 후속 명시 요청 없이는 하지 않는다.

다음 최소 동작: 클라우드 환경 설정의 인터넷 허용 도메인에 `api.github.com`을 추가한다. 이 조치만으로 GitHub 권한이나 Pages 준비가 입증되는 것은 아니며 이번 작업에서 자동 재시도하지 않는다. Pages 최초 설정이 필요한지는 API 차단으로 확인하지 못했으므로 임의로 필요하다고 단정하지 않는다.

예상 기본 주소(실제 배포 확인 주소 아님):
https://YunSangYeong.github.io/Vocational-Counselor-Class-2/

## 후속 요청: 기본 은행 1,000문항 확대

위의 초기 구현 기록(100문항·단위116개)은 당시의 이력이다. 이번 후속 요청의 현재 결과는 다음과 같다.

- 기본 JSON 총1,000개, 과목별200개. 기존100개 객체 전체 보존, 추가900개.
- 자체 제작1,000 / 기출0 / 복원0 / 숫자변형0 / 계산형0 / 기본 pending0 / 부족0.
- 추가 원고는 과목별60개 개념 × 세 가지 학습 과제. 총300개 연결 개념에 대해 개념 확인·사례 적용·오개념 판별 각300개를 추가했다. 서로 다른900개 개념이라고 집계하지 않는다.
- `conceptId`·`itemFormat`을 기록하고 family로 같은 개념을 묶었다. 충분한 개념이 있는 현재 은행에서는 실전100문항에 동일 family가 중복되지 않음을 검사한다.
- `npm run check` 종료0: 단위1,020개 통과 및 타입 검사·프로덕션 빌드 통과.
- 원고 재생성 전후 JSON 바이트 일치, 기존100개 JSON.stringify SHA256 일치, ID·본문·보기 중복 검사 통과.
- Vite는 압축 전 JS 청크가500kB를 넘는다는 크기 경고를 출력했다. 빌드는 성공했으며 gzip JS 약190kB다. 경고를 숨기거나 기준을 완화하지 않았다.
- 공식 규칙과 법령 직접 대조·외부 전문가 검수는 여전히 미완료다. 원고 검수와 자동 형식 검사를 전문적 외부 검증으로 표현하지 않는다.
- 이번 변경도 보존 브랜치 `feat/vocational-counselor-cbt`에만 반영한다. 앞서 차단된 배포 API 재요청·main push·Actions 실행·Pages 배포는 하지 않는다.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` 종료0: PC·모바일30개 통과(52.2초). 실제 휠·터치 메뉴 스크롤, 두 모드 Space, 신규 문항 포함100개 응시·과락없는60점 경계 결과, 등록·초기화·저장 오류 회귀를 확인했다. 실기기가 아닌 Chromium 에뮬레이션이다.
