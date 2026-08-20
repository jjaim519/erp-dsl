'use client';
// DocModal (유기체) — 회사 서류의 **껍데기 하나**. 문서를 보고·인쇄하고·채운다. 도메인 0줄.
//
//  · **내용은 두 갈래로 받고 인쇄는 한 갈래다.** 서식(PaperSpec)으로 그린 문서든 손으로 그린 문서든
//    인쇄가 갈릴 이유가 없다 — 인쇄 경로는 «무엇으로 그렸나»가 아니라 **클래스 계약**(`.erpPaperSheet`)에
//    걸려 있기 때문이다. 그래서 손코딩 문서도 각 장을 `<PaperSheet>`로 감싸면 같은 다장 인쇄를 얻는다.
//    (v0.85.0 이전엔 이 갈림 때문에 소비 앱에 껍데기가 4종이었고, 문서마다 인쇄 결과가 달랐다.)
//  · 껍데기가 소유: 인쇄 · 크롬 · 쪽 나눔 · `@page`. 내용물이 소유: 칸을 어떻게 그리나.
//  · 인쇄 규칙은 반드시 `html.erp-doc-print` 안에 가둔다 — 스코프 없는 `body * { visibility: hidden }`이
//    소비 앱의 **모든 화면**을 인쇄 시 백지로 만든 적이 있다(PaperModal 배포 결함, 커밋 22389c0).
//  · 보기와 편집은 **한 부품**이다(`mode`). 문서 기하가 같기 때문 — 칸이 곧 입력의 크기다(PaperDoc 주석).
//  · 편집 초안은 **모달이 쥔다.** 소비처는 `onSave(values)` 하나만 배선하면 된다. 저장 안 한 채 닫으려
//    하면 확인을 띄운다(닫고 나서 «어? 저장했나?»가 남지 않게).
//  · 값 ↔ DB 매핑은 소비처 몫이다. 서식은 «어떤 이름이 필요한가»만 말한다(`spec.fields` · `spec.arrays`).
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal as M } from '@mantine/core';
import { PAPER_CANON, type PaperOrientation, type PaperSpec } from '../schema/paper';
import { PaperDoc } from './PaperDoc';
import { PaperSheetContext } from './PaperSheet';
import { paperPageRule } from './paperPrint';
import { Group } from './Group';
import { Title } from './Title';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import type { Action } from './_cells';
import { renderAction } from './_cells';

/**
 * ⚠ **배율은 100% 고정이다.** 「맞춤/100%」 토글이 헤더에 있었는데 걷어냈다 —
 *    문서를 통째로 맞춰 보는 시점은 **인쇄 미리보기**이지 뷰어가 아니다. 토글이 사라지면서
 *    실측(ResizeObserver)·프레임 계산도 같이 사라졌다(그건 오로지 「맞춤」을 위한 계산기였다).
 *    대가: 창이 종이보다 좁으면 데스크가 가로로 스크롤된다(가로 문서 1123px). 그게 100%의 뜻이다.
 */
const PAD = 12;                    // 데스크(회색 바탕)와 종이 사이 숨구멍

/**
 * 세로 스크롤바가 먹는 폭. **모달을 종이 폭에 딱 맞추면 이만큼이 모자라 가로 스크롤이 늘 생긴다**
 * (실측: 모달 818 = 종이 794 + 패딩 24 → 데스크 안쪽 803, 넘침 15 = 스크롤바 폭 그대로).
 * A4는 100%에서 거의 항상 세로로 넘치므로 이건 «좁은 창» 얘기가 아니라 **기본 상태**다.
 *
 * ⚠ 이건 레이아웃 실측이 아니라 **브라우저 상수**다(맞춤 배율을 지우며 걷어낸 ResizeObserver와 다르다).
 *   그래서 한 번만 재서 캐시한다. macOS 오버레이 스크롤바는 0을 돌려주고, 그때는 실제로 안 먹으므로 맞다.
 */
let scrollbarPx: number | null = null;
function scrollbarWidth(): number {
  if (scrollbarPx !== null) return scrollbarPx;
  if (typeof document === 'undefined') return 0;          // SSR — 모달은 Portal이라 여기까지 안 온다
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll';
  document.body.appendChild(probe);
  scrollbarPx = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  return scrollbarPx;
}

