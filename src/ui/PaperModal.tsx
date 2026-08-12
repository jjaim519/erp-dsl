'use client';
// ⚠⚠ **폐기 예정(v0.85.0) — 새 문서는 `DocModal`의 `children` 모드로 간다. 다음 minor에서 삭제된다.**
//  이 부품의 인쇄 빌트인은 `.erpPaper` **하나**를 `position: fixed`로 물리 A4에 고정한다. 그래서
//  여러 장짜리 문서를 넣으면 **N장이 전부 0,0에 겹쳐 한 장으로 나간다** — 소비 앱이 그걸 「한 장에
//  축소해 넣기」로 우회하다가 «내용이 늘면 글자가 작아지는» 문서가 됐다. 고칠 게 아니라 없앨 결함이다.
//  `DocModal`은 장마다 `break-after`를 거는 `.erpPaperSheet` 경로를 쓴다(paper.css).
//
// PaperModal (유기체) — A4 문서 *뷰어* 모달. 완성된 문서(거래명세서·견적서 등)를 본다(보기 전용, 편집 아님).
//  · 종이가 자기 윤곽을 가짐(.erpPaper) — 모달이 아니라 *종이*가 A4 한 장.
//  · CSS aspect-ratio/max-* 안 씀. 뷰포트(95vw×95vh 상한)−크롬을 실측(ResizeObserver)해 A4 박스를 px 계산(fitA4),
//    표준 A4 캔버스(@96dpi)를 transform:scale로 맞춘다 → 폰트·여백 비율 통째 스케일(프레임만 줄이는 내용 넘침 회피).
//  · **모달 폭은 가로(landscape) A4 기준으로 고정**(세로 문서여도 넓은 박스) — 한 모달에서 두 뷰를 지원하려고 가로만 넓힌 것.
//      ① 자세히(기본·좌측): 문서를 모달 폭에 꽉 채워 확대(fit-to-width) → 글자 커짐, 세로 넘치면 **세로 스크롤**.
//      ② 전체(우측 토글): 문서를 높이에 맞춰 contain(통째) 가운데 표시 → 세로 문서는 좌우 데스크, **스크롤 0**.
//      뷰 토글은 헤더 SegmentedControl — 내부 상태(공개 prop 아님, 순수 뷰 어포던스).
//  · 내용(children)은 소비처가 표준 A4 캔버스(CANON) 좌표계 기준으로 채움(보통 FieldGrid 장표) — 도메인 0.
//  · 인쇄 빌트인(@media print, controls.css): 종이만 남기고(머리말/꼬리말·모달 백드롭 제거) 화면 맞춤 scale·모달 변형을
//    무효화해 물리 A4 1:1·1장으로 출력. orientation별 @page size는 여기서 <style>로 주입(닫힌 enum). 인쇄 *트리거*(버튼)만 actions로 소비처 배선.
//  · Mantine Modal 격리 래핑(헌법 7). 본문이 '뷰어 본문'이라 공유 Modal과 별도 유기체.
import { Modal as M } from '@mantine/core';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Group } from './Group';
import { Title } from './Title';
import { Icon } from './Icon';
import { SegmentedControl } from './SegmentedControl';
import type { Action } from './_cells';
import { renderAction } from './_cells';
import './controls.css';

type Orientation = 'portrait' | 'landscape';
type View = 'full' | 'large';   // large=자세히(폭 채움·세로 스크롤, 기본) / full=전체(통째·무스크롤)

// 표준 A4 픽셀 캔버스(@96dpi): 210mm×297mm = 794×1123. 소비처는 이 좌표계 기준으로 문서를 그린다(스케일은 뷰어가 함).
const CANON: Record<Orientation, { w: number; h: number }> = {
  portrait:  { w: 794, h: 1123 },
  landscape: { w: 1123, h: 794 },
};
const PAD = 8;  // 본문 영역 안쪽 여백(px) — 종이가 가장자리에 닿지 않게 하는 최소 숨구멍.

