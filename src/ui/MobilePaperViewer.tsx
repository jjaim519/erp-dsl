'use client';
// MobilePaperViewer (유기체) — 폰의 **A4 장표 뷰어**. 데스크탑 PaperModal의 *형제*다(축소판 아님).
//
//  ── 왜 PaperModal을 폰에 그대로 못 쓰나 ────────────────────────────────────────────
//  A4 세로 CANON 794px를 폰 본문 폭 393pt에 맞추면 배율이 **0.495**다. 캔버스 안쪽은 인쇄 좌표계라
//  **데스크탑 타이포**(body 14px)를 쓰므로 그때 글자는 **6.9px**가 된다. 우리 모바일 body는 17px다.
//  즉 fit-to-width 하나로는 "못 읽는 화면"이 된다 — PaperModal의 두 뷰(자세히/전체)는 둘 다 이 문제를
//  못 푼다. 그 둘은 *데스크탑 폭*에서 갈리는 축이기 때문이다.
//
//  ── 그래서 축이 다르다: 페이지를 지킬 것인가, 내용을 지킬 것인가 ───────────────────
//  업계가 전부 이 두 뷰를 갖는다 — Word(Mobile View ↔ Print Layout) · Google Docs(Print layout on/off) ·
//  DocuSign(Responsive Signing, 문서별 off) · Acrobat(Liquid Mode ↔ 일반). 하나로는 안 된다는 게 결론이고,
//  DocuSign이 자기 기능에 단 단서가 우리 도메인을 정확히 지목한다: 리플로우는 **"법률 계약이나 재무 양식처럼
//  표현의 정밀함이 중요한 문서에는 늘 적합하지는 않다"**. 견적서·거래명세서·발주서가 그 부류다.
//
//   · read(기본) — rows를 **라벨-값으로 투영**한다. 아래 project() 참조.
//   · paper      — CANON 캔버스를 그대로 두고 2D 스크롤 + 핀치 확대(아래 절).
//     근거: WCAG **1.4.10 Reflow**는 "용도·의미상 2차원 배치가 필요한 콘텐츠"를 예외로 두고 **데이터 표를
//     명시적으로** 그 예로 든다. 단 예외는 **그 구획에만** 적용되고 주변 크롬까지 확장되지 않는다 →
//     크롬(헤더·세그먼트·확대 바)은 전부 rem 토큰이다. MobileAttachmentViewer가 같은 문장을 갖는다.
//
//  ── 우리가 Adobe보다 유리한 지점 ─────────────────────────────────────────────────
//  Liquid Mode는 PDF에서 구조를 **AI로 추론**해야 한다. 우리는 `rows: FieldGridCell[][]`로 **구조를 이미 갖고
//  있다.** 추론이 아니라 투영이라 실패할 여지도, 서버 왕복도 없다. **그래서 계약이 PaperModal과 갈린다** —
//  PaperModal은 `children: ReactNode`를 받지만 ReactNode에는 구조가 없어 리플로우를 만들 수 없다.
//  이 부품은 children이 아니라 **장표 스키마 자체**를 받는다.
//
//  ── 크롬 규범은 MobileAttachmentViewer와 한 벌 ──────────────────────────────────
//   · 불투명 전체 화면 커버(모달 아님) · auto-hide 없음(ERP 문서는 체류지가 아니라 경유지다)
//   · 탈출구 2개까지(X + 뒤로) · **문서 레벨 viewport meta 불가침**(SC 1.4.4)
//   · **팬은 브라우저 기본 스크롤**이다(직접 안 잡는다). 첨부 뷰어가 제스처를 통째로 안 쓴 이유는
//     "가로 스와이프=페이징 vs 세로=닫기" 충돌이었는데(NN/g 직접 경고), 여기엔 페이징도 스와이프-투-닫기도
//     없어서 그 충돌 자체가 없다. 그래서 **핀치만** 직접 잡는다(touch-action: pan-x pan-y).
//
//  ── 확대: 핀치 + 단일 포인터 대안 ──────────────────────────────────────────────
//  문서에서 핀치는 사람들이 기대하는 동작이라 넣는다. 단 핀치는 **multipoint 제스처**라
//  **WCAG 2.5.1 Pointer Gestures(Level A)** 가 단일 포인터 대안을 요구하고, 06 §1-4도 같은 말이다
//  ("제스처는 가속기이지 유일 경로가 아니다"). → 하단 **확대율 표기 자체가 버튼**이다: 보기엔 표기,
//  누르면 다음 단계(맞춤 → 실제 → 2배 → 맞춤). 자리를 하나도 더 안 쓰면서 경로는 남는다.
//
//  ⚠ 핀치는 *연속* 배율이라 "자유 배율을 안 연다(헌법 5)"와 부딪히는 것처럼 보인다. 부딪히지 않는다 —
//    그 규율은 **API 표면**(소비처가 뭘 넘길 수 있나)에 대한 것이고, 이 부품은 `zoom` prop을 안 연다.
//    사용자가 문서를 들여다보는 배율은 계약이 아니다. 반대로 여기서 단계를 세 개로 묶으면
//    "고정 배치 문서를 임의로 살펴본다"는 이 뷰의 목적 자체가 안 선다.
//
//  ── 안 만드는 것 ─────────────────────────────────────────────────────────────
//   · 가로 회전 — `.ms`가 100dvh 전제라 회전은 셸 전체를 건드린다. 가로 A4는 맞춤 배율이 0.35로 더 나쁘고,
//     원본 뷰의 2D 스크롤이 이미 그걸 받는다.
//   · 여러 장 — PaperModal이 1장 전제다(인쇄도 1장). 같은 전제를 지킨다.
//   · 편집 — 06 §4-1(편집 능력은 읽기보다 좁다). FieldGrid는 mode="read" 고정.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { desktopTypoVars } from './theme';
import { FieldGrid, type FieldGridCell } from './FieldGrid';
import { MobileSegment } from './MobileSegment';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Text } from './Text';
import { renderAction } from './_cells';
import type { MobileHeaderActions } from './MobileShell';
import type { FieldSpec } from '../schema';
import { fmtNumber, fmtCurrency } from './_cells';
import './mobilepaper.css';

