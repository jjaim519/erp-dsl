'use client';
// MobilePullToRefresh (분자) — 목록 최상단에서 아래로 당겨 새로고침.
//
//  **제스처는 가속기이지 유일 경로가 아니다(06 §1-4).** 이 부품은 다른 경로를 대신 만들어주지 않는다 —
//   화면이 상단 액션이나 버튼으로 같은 일을 낼 수 있게 두는 건 소비처 책임이고, 그게 없으면
//   당기는 법을 모르는 사용자에게 새로고침이 존재하지 않는 기능이 된다.
//
//  스크롤 주인: **window가 아니라 가장 가까운 스크롤 조상**에 건다.
//   MobileShell은 문서를 잠그고(.erp-mobile-lock) 본문(.ms-body)만 스크롤하므로
//   window의 scrollTop은 항상 0이라 "최상단"이 늘 참이 되어 아무 데서나 당겨진다.
//
//  passive: touchmove만 passive:false다. preventDefault를 부르려면 그래야 하고,
//   나머지(start/end/cancel)를 passive:true로 두면 스크롤 성능을 안 깎는다.
//   그리고 preventDefault는 **최상단 + 아래로 당길 때만** 부른다 — 아니면 평소 스크롤이 막힌다.
//
//  ⚠ **함수형 업데이터 안에서는 setState도 콜백 호출도 하지 않는다 — 이전 값이 필요하면 ref로 든다.**
//   `setPull(fn)`의 `fn`은 React가 *다음 렌더에서 상태를 계산할 때* 부른다. 업데이터는 순수해야 하고
//   부수효과는 이벤트 핸들러에 있어야 한다. 이 부품이 onEnd에서 업데이터 안에 `setBusy(true)`와
//   `cb.current()`를 두고 있었고, 그래서 새로고침이 **렌더 단계에서** 실행됐다.
//   증상이 소비처의 Router 경고로 터져서 원인이 부품에 있다는 게 안 보였다. StrictMode(dev)에서는
//   업데이터가 두 번 불려 `onRefresh`가 두 번 나갔다 — 서버 액션을 부르는 소비처면 요청이 두 번 간다.
//   → 값은 ref, 그리기는 state. 부수효과는 핸들러.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Spinner } from './Spinner';
import { Icon } from './Icon';
import './mobilesheet.css';

// 발동 거리(px). 터치 기하라 px가 맞다(--erp-touch-target과 같은 부류 — 글자가 아니라 손가락 치수).
//  44(터치 하한)보다 넉넉히 커야 스크롤하려다 얻어걸리지 않는다.
const THRESHOLD = 72;
// 당긴 거리를 그대로 안 따라간다 — 고무줄 감쇠. 끝까지 늘어나는 시트처럼 보이지 않게 한다.
const DAMPING = 0.5;

type Props = {
  onRefresh: () => void | Promise<void>;
  // 소비처가 재조회 중임을 아는 경우(외부 상태). 안 주면 onRefresh의 Promise가 끝날 때까지로 본다.
  refreshing?: boolean;
  children: ReactNode;
};

/** 가장 가까운 세로 스크롤 조상. **넘치는지는 안 따진다** — 지금 안 넘쳐도 그게 스크롤 주인이고,
 *  마운트 시점엔 내용이 아직 안 차 있을 수 있다(그때 걸러내면 리스너가 영영 안 붙는다).
 *  못 찾으면 문서(스크롤이 문서 레벨인 소비처)로 떨어진다. */
function findScroller(from: HTMLElement | null): HTMLElement {
  let el: HTMLElement | null = from?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if (oy === 'auto' || oy === 'scroll') return el;
    el = el.parentElement;
  }
  return document.scrollingElement as HTMLElement ?? document.documentElement;
}

