# 모바일 계열 재정립 — 조사 결과와 결정 (2026-08-03)

> **이 문서는 세션 인수인계용이다.** 다른 PC에서 작업을 이어받을 때 이것부터 읽는다.
> 배경: 제품 정체를 ERP → **그룹웨어**로 조준선을 다시 맞추면서, 모바일 계열(16부품)의 *규율*을
> 사후적·산발적으로 쌓인 상태에서 **선언된 규율 → 부품 도출** 순서로 뒤집기 위한 전수 조사.
> 조사 규모: 6개 라인(HIG+M3 / 한국·아시아 DS / 서구 엔터프라이즈 DS / 해외 그룹웨어 / 한국 그룹웨어 / 첨부 뷰어).

---

## 0. 지금 상태 한 줄

조사 완료 · **결정 2건 확정 / 2건 논의 중** · 코드 변경 0건. 다음 작업은 뷰어 착수 또는 규율 문서(06) 신설.

---

## 1. 결정 상태

| # | 항목 | 상태 |
|---|---|---|
| 1 | **첨부 뷰어 착수** | ✅ **확정** — 권장안 그대로(`pdfjs-dist` + `react-zoom-pan-pinch`, 둘 다 optional peer). 양층 공용 계약 |
| 2 | **BottomSheet 범위** | ✅ **확정** — **콘텐츠 시트만.** 액션 목록 시트(버튼만 잔뜩 든 시트)는 만들지 않는다. 액션 목록은 Menu로 |
| 3 | **모바일 폼 어휘**(MobileField 밑줄) | ⏳ **논의 중** — §5 참조 |
| 4 | **하단 고정 CTA 규율** | ⏳ **논의 중** — §6 참조 |
| — | 기존 16부품 breaking 허용 | ✅ 확정 — 규율이 맞다면 깬다. kk 회신 문서를 한 벌 써서 넘긴다 |
| — | `Badge`에 `primary` 열기 | ❓ 미답 — 두 번째 재발(§4-C). rule of three에 한 건 남음 |

---

## 2. 조사가 확정해준 규율

### 2-1. 살아남는 것 (근거만 교체)

| 우리 규율 | 새 근거 |
|---|---|
| 면·그림자 대신 **배경 + 헤어라인** | **M3 명문**: "여백·구분선으로 더 단순한 위계가 되면 카드에 넣지 마라", "compact에서는 카드를 리스트로", "contained 리스트는 선이 아니라 gap". ⚠️ **Apple 인용은 걷어낼 것**(§3) |
| **모바일 = 형제 층, 축소판 아님** | **Salt(JPMorgan)가 `touch` 밀도를 만들었다 폐기**했다 — *"작은 화면에 최적화돼 있지 않다"*. 배수 스케일의 실패를 업계가 값으로 증명. mobile 밀도는 손으로 재저작(비선형 램프) |
| **타이포를 셸 스코프 역할변수로** | Salt `.salt-density-mobile`이 **정확히 같은 기법**(밀도 클래스가 h1~body 역할변수 재선언). Spectrum은 desktop/mobile 토큰 세트 |
| **하한 768** | Atlassian sm · Polaris md · Radix sm · Mantine sm · **Spectrum 디자인 스펙 임계값**과 일치. 업계 합의점(768/1024) |
| **모바일 홈 = 내비게이션, 대시보드 아님** | Notion·Confluence·Basecamp 셋 다 위젯 홈이 없다. `Bento`를 폰에 안 올린 게 맞음 |
| 탭 3~5, 오버플로('더보기') 없음 | 근거를 HIG → **M3(3~5)**로. Apple도 "이런 상황을 제한하라" |
| **`MobileChoice`(칩 줄)를 Select 대신** | 강하게 검증. Linear 속성 칩 줄 · ClickUp 속성 블록 · Drive 필터 칩이 같은 방향. **단 상한은 6~7이 아니라 5**(HIG "iPhone 약 5" / M3 "2~5, 5 초과 금지" 독립 수렴) |
| `CountBadge` "행동요구만 빨강" | Teams·Google Chat·Slack **3사 독립 수렴**: 볼드/상단 호이스트=일반 안읽음, 점=사용자가 표시한 안읽음, **숫자 배지=멘션급 에스컬레이션 전용** |
| `MobileShell.bottom` 슬롯 하나(CTA·컴포저 공유) | Jira가 이슈 화면 하단에 댓글 바를 영구 도킹하는 것과 동형 |

### 2-2. 새로 세워야 하는 것

