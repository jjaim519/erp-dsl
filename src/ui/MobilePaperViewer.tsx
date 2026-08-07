'use client';
// MobilePaperViewer (유기체) — 폰의 **A4 문서 뷰어**. 데스크탑 `PaperDocModal`·`PaperModal`의 *형제*다.
//  하는 일은 하나다: **인쇄 좌표계로 그려진 문서를 폰에서 훑어보게 한다.** 그리지도, 다시 쓰지도 않는다.
//
//  ── 왜 「읽기 뷰」가 없나 (v0.76.0에서 걷어냈다) ──────────────────────────────────
//  v0.75.0은 두 뷰였다 — 장표를 라벨-값으로 **투영**한 읽기 뷰와, 캔버스를 그대로 두는 원본 뷰.
//  그 자랑은 "Adobe Liquid Mode는 구조를 AI로 추론하지만 우리는 이미 갖고 있다"였는데, 문서 체계가
//  `PaperSpec`으로 옮겨오면서 **그 전제가 사라졌다**: `PaperCell`은 좌표(`c`/`cs`/`rs`)와 `text`/`field`/
//  `border`만 갖는다. 라벨-값 짝은 "왼쪽 칸이 라벨"이라는 **시각적 인접성 추론**으로만 성립한다 —
//  즉 되살리면 우리도 Liquid Mode와 같은 처지가 된다. 실제로 소비처는 그걸 피하려고 폰 전용 2열 격자를
//  손으로 합성해 넘기고 있었고, 그 결과 **「원본」 탭이 원본이 아니었다.**
//
//  ── 그래서 계약이 `children`으로 돌아왔다 ────────────────────────────────────────
//  투영을 안 하면 **구조가 필요 없다.** 장표 스키마를 받던 유일한 이유가 투영이었으므로 계약은
//  `PaperModal`과 같은 `children`이 된다. 그러면 `<PaperDoc spec values />`도, 소비처가 이미 갖고 있는
//  A4 문서(ReactNode)도 그대로 들어온다 — 폰용으로 문서를 **다시 짜는 일이 없어진다**(그게 두 화면을
//  갈리게 하던 원인이다).
//   · 문서는 **배율 없이** 넘긴다. 여기가 배율을 소유한다 — 소비처가 자기 fit을 걸어 두면 두 겹이 된다.
//   · 높이는 **잰다**. 그래서 계약에 쪽 수가 없어도 여러 장이 그냥 된다(`PaperDoc`은 N장을 낸다).
//
//  ── 접근성: 리플로우 대안을 잃는 대신 ───────────────────────────────────────────
//  WCAG **1.4.10 Reflow**는 "용도·의미상 2차원 배치가 필요한 콘텐츠"를 예외로 두고 **데이터 표를 명시적
//  으로** 그 예로 든다 — 견적서·거래명세서·발주서가 그 부류다(DocuSign도 자기 리플로우에 "재무 양식처럼
//  표현의 정밀함이 중요한 문서엔 늘 적합하진 않다"고 단서를 단다). 단 예외는 **그 구획에만** 적용되므로
//  크롬(헤더·확대 바)은 전부 rem 토큰이고, 확대 경로는 반드시 남는다(아래).
//
//  ── 확대: 폭맞춤 ↔ 100% ────────────────────────────────────────────────────────
//  **폰에서는 폭이 늘 구속조건이다** — 세로 A4를 폭에 맞추면 한 장이 556px이라 무대(≈659px)에 통째로
//  들어온다. 즉 **폭맞춤이 곧 「한 장 전체」**여서 하한을 따로 높이맞춤으로 열 이유가 없다(목업 대조).
//   · 열자마자 = 폭맞춤. 문서 전체 모양을 먼저 보여주고, 읽을 곳은 사용자가 고른다.
//   · **더블탭 = 폭맞춤 ↔ 100%**, 탭 지점을 앵커로. 문서 뷰어에서 사람들이 기대하는 동작이다.
//   · 핀치는 이 사이를 연속으로 지난다. ⚠ 핀치는 multipoint라 **WCAG 2.5.1(Level A)** 이 단일 포인터
//     대안을 요구한다(06 §1-4도 같은 말) → **하단 확대율 표기 자체가 버튼**이다(자리를 안 더 쓰고 경로만
//     남긴다). 더블탭도 단일 포인터지만 그건 *가속기*고, 보이는 경로가 하나는 있어야 한다.
//   · 배율이 연속인 건 헌법 5와 안 부딪힌다 — 그 규율은 **API 표면**이고 여기는 `zoom` prop을 안 연다.
//   ⚠ 핀치는 `touch-action: pan-x pan-y`(팬은 브라우저 몫) 위에서 돈다. 브라우저가 스크롤 제스처를
//     가져가면 `pointercancel`이 와서 핀치가 중간에 죽을 수 있다 — **실기기 검증 대기 중인 항목**이고,
//     죽어도 더블탭·표기 버튼이 그대로 받는다(그래서 확대 경로가 핀치에 걸려 있지 않다).
//
//  ── 안 만드는 것 ─────────────────────────────────────────────────────────────
//   · **인쇄 스코프** — 「문서 밖 치우기」는 *화면을 소유한 쪽*만 할 수 있는 일이다. `PaperDocModal`이
//     그걸 하는 건 Mantine Portal이라 `body`의 직계 자식이고 그 형제가 곧 «문서 밖»이기 때문인데,
//     이 커버는 Portal이 아니라 앱 트리 안에 있어서 같은 규칙(`body > *:not(...)`)이 **자기를 지운다.**
//     남는 수법인 `visibility: hidden`은 자리가 남아 빈 페이지를 뒤에 붙이고(paper.css 실측), 스코프를
//     잃으면 소비 앱 전 화면을 백지로 만든 그 결함(커밋 22389c0)이다. → paper.css의 doctrine 그대로
//     **인쇄는 소비처 몫**이다(문서 전용 라우트나 데스크탑 `PaperDocModal`). `actions`는 트리거만 나른다.
//   · 가로 회전 — `.ms`가 100dvh 전제라 셸 전체를 건드린다. 2D 스크롤이 이미 그 자리를 받는다.
//   · 편집 — 06 §4-1(편집 능력은 읽기보다 좁다). 고치는 건 데스크탑 `PaperDocModal`의 일이다.
//   · 문서 그리기 — 이 부품은 문서를 **모른다**. 칸도 값도 소비처가 넘긴 children 안에 있다.
import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { PAPER_CANON, type PaperOrientation } from '../schema/paper';
import { desktopTypoVars } from './theme';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Text } from './Text';
import { renderAction } from './_cells';
import type { MobileHeaderActions } from './MobileShell';
import './mobilepaper.css';

