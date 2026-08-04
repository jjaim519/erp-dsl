# DSL → kk 회신 — 모바일 부품 R1 요청 판정

발신: erp-dsl · 2026-08-04
대상: `dsl-mobile-parts-r1.md` (kk, v0.70.1 기준)

## §0 판정 기준

요청을 항목별로 보지 않고 **세 갈래로 갈라서** 판정했다. 이 기준이 결론을 정한다.

| 갈래 | 처리 |
|---|---|
| **A · 우리 결함** — kk가 요청 안 했어도 우리가 했어야 할 것 | 무조건 한다 |
| **B · 일반 능력** — 어느 소비처든 필요한 것 | 한다. **단 계약에서 kk 사정을 걷어낸다** |
| **C · kk 화면 그 자체** | **부품으로 안 만든다.** 우리 부품으로 조립되는지 보고, 안 되면 부족한 *일반* 조각만 낸다 |

C를 부품으로 받으면 패키지가 소비처 하나의 화면 모음이 된다. 그건 이 패키지의 존재 이유와 반대다
(헌법 1 — 도메인 의미는 컴포넌트가 아니라 데이터로 들어온다).

**결과: A 4건 · B 8건 · C 3건(부품화 기각).**

---

## §1 A · 우리 결함 — 요청 여부와 무관하게 한다

이 넷은 kk가 지적해줘서 알게 된 **우리 계약의 구멍**이다. 요청이 없었어도 고쳐야 했다.

| | 무엇 | 왜 우리 결함인가 |
|---|---|---|
| 2-5 | `MobileShell.profile` | **데스크탑 `AppShell`은 이미 `profile`을 받는다.** 두 셸의 계약이 어긋나 있었고, 그 탓에 소비처가 탭 하나를 계정에 소비한다 — 06 §4가 연 탭 3~5에서 실질 하나가 준다 |
| 3-1 | `MobileSegment.countTone` | **데스크탑 `TabBar`는 `countTone`을 받는다.** 같은 비대칭 |
| 2-7 | `MobileConfirm` | 패키지에 확인 표면이 없어 `window.confirm`을 쓰게 방치했다. 브라우저 크롬이 앱 표면 밖으로 튀어나온다 |
| — | 로딩 규율의 적용 범위 | v0.68.0에서 정한 규율(400ms 지연 · 기존 행 유지)을 **`MobileBoardList`에만 넣었다.** 2-1이 지적한 그대로다 |

---

## §2 B · 일반 능력 — 수용. 단 계약을 우리가 다시 쓴다

### 2-1. `MobileList<T>` — 수용, 그리고 **2-2를 여기로 흡수한다**

kk 각주가 정답이다("`MobileBoardList`에서 도메인 타입만 제네릭으로 빼면 충분할 수 있다").
`MobileBoardList`엔 게시판 고유의 것들이 있어(공지 구획·안읽음 emphasis·첨부/댓글 카운트)
통째 제네릭화는 안 되지만, **껍데기를 빼내고 그 위에 얹는 건 된다.**

```ts
type MobileListProps<T> = {
  items: T[];                 // **정렬된 상태로 받는다** — 부품은 순서를 만들지 않는다(아래 §3-1)
  getKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;

  // 계층 — 없으면 평면. 있으면 섹션, 그 안에서 한 번 더 묶으려면 groupBy
  sections?: { key: string; title: string; match: (item: T) => boolean }[];
  groupBy?: (item: T) => string;
  renderGroupHeader?: (items: T[]) => ReactNode;
  renderGroupAction?: (items: T[]) => ReactNode;   // 그룹 크기 ≥ 2에서만 렌더(부품 소관)

  filters?: { value: string; label: string }[];
  filter?: string;
  onFilterChange?: (v: string) => void;
  searchQuery?: string; onSearchChange?: (v: string) => void; searchPlaceholder?: string;

  status?: 'loading' | 'empty' | 'ready';
  emptyState?: { icon?: IconName; title: string; description?: string };
  onLoadMore?: () => void; loadMoreLabel?: string; totalCount?: number;
};
```

**왜 두 부품이 아니라 하나인가** — `MobileList`와 `MobileGroupedList`로 가르면
`status`·필터·더보기 계약이 **두 벌**이 된다. 그건 정확히 2-1이 지적한 문제(로딩 규율이 화면마다 다름)를
부품 층에서 반복하는 것이다. 계층은 옵션이 아니라 **축**이므로(평면 / 섹션 / 섹션+그룹)
한 부품 안에서 여는 게 맞다(06 §3-1).

### 2-3. `MobileActionRow` → **`MobileListRow.actions`**

제약 진단은 정확하다(`onClick`이 루트를 `<button>`으로 만들어 `trailing`에 버튼을 못 넣는다).
다만 **그 문제는 v0.67.0에서 이미 풀렸다** — `MobileFileRow.onOpen`이 같은 상황이었고,
`data-split`일 때 행을 컨테이너로 바꾸고 [본체 버튼 | 우측 버튼]을 형제로 둔다.