type Orientation = 'portrait' | 'landscape';
/** 표준 A4 픽셀 캔버스(@96dpi) — PaperModal의 CANON과 **같은 값**이어야 한다(같은 문서가 두 층에서 같게 보인다). */
const CANON: Record<Orientation, { w: number; h: number }> = {
  portrait: { w: 794, h: 1123 },
  landscape: { w: 1123, h: 794 },
};
/** 단일 포인터 경로가 밟는 단계 — 맞춤(실측)/실제/2배. 핀치는 이 사이를 연속으로 지난다. */
const STEPS = [1, 2];
/** 상한 — 넘어가면 문서가 아니라 픽셀을 보게 된다. 하한은 맞춤 배율(그보다 작을 이유가 없다). */
const MAX_SCALE = 4;

type Values = Record<string, unknown>;

type Props = {
  opened: boolean;
  onClose: () => void;
  /** 문서 이름 — 헤더 행. 셸 헤더와 같은 자리·같은 타이포. */
  title: string;
  orientation?: Orientation;
  // ── 장표 — PaperModal이 children(ReactNode)을 받는 것과 갈리는 지점(위 헤더 주석) ──
  columns: number;
  rows: FieldGridCell[][];
  fields?: FieldSpec[];
  values?: Values;
  /** 상한 2, 첫째만 텍스트(셸 헤더와 같은 계약). 인쇄·내려받기 *트리거*만 — 실행은 소비처. */
  actions?: MobileHeaderActions;
};

/* ── 값 → 텍스트 ───────────────────────────────────────────────────────────────
   포맷 규칙을 여기서 새로 쓰지 않는다 — 숫자·통화는 _cells의 공유 포맷터를 그대로 쓴다.
   그래야 같은 값이 표·카드·장표에서 다르게 보이지 않는다(fmtNumber/fmtCurrency가 단일 출처). */
function textOf(cell: FieldGridCell, fields: FieldSpec[] | undefined, values: Values | undefined): string {
  if (!cell.field) return '';
  const spec = fields?.find((f) => f.name === cell.field);
  const v = values?.[cell.field];
  if (v == null || v === '') return '';
  switch (spec?.type) {
    case 'currency': return fmtCurrency(v);
    case 'number':   return fmtNumber(v);
    case 'checkbox': return v ? '예' : '아니오';
    case 'select':   return spec.options?.find((o) => o.value === v)?.label ?? String(v);
    default:         return String(v);
  }
}

/* ── 투영 — 2D 장표를 1D 라벨-값으로 ───────────────────────────────────────────
   목업으로 확인한 것: **병합은 손실이 아니다.**
    · colSpan       → 값이 폭을 더 쓸 뿐. 라벨-값 짝은 그대로다(손실 0)
    · rowSpan(라벨) → 의미가 "아래 몇 행을 묶는다" = **그룹 머리**다. MobileList가 이미 가진 어휘로 내려간다(손실 0)
    · image/node    → 2D 배치가 곧 의미인 유일한 자리. 전폭 행으로 내리되 **자리는 사라진다**(유일한 손실)
   그래서 "원본에서 보기" 같은 탈출구를 읽기 뷰에 두지 않는다 — 손실이 한 종류뿐이고 그건 원본 뷰가 받는다. */
