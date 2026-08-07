# 인수인계 — `MobilePaperViewer` 재작성 (2026-08-07)

> `handoff-2026-08-05.md`(`v0.75.2` 기준)의 **델타 한 건**이다. 그 문서의 §1-2와 §3 검증 동선 한 줄이
> 이 문서로 대체된다. **아직 커밋·발행 전이고, 버전은 `0.76.2`에서 안 올렸다**(발행 시 `0.77.0`, breaking).

---

## 1. 무엇이 바뀌었나 — 읽기 뷰 폐기 · 계약을 `children`으로

`v0.75.0`은 두 뷰였다: 장표를 라벨-값으로 **투영**하는 읽기 뷰와, 캔버스를 그대로 두는 원본 뷰.
그 자랑은 *"Liquid Mode는 구조를 AI로 추론하지만 우리는 이미 갖고 있다"* 였는데, 문서 체계가
`PaperSpec`으로 옮겨오면서 **그 전제가 사라졌다.**

- `PaperCell`은 좌표(`c`/`cs`/`rs`)와 `text`/`field`/`border`만 갖는다. **라벨-값 짝이 없다** —
  "왼쪽 칸이 라벨"이라는 **시각적 인접성 추론**으로만 성립한다. 되살리면 우리도 Liquid Mode와 같은 처지다.
- 실제로 소비처(kk `InquiryDetailMobile`)는 그걸 피하려고 **폰 전용 2열 격자를 손으로 합성**해 넘기고
  있었다(`agency-order-paper.ts`, 188줄). 그래서 **「원본」 탭이 원본이 아니었다** —
  진짜 발주서는 `AgencyOrderConfirmView`(210mm·자체 쪽나눔)다.

투영을 안 하면 **구조가 필요 없다.** 장표 스키마를 받던 유일한 이유가 투영이었으므로 계약은
`PaperModal`과 같은 `children`으로 돌아왔다.

```ts
// 이전 (0.75)                          // 지금 (0.77)
<MobilePaperViewer                      <MobilePaperViewer
  columns={4} rows={rows}                 title="거래명세서 …">
  fields={fields} values={values} />      <PaperDoc spec={spec} values={values} />
                                        </MobilePaperViewer>
```

- **배율은 뷰어가 소유한다.** 문서는 배율 없이 넘긴다(소비처가 자기 fit을 걸면 두 겹이 된다).
- **높이는 잰다**(`canvas.offsetHeight`). 그래서 계약에 쪽 수가 없어도 **여러 장이 그냥 된다.**
- `orientation`은 이제 **폭만** 정한다(`PAPER_CANON` 단일 출처).

## 2. 확대 — 목업이 정한 것

폰에서는 **폭이 늘 구속조건**이다. 세로 A4를 폭에 맞추면 한 장이 556px이라 무대(659~739px)에 통째로
들어온다 → **폭맞춤이 곧 「한 장 전체」**여서 하한을 따로 높이맞춤으로 열 이유가 없다.

| | |
|---|---|
| 열자마자 | **폭맞춤**(≈49%). 문서 전체 모양을 먼저 보여준다 |
| 더블탭 | **폭맞춤 ↔ 100%**, 탭 지점이 앵커. 문서 뷰어의 관습 |
| 핀치 | 그 사이를 연속으로. 실기기 검증 대기(§4) |
| 하단 표기 | 누르면 맞춤 → 100% → 200% 순환. **WCAG 2.5.1의 보이는 경로**(더블탭은 가속기라 이걸 못 대신한다) |

부수로 고친 것: 축소분이 무대보다 작을 때 **가운데 정렬**(전엔 좌상단에 붙었다) · 확대 표기의
`100%` 하드코딩 제거(첫 실측 전엔 비어 있다 — 전엔 49%인데 100%라고 적혀 있었다).

## 3. 인쇄 스코프는 **두지 않았다**(계획에서 뺐다)

「문서 밖 치우기」는 *화면을 소유한 쪽*만 할 수 있다. `PaperDocModal`이 하는 건 Mantine Portal이라
`body`의 직계 자식이고 그 형제가 곧 «문서 밖»이기 때문인데, **이 커버는 Portal이 아니라 앱 트리 안**이라
같은 규칙(`body > *:not(…)`)이 **자기를 지운다.** 남는 수법인 `visibility: hidden`은 자리가 남아 빈
페이지를 뒤에 붙이고(paper.css 실측), 스코프를 잃으면 소비 앱 전 화면을 백지로 만든 그 결함(커밋
`22389c0`)이다. → `paper.css` doctrine 그대로 **인쇄는 소비처 몫**이다.

## 4. 검증 — 한 것 / 남은 것

부품을 esbuild로 번들해 **헤드리스 크롬에서 실제로 돌려** 확인했다(뷰포트 393×852):

- 폭맞춤 `scale(0.494962)` · 캔버스 `794×2262`(2장) · 스페이서 `393×1120` — 전부 계산과 일치
- 더블탭 → `scale(1)`/표기 `100%` → 다시 더블탭 → `0.4950`/`49%`. **400ms 뒤 단독 탭은 확대 안 됨**(오탐 없음)
- 표기 클릭 순환 `100% → 200% → 49%`
- 1장짜리에서 가운데 정렬 `translate(0px, 91.58px)` = (739−556)/2 ✓
- 서식 검증 `validatePaper`/`coverage` 0건 · `layoutPaper` 2쪽 · 쪽 번호 `2 / 2` · 총계 `₩5,530,000`
- `tsc --noEmit` · `eslint` · `check:drift` 통과

**남은 것 — 오너 몫:**

| | |
|---|---|
| `/dev` → 모바일 → **MobilePaperViewer** | 거래명세서 **48줄(2장)**. 열자마자 한 장 전체 · 더블탭 100% · 아래로 끌면 **장 이음매와 쪽 번호** |
| **실기기 핀치** | iOS Safari·안드로이드 크롬. `touch-action: pan-x pan-y` 위에서 브라우저가 스크롤을 가져가며 `pointercancel`을 던지면 핀치가 중간에 죽는다. **죽어도 더블탭·표기 버튼이 받으므로 확대 경로는 안 끊긴다.** 죽는 게 확인되면 선택지는 ① 현행 유지 ② `touch-action: none` + 팬 직접 ③ 핀치 제거 |
| **kk 소비처 배선** | `InquiryDetailMobile`이 `<AgencyOrderConfirmView>`를 children으로. `agency-order-paper.ts` 188줄 삭제. ⚠ `ConfirmView`는 `.fitInner`로 **자기 배율을 갖고 있다** — 그 fit을 끄고 넘겨야 두 겹이 안 된다 |
| **발행** | `0.77.0`(breaking). 태그 push만 — 로컬 `npm publish` 금지 |

## 5. 만진 파일

```
src/ui/MobilePaperViewer.tsx   재작성(읽기 뷰·투영 삭제, children, 더블탭, 높이 실측, 가운데 정렬)
src/ui/mobilepaper.css         읽기 뷰 CSS·.mpv-paper 껍데기(padding 48px) 삭제
src/ui/_devFixtures.ts         PAPER_ROWS/FIELDS/VALUES → PAPER_DEMO_SPEC/VALUES(PaperSpec, 48줄)
src/ui/_mobileDemos.tsx        데모가 PaperDoc을 children으로 — **여러 장이 일부러다**(1장 데모론 안 잡힌다)
src/ui/_catalog.ts             항목 재작성
src/ui/index.ts                주석
docs/06_모바일계열규율.md        §1-4(더블탭은 대안이 아니다) · §1-9(예외를 남기는 이유가 바뀌었다) · R13
```