| 규율 | 근거 |
|---|---|
| **`word-break: keep-all` 전역** | KRDS가 리셋에 깔고 예외를 유틸(`.break-all`)로 엾. **우리 레포에 0건** — 한글이 음절 단위로 끊긴다. 부품 하나보다 파급이 크다 |
| **편집 능력을 읽기보다 의도적으로 좁힌다** | Notion·Confluence·Basecamp **셋 다 명문화**. Notion=컬럼 없음·다중선택 없음·레이아웃 빌더 없음 / Confluence=매크로 저작 불가(5종만) / Basecamp=Card Table을 컨텍스트 메뉴·컬럼 재정렬 없이 출시. 우리엔 대응 규율 없음 |
| **스와이프는 목록 트리아지 전용, 문서 안 금지** | Notion·Basecamp 공통. 메신저 3사도 **메시지 버블 swipe-to-reply가 없다**(WhatsApp 제스처를 가져오지 말 것). 정본(HIG/M3)은 침묵 → 우리가 정하는 자리 |
| **스와이프는 가속기이지 유일 경로가 아니다** | SAP Fiori·ServiceNow가 각자 DS에 **접근성 의무로 명문화**. ServiceNow가 iOS에서 스와이프 전용으로 낸 건은 **불일치(버그)로 KB 등록**됨 |
| **전체화면 push가 기본 / 시트는 생성·편집·피커** | 3앱 공통. 에스컬레이션 규칙도 수렴: Slack "입력 6개 넘으면 페이지네이션", Teams "정말 복잡하면 다이얼로그 말고 전체 페이지", NN/g "검토에 시간 드는 내용엔 쓰지 말라". **시트 중첩 금지 만장일치** |
| **인라인 액션 상한 3, 초과는 시트** | 업계가 발행한 실제 숫자: Teams Adaptive Card(primary 1~3, 하드맥스 6, 초과는 모바일에서 바텀시트) · ServiceNow(카드 3, 스와이프 1~3) · Salesforce(3~4) · LINE(3 비권장) · Gmail(하단 2 + ⋮) |
| **강조 버튼은 페이지당 1개** | SAP 명문. Gmail이 Reply All을 **삭제**한 것이 실증 |
| **폰 폼은 필드 8개 권장, 20개 초과 금지** | Salesforce의 유일한 수치 규칙. 자체 예시로 32필드 데스크탑 → 폰 5페이지 스크롤 |
| **폰에 표를 놓지 않는다**(승인·레코드 계열) | Spectrum Table은 iOS/Android 구현이 **아예 없고**(`spectrum_ios: no`) 이슈 트래커에 표+모바일 이슈 **0건**. Fluent 모바일에도 Table 없음. Carbon은 공개 이슈에서 실패 인정. Teams는 "가로 스크롤 미지원" 명문. **단 §7 진영 갈림 참조** |
| **프레젠테이션 규칙을 선언 테이블로** | Basecamp(Hotwire Native)만 외부화 — `context: modal\|default`, `presentation: push\|pop\|replace…`, iOS `modal_style: large\|medium\|full\|page_sheet\|form_sheet`, 정본 예시가 **`/new$` → modal, 나머지 push**. 나머지는 화면마다 판단하고 Confluence는 그 비일관성이 제품에 드러남 |

### 2-3. 제3의 길 — Primer의 뷰포트 키 enum

"반응형 변신 vs 별도 부품" 이분법 밖에 세 번째가 있다:

```ts
// GitHub Primer Dialog
position: 'center'|'left'|'right'
        | { narrow?: …|'bottom'|'fullscreen', regular?: …, wide?: … }
// React Spectrum
type: 'modal'|'popover'|'tray'|'fullscreen'|'fullscreenTakeover'
mobileType: 'modal'|'tray'|'fullscreen'|'fullscreenTakeover'
```

**한 부품이 변신하되 결과를 소비처가 닫힌 enum으로 선언한다.** 옵션을 쌓는 게 아니라 **축을 하나 추가**하는 것이라 §11-3(옵션 스태킹 금지)에 안 걸린다.

---

## 3. 우리 문서의 근거 3건이 확인 실패했다 (교정 필요)

모바일 계열 정체성을 세운 문장들이 **현행 정본에 없다.**

