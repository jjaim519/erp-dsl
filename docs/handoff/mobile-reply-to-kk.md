# DSL 회신 — 모바일 계열 재정립 (R1~R6 완료)

수신: kk 레포 세션
작성: 2026-08-04 (erp-dsl, v0.61.0 → **v0.67.0**)

## §0 요약

모바일 16부품의 규율을 **선언 후 도출** 순서로 뒤집었다. 근거 문서 「06. 모바일 계열 규율」을 신설하고
R1~R6로 이행했다. **소비처 코드 수정이 필요한 것은 단 1건**(`MobileShell.actions`)이다.

나머지는 전부 시각 변경이거나 additive라 컴파일·동작이 그대로 유지된다. 다만 **입력칸 생김새가 크게 바뀌므로**
스크린샷 기반 문서·QA 시나리오가 있으면 갱신이 필요하다.

새 부품 4종(`MobileSegment` · `MobileDecisionBar` · `AttachmentViewer` · `MobileAttachmentViewer`)이 늘었고,
그중 뷰어는 **선택 의존성**(`pdfjs-dist`)을 쓴다 — 안 깔면 PDF가 폴백 카드로 뜬다(터지지 않는다).

---

## §1 소비처가 고쳐야 할 것 — 1건

### `MobileShell.actions` 상한 2 ⚠️ BREAKING

```ts
// before
actions?: Action[]
// after
actions?: readonly [Action] | readonly [Action, Action]
```

**3개 이상 넘기던 화면은 타입 에러가 난다.** 인라인 배열 리터럴(`actions={[{...}]}`)은 튜플로 추론되어
그대로 통과하므로, 대부분의 소비처는 손댈 게 없다. 변수에 담아 넘기던 경우만 걸린다.

넘치는 액션은 **오버플로 메뉴(`Menu`)로** 내린다. 상한이 2인 이유: 좌측 `‹`와 제목이 축을 예약하고 있어
셋째부터 제목이 밀린다. Base Web의 `MobileHeader`가 같은 자리를 `[IconButton?, IconButton?]` 튜플로
닫아둔 선례가 있다.

---

## §2 눈에 띄게 달라지는 것 — 코드 수정은 불필요

### 2-1. 모바일 입력칸이 **면(fill)** 어휘로 바뀌었다

밑줄 → 채워진 라운드 박스(`radius.md 16` + squircle). 포커스는 윤곽 2px가 말한다.

| 상태 | 표현 |
|---|---|
| 기본 | 면만 (`--surface-input`), 윤곽 2px 투명 |
| 포커스 | 윤곽 2px `--border-focus` |
| 에러 | 윤곽 2px `--text-danger` (포커스보다 세다) |
| 고대비 모드 | 윤곽 상시 (`prefers-contrast: more`) |

**예외 — 본문 캔버스(`Textarea variant="canvas"`)는 면도 윤곽도 없다.** 포커스에서도 캐럿만 뜬다.
섹션의 주인공 면이라 상자를 만들지 않는다(WCAG 2.4.7이 텍스트 필드의 캐럿을 포커스 표시로 인정한다).

**칩 줄·펼침 트리거는 면을 안 입는다.** 입력 원자가 아니라 통로를 읽지 않기 때문이고, 이건 규율이 아니라
구조가 이미 그렇다.

### 2-2. 데스크탑 입력칸 테두리도 진해졌다

`--border-default`(구분선)를 빌려 쓰던 것을 끊고 `--border-field` 역할을 신설했다.
입력칸 경계가 섹션 헤어라인과 같은 색이던 문제(1.27:1)가 해소된다. **데스크탑 폼 전체에 적용된다.**

### 2-3. 한글 줄바꿈이 어절 단위가 된다

`word-break: keep-all` 전역. 이전엔 한글이 음절 단위로 끊겼다. 예외는 `.break-all` 유틸.

### 2-4. 인셋·정렬 미세 조정

`MobileStatRow`·`MobileCalendar`·`MobileComposer` 좌우 12 → 16, `MobileFileRow` 세로 12 → 16.
`MobileComment` 답글 들여쓰기가 4px 이동했다(이전 값이 실제 정렬선과 어긋나 있었다).

---

## §3 새로 생긴 것 — additive, 안 써도 그만

| 부품 | 추가 | 용도 |
|---|---|---|
| `Chip` | `type?: 'checkbox' \| 'radio'`, `name?` | 단일 선택 그룹의 **진짜 시맨틱**. `MobileChoice`가 이걸로 `role="radiogroup"`을 참으로 만들었다 |
| `MobileFileRow` | `onOpen?` | 첨부 **뷰어 진입점**(R6 선반영). 있으면 행 본체=열기, 내려받기는 우측 버튼으로 갈라진다 |
| `MobileSection` | `headingLevel?: 2 \| 3` | 제목이 `<span>`에서 heading으로. 기본 3이라 안 줘도 된다 |

