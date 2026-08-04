# DSL → kk 회신 R3 — 전부 반영. 단 **약속 하나를 철회한다**

`@jjaim519/erp-dsl` **v0.73.0** 배포 완료. R2에서 확인해준 6건 답변을 전부 계약에 박았다.

먼저 철회부터 적는다. R1 §1에서 **&ldquo;요청 여부와 무관하게 한다&rdquo;**고 A급으로 약속한 것 중 하나를 안 만들기로 했다.

---

## §0 철회 1건 — `MobileShell.profile`

**우리가 &ldquo;계약 비대칭&rdquo;으로 판정한 게 틀렸다. 비대칭이 아니라 구조 차이다.**

데스크탑 아바타가 하는 일은 둘인데, 모바일에선 둘 다 이미 처리돼 있다.

| 아바타의 일 | 데스크탑 | 모바일 |
|---|---|---|
| ① 표지 — "이 구석은 나에 관한 곳" | 넷바 하단 유틸리티 존의 아바타 | **&ldquo;내정보&rdquo; 탭 라벨.** 그림보다 글자가 정확하다 |
| ② 진입 — 메뉴 열기 | 아바타 클릭 → `Menu` | **탭 이동 자체** |

구조도 다르다. 데스크탑 넷바에는 `{(profile || notification) && <M.Section borderTop…>}` 라는 **여유 코너**가 있지만,
모바일 탭바는 **모든 픽셀이 탭**이라 그런 존이 없다. 없는 존을 만들어 짝을 맞추면 모바일 셸이 데스크탑의
**축소판**이 되는데, 06이 처음부터 아니라고 한 것이다(&ldquo;`AppShell`의 **형제**(축소판 아님)&rdquo;).

**&ldquo;탭 하나를 계정에 쓴다&rdquo;는 손실이 아니라 플랫폼의 값이다.** 실물이 그렇게 치른다 —
Instagram(2011 네비 개편부터 Profile이 하단 탭) · YouTube(&ldquo;You&rdquo;) · Airbnb(2014 드로어 → 2016 하단 네비).
상단 아바타는 소수 흐름이고(Snapchat·Nike·Asana·Spotify) 출처가 **&ldquo;표준 위치인 하단에서 옮겨간 것&rdquo;**
이라고 명시한다. 게다가 Google 계열이 상단 아바타를 쓰는 이유는 **계정 전환**인데 **그룹웨어엔 그 요구가 없다.**

그래서 아바타의 자리가 갈린다:

- **&ldquo;남이 누구인가&rdquo;** — 귀속 정보. 실재한다(`MobileBoardView` 작성자·`MobileComment`)
- **&ldquo;내가 누구인가&rdquo;** — 모바일에 자리가 없다

계정 화면은 도메인(설정 항목·권한·로그아웃 정책)이고 **이미 우리 부품으로 조립된다**:
`MobileTop` + `MobileSection` + `MobileListRow`. 셸이 낼 것이 없다. → 06 §5-1에 남겼다.

**넘겨준 `ProfileCard.tsx` 330줄은 읽지 않았다.** R2 §1-3에서 &ldquo;태블릿에선 안 쓴다·드로어 고정&rdquo;으로
**우리가 그 코드를 달라고 한 이유(기기 분기의 실제 형태) 자체가 사라졌기** 때문이다.

> **알림(`notification`)은 다르다.** 같은 유틸리티 존에 살지만 그건 **표지가 아니라 미처리 건수**라
> 탭 라벨이 대신해줄 수 없다. 요청이 없어 지금은 안 건드리지만, 필요해지면 말해달라 — 이건 진짜 구멍일 수 있다.

---

## §1 신설 5부품 — 전부 나갔다

| 부품 | 계약이 R1에서 바뀐 곳 |
|---|---|
| **`MobileBottomSheet`** | 이름이 `BottomSheet` → `MobileBottomSheet`. 우리 배럴은 **`Mobile*` 접두가 곧 경계**라 접두 없이 두면 `Modal`·`Drawer` 옆에서 데스크탑 부품으로 읽힌다 |
| **`MobileConfirm`** | 선언형(`opened`를 소비처가 쥔다). `await confirm()` 같은 명령형은 안 만든다 |
| **`MobileFilterBar`** | `prefix` 제거 · `summaryMax` 제거 · `swatch` 닫음 · `action`을 `Action`으로 (아래) |
| **`MobileRecordList`** | `DataTableColumn.listSlot`에서 파생 — R1에 적은 그대로 |
| **`MobilePullToRefresh`** | 리스너를 **window가 아니라 스크롤 조상**에 건다 (아래) |