// fitA4 — 영역(cw×ch)에 A4 비율(orientation)로 contain되는 최대 박스를 px로 계산. (크기 계산 로직)
function fitA4(cw: number, ch: number, orientation: Orientation) {
  const ratio = orientation === 'landscape' ? 297 / 210 : 210 / 297;  // w/h
  let w = cw;
  let h = w / ratio;
  if (h > ch) { h = ch; w = h * ratio; }      // 폭 기준이 넘치면 높이 기준으로 다시(contain)
  return { w: Math.max(0, Math.floor(w)), h: Math.max(0, Math.floor(h)) };
}

const isPrimaryEnd = (v?: string) => v === 'primary' || v === 'danger';

type Props = {
  opened: boolean;
  onClose: () => void;
  title: string;
  actions?: Action[];                       // 푸터 — 소비처가 인쇄·닫기 등 배선(뷰어는 빌트인 없음)
  orientation?: Orientation;                // 기본 portrait(A4 세로). 문서 종류가 방향을 정함.
  closeOnOverlayClick?: boolean;
  children: ReactNode;                      // 표준 A4 캔버스(CANON) 기준 문서 — 소비처(FieldGrid 등)
};

export function PaperModal({
  opened, onClose, title, actions, orientation = 'portrait', closeOnOverlayClick = false, children,
}: Props) {
  const ordered = actions
    ? [...actions].sort((a, b) => Number(isPrimaryEnd(a.variant)) - Number(isPrimaryEnd(b.variant)))
    : [];
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [view, setView] = useState<View>('large');   // 기본=자세히(읽기용 확대).
  // 모달 본문 = 가로(landscape) A4 박스로 *고정*(orientation·view 무관, 넓은 박스). 그 안에서 뷰만 토글. (크기 계산 로직)
  const [frame, setFrame] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    if (typeof window === 'undefined') return;
    const headerH = headerRef.current?.offsetHeight ?? 0;   // 크롬(헤더/푸터) 실측 — 종이에 쓸 높이에서 뺀다.
    const footerH = footerRef.current?.offsetHeight ?? 0;
    const availW = window.innerWidth * 0.95 - PAD * 2;       // 상한 95vw 안의 가용 폭
    const availH = window.innerHeight * 0.95 - headerH - footerH - PAD * 2;  // 상한 95vh − 크롬 안의 가용 높이
    setFrame(fitA4(availW, availH, 'landscape'));            // 항상 가로 A4 박스 — 모달 크기는 뷰와 무관하게 고정.
  }, []);

  // 콜백 ref — 모달 콘텐츠 루트가 실제 DOM에 붙는 순간 측정·관찰 시작(Mantine Portal이 effect로 늦게 mount해도 놓치지 않음).
  //  주의: useRef+useEffect는 Portal mount 전에 돌아 노드를 놓쳐 frame이 0으로 굳는다 → 종이 scale 0(투명).
  const setRootRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);  // 크롬(폰트 스케일·제목 줄바꿈) 변화 추적
    ro.observe(el);
    roRef.current = ro;
  }, [measure]);

  // 뷰포트 리사이즈 시 재계산.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // 인쇄 빌트인 스코프 — 열려 있는 동안만 <html>에 표시를 건다.
  //  controls.css의 `body * { visibility: hidden }`은 이 클래스 안에 갇혀 있다. 안 그러면
  //  Providers가 controls.css를 import하므로 **앱의 모든 화면이 인쇄 시 백지로 나간다**
  //  (다른 인쇄 경로 PaperDoc을 만들다 드러난 배포 결함).
  useEffect(() => {
    if (typeof document === 'undefined' || !opened) return;
    const root = document.documentElement;
    root.classList.add('erp-paper-print');
    return () => root.classList.remove('erp-paper-print');
  }, [opened]);

  const canon = CANON[orientation];
  // 전체=본문(frame)에 contain(높이/폭 중 작은 배율) → 통째·무스크롤. 크게=폭 채움(frame.w/캔버스폭) → 확대·세로 스크롤.
  const large = view === 'large';
  const scale = frame.w > 0
    ? (large ? frame.w / canon.w : Math.min(frame.w / canon.w, frame.h / canon.h))
    : 0;
  const paperW = canon.w * scale;
  const paperH = canon.h * scale;

  return (
    <M
      opened={opened}
      onClose={onClose}
      size={frame.w > 0 ? frame.w + PAD * 2 : '95vw'}  /* 가로 A4 기준 고정 폭(상한 95vw). 측정 전 첫 프레임만 95vw. */
      xOffset="2.5vw"          /* 좌우 5vw 여백 → content 폭 95vw까지 허용(기본 5vw는 95vw를 90vw로 깎음) */
      yOffset="2.5vh"          /* 상하 5vh 여백 → content 높이 95vh까지 허용(기본 5dvh는 90dvh로 캡) */
      centered
      closeOnClickOutside={closeOnOverlayClick}
      radius="md"
      shadow="md"
      withCloseButton={false}  /* 기본 헤더 끔 — 우리가 직접 조립 */
      padding={0}              /* 본문 패딩 끔 — 패딩 주인을 우리 3영역으로 이관 */
    >
      {/* 3영역 flex 세로 — 헤더 + 본문(고정 가로 박스) + 푸터. 루트에 콜백 ref로 측정·관찰. */}
      <div ref={setRootRef} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 인쇄용 @page — orientation별 A4 size + margin 0(머리말/꼬리말 제거). 나머지 인쇄 규칙은 controls.css.
            html/body를 페이지 높이로 고정 + overflow:hidden → 뒤 앱/문서가 visibility:hidden으로 남긴 *높이*를 클립해
            빈 2페이지 방지(종이 1장만). 종이는 position:fixed라 이 클립에 안 잘림. */}
        <style>{`@media print{@page{size:A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'};margin:0}html,body{margin:0!important;padding:0!important;height:${orientation === 'landscape' ? '210mm' : '297mm'}!important;overflow:hidden!important}}`}</style>
        {/* 헤더(고정) — 좌: 제목 / 우: 뷰 토글(전체·크게) + 닫기. */}
        <div ref={headerRef} style={{ flex: 'none', padding: 'var(--mantine-spacing-md)', borderBottom: `var(--border-width) solid var(--border-default)` }}>
          <Group justify="between" align="center">
            <Title variant="heading">{title}</Title>
            <Group gap="md" align="center" wrap={false}>
              <SegmentedControl
                size="sm"
                value={view}
                onChange={(v) => setView(v as View)}
                options={[{ label: '자세히', value: 'large' }, { label: '전체', value: 'full' }]}
              />
              <span role="button" aria-label="닫기" onClick={onClose} style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <Icon name="x" color="secondary" />
              </span>
            </Group>
          </Group>
        </div>

        {/* 본문(뷰어) — 고정 가로 박스(frame). 전체=무스크롤·가운데 / 크게=세로 스크롤·상단정렬.
            회색 데스크(bg-secondary) 위에 흰 종이가 뜬다(세로 문서 전체뷰는 좌우 데스크). */}
        <div
          style={{
            height: frame.h + PAD * 2, padding: PAD,
            overflowY: large ? 'auto' : 'hidden', overflowX: 'hidden',
            display: 'flex', justifyContent: 'center', alignItems: large ? 'flex-start' : 'center',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* 발자국 박스(paperW×paperH) — 종이를 absolute로 스케일해 채운다. 크게에서 paperH가 본문보다 크면 위 overflow가 받는다. */}
          <div style={{ position: 'relative', width: paperW, height: paperH, flexShrink: 0 }}>
            {/* 종이 — 표준 A4 캔버스(canon)를 transform:scale로 맞춤(origin top-left). 종이가 자기 윤곽(.erpPaper)을 가짐.
                인쇄 시 .erpPaper 규칙(controls.css)이 scale 무효화 + 물리 A4 고정. erpPaper-landscape=가로 물리 치수. */}
            <div
              className={orientation === 'landscape' ? 'erpPaper erpPaper-landscape' : 'erpPaper'}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: canon.w, height: canon.h,
                transform: `scale(${scale})`, transformOrigin: 'top left',
              }}
            >
              {children}
            </div>
          </div>
        </div>

        {/* 푸터(고정) — actions 있을 때만(소비처가 인쇄 등 배선). flex:none. */}
        {ordered.length > 0 && (
          <div ref={footerRef} style={{ flex: 'none', padding: 'var(--mantine-spacing-md)', borderTop: `var(--border-width) solid var(--border-default)` }}>
            <Group justify="end" gap="xs">
              {ordered.map((a, i) => renderAction(a, i))}
            </Group>
          </div>
        )}
      </div>
    </M>
  );
}