```ts
actions?: readonly [Action] | readonly [Action, Action];
```

새 부품 대신 이걸 쓰면 부품이 하나 줄고 두 행 부품이 같은 기제·같은 CSS를 쓴다.
`selectable`(일괄)과 `actions`(그 자리)의 구분은 kk 설명 그대로다.

### 2-4. `MobileFilterBar` — 수용. §4 논쟁은 kk가 맞다

칩 줄을 안 낸다. kk의 실패 경험 때문이 아니라 **두 물건이 다르기 때문**이다:

- 조사가 수렴으로 본 것(Jira·Drive·ClickUp·Asana) = 활성 필터를 ***보여주는*** 칩
- 2-4 요구 = 필터를 ***고르는*** 컨트롤

§4에서 kk가 "배타적이지 않다"고 짚은 게 정확하다.
(우리는 2026-08-04 판정에서 `MobileFilterChips`를 "소비처가 없다"로 닫았다 — 06 §7.
 이제 소비처가 왔는데 요구가 칩이 아니라 축 바다. 칩 줄은 계속 안 만든다.)

**계약 흠 1건 — `FilterMarker.swatch.color: string`.** 자유 색 문자열은 열린 스칼라라 헌법 5 위반이다.
`BadgeColor` 같은 닫힌 값으로 받는다. **kk 구현본이 실제로 어떤 색을 쓰는지 알려달라** —
도메인 색이 6개를 넘거나 임의 hex면 그건 색이 아니라 *구분자*라는 뜻이므로 `initial`(글자)이 맞다.

### 2-8. `MobileRecordList` — 수용. **다만 계약은 우리가 다시 쓴다**

kk 스키마는 `cells`(표용)와 `title`/`badges`/`meta`/`trailing`(카드용)을 **따로** 받는다.
그러면 소비처가 매핑을 두 번 쓰게 되고, **kk가 겪었다는 사고(강조가 카드에만 걸림)가 계약 차원에서 반복된다.**

06 §3-4가 이미 답을 적어뒀다:
> *"컬럼을 한 번 선언하고 **그 컬럼이 리스트 기하에서 갖는 역할을 닫힌 enum으로 선언**한다"*(Polaris `s-table`)

```ts
// DataTableColumn에 역할 슬롯을 연다 — 행 데이터는 DataTableRow 한 벌 그대로
listSlot?: 'primary' | 'secondary' | 'kicker' | 'inline' | 'trailing' | 'none';

type MobileRecordListProps = {
  columns: DataTableColumn[];   // listSlot이 카드 표현을 파생시킨다
  rows: DataTableRow[];         // 표와 카드가 **같은 배열**을 본다
  onRowClick?: (id: string) => void;
};
```

**한 벌에서 두 표현이 파생되므로 어긋날 수 없다.** kk가 매핑을 쓸 일이 없다.
적용 범위(열이 많고 값 비교가 목적인 표)는 kk 판단에 동의한다.

### 3-2 · 3-3 · 3-4 · 3-6 — 수용

- **3-2** `MobileDisclosure` 위계: `title`을 `ReactNode`로 여는 대신 **`sub?: string`을 더한다.**
  raw 슬롯을 열면 무엇이든 들어와 한 줄의 규격이 소비처마다 갈린다(06 §3-1 — 축이 추가될 때만 연다).
  위계가 두 단인 게 요구이므로 축은 하나면 된다. **이걸로 포크를 폐기할 수 있는지 확인해달라.**
- **3-3** 마커 슬롯: 라벨 앞 + `flex: none`. 폭이 부족할 때 무엇이 남아야 하는가의 문제라 일반적이다.
- **3-4** 연속 구간 라벨 반복: **버그에 가깝다.** 데스크탑은 반복하는데 모바일은 안 해서
  같은 데이터가 두 표현에서 다르게 읽힌다. **prop으로 열지 않고 기본을 반복으로 고친다** —
  안 반복하는 게 맞는 사례가 나오면 그때 축을 연다.
- **3-6** `MobilePullToRefresh`: 수용. 단 06 §1-4(제스처는 유일 경로가 아니다)에 따라
  **새로고침의 다른 경로가 화면에 있어야 한다**는 것을 계약 주석에 박는다.

### §5 BottomSheet — 수용. 기대 스키마 그대로

콘텐츠 시트만(06 §2-2 확정 범위)이고 3~4 필드는 상한(6) 안이다.
키보드 회피·safe-area·높이 스냅 포함한다.

---

## §3 C · 부품화 기각 — 3건

### 3-1. 2-2 `MobileTaskList` — **계약 자체가 도메인이다**

이름(`Task`)만의 문제가 아니다. 계약이 도메인을 안다:

```ts
sortKey: (item) => { priority: boolean; due: string|null; stale: string|null }  // 3단 정렬이 부품 안에 박힘
isDone: (item) => boolean                                                        // 대기/완료 2탭 고정
```

**부품이 "우선순위·마감·경과"라는 개념을 아는 순간 도메인 무지가 깨진다.** 2탭 고정도 특정 워크플로다.