/** 상한 — 넘어가면 문서가 아니라 픽셀을 보게 된다. 하한은 폭맞춤(=한 장 전체)이라 실측으로 나온다. */
const MAX_SCALE = 4;
/** 단일 포인터 경로가 밟는 단계. 앞에 폭맞춤(실측)이 붙어 [맞춤 → 100% → 200% → 맞춤]으로 순환한다. */
const STEPS = [1, 2];
/** 더블탭 판정 — 간격과 흔들림 허용치. 두 번째 탭이 첫 탭에서 멀면 그건 다른 곳을 본 것이다. */
const DOUBLE_TAP_MS = 300;
const TAP_SLOP = 12;

type Props = {
  opened: boolean;
  onClose: () => void;
  /** 문서 이름 — 헤더 행. 셸 헤더와 같은 자리·같은 타이포. */
  title: string;
  /**
   * 문서 — **인쇄 좌표계 그대로**(A4 폭 `PAPER_CANON[orientation].w`px) 그린 것. 보통 `<PaperDoc spec values />`.
   * **배율을 걸어서 넘기지 않는다** — 배율은 이 부품이 소유한다(소비처가 자기 fit을 걸면 두 겹이 된다).
   * 높이는 여기서 재므로 몇 장이든 상관없다.
   */
  children: ReactNode;
  orientation?: PaperOrientation;
  /** 상한 2, 첫째만 텍스트(셸 헤더와 같은 계약). 인쇄·내려받기 *트리거*만 — 실행은 소비처. */
  actions?: MobileHeaderActions;
};