### 1-1. `MobileFilterBar` — 스펙 4곳을 고쳤다

```ts
type FilterMarker =
  | { kind: 'swatch'; color: CalendarColorRole }   // ← string이 아니다
  | { kind: 'initial'; text: string }
  | { kind: 'emphasis'; value: 'solid' | 'dashed' };

type FilterRow  = { key: string; label: string; count?: number; marker?: FilterMarker };
type FilterAxis = { id: string; label: string; rows: FilterRow[]; action?: Action };  // prefix 없음

type Props = {
  axes: FilterAxis[];
  hiddenKeys: ReadonlySet<string>;      // 이름만 바뀜(hidden → hiddenKeys)
  onToggle: (key: string) => void;
  onReset: () => void;
  resetLabel?: string;                  // summaryMax 없음
};
```

- **`swatch`** — R2 §5 그대로 `CalendarColorRole`로 받는다. 같은 인코딩 어휘여야 &ldquo;달력에서 이 색으로 그려진다&rdquo;가 거짓말이 아니다.
- **`prefix` 제거** — 부품에 문자열 접두사를 시키면 키 공간이 둘(원본/접두사)이 되어 `hiddenKeys`에 어느 쪽을 넣는지가 흐려진다.
  **`row.key`가 바 전체에서 유일하다**는 규칙 하나로 닫았다. 지금 쓰는 `st:` / `ow:` 접두를 그대로 `key`에 넣으면 된다.
- **`summaryMax` 제거** — 부품이 글자수를 세는 순간 기준이 폭이 아니라 길이가 된다.
  요약은 값 이름을 잇지 않고 **&ldquo;축 N&rdquo;**(보이는 개수)으로 낸다 — 길이가 안 변해서 바 폭이 안 출렁인다.
- **`action`** — 우리 `Action`(`label`·`onClick`·`icon?`·`variant?`)을 쓴다. 새 모양을 만들면 아이콘·톤이 여기서만 안 된다.

**`hiddenKeys`(부정 극성)는 그대로 뒀다** — 그쪽 판단이 맞다. 데이터에 새 담당이 생기면 `hiddenKeys`에 없으니
**자동으로 보인다.** `selected`였다면 새 값이 기본 숨김이 되어 조용히 누락됐을 것이다.

**값 고르기는 시트다.** 06 §2-2가 시트를 *생성·편집·**피커***로 열어뒀고 필터 값 고르기가 정확히 피커다.
그래서 `MobileFilterBar`가 `MobileBottomSheet` 위에 선다 — 만들다 발견한 의존이라 순서를 바꿔 시트를 먼저 냈다.

**`MobileList.filters`와의 경계**는 R2 제안 그대로 계약 주석에 박았다: *축이 하나면 `filters`, 둘 이상이면 `MobileFilterBar`.*

### 1-2. `MobilePullToRefresh` — 그쪽 코드에서 **기제만** 봤다

`preventDefault` 조건이 까다롭다는 말이 맞아서 이벤트 처리부만 확인했다(도메인은 안 읽었다).
`touchmove`만 `passive:false`, 나머지는 `passive:true`, `preventDefault`는 **최상단 + 아래로**일 때만 — 그대로 가져왔다.

**한 곳은 다르게 했다.** 그쪽은 `window`에 거는데, 우리 셸은 문서를 잠그고(`.erp-mobile-lock`) `.ms-body`만 스크롤한다.
`window.scrollTop`이 항상 0이라 &ldquo;최상단&rdquo;이 늘 참이 되어 **아무 데서나 당겨진다.**
그래서 **가장 가까운 스크롤 조상**을 찾아 거기 건다. 그대로 베꼈으면 동작하지 않았을 부분이다.

임계 72px · 감쇠 0.5. 06 §1-4대로 **다른 새로고침 경로를 화면에 두는 건 그쪽 책임**이고, 그 문구를 계약 주석에 박았다.

---

## §2 보강 4건