도메인을 걷어내면 남는 것:

| kk 계약 | 걷어낸 뒤 |
|---|---|
| `sections` · `groupKey` | **일반적** → `MobileList.sections` / `groupBy`(§2-1) |
| `sortKey` 3단 | **소비처가 정렬해 넘긴다.** 부품은 순서를 만들지 않는다 |
| `isDone` 2탭 | **`MobileSegment` + 소비처 필터링.** 이미 있는 부품이다 |
| `renderGroupAction` 노출 판정(≥2) | 일반적 → `MobileList`가 갖는다 |

→ **새 부품 없이 `MobileList`로 조립된다.** 정렬을 소비처가 갖는 게 손해처럼 보이지만,
정렬 규칙은 화면마다 다르고 그건 데이터의 일이다(헌법 1).

### 3-2. 2-6 `MobileBulkBar` — 이미 있다

`selectedCount` + `actions` + `onCancel`은 **`MobileDecisionBar`(v0.66.0)로 그대로 조립된다.**

```tsx
bottom={<MobileDecisionBar
  primary={{ label: `${n}건 승인`, onClick: run }}
  more={[{ label: '선택 해제', onClick: clear }]} />}
```
취소(모드 종료)는 셸 상단 `onBack`이 받는다 — 하단에 또 두면 탈출구가 둘이 된다.

**진짜 요청은 `BulkReport`이고, kk도 "부품이 아니라 규율"이라 적었다.** 동의한다.
알림으로 받고 문구 규칙(3건 나열 + `외 N건`)만 공유 헬퍼로 낸다.

### 3-3. 3-5 범례를 `MobileFilterBar`로 대체 — 기각

**범례는 범례고 필터는 필터다.** 범례가 좁은 화면에서 잘리는 건 실제 결함이지만,
그 해법이 필터 부품이어야 할 이유가 없다(읽는 것과 고르는 것은 다르다 — §2-4에서 우리가 든 논거와 같다).

**범례 자체의 접힘·줄바꿈으로 푼다.** 값이 늘 때 어떻게 접을지는 우리가 정한다.

---

## §4 넘겨달라

**구현본 3건** — 동작 계약이 촘촘해 검증된 코드가 있으면 빠르다.

| | 이유 |
|---|---|
| **2-4 `MobileFilterBar`** (195줄) | 메뉴 위치·요약 말줄임·축 간 키 충돌 방지의 실제 처리 |
| **2-5 `MobileShell.profile`** (330줄) | 기기 분기의 실제 형태 |
| **3-6 `MobilePullToRefresh`** (130줄) | `preventDefault` 조건이 까다롭다 |

2-2 · 2-6 · 2-8은 **안 받는다**(부품화 기각 또는 계약 재설계). 다만 2-6의 **실패 보고 문구**를
만드는 부분만 짧게 발췌해주면 헬퍼에 반영한다.

**포크 diff** — 3-2 `MobileDisclosure`, 3-3~3-5 `MobileCalendar`.
포크에서 무엇을 고쳤는지가 곧 요구 명세다. 스키마보다 정확하다.

---

## §5 확인 필요 — 설계에 걸리는 것

1. **2-1의 `filters`와 2-4 `MobileFilterBar`가 한 화면에 같이 서는가?**
   §5 점검표의 목록 ①이 "축 2 · `MobileChoice`"인데 2-4도 축 필터다.
   같이 선다면 둘의 역할 경계를 계약에 적어야 한다(안 그러면 소비처마다 갈린다).
2. **2-3 행 액션이 3개 필요한 행이 있는가?** 상한을 2로 잡았다 — 제목·메타가 이미 폭을 쓰므로
   행 안에서는 2가 실질 상한이라 본다.
3. **`MobileShell`을 태블릿에서도 쓰는가?** 우리 분기는 768 하나이고 그 아래는 전부 `MobileShell`이다.
   모바일 셸 안이면 항상 터치이므로 **profile 표면을 드로어 하나로 고정**하려 한다.
4. **BottomSheet 폼 필드의 타입** — 텍스트·금액·날짜·선택 중 무엇인지.
   키보드 회피가 타입에 따라 갈린다(날짜 피커는 키보드를 안 띄운다).
5. **2-4 `swatch`가 실제로 쓰는 색** — §2-4 참조.
6. **3-2를 `sub?: string`으로 열면 포크를 폐기할 수 있는가?**

---

## §6 우리 쪽 예정

- **breaking 없음.** 신설·보강 전부 additive다. kk는 v0.70.1로 올린 뒤 §1-1(`actions` 튜플)만 조치하면 된다.
- `MobileList` 신설로 `MobileBoardList` 내부가 바뀌지만 **props는 그대로**다. kk 코드 수정 불필요.
- 착수 순서는 kk 우선순위를 따르지 않는다 — **전부 하기로 했다.** 의존 순으로 간다:
  `MobileList`(로딩 규율의 단일 출처) → 나머지.
