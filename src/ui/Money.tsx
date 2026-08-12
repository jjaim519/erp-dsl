// Money (의미 원자) — 금액·수량의 **표시** 규율 한 곳.
//  왜 원자로 여는가: 포맷 함수(`fmtCurrency`)는 있었지만 *표기 규율*은 어디에도 없었다 —
//  자릿수 정렬(tabular-nums)·음수 표기·0 표기를 호출처가 각자 정하고 있었고, 실제로
//  `paperLayout.ts`가 `fmtCurrency`를 자기 파일에 한 벌 더 갖고 있었다(단일출처 이탈).
//  돈 부품(Register·AgingReport·PaymentApply)이 셋 생기면 그 드리프트가 셋으로 늘어난다.
//
// ── 이 원자가 **안 가진** 것: 정렬 ─────────────────────────────────────────────
//  우측정렬은 이미 주인이 있다 — `_cells.cellAlign`이 "currency·number는 right"를 단일 출처로 갖는다.
//  Money가 스스로 오른쪽에 붙으면 그 규율이 두 곳이 된다. **정렬은 담는 칸의 일**이고,
//  Money는 *글자*(자릿수 폭·부호·기호)만 책임진다.
//
// ── 음수 표기를 옵션으로 연 이유 ──────────────────────────────────────────────
//  회계 관행이 하나가 아니다: 화면은 −1,200 / 인쇄 장표는 △1,200(일본계 서식 관행이 국내 장표에 남아 있다) /
//  영문 재무제표는 (1,200). 하나로 못 닫아서 셋을 닫힌 enum으로 연다(자유 포맷 함수는 안 연다 — 헌법 4).
import type { CSSProperties } from 'react';
import { fmtCurrency, fmtNumber } from './_cells';

export type MoneyZero = 'number' | 'dash' | 'blank';
export type MoneyNegative = 'minus' | 'triangle' | 'paren';

type Props = {
  value: number | null | undefined;
  /** ₩ 기호(기본 true — `fmtCurrency`와 같은 얼굴). 표 안에서 매 행에 기호가 붙으면 소음이라 그때 끈다. */
  symbol?: boolean;
  /** 수량 단위(장·개·EA). 주면 기호는 무시된다 — 돈이 아닌 수불부 열이 이 통로로 온다. */
  unit?: string;
  /** 0의 얼굴. 표에선 대개 dash(값이 *없다*가 아니라 *0이다*를 조용히 말한다). */
  zero?: MoneyZero;
  /** 음수 표기 — 화면 minus / 장표 triangle / 영문 paren. */
  negative?: MoneyNegative;
  /** 굵게(합계·잔액처럼 그 줄의 주인공인 숫자). */
  emphasis?: boolean;
  /** auto(기본) = 음수를 danger 색으로. plain = 색을 안 입힌다(부호만으로 읽는 장표). */
  tone?: 'auto' | 'plain';
};

// null·빈값은 "값이 없다"라 0과 다르게 항상 대시다(0 표기 옵션과 별개 축).
const EMPTY = '—';

export function Money({
  value, symbol = true, unit, zero = 'number', negative = 'minus', emphasis, tone = 'auto',
}: Props) {
  const style: CSSProperties = {
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
    whiteSpace: 'nowrap',
    fontWeight: emphasis ? 600 : undefined,
  };

  if (value == null || Number.isNaN(value))
    return <span style={{ ...style, color: 'var(--text-disabled)' }}>{EMPTY}</span>;

  if (value === 0 && zero !== 'number')
    return <span style={{ ...style, color: 'var(--text-disabled)' }}>{zero === 'dash' ? EMPTY : ''}</span>;

  const neg = value < 0;
  const body = unit
    ? `${fmtNumber(Math.abs(value))} ${unit}`
    : symbol ? fmtCurrency(Math.abs(value)) : fmtNumber(Math.abs(value));

  const text = !neg ? body
    : negative === 'paren' ? `(${body})`
    : negative === 'triangle' ? `△${body}`
    : `−${body}`;   // U+2212 — 하이픈(-)은 폭이 좁아 숫자 열에서 자릿수가 밀린다

  return <span style={{ ...style, color: neg && tone === 'auto' ? 'var(--text-danger)' : undefined }}>{text}</span>;
}