| 위치 | 우리가 쓴 것 | 실제 |
|---|---|---|
| `MobileShell.tsx:9` · `MobileSection.tsx:4` | "Apple HIG가 inset grouped를 *compact 폭, 특히 현지화 콘텐츠에서 줄바꿈을 유발한다*며 말린다" | **현행 HIG 원문에서 확인 실패.** 구 HIG 미러에만 있는 문장 |
| `MobileShell.tsx:14` | "탭은 3~5개(HIG)" | **현행 HIG는 숫자를 안 박는다.** 3~5는 M3 규정 |
| `mobilelist.css:48` 등 | "Apple HIG 최소 터치타깃 44×44pt" | 실제는 **44pt 권장 / 28pt 하한의 2단**. 단일 하한 48dp는 M3 |
| `MobileComposer.tsx:3` | 하단 고정을 "긴 스크롤 끝의 입력창은 손이 안 닿는다"로 정당화 | **NN/g가 도달성 논거를 명시 반박** — 하단이 가장 닿기 쉬운 곳이 아니고 가장 탭하기 쉬운 곳은 화면 중앙. **진짜 이유는 위치 불변성** |

**결론은 살아남고 근거만 바뀐다** — M3가 우리 무테·헤어라인 체계를 명문으로 지지한다.

---

## 4. 현행 16부품 코드 실측 감사

부품 대부분이 40줄 이하 껍데기이고 진짜 규율은 **`mobilelist.css`(425줄)·`mobileshell.css`(173줄)**에 산다. 검수 대상은 CSS다.

`mobileshell.css`가 셸 스코프에서 재선언하는 것(= "부품을 안 고치고 모바일을 만드는" 핵심 기제):
`mobileTypoVars`(타이포 6단계) · `--input-height-sm/md`(36→44, 42→48) · `--field-border: transparent` · `.mantine-Input-input` 배경·패딩·radius · `input/textarea { font-size: max(16px, …) }`(iOS 자동 확대 봉인)

### A. 좌우 인셋이 갈렸다

| 부품 | 좌우 패딩 |
|---|---|
| ListRow · FileRow · Comment · Field · Disclosure · Section · Top | **16** (`md`) |
| **MobileStatRow** | **12** — `mobilelist.css:85` |
| **MobileCalendar** 헤더·칩줄 | **12** — `:198, :207` |
| **MobileComposer** | **12** — `:333` |

StatRow는 목록 바로 위아래에 놓이는 물건이라 4px 어긋남이 그대로 보인다. 세로도 갈림 — ListRow 16 vs **FileRow 12**(`:366`).

### B. 실제 결함 2건

1. **`.mcal-mark { font-size: 9.5px }`**(`:296`) — 하드코딩 px 폰트. 폰트 스케일(전역 줌)을 안 탄다. `CountBadge`를 rem화한 것과 **같은 접근성 역행**이고, 같은 파일 `:285` 주석이 스스로 "하드코딩 px은 안 탄다"고 쓰고 바로 아래에서 위반한다.
2. **`MobileComposer.tsx:51` — `Math.min(scrollHeight, 96)`** 을 `style.height`에 직접 씀. React 밖 DOM 조작 + 매직넘버. 폰트 스케일을 키우면 96px에 3줄이 안 들어간다.

기타 매직넘버: `gap:5px`(`:62,63`) · `margin-bottom:1px`(`:63`) · 달력 `22px` 바 · `border-radius:4px`(**radius `xs`가 정확히 4인데 리터럴**, `:264,270`) · `28px` 날짜 원 · `34px` 답글 들여쓰기 · 셸 `52px`/`56px`/`-3px -13px`.

### C. 손으로 그린 것 — 회색지대 1건

**`.mcmt-tag`**(`:315`) — '작성자' 배지를 `Badge` 대신 손으로 그림. 이유는 `BadgeColor`에 `primary`가 없어서. **QueueList의 `mark` 배지와 같은 상황**이고 거기서 "무게 사다리가 재발하면 Badge variant로 승격"이라 적어뒀다 → **두 번째 재발.**

명시 사유가 있는 raw(수용): `.mcps` raw textarea · `.mpp-del` 26px ✕ · `.mcmt-reply` 텍스트 액션 · 달력 셀/바.

### D. 접근성 구멍 2건

1. **`MobileSection`의 제목이 `<span>`**(`MobileSection.tsx:32`) — 모든 구획 제목이 heading이 아니라 **스크린리더 제목 탐색이 통째로 안 된다.**
2. **`MobileChoice`가 `role="radiogroup"`을 선언**(`:27`)하는데 자식은 `Chip variant="legend"`. 안쪽이 `role="radio"`가 아니면 **거짓 시맨틱** → `Chip.tsx` 확인 필요.

### E. 데스크탑 의존 2건