type Base = {
  opened: boolean;
  onClose: () => void;
  title: string;
  /**
   * 헤더 도구 자리(제목 반대편) — **문서의 «종류»를 고르는 것**이 여기 선다(견적서 갑/을 같은).
   * 열어 둔 슬롯인 이유: 어떤 도메인은 토글이고 어떤 도메인은 라디오·선택이다. 우리가 `views` 같은
   * 모양을 못박으면 그 도메인들이 각자 껍데기를 다시 만든다 — 이 부품이 없애려는 바로 그 갈림.
   * ⚠ **행위(인쇄·닫기)는 여기 넣지 않는다.** 그건 빌트인이고, 섞으면 헤더가 두 문법이 된다.
   */
  toolbar?: ReactNode;
  /**
   * 우하단 CTA — 「수정」·「발송」·「승인 요청」처럼 **문서 밖 업무**를 잇는 단추.
   * 인쇄·저장은 빌트인이라 여기 넣지 않는다. primary/danger는 자동으로 맨 오른쪽에 선다.
   */
  actions?: Action[];
  closeOnOverlayClick?: boolean;
};

type SpecProps = Base & {
  /** 서식 — 엑셀에서 변환한 PaperSpec(빌드 산출물)이거나 손으로 적은 것. */
  spec: PaperSpec;
  /** 값 — 소비처가 자기 DB에서 만들어 넣는다. 반복은 배열(`{ 부속: [{...}] }`). */
  values?: Record<string, unknown>;
  /**
   * `edit`이면 데이터 자리가 입력칸이 된다. 문서 기하는 그대로다.
   * **「작성」과 「편집」을 안 가른다** — 값이 있느냐 없느냐만 다를 뿐 하는 일이 같기 때문이다.
   * 빈 문서를 처음 채우는 것도 이 모드다(제목으로 「작성」이라 부르는 건 소비처 몫).
   */
  mode?: 'view' | 'edit';
  /**
   * `edit` 전용 — 저장. 없으면 편집 모드여도 저장 단추가 안 나온다(읽기 전용 편집은 의미가 없다).
   * 초안 전체를 준다 — 소비처는 setState 하나로 받는다.
   */
  onSave?: (values: Record<string, unknown>) => void;
  /**
   * `edit` 전용 — 데이터에서 끌어오는 값(보이되 못 고친다). 어느 값이 어디서 오는지는 소비처만 안다.
   * 반복 안은 점 경로(`'부속.품목'` = 전 행), 행 하나만 잠글 땐 `'부속[14].품목'`(원본 배열 순번).
   */
  readonlyFields?: string[];
  /**
   * `edit` 전용 — 좌하단 `취소` 노출. 기본은 켜짐이다: 그건 닫기가 아니라 **`저장`의 짝**(버리기)이고,
   * 우상단 ✕와 뜻이 다르다. 끄면 나가는 길은 ✕ 하나가 된다(둘 다 «안 저장한 변경» 확인을 탄다).
   * *보기* 모드엔 애초에 좌하단 닫기가 없다 — ✕와 중복이라 걷어냈다.
   */
  withCancel?: boolean;
  children?: never;
  orientation?: never;
};

type FreeProps = Base & {
  /**
   * 손으로 그린 문서 — **각 장을 `<PaperSheet>`로 감싼다.** 그 한 줄이 인쇄 계약의 전부이고,
   * 껍데기는 문서 **안을 모른다**(FieldGrid든 JSX든 상관 안 한다).
   */
  children: ReactNode;
  /**
   * `children` 모드에서 **필수** — 서식이 없으니 방향을 말해 줄 사람이 소비처뿐이다.
   * 이 값이 시트 물리 치수와 `@page size`를 함께 정한다(`paperPrint.ts`).
   */
  orientation: PaperOrientation;
  spec?: never;
  values?: never;
  mode?: never;
  onSave?: never;
  readonlyFields?: never;
  withCancel?: never;
};

export type DocModalProps = SpecProps | FreeProps;

const isPrimaryEnd = (v?: string) => v === 'primary' || v === 'danger';