export function MobilePaperViewer({
  opened, onClose, title, children, orientation = 'portrait', actions,
}: Props) {
  const canonW = PAPER_CANON[orientation].w;

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const fitRef = useRef(0);                    // 폭맞춤 배율 — 실측값(하한이기도 하다)
  const docHRef = useRef(0);                   // 문서 높이(배율 1 기준). 여러 장이면 장 수만큼 길다
  const scaleRef = useRef(0);                  // 지금 배율(연속). **state가 아니다**: 핀치는 프레임마다
  const atFitRef = useRef(true);               //  바뀌는데 리렌더하면 손가락이 미끄러진다.
  const offRef = useRef({ x: 0, y: 0 });       // 가운데 정렬 보정(문서가 무대보다 작을 때)

  /** 배율 적용 — 앵커(두 손가락 사이·탭 지점) 아래의 **문서 좌표를 붙잡아 둔다.** 안 그러면 확대할 때마다
   *  보던 자리가 달아난다. 가운데 정렬 보정(off)도 같은 식에 들어간다 — 보정을 빼먹으면 축소된 문서를
   *  확대할 때 앵커가 보정만큼 어긋난다. */
  const apply = useCallback((next: number, anchor?: { x: number; y: number }) => {
    const stage = stageRef.current, canvas = canvasRef.current, spacer = spacerRef.current;
    if (!stage || !canvas || !spacer) return;
    const min = fitRef.current || 0.1;
    const s = Math.min(MAX_SCALE, Math.max(min, next));
    const prev = scaleRef.current || s;
    const prevOff = offRef.current;
    const ax = anchor ? anchor.x : stage.clientWidth / 2;
    const ay = anchor ? anchor.y : stage.clientHeight / 2;
    const cx = (stage.scrollLeft + ax - prevOff.x) / prev;   // 앵커 아래의 문서 좌표
    const cy = (stage.scrollTop + ay - prevOff.y) / prev;

    const w = canonW * s, h = docHRef.current * s;
    // 문서가 무대보다 작으면 가운데로. 크면 0 — 그때 자리를 정하는 건 스크롤이다.
    const off = {
      x: w < stage.clientWidth ? (stage.clientWidth - w) / 2 : 0,
      y: h < stage.clientHeight ? (stage.clientHeight - h) / 2 : 0,
    };
    scaleRef.current = s;
    atFitRef.current = Math.abs(s - min) < 0.005;
    offRef.current = off;
    canvas.style.transform = `translate(${off.x}px, ${off.y}px) scale(${s})`;
    spacer.style.width = `${w}px`;             // transform은 레이아웃 크기를 안 바꾼다 — 스크롤 범위는 이게 만든다
    spacer.style.height = `${h}px`;
    stage.scrollLeft = cx * s + off.x - ax;
    stage.scrollTop = cy * s + off.y - ay;
    if (readoutRef.current) readoutRef.current.textContent = `${Math.round(s * 100)}%`;
  }, [canonW]);

  // 폭맞춤은 **실측**이다 — 폰 폭은 기기마다 다르고(375/390/430) 폰트 스케일도 크롬 높이를 바꾼다.
  //  문서 높이도 같이 잰다: 여러 장이면 장 수만큼 길고, 그 값이 스크롤 범위를 만든다.
  //  ResizeObserver 둘: 무대(폭·회전·폰트 스케일)와 캔버스(문서가 늦게 자라는 경우 — 이미지·폰트).
  //  이미 확대해 둔 상태면 배율을 안 뺏는다.
  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current;
    if (!opened || !stage || !canvas) return;
    const measure = () => {
      docHRef.current = canvas.offsetHeight;   // transform은 offsetHeight를 안 바꾼다 — 배율 1 기준 높이다
      fitRef.current = stage.clientWidth / canonW;
      apply(atFitRef.current ? fitRef.current : scaleRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [opened, canonW, apply]);

  // 닫으면 배율을 되돌린다 — 다음에 열었을 때 앞 문서의 배율이 남아 있으면 "왜 확대돼 있지"가 된다
  //  (MobileAttachmentViewer가 장을 넘길 때 하는 것과 같은 규율).
  useEffect(() => {
    if (!opened) { scaleRef.current = 0; atFitRef.current = true; offRef.current = { x: 0, y: 0 }; }
  }, [opened]);

  /* ── 핀치 ────────────────────────────────────────────────────────────────
     두 포인터만 본다. 하나면 브라우저 기본 스크롤(팬)이 그대로 일한다 — 우리가 가로채지 않는다.
     touch-action: pan-x pan-y가 브라우저의 요소 내 핀치만 끄고 팬은 남겨둔다(mobilepaper.css). */
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const pinched = useRef(false);               // 이번 접촉이 핀치였나 — 탭으로 오인하지 않게
  const down = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const two = () => [...ptrs.current.values()];
  const distOf = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  /** 더블탭 — 폭맞춤 ↔ 100%. 탭 지점이 앵커라 "누른 곳"이 화면에 남는다. */
  const onTap = (x: number, y: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && now - prev.t < DOUBLE_TAP_MS && Math.hypot(x - prev.x, y - prev.y) < TAP_SLOP * 2) {
      lastTap.current = null;
      const rect = stage.getBoundingClientRect();
      apply(atFitRef.current ? 1 : fitRef.current, { x: x - rect.left, y: y - rect.top });
      return;
    }
    lastTap.current = { t: now, x, y };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY, moved: false };
    if (e.pointerType !== 'touch') return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) {
      const [a, b] = two();
      pinch.current = { dist: distOf(a, b) || 1, scale: scaleRef.current };
      pinched.current = true;
    }
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = down.current;
    if (d && !d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP_SLOP) d.moved = true;
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pinch.current || ptrs.current.size !== 2) return;
    const [a, b] = two();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    apply(pinch.current.scale * (distOf(a, b) / pinch.current.dist), {
      x: (a.x + b.x) / 2 - rect.left,
      y: (a.y + b.y) / 2 - rect.top,
    });
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) pinch.current = null;
    const d = down.current;
    down.current = null;
    // 탭 판정은 **마지막 손가락이 떨어질 때** 한다 — 핀치의 두 번째 손가락을 탭으로 세면 안 된다.
    if (ptrs.current.size > 0) return;
    if (d && !d.moved && !pinched.current && e.type === 'pointerup') onTap(e.clientX, e.clientY);
    pinched.current = false;
  };

  /** 단일 포인터 경로(WCAG 2.5.1) — 지금 배율보다 큰 첫 단계로, 없으면 폭맞춤으로 돌아간다. */
  const stepUp = () => {
    const steps = [fitRef.current, ...STEPS].filter((v) => v > 0).sort((a, b) => a - b);
    apply(steps.find((v) => v > scaleRef.current + 0.01) ?? steps[0]);
  };

  const close = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opened, close]);

  if (!opened) return null;

  return (
    <div className="mpv" role="dialog" aria-modal="true" aria-label={title}>
      {/* 헤더 행 — 셸 헤더와 같은 기하(52px·좌측 정렬·subheading). 탈출구는 X 하나 + Esc. */}
      <header className="mpv-nav">
        <span className="mpv-nav-lead">
          <IconButton icon="x" label="닫기" variant="ghost" size="sm" onClick={close} />
        </span>
        <span className="mpv-nav-title"><h2 className="mpv-nav-title-t">{title}</h2></span>
        <span className="mpv-nav-spacer" />
        <span className="mpv-nav-trail">
          {actions?.map((a, i) => renderAction(a.iconOnly ? a : { ...a, variant: a.variant ?? 'accent' }, i, 'sm'))}
        </span>
      </header>

      {/* 2D 무대 — 팬은 브라우저 기본 스크롤, 핀치·더블탭만 우리가 잡는다(위 헤더 주석). */}
      <div
        className="mpv-stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* 캔버스만 데스크탑 타이포로 되돌린다 — 06 §1-9의 예외(theme.desktopTypoVars 주석).
            `PaperDoc`은 자기 글자를 행 단위에서 파생시키므로 안 필요하지만, children은 **아무 문서나**
            올 수 있고 그게 우리 토큰을 쓰면 17px을 물려받아 인쇄 좌표계를 깨뜨린다.
            transform·크기는 apply()가 직접 쓴다(핀치 중 리렌더 금지). */}
        <div className="mpv-canvas" ref={canvasRef}
          style={{ ...(desktopTypoVars as CSSProperties), width: canonW }}>
          {children}
        </div>
        <div className="mpv-spacer" ref={spacerRef} />
      </div>

      {/* 하단은 **표기**다. 다만 누를 수 있다 — 핀치는 multipoint라 단일 포인터 대안이 있어야 하고
          (WCAG 2.5.1 Level A · 06 §1-4), 자리를 더 쓰지 않고 경로만 남기는 방법이 이것이다.
          비어 있는 채로 시작한다 — 첫 실측 전에 «100%»라고 적어 두면 그건 거짓말이다. */}
      <div className="mpv-bar">
        <button type="button" className="mpv-zoom" onClick={stepUp} aria-label="확대 배율 — 눌러서 다음 단계">
          <Icon name="search" size="sm" />
          <Text variant="body"><span ref={readoutRef} /></Text>
        </button>
      </div>
    </div>
  );
}