export function MobilePullToRefresh({ onRefresh, refreshing, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  // 당김값을 ref로도 든다 — onEnd가 "지금 얼마나 당겨졌나"를 알아야 하는데, 그걸 함수형 업데이터로
  //  읽으면 부수효과가 렌더 단계로 들어간다(위 헤더 주석). **값은 ref, 그리기는 state.**
  const pullRef = useRef(0);
  const setPullBoth = useCallback((v: number) => { pullRef.current = v; setPull(v); }, []);
  // 진행 중 재진입 방지 — busy(state)는 리스너 클로저에서 낡는다(effect deps가 []이라 한 번만 붙는다).
  const busyRef = useRef(false);
  // 콜백을 ref로 들고 있는다 — 리스너를 매 렌더 새로 붙였다 떼면 터치 도중에 끊긴다.
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  const active = refreshing ?? busy;

  useEffect(() => {
    // **리스너는 우리 루트에 건다.** 스크롤 조상에 걸면 그 조상이 마운트 시점에 아직 없거나
    //  바뀔 수 있고, 무엇보다 우리 밖의 형제 영역에서 시작한 터치까지 잡는다.
    //  루트는 터치 경로 위에 있으므로 preventDefault가 유효하다(버블 단계여도 취소 가능).
    const root = rootRef.current;
    if (!root) return;
    // 스크롤 주인은 **터치 시작 때마다** 다시 찾는다 — 접힘·펼침으로 스크롤러가 바뀌어도 따라간다.
    let scroller: HTMLElement = findScroller(root);

    let startY = 0;
    let pulling = false;

    const onStart = (e: TouchEvent) => {
      scroller = findScroller(root);
      // 최상단에서 시작한 터치만 후보다. 중간에서 위로 스크롤해 올라온 경우는 아니다
      //  — 그때 당김이 발동하면 "끝까지 올렸더니 새로고침됐다"가 된다.
      if (scroller.scrollTop > 0) { pulling = false; return; }
      startY = e.touches[0].clientY;
      pulling = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      // 위로 미는 건 평소 스크롤이다 — 넘긴다(preventDefault도 안 부른다).
      if (dy <= 0) { pulling = false; setPullBoth(0); return; }
      // 당기는 동안에도 최상단이어야 한다(관성으로 내려갔으면 그만둔다).
      if (scroller.scrollTop > 0) { pulling = false; setPullBoth(0); return; }
      e.preventDefault();                       // 최상단 + 아래로일 때만 — 평소 스크롤 방해 0
      setPullBoth(Math.min(dy * DAMPING, THRESHOLD * 1.5));
    };

    // 부수효과는 전부 여기(핸들러)에 있다 — 업데이터 안이 아니다.
    const onEnd = () => {
      if (!pulling) return;
      pulling = false;
      if (pullRef.current < THRESHOLD) { setPullBoth(0); return; }
      if (busyRef.current) return;              // 진행 중이면 두 번 안 부른다
      // 임계를 넘겼으면 인디케이터를 임계 위치에 붙잡아 둔 채 실행한다 —
      //  손을 떼자마자 0으로 접히면 "눌렸나?"가 되고, 완료 신호를 볼 자리가 없다.
      setPullBoth(THRESHOLD);
      busyRef.current = true;
      setBusy(true);
      Promise.resolve(cb.current()).finally(() => {
        busyRef.current = false;
        setBusy(false);
        setPullBoth(0);
      });
    };

    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: false });
    root.addEventListener('touchend', onEnd, { passive: true });
    root.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
      root.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const shown = active ? THRESHOLD : pull;
  const ready = pull >= THRESHOLD;

  return (
    <div className="mptr" ref={rootRef}>
      {/* 인디케이터는 자리를 *밀어서* 만든다(겹치지 않는다) — 겹치면 첫 행 위에 얹혀 글자를 가린다. */}
      <div className="mptr-ind" style={{ height: `${shown}px` }} aria-hidden={!active}>
        {shown > 0 && (active
          ? <Spinner size="sm" />
          : <span className="mptr-ar" data-ready={ready ? '' : undefined}><Icon name="arrow-left" size="sm" color="secondary" /></span>)}
      </div>
      {children}
    </div>
  );
}