`MobileBoardList`·`View`가 **`board.css`(데스크탑)를 import**(의도된 결정이나 결합) · `MobileBoardList`가 **데스크탑 `EmptyState`를 그대로 씀**(모바일 빈 상태 어휘 없음).

### F. 부품별 판정

| 부품 | 판정 | 할 일 |
|---|---|---|
| MobileShell | 유지 | `actions` **개수 상한 2**(Base Web `MobileHeader`는 `[IconButton?, IconButton?]` 튜플로 타입에 못 박음) · `bottom` 근거 재작성 |
| MobileTop | **재검토** | `action`이 '글쓰기'(생성 진입)를 받는 계약 — §6-덧붙임 |
| MobileSection | 유지 | **제목 heading 시맨틱** |
| **MobileField** | **결정 대기** | §5 |
| MobileChoice | 유지 | 상한 6~7 → **5** · `role` 검증 |
| MobileListRow | 유지 + 구멍 | **chevron 의미 분리**(Apple: ⓘ=정보 노출 / ›=계층 진입) · `selectable`/`selected`(일괄 처리) · 상태 칩 슬롯. **`reorderable`과 합치지 말 것**(Apple: 독립 능력) |
| MobileDisclosure | 유지 | — |
| MobileStatRow | 유지 | 좌우 인셋 12 → 16 |
| MobilePhotoPicker | 유지 | 읽기 뷰어와 짝 필요 |
| MobileCalendar | 유지 | **주(week) 모드** · `9.5px` rem화 |
| MobileComment | 유지 | `.mcmt-tag` → Badge primary 승격 |
| MobileComposer | 유지 | 96px 인라인 style 제거 |
| **MobileFileRow** | **확장** | `onOpen` 신설(뷰어 진입) · 세로 패딩 12 → 16 |
| MobileBoard×3 | 유지 | View는 댓글·첨부가 본문에 이어붙어 긴 글에서 문제(Salesforce가 관련 목록을 별도 페이지로 뺀 이유) |

---

## 5. 미결 ① 모바일 폼 어휘 (MobileField)

**`MobileField`는 값이 아니라 "칸의 크롬"이다.** 입력 원자(`TextInput`·`Textarea`·`Select`)는 데스크탑과 같은 걸 쓰고, 갈린 건 겉을 감싸는 분자 하나다.

```
데스크탑 FormField          모바일 MobileField
제목 *                      제목 *            ← 라벨(작고 흐림)
┌──────────────┐            값
│ 값           │            ──────────────    ← 헤어라인
└──────────────┘
  = 상자(윤곽)                = 밑줄
```

### 반대 근거 3건

| 출처 | 기준 |
|---|---|
| **SEED(당근)** | underline은 **"화면에 입력 필드가 하나일 때"** — 조사 전체에서 밑줄/박스 기준을 명시한 유일 문서 |
| **M3** | filled(밑줄 계열)=짧은 폼·다이얼로그 / **outlined=필드가 여럿 놓이는 폼** |
| **KRDS**(정부·고령자 우선) | 모바일에서도 **박스형만**(배경 대비 3:1) |

`MobileBoardWrite`는 분류·제목·수신자·본문·첨부·게시옵션 **6칸** — 세 출처 기준으로 정확히 "박스를 써야 하는 폼". 고령 사용자층이 있어 KRDS가 특히 무겁다.

### 후보 3안

1. 밑줄 유지 + 반대 근거를 문서에 명시(소비처 영향 0, 고령 리스크 잔존)
2. 박스형으로 전환(가장 안전하나 "헤어라인으로만 나눈다"는 정체성과 충돌)
3. **두 어휘를 닫힌 enum으로** + "필드 하나=밑줄 / 여럿=박스" 규율 ← *현재 유력*. Primer의 뷰포트 키 enum과 같은 계열(옵션 스태킹 아님)

**참고**: TDS `TextField`는 `variant: box | line | big | hero`로 한 부품이 네 변종을 갖고, `labelOption: appear | sustain`(값 있을 때만 / 상시)까지 연다. 우리는 라벨 상시 노출 고정.

---

## 6. 미결 ② 하단 고정 CTA 규율

### 재해석: 동서 분기가 아니라 **화면 유형** 분기다

처음엔 "한국 그룹웨어는 쓰고 서구 협업툴은 안 쓴다"로 보였으나, 서구의 **결재·승인 계열**을 보면 정반대다.