export function DocModal(props: DocModalProps) {
  const { opened, onClose, title, toolbar, actions, closeOnOverlayClick = false } = props;
  const spec = 'spec' in props ? props.spec : undefined;
  const values = spec ? props.values : undefined;
  const orientation = spec ? spec.orientation : (props as FreeProps).orientation;
  const canon = PAPER_CANON[orientation];
  const onSave = spec ? props.onSave : undefined;
  const editing = !!spec && props.mode === 'edit' && !!onSave;
  const withCancel = editing && ((props as SpecProps).withCancel ?? true);

  // 초안 — 열릴 때 값을 복사해 들고, 닫히면 버린다. `null`이면 «아직 안 고쳤다»(원본 그대로 보여준다).
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [asking, setAsking] = useState(false);       // 저장 안 한 채 닫으려는 중
  useEffect(() => { if (!opened) { setDraft(null); setAsking(false); } }, [opened]);
  // 서식·값이 통째로 갈리면(다른 문서를 연다) 초안은 남 얘기가 된다.
  useEffect(() => { setDraft(null); setAsking(false); }, [spec, values]);

  const shown = draft ?? values ?? {};
  const dirty = draft !== null;

  // 닫기 — 안 저장한 변경이 있으면 한 번 묻는다. 확인 UI는 푸터를 바꿔 끼운다
  //  (모달 위에 모달을 쌓으면 포커스 함정이 생긴다 — 그럴 만한 무게가 아니다).
  const requestClose = useCallback(() => {
    if (dirty) setAsking(true);
    else onClose();
  }, [dirty, onClose]);

  // 인쇄 스코프 — 열려 있는 동안만 <html>에 표시를 건다. paper.css의 «문서 밖 감추기»가 이 안에 갇혀 있다.
  useEffect(() => {
    if (typeof document === 'undefined' || !opened) return;
    const root = document.documentElement;
    root.classList.add('erp-doc-print');
    return () => root.classList.remove('erp-doc-print');
  }, [opened]);

  // 푸터 — **있어야 할 때만 있다.** 보기 모드에서 CTA가 없으면 통째로 안 그린다(빈 띠가 남지 않게).
  const footer = useMemo(() => {
    if (asking) {
      return (
        <Group justify="between" align="center" wrap={false}>
          <Text variant="body" color="secondary">저장하지 않은 변경이 있습니다.</Text>
          <Group gap="xs">
            <Button variant="secondary" size="sm" onClick={() => setAsking(false)}>계속 편집</Button>
            <Button variant="danger" size="sm" onClick={onClose}>버리고 닫기</Button>
          </Group>
        </Group>
      );
    }
    const ctas = actions
      ? [...actions].sort((a, b) => Number(isPrimaryEnd(a.variant)) - Number(isPrimaryEnd(b.variant)))
      : [];
    if (!withCancel && !editing && ctas.length === 0) return null;
    return (
      <Group justify="between" align="center" wrap={false}>
        {/* 좌: 되돌리는 행위 — CTA에서 제일 멀리 둔다. 없으면 자리만 비워 오른쪽 정렬을 지킨다. */}
        {withCancel
          ? <Button variant="secondary" size="sm" onClick={requestClose}>취소</Button>
          : <span />}
        <Group gap="xs" wrap={false}>
          {ctas.map((a, i) => renderAction(a, i))}
          {editing && (
            <Button variant="primary" size="sm" disabled={!dirty} onClick={() => { onSave!(shown); onClose(); }}>
              저장
            </Button>
          )}
        </Group>
      </Group>
    );
  }, [asking, editing, withCancel, dirty, shown, onSave, onClose, requestClose, actions]);

  return (
    <M
      opened={opened}
      onClose={requestClose}
      /* 종이 폭 + 데스크 숨구멍. **CSS가 상한을 받는다** — 배율이 100%로 굳어서 JS로 잴 게 없어졌고,
         min()이면 창 크기 변화도 리스너 없이 따라온다(측정 전 첫 프레임의 깜빡임도 없다).
         ⚠ **px여야 한다.** 수로 주면 Mantine이 rem으로 바꿔 루트 font-scale(전역 줌)을 타는데,
            종이는 고정 px 캔버스라(paper.css) 안 는다 — 모달만 넓어지고 데스크가 벌어진다. */
      size={`min(95vw, ${canon.w + PAD * 2 + scrollbarWidth()}px)`}
      xOffset="2.5vw"
      yOffset="2.5vh"
      centered
      closeOnClickOutside={closeOnOverlayClick && !dirty}
      radius="md"
      /* 그림자는 elevation 2축의 overlay — Mantine shadows.md와 값이 겹쳐 카드와 구분이 안 됐다(02 §2축) */
      styles={{ content: { boxShadow: 'var(--elevation-overlay)' } }}
      withCloseButton={false}
      padding={0}
      /* ⚠ **인쇄가 백지로 나가던 자리다.** Mantine 8은 포털을 body에 직접 안 붙인다 —
         `<div data-mantine-shared-portal-node>`(다른 팝오버·툴팁과 **공유**하는 상자)를 body에 만들고
         모달을 그 *안*에 넣는다. 그래서 「문서 밖 감추기」가 `body > *:not(.mantine-Modal-root)`처럼
         **우리가 안 만든 클래스**를 겨누면 그 공유 상자째 사라져 인쇄물이 통째로 빈다.
         → 우리 상자를 따로 만들어(`reuseTargetNode: false`) 우리 이름을 건다. 남의 구현이 바뀌어도 안 깨지고,
            공유 상자에 얹힌 남의 포털(툴팁 등)이 종이에 묻어 나오지도 않는다. */
      portalProps={{ reuseTargetNode: false, className: 'erpDocPortal' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
        {/* `@page` — **껍데기가 소유한다.** 두 모드가 한 문자열을 쓴다(paperPrint.ts).
            이게 없으면 브라우저가 자기 머리말·꼬리말(URL·날짜·쪽번호)을 종이 위에 얹는다. */}
        <style>{paperPageRule(orientation)}</style>

        <div
          className="erpDocChrome"
          style={{
            flex: 'none', padding: 'var(--mantine-spacing-md)',
            borderBottom: 'var(--border-width) solid var(--border-default)',
          }}
        >
          <Group justify="between" align="center" wrap={false}>
            <Title variant="heading">{title}</Title>
            {/* 우: 도구(문서 종류) → 인쇄 → 닫기. 인쇄가 하단에서 여기로 올라왔다 —
                푸터는 «이 문서로 무슨 일을 하나»(소비처 CTA)의 자리이고, 인쇄는 뷰어의 빌트인이다. */}
            <Group gap="md" align="center" wrap={false}>
              {toolbar}
              {!editing && (
                <Button variant="secondary" size="sm" leftIcon={<Icon name="print" />} onClick={() => window.print()}>
                  인쇄
                </Button>
              )}
              <span role="button" aria-label="닫기" onClick={requestClose} style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <Icon name="x" color="secondary" />
              </span>
            </Group>
          </Group>
        </div>

        {/* 데스크 — 회색 바탕 위에 흰 종이가 여러 장. 세로 스크롤은 여기가 받는다. */}
        <div
          className="erpDocDesk"
          style={{
            flex: 1, minHeight: 0, overflow: 'auto', padding: PAD,
            background: 'var(--bg-secondary)',
          }}
        >
          {spec ? (
            <PaperDoc
              spec={spec}
              values={shown}
              mode={editing ? 'edit' : 'view'}
              onChange={editing ? setDraft : undefined}
              readonlyFields={props.readonlyFields}
            />
          ) : (
            /* 손코딩 문서 — 장을 쌓는 상자는 서식 문서와 **같은 것**(.erpPaperDoc)이다.
               인쇄에서 장 사이 간격을 0으로 만드는 규칙이 거기 걸려 있다. */
            <PaperSheetContext.Provider value={orientation}>
              <div className="erpPaperDoc">{props.children}</div>
            </PaperSheetContext.Provider>
          )}
        </div>

        {footer && (
          <div
            className="erpDocChrome"
            style={{
              flex: 'none', padding: 'var(--mantine-spacing-md)',
              borderTop: 'var(--border-width) solid var(--border-default)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </M>
  );
}

/** @deprecated `DocModal`로 이름이 바뀌었다(`children`을 받는 순간 PaperSpec 전용이 아니게 됐다). 다음 minor에서 사라진다. */
export const PaperDocModal = DocModal;