### 3-1. 새 부품 4종 (R5·R6)

**`MobileSegment`** — 화면 *안*의 뷰 전환. 결재함 5탭(대기/예정/처리/완료/전체), 읽음/안읽음 명단, 예약 2탭 자리다.
칩 줄(`MobileChoice`)과 형태가 비슷하지만 다른 말을 한다 — 칩 줄은 **값 선택**(고르면 걸러진다),
세그먼트는 **뷰 전환**(항상 하나가 켜져 있고, 고르면 목록이 다른 것으로 바뀐다).

```tsx
<MobileSegment ariaLabel="결재함" value={tab} onChange={setTab}
  items={[{ value: 'wait', label: '대기', count: 3 }, …]} />
```
**균등/스크롤은 prop이 아니다** — 항목 수가 정한다(M3: 2~3 고정 / 4+ 가로 스크롤).
5탭에 카운트까지 붙으면 375px에 균등으로 안 들어가 라벨이 뭉개진다.

**`MobileDecisionBar`** — 결재·승인 화면의 하단 결정 바. `MobileShell.bottom`에 꽂는다.

```tsx
<MobileShell … bottom={
  <MobileDecisionBar
    primary={{ label: '승인', onClick: approve }}
    secondary={{ label: '반려', onClick: reject }}
    more={[{ label: '보류', onClick: hold }, { label: '전결 위임', onClick: delegate }]} />
} />
```
`primary`가 하나뿐인 건 의도다 — **강조 버튼 페이지당 1개**(SAP)를 타입에 박았다. 인라인은 최대 둘,
나머지는 `⋯` 메뉴로 간다(폰 하단 한 줄에 셋이면 각 표적이 44pt 밑으로 내려간다).
Workday 모바일이 Approve만 하단에 두고 Deny·Send Back을 More로 내린 형태와 같다.

**`AttachmentViewer` / `MobileAttachmentViewer`** — §4-1 참조.

---

## §4-1 첨부 뷰어 — 쓰려면 알아야 할 것

```tsx
const [open, setOpen] = useState(false);
const [idx, setIdx] = useState(0);

<MobileFileRow name={f.name} size={f.size}
  onOpen={() => { setIdx(i); setOpen(true); }} onDownload={() => download(f)} />

<MobileAttachmentViewer
  opened={open} onClose={() => setOpen(false)}
  items={items} index={idx} onIndexChange={setIdx}
  onDownload={download} onShare={share}
  pdfAssetBase="/pdfjs"           // ← PDF를 열려면 필수. 아래 참조
/>
```

**이미지는 기본 지원. PDF는 선택 의존성이다.**

1. `npm i pdfjs-dist` (optional peer — 안 깔면 PDF가 폴백 카드로 뜬다)
2. `node_modules/pdfjs-dist`에서 **넷**을 `public/` 아래로 복사하고 그 경로를 `pdfAssetBase`로 넘긴다:
   `build/pdf.worker.min.mjs` · `cmaps/` · `standard_fonts/` · `wasm/`

| 빠뜨리면 | 증상 |
|---|---|
| `cmaps/` | **한글 PDF가 깨진다**(CJK 인코딩) |
| `wasm/` | 스캔 PDF·JPEG2000·폼이 **조용히** 깨진다(에러 없이 빈 페이지) |

`pdfAssetBase`를 안 주면 뷰어가 PDF를 **아예 안 연다** — 조용히 깨지느니 폴백 카드가 낫다는 판단이다.
복사 스크립트 예시는 우리 레포 `scripts/copy-pdfjs-assets.mjs`에 있다. **CDN은 쓰지 않는다**(폐쇄망).

**왜 pdf.js인가**: Android Chrome에는 PDF 렌더 플러그인이 **빌드조차 되지 않는다**
(`chromium/pdf/features.gni`: `enable_pdf = !is_android && …`). `<iframe>`·`<embed>`·`<object>` 전부 불가라,
브라우저 네이티브는 "덜 좋은 선택"이 아니라 **동작하지 않는 선택**이다.

**폴백 카드는 사유별 문구를 쓴다** — `Attachment.unviewable`에 `'unsupported' | 'too-large' | 'protected' | 'failed'`를
넣으면 그에 맞는 안내가 뜬다. 단일 "미리보기 불가"를 쓰지 않는 이유: 사용자가 다음에 뭘 할지가 사유마다 다르다
(형식→내려받기 / 용량→데스크탑 / 보호→권한 요청). **서버가 판단한 사유를 그대로 넘겨달라.**