**하단을 쓰는 쪽 (결재·승인 도구):**
- **SAP Fiori 명문** — footer toolbar가 주 액션의 집, "헤더와 푸터가 둘 다 있으면 대개 푸터가 더 주목받는다", 페이지당 강조 버튼 1개
- Workday 모바일(Approve 하단, More에 Deny/Send Back) · Zoho Expense · **Gmail**(Reply/Forward를 본문 하단 고정으로 올리며 제목 아래 회신 아이콘 제거 + Reply All 삭제)
- 네이버웍스 결재 상세('결재 진행' 탭 → 하단 가변 버튼 영역) · WEHAGO

**안 쓰는 쪽 (협업 도구):** Notion · Confluence · Basecamp · Slack · Linear

### 왜 갈리는가 (3가지)

1. **커밋이 있느냐.** 협업툴의 대표 화면은 이슈·문서 = **tap-in-place + 자동 저장**이라(Linear·ClickUp·Asana·Jira 전부 명시적 편집 모드 없음, Monday CRM만 Edit 버튼) **하단에 고정할 "그 버튼"이 존재하지 않는다.** 결재는 **2단 커밋**(결정 → 선택 코멘트 → 확정)이 문서화돼 있다.
2. **하단 탭바가 이미 그 자리를 점유했는가.** Notion·Slack·Basecamp는 탭바가 앱의 척추. 네이버웍스 결재 상세는 탭바 밖 2뎁스 화면이라 하단이 비어 있다. (우리 `MobileShell`은 탭 위에 `bottom`을 층으로 쌓아 이 문제를 이미 피함.)
3. **정당화는 도달성이 아니라 위치 불변성.** NN/g가 도달성 논거를 반박. 결재를 연속 20건 처리할 때 문서 길이가 제각각이어도 버튼이 매번 같은 자리에 있는 것이 실익. 네이버웍스는 한 건 처리하면 **남은 대기 목록 팝업**이 떠 바로 다음 건으로 넘어간다(= 큐 연속 처리 화면).

### 유력안

> **"모바일은 하단 고정"이 아니라 "커밋이 목적인 화면은 하단 고정 / 조회·탐색 화면은 하단을 내비에 양보"**

### 덧붙임 — 조사가 자기 판정을 뒤집은 건 (해소됨)

해외 그룹웨어 조사가 `MobileTop.action`에 대해 1차 "어긋난다" / 2차 "일치, 유지"로 상반된 판정을 냈다.
**근거를 직접 보면 1차가 맞다** — 2차의 근거도 "Asana·ClickUp·Trello·Jira 전부 **오버플로**를 우상단에 둔다"인데, 오버플로(복사·보관·삭제·설정)와 진입(글쓰기)은 다른 물건이다. 생성 진입은 Google FAB 3종·Trello FAB·Monday +·ClickUp +·Asana + 전부 **하단**이다.
→ **`MobileTop.action`이 '글쓰기'를 받는 계약은 재검토 대상.**

---

## 7. 표를 폰에서 어떻게 할 것인가 — 업계가 갈린다

**진영 A(작업 도구) — 표를 유지하고 가로로 민다**: ClickUp 모바일 List는 **진짜 표**(컬럼 가로 스와이프, 헤더 탭해 정렬/숨김, 문서가 "기기를 회전하라"고 씀) · Monday Main Table 그대로 · Jira 보드는 한 번에 한 컬럼(~85% 폭 + peek, long-press 드래그) · Trello.

**진영 B(승인·레코드 계열) — 표 금지, 카드/행 + 필드 예산**: Teams "가로 스크롤 미지원" 명문 · SAP은 폰 전용 테이블 동작이 없고 "별도의 단순화된 모바일 앱을 만들라" · ServiceNow "모바일 카드가 표를 대체한다" · Salesforce Compact Layout(하이라이트 10 / 프리뷰·룩업 4) · Slack은 파일 목록에 탭조차 없음.

**→ 전자결재는 진영 B다. 우리는 B.**

**유일하게 베낄 만한 닫힌 어휘 해법 — Polaris 신규 `s-table`:**
```
variant: "auto" | "list" | "table"
컬럼별 listSlot: "primary" | "secondary" | "kicker" | "inline" | "labeled"
```
컬럼을 한 번 선언하고 **그 컬럼이 리스트 기하에서 어떤 역할인지를 닫힌 enum으로 선언**한다. **우리 `ObjectCard` 역할 슬롯과 같은 형태.**
→ 세 릴리스째 이월된 「DataTable 가로 스크롤」 백로그의 답은 가로 스크롤이 아니라 **역할 슬롯 + variant**이거나, 아니면 **"폰에 표를 놓지 않는다"는 규율로 닫는 것**이다.

