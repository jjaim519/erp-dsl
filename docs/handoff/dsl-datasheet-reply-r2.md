# DSL → kk 회신 R2 — `draft.derive` 열었다. 단 **§4 스니펫으로는 안 그려졌다**

`@jjaim519/erp-dsl` **v0.77.0**. `dsl-datasheet-r2.md` 요청 그대로 받았다.
통장내역 화면을 `DataSheet`로 넘겨도 된다.

---

## §1 받은 이유 — 표현층은 이미 만들어져 있었다

빈자리 증명이 정확했다. 덧붙이면, 초안 줄의 파생 칸은 **색까지 이미 있었다**:

```css
/* datasheet.css:96 */
.erpDsCell.is-derived .erpDsVal { color: var(--text-secondary); }
```

`is-derived`는 초안 줄에도 붙는다. 너희가 그린 그 **회색 숫자의 회색은 이미 있었고 값만 없었다.**
새 축이 아니라 구멍이라는 판정에 동의한다.

증거가 하나 더 있다. `/dev` 박물관의 DataSheet 데모에 이미 `amount`(수량×단가) 파생 열이 있고
**초안 줄에서만 빈칸**이었다. 결함이 이미 데모에 박혀 있었는데 아무도 안 봤다.
너희가 실제 장부를 옮기다 먼저 부딪혔다.

---

## §2 §4의 구현안은 틀렸다 — 그 한 줄로는 화면에 안 나온다

너희가 적어 준 자리:

```ts
const draftRow: SheetRow = { id: DRAFT_ID, ...draftValues, ...derived };   // ← 이것만으로는 여전히 빈칸
```

초안 줄은 `editingThisRow === true`로 그려지고, **그 분기의 표시값은 행이 아니라 `cellValue()`에서 나왔다**:

```ts
// v0.76.2 · DataSheet.tsx:253
const value = editingThisRow ? cellValue(row.id, c.key) : row[c.key];
//                             └─ 초안이면 draftValues[key]를 돌려준다. 병합한 derived를 안 본다
```

그래서 진짜 고친 자리는 표시 경로다 — 표시값이 **넘겨받은 줄 하나**에서만 나오게 했다:

```ts
// v0.77.0
const value = row[c.key];
```

저장 행 편집 중에는 결과가 같다(`openRow`가 `values = {...row}`로 씨를 뿌리므로 두 경로의 값이 애초에 동일했다).
없어진 건 갈림길뿐이고, 그 갈림길이 초안 줄의 파생 칸을 영구히 빈칸으로 만들던 것이다.

**교훈으로 적어 둔다:** 값을 어디에 넣을지보다 **어디서 읽는지**가 결정한다. 같은 표에 진실이 둘
(`draftValues` / 행 객체)이면, 새 값을 옳은 쪽에 넣어도 화면은 틀린 쪽을 읽고 있을 수 있다.

---

## §3 파생값은 **밖으로 안 나간다** — §4와 §5가 어긋나서 §5를 택했다

§5는 *"반환값은 표시에만 쓰이고, 소비처에는 아무 상태도 남지 않습니다"* 라고 썼는데,
§4 스니펫대로 `draftRow`에 병합하면 `commit()`이 그걸 그대로 `ready`·`onCreate`에 넘긴다.
**소비처가 계산한 값이 부품을 한 바퀴 돌아 저장 payload로 되돌아온다.** 그건 §5가 막으려던 그 일이다.

그래서 줄을 둘로 갈랐다:

```ts
const draftRow  = { id: DRAFT_ID, ...draftValues };   // 소비처에 넘기는 줄 — ready · onCreate
const draftView = { ...draftRow, ...derived };        // 그리는 줄 — 화면
```

**kk 코드에 미치는 영향 1건:** `onCreate(v)`의 `v`에는 **`balance`가 없다.** 서버로 보낼 값에
거래 후 잔고가 필요하면 `onCreate` 안에서 다시 계산해라(`previewBalance`를 그대로 부르면 된다).
표시용과 저장용을 같은 통로로 흘리지 않는 게 이 부품의 규율이다.

---

## §4 편집칸 필터 — `delete` 대신 사본

너희 스니펫은 반환 객체를 직접 지웠다(`delete derived[c.key]`). **소비처가 돌려준 객체를 부품이 파괴한다** —
`useMemo`로 만든 객체를 돌려주면 다음 렌더에 키가 사라진 채로 재사용된다. 걸러낸 사본을 만든다:

```ts
const derived: Record<string, unknown> = {};
if (draft?.derive) {
  const d = draft.derive(draftValues);
  for (const k of Object.keys(d)) if (!colOf(k)?.edit) derived[k] = d[k];
}
```

계약은 너희가 쓴 대로다 — `edit` 있는 열의 key는 **조용히 무시**한다(덮을 수 있게 열면 그게 곧 두 주인).

부수 확인 하나: `derive`가 seed만으로 숫자를 뱉어도 **유휴 초안 줄에 ✕/✓가 뜨지 않는다.**
"손을 탔나" 판정은 친 값(`draftValues`)만 보게 되어 있었고, 파생값이 거기 끼지 않게 못 박아 뒀다.

---

## §5 최종 계약

```ts
draft?: {
  seed?: Record<string, unknown>;
  ready: (values: Record<string, unknown>) => boolean;
  onCreate: (values: Record<string, unknown>) => Promise<SheetCommitResult>;
  derive?: (values: Record<string, unknown>) => Record<string, unknown>;
};
```

너희가 §4에 적은 소비처 코드는 **그대로 동작한다.**

```tsx
draft={{
  seed: { entry_date: draftDateFor(ym), category: '매출', description: '', amount: '' },
  ready: (v) => String(v.description).trim() !== '' && Number(v.amount) > 0,
  onCreate: handleCreate,
  derive: (v) => ({ balance: previewBalance(rows, openingBalance, v) }),
}}
```

주의 둘:
- `derive`의 인자에는 **`id`가 없다**(`onCreate`가 받는 값에는 `id: '__draft'`가 섞여 있는 것과 다르다).
- 렌더 중 호출이라 **순수·저렴**해야 한다. `previewBalance`가 `rows` 전체를 훑는 건 괜찮지만,
  그 안에서 정렬·포맷을 새로 만들지는 마라(한 글자 칠 때마다 돈다).

살아 있는 예시는 `/dev` → DataSheet. 초안 줄에 수량·단가를 치면 `금액`이 따라 붙는다.

---

## §6 곁다리 2건 — 판정

### ① `read:'currency'` 무채색 — **별건으로 세우되, 요청한 셋 중 하나만 열릴 것 같다**

색을 나눠 달라는 셋의 성격이 다르다.

| 요청 | 판정 |
|---|---|
| 잔고 **음수 빨강** | 열 만하다. 부호는 **값 자체의 성질**이고, 회계에서 음수 빨강은 표기 규칙이다 |
| 입금 초록 / 출금 빨강 | 안 열 쪽으로 본다 — 그 표엔 이미 `구분` 열이 매출/매입을 말한다. **같은 말을 두 번 하는 색**이다 |

`_cells`의 `renderCell`은 `DataTable`과 공유하는 표현 어휘라, 여기에 소비처가 톤을 주입하는 문을 열면
"셀 색을 소비처가 정한다"가 두 부품에 동시에 열린다. 값에서 도출되는 규칙(부호)으로 닫는 편이 안전하다.
**이번 릴리스에 안 넣었다.** 통장내역을 옮겨 본 뒤, 음수 빨강만으로 부족한지 알려 달라 — 그 답을 보고 연다.

### ② `draft.resetKey` — **안 연다. `key` 리마운트가 맞다**

`seed`를 좇는 prop을 열면 "초안 값의 주인은 부품 하나"에 **두 번째 진실**이 생긴다
(seed가 바뀌었는데 사용자가 이미 친 값이 있으면 누가 이기나 — 답이 없는 질문이 계약에 들어온다).
`key={ym}` 리마운트는 우회가 아니라 React가 "이건 다른 초안이다"를 말하는 정식 표현이다.

다만 **계약에 없다는 지적은 맞다.** 카탈로그에 박았다 —
*"`seed`는 최초 1회만 읽힌다. 출발값이 달라져야 하면 `key`로 리마운트한다."*

---

## §7 요약

| 항목 | 결과 |
|---|---|
| `draft.derive` | **열었다** (v0.77.0) |
| 파생값이 `onCreate`로 감 | **안 간다** — 필요하면 `onCreate` 안에서 다시 계산 |
| 편집칸 key 반환 | 조용히 무시 |
| 비동기 `derive` | 안 연다 |
| 저장 줄용 `derive` | 안 연다(`rows`가 그 자리) |
| `read:'currency'` 색 | 보류 — 음수 빨강만 열릴 가능성. 실사용 뒤 회신 요청 |
| `draft.resetKey` | 안 연다 — `key` 리마운트가 정답. 카탈로그에 명시 |

통장내역 넘겨라.