type ReadRow = { key: string; label: string; cell?: FieldGridCell };
type ReadBlock = { kind: 'row'; row: ReadRow } | { kind: 'group'; title: string; rows: ReadRow[] };

const pairOf = (cells: FieldGridCell[], key: string): ReadRow => ({
  key,
  label: cells.find((c) => c.label)?.label ?? '',
  cell: cells.find((c) => c.field || c.image || c.node),
});

function project(rows: FieldGridCell[][]): ReadBlock[] {
  const out: ReadBlock[] = [];
  let i = 0;
  while (i < rows.length) {
    const head = rows[i]?.[0];
    const span = head?.rowSpan ?? 1;
    // 병합 라벨이 머리인 묶음 — 첫 행은 머리 셀을 빼고 짝짓는다(머리는 그룹 제목이 됐다).
    if (span > 1 && head?.label) {
      const group: ReadRow[] = [];
      for (let k = 0; k < span && i + k < rows.length; k++) {
        group.push(pairOf(k === 0 ? rows[i + k].slice(1) : rows[i + k], `${i + k}`));
      }
      out.push({ kind: 'group', title: head.label, rows: group });
      i += span;
      continue;
    }
    out.push({ kind: 'row', row: pairOf(rows[i], `${i}`) });
    i += 1;
  }
  return out;
}

