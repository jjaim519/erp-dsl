'use client';
// 입력 원자의 **커밋 계약** — 한 곳에서만 산다.
//
// 왜 원자가 갖는가: 이 부품군의 본질은 키 조작(Enter=확정, Esc=되돌림)인데,
//  raw `onKeyDown`을 노출하면 소비처마다 임의 동작을 심는 열린 구멍이 되고(헌법 5),
//  무엇보다 **IME 가드가 반드시 한 곳에서 빠진다.**
//
// 실제로 우리 안에서 이미 빠져 있었다 — `Tree`의 인라인 이름변경과 `optionset-shared`의 raw input이
//  `e.key === 'Enter'`를 맨손으로 받는다(가드 0). 한글/한자 변환을 확정하려고 누른 Enter가
//  그대로 커밋으로 새어, **덜 만들어진 글자로 저장된다.**
//
// 그래서 여는 것은 키가 아니라 **의도**다: onCommit(확정) · onCancel(되돌림).
// 두 콜백은 닫힌 계약이라 경쟁 경로를 안 만들고, 가드는 여기 한 줄이 전부를 덮는다.
import type { KeyboardEvent } from 'react';

/**
 * 조합(IME) 중인가.
 *
 * `isComposing` 하나로는 부족하다 — Safari와 일부 IME는 keydown에서 이 값을 안 채우고
 * 대신 레거시 `keyCode === 229`로만 알린다. 둘 다 봐야 한다.
 */
export function isComposingEvent(e: KeyboardEvent<HTMLElement>): boolean {
  return e.nativeEvent.isComposing || e.keyCode === 229;
}

export type CommitHandlers = {
  /** Enter — 조합 중 Enter는 삼킨다. */
  onCommit?: () => void;
  /** Esc — 값 되돌림은 소비처 몫(원자는 값의 주인이 아니다). */
  onCancel?: () => void;
};

/** 입력 원자가 Mantine 컴포넌트에 그대로 넘길 keydown 핸들러. 계약이 없으면 undefined(리스너 0). */
export function commitKeyHandler({ onCommit, onCancel }: CommitHandlers) {
  if (!onCommit && !onCancel) return undefined;
  return (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (isComposingEvent(e)) return;   // ← 계약. 이 한 줄이 CJK 저장 사고를 막는다.
      if (!onCommit) return;
      e.preventDefault();
      onCommit();
      return;
    }
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };
}