| | 무엇 |
|---|---|
| **`MobileDisclosure.sub?: string`** | 포크 지워도 된다. 제목+보조를 한 묶음으로 묶어 남는 폭을 갖게 했고, **제목만 말줄임**되고 보조·`meta`는 남는다(그래서 `sub`는 짧아야 한다) |
| **`MobileSegment.countTone`** | 열었다. **기본값은 `neutral`**이다(데스크탑 `TabBar`는 `danger`) — 하단 탭바(primary)는 &ldquo;가서 처리해라&rdquo;고 화면 안 세그먼트(secondary)는 &ldquo;지금 보는 갈래&rdquo;라 건수가 정보성이다. 행동요구인 갈래만 `danger`로 올려 쓰면 된다 |
| **`MobileSegment.showZero`** | **요청에 없었지만 같은 결함 부류라 함께 열었다.** 결재함 5탭이 정확히 단계별 큐고, 안 열면 라벨 문자열에 숫자를 박아 우회하게 된다 |
| **`MobileListRow.actions`** | `readonly [Action] | readonly [Action, Action]`. `MobileFileRow.onOpen`과 **같은 기제·같은 CSS**(행이 컨테이너가 되고 [본체｜액션]이 형제). **chevron은 사라진다** — 진입 표적이 본체로 좁아졌는데 오른쪽 끝 꺽쇠는 아무 데도 안 데려간다 |

---

## §3 버그 1건 — 연속 구간 라벨

R2 §0-1에서 &ldquo;정보로 남긴다&rdquo;고 한 그것, **고쳤다.** `MobileCalendar`가 `isStart` 조각에만 라벨을 그려서
3주짜리 일정이 둘째·셋째 주에서 이름 없는 색 막대였다. 이제 조각마다 반복한다.
**prop으로 열지 않았다** — 안 반복하는 게 맞는 사례가 나오면 그때 축을 연다.

나머지 `MobileCalendar` 2건(마커 위치·범례)은 **철회 수용.** 그쪽 판단이 맞다.

---

## §4 그쪽 원칙을 우리 규율로 받았다

R2 §0-1의 문장을 06 §5-2에 넣었다. **우리가 먼저 세웠어야 할 선이다.**

> 도메인 특수가 섞이는 변형은 부품이 덮지 않는다 — 소비처가 포크로 안는다.
> 단 계약의 비대칭·구멍은 우리가 메운다.

가르는 기준을 **&ldquo;축이 누구 것인가&rdquo;**로 적었다. 축이 소비처 것이면(달력 마커) 포크, 축이 우리 것이면(모바일만 못 받는 자리) 우리가 메운다.
**단 포크로 넘긴 것에도 예외가 있다 — 비대칭은 정보로 남긴다.** §3이 그 예다.

---

## §5 그쪽에서 할 것

| | |
|---|---|
| 1 | **v0.73.0으로 올린다.** breaking 없음 — 신설·보강 전부 additive다 |
| 2 | `MobileDisclosure` **포크 파일을 지우고 배럴로 돌아온다**(`sub` 나갔다) |
| 3 | `MobileShell.profile`을 **기다리지 않는다.** 탭 하나를 계정에 쓰는 현행 구성을 유지하면 된다(§0) |
| 4 | `MobileFilterBar` 이행 — `prefix`를 없애고 그 접두를 `row.key`에 합쳐 넣는다. `swatch`는 `CalendarColorRole` |
| 5 | 이름 확인 — `BottomSheet`가 아니라 **`MobileBottomSheet`** 다 |

## §6 아직 안 된 것 1건

**일괄 결과 보고 헬퍼.** R1 §4에서 `MobileBulkBar`의 **실패 보고 문구**만 발췌해달라고 했는데 아직 안 왔다.
&ldquo;3건 중 1건 실패&rdquo; 같은 문장을 우리가 지어내면 그게 도메인이 된다 — 실물 문구를 보고 만든다.

## §7 확인 필요 1건

**`MobileRecordList`에 `listSlot`을 실제로 붙여보고 부족한 슬롯이 있는지.**
지금 연 것은 `primary` · `secondary` · `kicker` · `inline` · `trailing` · `none` 여섯이다.
표에서 카드로 못 내려오는 열이 나오면 알려달라 — **슬롯을 더 열지, 그 열은 좁은 화면에 안 내보낼지**를 같이 정하자.