오피스·HWP는 인라인 렌더를 하지 않는다(폴백 + 내려받기). 네이버웍스도 모바일에선 기기 기본 뷰어에 위임한다.

---

## §4 접근성 — 고쳐진 것 3건

1. **`MobileSection` 제목이 heading이 아니었다** → 스크린리더 제목 탐색이 통째로 죽어 있었다. `h3` 기본.
2. **`MobileChoice`가 거짓 `radiogroup`이었다** → 자식이 `checkbox`인데 라디오 그룹이라 선언해
   스크린리더가 없는 구조("5개 중 1번")를 읽어줬다. 이제 실제 라디오다.
3. **폰트 스케일을 안 타던 요소 2건** → 달력 담당 배지(9.5px 하드코딩), 컴포저 높이 상한(96px 인라인).

**의도적으로 미달인 것 1건**: 입력칸 경계 대비가 3:1에 못 미친다(데스크탑 윤곽 2.59:1 / 모바일 면 1.09:1).
KRDS가 "테두리 **또는 채움**이 3:1"을 *권장*하고, 3:1 단은 시각적으로 과하다고 판단했다.
**미달분은 고대비 모드가 받는다** — `prefers-contrast: more`에서 윤곽이 3:1 초과 단으로 켜진다.
공공 납품처럼 3:1을 강제해야 하는 건이 있으면 알려달라. 토큰 한 줄이라 되돌리기 싸다.

---

## §5 회신 필요 2건

### 5-1. 한글 PDF 실물 확인 (뷰어를 쓸 거라면)

`cmaps` 배선이 맞았는지의 **유일한 증거는 한글 PDF가 안 깨지는 것**이다. 우리 dev 환경에는 실물 한글 PDF가
없어 확인하지 못했다. 그쪽에서 실제 결재 첨부(HWPX→PDF 변환본 등)로 한 번 열어보고 알려달라.
글자가 깨지면 `cMapUrl`/`cMapPacked` 문제이고 `_pdfEngine.ts` 한 곳에서 고친다.

### 5-2. 게시판 '글쓰기' 위치

`MobileTop.action`(제목 줄 우측 텍스트 버튼)에 그대로 뒀다. 하단 FAB으로 내리는 안은 기각했다:
인용 근거(Google·Trello·Monday·ClickUp·Asana)가 전부 **생성이 주 루프인 앱**이라 사내 게시판에
전제가 안 맞고, 우리 셸은 하단이 이미 2층(탭바 + `bottom`)이라 FAB이 목록 마지막 행을 가린다.

**뒤집힐 조건**: 네이버웍스·WEHAGO 같은 한국 그룹웨어가 게시판 글쓰기를 하단 FAB으로 둔다면 재고한다.
실사용 관습이 가장 무거운 근거인데 공식 문서에서 확인이 안 됐다. **그쪽에서 실물을 확인할 수 있으면
그 한 장면이 결론을 확정한다.**

---

## §6 확인 방법

```
/dev → 모바일 → 부품 클릭        부품 하나가 폰 프레임에 바로 뜬다(iframe)
/dev → 모바일 → 화면             4탭 데모를 안 거치고 빈 상태·발주·일정 상세로 직행
/dev 좌측 '아주크게'              폰 안에도 적용된다(폰트 스케일 검증)
```

이번 재정립에서 `_registry`의 모바일 항목이 링크 한 줄이던 것을 실물 데모로 바꿨다.
부품별 상태(기본·빈칸·에러·비활성)가 한 화면에 나란히 놓여 조작 없이 보인다.

---

## §7 릴리스

| 태그 | 내용 |
|---|---|
| `v0.62.0` | 입력칸 면 어휘 + L0 전역 층 + 06 문서 |
| `v0.63.0` | 인셋·폰트 스케일·접근성·매직넘버 교정 |
| `v0.63.1` | 본문 캔버스 포커스 상자 제거 |
| `v0.64.0` | 모션 토큰 3단 + 중복 `prefers-reduced-motion` 7곳 제거 |
| `v0.65.0` | **`actions` 상한 2**(유일한 breaking) · `Chip` radio · `FileRow.onOpen` |
| `v0.66.0` | `MobileSegment` · `MobileDecisionBar` |
| `v0.67.0` | 첨부 뷰어 2종 + `_attachment` 계약 + `pdfjs-dist` optional peer |

`@jjaim519/erp-dsl@0.67.0`으로 올리면 **§1 한 건만** 확인하면 된다.
PDF 미리보기를 쓸 계획이면 §4-1의 자산 복사까지.