---

## 8. 부품 공백 — 우선순위

**T1 (즉시)**
- **첨부 뷰어 2종**(§9)
- **화면 내 세그먼트/탭** — 한국 그룹웨어 조사가 "16종 중 가장 큰 누락"으로 지목. 결재함 5탭(대기/예정/처리/완료/전체) · 읽음/안읽음 명단 · 예약 2탭이 전부 요구
- **하단 결정 바**(`MobileDecisionBar` 후보) — Approve/Reject + More, 인라인 3 상한

**T2**
- **BottomSheet(콘텐츠 전용)** — 확정된 범위
- **속성 칩 줄**(`MobilePropertyChips` 후보) — 가장 강한 부품화 후보. Linear·ClickUp·Jira·Trello 수렴: 담당자→아바타만, 우선순위→글리프만, 라벨→`N labels` 카운트, **필드명 없음**, 미설정은 흐린 칩 또는 `Add` 메뉴 뒤. trailing `+` 고정
- **필터 칩 줄**(`MobileFilterChips` 후보) — 활성 필터 가로 스크롤 + 끝에 Clear(Jira·Drive·ClickUp·Asana)
- ListFooter(더보기 부품화 — TDS는 `border: full|indented|none`까지 닫음)
- **TableRow**(라벨-값 행 = `DescriptionList`의 모바일 짝) — TDS `TableRow(align, leftRatio)`
- 모바일 스켈레톤·빈 상태

**T3**
- PullToRefresh · SwipeCell(단 비제스처 대체 경로 의무) · **IndexBar**(ㄱㄴㄷ 색인 — 조직도·주소록) · **NoticeBar**(사내 공지) · Result(끝났음 ≠ 비어 있음) · Sticky · **Signature**(전자결재 서명) · 결재선 트레일(`MobileStepTrail` 후보)

**T4** — 서비스 런처 그리드 · Coachmark(KRDS는 "도움" 카테고리에 4부품) · Watermark(문서 유출 방지) · MessageBubble(기존 백로그)

**부품이 아닌 층위의 구멍** — `word-break: keep-all` · 고대비 모드(KRDS 본문 15:1) · 모션 토큰(우리 0) · 컴포넌트 토큰 3층 · 폰트 확대 시 토큰별 px 상한 캡(TDS)

**만들지 말 것** — 액션 시트(§1-2) · 문서 뷰어의 오피스/HWP 인라인(플랫폼·서버 위임) · 결재란 격자(폰에서는 트레일로) · 폰 일괄 승인 FAB · 도메인 이름 붙은 모든 것(결재·근태·휴가는 서식/스키마로 — 네이버웍스가 기본 서식 12종으로 정확히 그렇게 함)

---

## 9. 첨부 뷰어 — 착수안 (확정)

### 결정적 사실

> **Android Chrome에는 PDF 렌더 플러그인이 빌드조차 되지 않는다.**
> `enable_pdf = !is_android && !is_ios && !is_castos && !is_fuchsia` — chromium/pdf/features.gni

`<iframe>`·`<embed>`·`<object>` 어느 것도 안드로이드에서 인라인 렌더 불가. **브라우저 네이티브는 "덜 좋은 선택"이 아니라 "동작하지 않는 선택"이다.**
(iOS는 반대로 통념이 뒤집혔다 — Safari 26+가 `UnifiedPDFPlugin`으로 교체되어 스크롤·핀치·텍스트 선택·find-in-page 전부 동작. iOS ≤25는 첫 페이지만.)

### 채택

- **`pdfjs-dist`를 optional peer로 흡수**, 단일 격리 파일(`_pdfEngine.ts`)에 가둔다
  - runtime deps **0개** · Apache-2.0 · CDN 0 · 전 자산 self-host → **TipTap·TanStack 선례와 동형**
  - 자산 실측(6.2.108): `pdf.min.mjs` 126KB gz + `worker` 363KB gz + **`cmaps/` 1656KB(CJK — 한국어 필수)** + `wasm/` 1540KB(6.x 신설) + `standard_fonts/` 800KB. 최소 배포 **489KB gz**
  - ⚠️ **6.x는 `wasmUrl` 필수** — 빠뜨리면 스캔 PDF·JPEG2000·폼 스크립트가 조용히 깨진다
  - react-pdf 탈락(패키지 8개를 소비처 트리에 끌고 오고 pdf.js를 한 메이저 뒤에 고정)
  - `@react-pdf-viewer` **절대 금지** — 상용 + npm 2023-03 정지 + GitHub archived + **라이선스 URL 도메인이 죽음**