export function MobilePaperViewer({
  opened, onClose, title, orientation = 'portrait',
  columns, rows, fields, values, actions,
}: Props) {
  const [view, setView] = useState<'read' | 'paper'>('read');
  const canon = CANON[orientation];

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const fitRef = useRef(0);        // 맞춤 배율 — 실측값
  const scaleRef = useRef(0);      // 지금 배율(연속). **state가 아니다**: 핀치는 프레임마다 바뀌는데
  const atFitRef = useRef(true);   //  리렌더하면 손가락이 미끄러진다. DOM에 직접 쓰고 표기만 갱신한다.

  /** 배율 적용 — 앵커(두 손가락 사이 지점) 아래의 문서 좌표를 붙잡아 둔다. 안 그러면 확대할 때마다
   *  보던 자리가 달아나서 "내가 잡은 곳"이 유지되지 않는다. */
  const apply = useCallback((next: number, anchor?: { x: number; y: number }) => {
    const stage = stageRef.current, canvas = canvasRef.current, spacer = spacerRef.current;
    if (!stage || !canvas || !spacer) return;
    const min = fitRef.current || 0.1;
    const s = Math.min(MAX_SCALE, Math.max(min, next));
    const prev = scaleRef.current || s;
    const ax = anchor ? anchor.x : stage.clientWidth / 2;
    const ay = anchor ? anchor.y : stage.clientHeight / 2;
    const cx = (stage.scrollLeft + ax) / prev;   // 앵커 아래의 문서 좌표
    const cy = (stage.scrollTop + ay) / prev;
    scaleRef.current = s;
    atFitRef.current = Math.abs(s - min) < 0.005;
    canvas.style.transform = `scale(${s})`;
    spacer.style.width = `${canon.w * s}px`;     // transform은 레이아웃 크기를 안 바꾼다 — 스크롤 범위는 이게 만든다
    spacer.style.height = `${canon.h * s}px`;
    stage.scrollLeft = cx * s - ax;
    stage.scrollTop = cy * s - ay;
    if (readoutRef.current) readoutRef.current.textContent = `${Math.round(s * 100)}%`;
  }, [canon.w, canon.h]);

  // 맞춤 배율은 **실측**이다 — 폰 폭은 기기마다 다르고(375/390/430) 폰트 스케일도 크롬 높이를 바꾼다.
  //  ResizeObserver인 이유: 회전·폰트 스케일 변경에도 따라와야 한다(PaperModal의 fitA4와 같은 접근).
  //  이미 확대해 둔 상태면 건드리지 않는다 — 사용자가 맞춰 둔 배율을 폭 변화가 뺏으면 안 된다.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || view !== 'paper') return;
    const measure = () => {
      fitRef.current = el.clientWidth / canon.w;
      // 읽기↔원본을 오가면 캔버스가 재마운트돼 transform이 날아간다 — 들고 있던 배율을 다시 입힌다.
      //  맞춤 상태였으면 새로 잰 맞춤값으로(폭이 변했을 수 있다), 아니면 사용자가 맞춰 둔 배율 그대로.
      apply(atFitRef.current ? fitRef.current : scaleRef.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [view, canon.w, apply]);

  // 닫으면 뷰·배율을 되돌린다 — 다음에 열었을 때 앞 문서의 배율이 남아 있으면 "왜 확대돼 있지"가 된다
  //  (MobileAttachmentViewer가 장을 넘길 때 하는 것과 같은 규율).
  useEffect(() => {
    if (!opened) { setView('read'); scaleRef.current = 0; atFitRef.current = true; }
  }, [opened]);

  /* ── 핀치 ────────────────────────────────────────────────────────────────
     두 포인터만 본다. 하나면 브라우저 기본 스크롤(팬)이 그대로 일한다 — 우리가 가로채지 않는다.
     touch-action: pan-x pan-y가 브라우저의 요소 내 핀치만 끄고 팬은 남겨둔다(mobilepaper.css). */
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const two = () => [...ptrs.current.values()];
  const distOf = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'touch') return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) {
      const [a, b] = two();
      pinch.current = { dist: distOf(a, b) || 1, scale: scaleRef.current };
    }
  };
  const onPointerMove = (e: ReactPointerEvent) => {
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
  };

  /** 단일 포인터 경로(WCAG 2.5.1) — 지금 배율보다 큰 첫 단계로, 없으면 맞춤으로 돌아간다. */
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

  const readRow = (r: ReadRow) => {
    // image/node 셀은 라벨 아래 통째로 — 값이 한 줄에 안 들어가는 유일한 종류다.
    const stacked = Boolean(r.cell?.image || r.cell?.node);
    const value = r.cell?.image
      ? <img className="mpv-img" src={r.cell.image} alt={r.cell.alt ?? r.label} />
      : r.cell?.node ?? <Text variant="body">{textOf(r.cell ?? {}, fields, values)}</Text>;
    return (
      <div key={r.key} className={stacked ? 'mpv-kv stacked' : 'mpv-kv'}>
        <span className="mpv-kv-k"><Text variant="caption" color="secondary">{r.label}</Text></span>
        <span className="mpv-kv-v">{value}</span>
      </div>
    );
  };

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

      {/* 뷰 갈래 — 화면 안 갈래는 MobileSegment다(06 §3). 토글 버튼이 아닌 이유: 버튼 라벨은 *목적지*라
          "원본"이 지금 원본이라는 뜻인지 원본으로 가겠다는 뜻인지가 안 닫힌다. 44px의 값이다. */}
      <MobileSegment
        ariaLabel="문서 보기 방식"
        value={view}
        onChange={(v) => setView(v as 'read' | 'paper')}
        items={[{ value: 'read', label: '읽기' }, { value: 'paper', label: '원본' }]}
      />

      {view === 'read' ? (
        <div className="mpv-read">
          {project(rows).map((b, i) =>
            b.kind === 'group' ? (
              <div key={`g${i}`} className="mpv-group">
                <div className="mpv-group-hd">
                  <Text variant="caption" color="secondary">{b.title}</Text>
                </div>
                {b.rows.map(readRow)}
              </div>
            ) : readRow(b.row),
          )}
        </div>
      ) : (
        <>
          {/* 2D 무대 — 팬은 브라우저 기본 스크롤, 핀치만 우리가 잡는다(위 헤더 주석). */}
          <div
            className="mpv-stage"
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* 캔버스만 데스크탑 타이포로 되돌린다 — 06 §1-9의 유일한 예외(theme.desktopTypoVars 주석).
                안 되돌리면 17px 글자가 794px 인쇄 좌표계를 깨뜨린다.
                transform·크기는 apply()가 직접 쓴다(핀치 중 리렌더 금지). */}
            <div className="mpv-canvas" ref={canvasRef}
              style={{ ...(desktopTypoVars as CSSProperties), width: canon.w, height: canon.h }}>
              <div className="mpv-paper" style={{ width: canon.w, height: canon.h }}>
                <FieldGrid columns={columns} rows={rows} fields={fields} values={values} mode="read" />
              </div>
            </div>
            <div className="mpv-spacer" ref={spacerRef} />
          </div>
          {/* 하단은 **표기**다. 다만 누를 수 있다 — 핀치는 multipoint라 단일 포인터 대안이 있어야 한다
              (WCAG 2.5.1 Level A · 06 §1-4). 자리를 더 쓰지 않고 경로만 남기는 방법이 이것이다. */}
          <div className="mpv-bar">
            <button type="button" className="mpv-zoom" onClick={stepUp} aria-label="확대 배율 — 눌러서 다음 단계">
              <Icon name="search" size="sm" />
              <Text variant="body"><span ref={readoutRef}>100%</span></Text>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
