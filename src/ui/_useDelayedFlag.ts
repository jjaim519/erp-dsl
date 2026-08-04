'use client';
// _useDelayedFlag — 켜짐을 *늦게* 반영한다. 로딩 표시가 번쩍이는 것을 막는 공유 훅.
//
//  왜 필요한가: NN/g가 **"1초 미만 작업엔 루프 애니메이션을 쓰지 마라"**고 못박는다 — 그런 표시는
//   기다림을 줄여주는 게 아니라 산만함만 더한다. 그런데 status='loading'을 즉시 렌더하면
//   200ms에 끝나는 조회에도 스피너가 번쩍인다(깜빡임 자체가 느리다는 인상을 만든다).
//   → 지연을 넘긴 요청에만 표시가 뜨고, 빠른 요청은 아무 일 없이 지나간다.
//
//  꺼짐은 **즉시** 반영한다: 로딩이 끝났는데 표시가 남아 있으면 그건 거짓말이다.
//  (반대로 "최소 노출 시간"을 두는 기법도 있지만 안 쓴다 — 끝난 걸 억지로 붙잡는 것이라
//   실제 대기를 늘린다. 깜빡임은 지연으로 막고, 끝나면 바로 치운다.)
import { useEffect, useState } from 'react';

/** 기본 지연 — NN/g의 1초 한계보다 짧게 잡는다. 대부분의 조회는 여기 안에서 끝난다. */
const DEFAULT_DELAY_MS = 400;

export function useDelayedFlag(on: boolean, delayMs: number = DEFAULT_DELAY_MS): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!on) { setShown(false); return; }        // 꺼짐은 즉시
    const t = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(t);
  }, [on, delayMs]);

  return shown;
}