- **`react-zoom-pan-pinch`를 두 번째 optional peer**(MIT, deps 0, ~21KB, **헤드리스라 크롬을 우리가 100% 소유**)
  - YARL 탈락 — 자기 UI·스타일을 들고 옴(Toast UI Editor를 뺀 것과 같은 이유)
  - `lightbox.js-react` **절대 금지** — dist에 `axios.post("https://lightboxjs-server.herokuapp.com/license")` 런타임 호출이 박혀 있음(폐쇄망 즉시 실격)
  - 직접 구현 말 것 — GoogleChromeLabs pinch-zoom이 790줄로도 핀치+팬+wheel만 커버, 더블탭·닫기 스와이프 없음
- `package.json`에 **`peerDependenciesMeta` 신설**(현재 없음) → 안 쓰는 소비처는 설치조차 안 함

### 계약

```ts
// _attachment.ts — 데스크탑·모바일 공유 어휘(단일 출처). 부품이 아니라 계약.
export type AttachmentKind =
  | 'image' | 'pdf' | 'document' | 'sheet' | 'slide' | 'archive' | 'unknown';
export type UnviewableReason = 'unsupported' | 'too-large' | 'protected' | 'failed';

export type Attachment = {
  id: string;
  kind: AttachmentKind;      // 확장자→종류 판별은 소비처(도메인·로케일)
  name: string;
  src?: string;
  size?: string;             // 포맷은 소비처(MobileFileRow 선례)
  alt?: string;
  unviewable?: UnviewableReason;   // 있으면 kind와 무관하게 폴백이 이긴다
};

export type AttachmentViewerContract = {
  opened: boolean;
  onClose: () => void;
  items: Attachment[];
  index: number;                            // controlled
  onIndexChange: (next: number) => void;
  onDownload?: (item: Attachment) => void;  // 폴백 카드의 유일한 탈출구
  onPrint?: (item: Attachment) => void;
  onShare?: (item: Attachment) => void;     // 모바일만 그림
  actions?: Action[];                       // 기존 Action 어휘 재사용
};
```

**부품 2종**: `AttachmentViewer`(데스크탑 — Mantine Modal 격리 래핑, dimmed backdrop) / `MobileAttachmentViewer`(모바일 — 불투명 전체 화면 커버, safe-area, 하단 액션 바).
**`layer` prop을 두지 않는다** — 소비처는 자기가 어느 셸인지 안다. 열면 규칙 2(경쟁 경로) 위반.

### 동작 규범 (계약에 박을 것)

- **counter "3/12"는 옵션이 아니라 필수** — APG가 인정한 접근 가능한 이름의 대체 수단. ⚠️ **live region 노드를 뷰어 열 때 함께 삽입하지 말 것**(첫 announce 누락)
- **rotate prop 두지 말 것** — 어느 제품도 라이트박스 크롬에 두지 않음(있으면 editor 안)
- **counter와 filmstrip은 택일.** ERP 첨부는 *경유지*이므로 counter, **크롬 auto-hide 없음**(auto-hide는 사진 앱=체류지 문법)
- **탈출구는 2개까지**(X + Esc/아래로 끌기) — NN/g: 닫기 버튼이 둘 이상이면 명시적 X의 이점이 사라짐
- **가로 스와이프=페이징 / 세로=닫기를 동시에 열지 말 것** — NN/g 직접 경고. `touch-action`은 **제스처 시작 후 변경이 무효**라 CSS로 중재 불가
- **문서 레벨 viewport meta는 절대 건드리지 말 것** — `user-scalable=no`·`maximum-scale<2` 둘 다 **SC 1.4.4 실패**(ACT Rule b4f0c3). 1.4.10 Reflow는 "2차원 레이아웃이 본질인 콘텐츠"를 예외로 두므로 **뷰어 본체는 예외이고 1.4.10은 크롬에 걸린다.** 크롬 텍스트는 rem 기반
- 폴백 카드 = 아이콘 + 파일명 + 용량 + 내려받기 + **사유별 문구**(단일 "미리보기 불가" 금지 — Dropbox 7종/Box 8종이 원인별 분기)
- **데스크탑/모바일 분기는 기존 48em(768) 재사용** — 600dp를 새로 들이면 셸과 뷰어가 어긋나는 폭 구간이 생김

### 포기하는 것
PDF 주석·AcroForm 상호작용 / iOS 17 이하 / 오피스·HWP 인라인(폴백 카드 + 내려받기) / rzpp의 React 19 명시 보증(peer가 `"*"`, 2.15M dl/wk가 실질 근거)

### 착수 전 확인 1건
**iOS 26에서 `blob:` iframe 동작 — 실기기 검증.** 조사에서 유일하게 못 닫은 결정적 미확인 항목.

---

## 10. 곁가지 — 알아둘 사실

- **오피스·HWP**: 네이버웍스는 **서버측 자체 뷰어**로 HWP/HWPX를 렌더하되 **모바일 앱에서는 기기 기본 뷰어에 위임**하고, 보안(다운로드 제한·워터마크)을 켠 회사만 앱 안에서 본다. **패키지가 HWP를 책임질 일이 아니다.**
- **복잡한 장표의 모바일 대응**: 네이버웍스는 지출품의서·지출결의서 같은 서식을 **폰에서 재현하지 않고 PDF로 렌더**한다. `FieldGrid`의 모바일 짝을 만들지 말지 고민할 필요가 없다 — **PDF 폴백이 업계 선택.**
- **규제**: 행안부 2026-05-12 보도자료 — **개방형 문서 형식(HWPX) 준수 의무화, 2026-05-18 시행.** HWP 5.x 바이너리 대응의 수명이 정해졌다.
- **LibreOffice HWP 필터 사용 금지** — 공식 개발자 문서가 *"silently corrupts the input"*이라고 경고. Collabora도 상속.
- **`@cyntler/react-doc-viewer` 금지** — 배포 번들에 `view.officeapps.live.com` 하드코딩. **쓰면 ERP 문서가 Microsoft로 업로드된다.**
- **별도 부품파의 실제 비용은 코드 중복이 아니라 문서 부패다** — Microsoft 실측: fluent2 문서의 iOS 부품 12개 vs 실제 코드 ~40개, README가 나열하는 파일이 트리에 없음. **우리는 `_catalog` 단일 출처 + /dev 박물관으로 방어가 낫지만, 문서 정합 점검에서 `Mobile*`을 최우선에 둘 근거가 생겼다.**
- **Spectrum은 디자인 스펙과 코드가 서로 다른 규칙을 쓴다**(디자인=폭 768 / 코드=포인터 타입, 브레이크포인트 숫자도 불일치). "Spectrum을 따랐다"고 쓸 땐 어느 층인지 명시할 것.
- **TDS 문서 67페이지가 전면 공개**돼 있다(`tossmini-docs.toss.im/tds-mobile`, `.md`·`llms.txt` 기계판독 제공) + npm `@toss/tds-colors`·`@toss/tds-typography`에 토큰 실물. "토스는 비공개"라는 전제가 틀렸다.
- **TDS `2RowTypeC`식 봉인 열거형**이 리스트 행을 닫는 방식으로 우리 지향과 가장 가깝다(개별 크기·굵기 prop 없이 타이포 조합 자체를 이름으로 노출).

---

## 11. 다음 액션

1. **미결 2건 매듭**(§5 폼 어휘 · §6 CTA 규율) → 그 뒤 **「06. 모바일 계열 규율」 신설**
2. **뷰어 착수** — 미결과 안 물리므로 병행 가능. 순서: `_attachment.ts` 계약 → `_pdfEngine.ts` 격리 → 두 부품 → `MobileFileRow.onOpen` → `_catalog`·`_registry` 등재 → README 5절
3. **저비용 교정 묶음**(부품 판정 §4-F의 작은 것들): 인셋 12→16 · `9.5px` rem화 · 96px 인라인 style 제거 · MobileSection heading · MobileChoice 상한 5 · `word-break: keep-all` 전역
4. **kk 회신 문서** — breaking 범위 확정 후

---

## 참고 — 세션 밖 자산

- 이 조사의 원문은 세션 전사(`~/.claude/projects/…`)에만 있고 레포에 없다. **본 문서가 그 요약본이다.**
- 프로젝트 메모리(`~/.claude/projects/-Users-byeongjun-Desktop-erp-dsl/memory/`)도 레포 밖이며 **PC를 옮기면 따라오지 않는다**(경로가 키라서 폴더 위치가 다르면 아예 안 잡힌다). 관련 메모리: `mobile-layer-design` · `tenet-vs-identity` · `no-decorative-subtext` · `dont-name-by-domain` · `dont-rebuild-existing-controls` · `font-scale-accessibility` · `package-never-touches-consumer`.
