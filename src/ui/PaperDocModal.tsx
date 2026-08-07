'use client';
// PaperDocModal (유기체) — 서식(PaperSpec) + 값으로 문서를 **보고·인쇄하고·채우는** 모달. 도메인 0줄.
//
//  · `PaperModal`의 형제다. **재사용이 아니라 형제인 이유**: 그쪽 인쇄 빌트인은 `.erpPaper` **하나**를
//    `position: fixed`로 물리 A4에 고정한다 — 여러 장인 문서를 넣으면 N장이 전부 0,0에 겹쳐
//    **한 장으로 나간다.** 게다가 `PaperDoc`은 자기 인쇄 경로(`.erpPaperSheet` + `break-after`)를 이미
//    갖고 있어서 겹치면 인쇄 빌트인이 둘이 된다.
//  · 그래서 인쇄는 **PaperDoc의 경로를 그대로 쓰고**, 이 모달은 «문서 밖을 감추는 일»만 더한다.
//    그 규칙은 반드시 `html.erp-doc-print` 안에 가둔다 — 스코프 없는 `body * { visibility: hidden }`이
//    소비 앱의 **모든 화면**을 인쇄 시 백지로 만든 적이 있다(PaperModal 배포 결함).
//  · 보기와 편집은 **한 부품**이다(`mode`). 문서 기하가 같기 때문 — 칸이 곧 입력의 크기다(PaperDoc 주석).
//  · 편집 초안은 **모달이 쥔다.** 소비처는 `onSave(values)` 하나만 배선하면 된다. 저장 안 한 채 닫으려
//    하면 확인을 띄운다(닫고 나서 «어? 저장했나?»가 남지 않게).
//  · 값 ↔ DB 매핑은 소비처 몫이다. 서식은 «어떤 이름이 필요한가»만 말한다(`spec.fields` · `spec.arrays`).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal as M } from '@mantine/core';
import { PAPER_CANON, type PaperSpec } from '../schema/paper';
import { PaperDoc } from './PaperDoc';
import { Group } from './Group';
import { Title } from './Title';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import type { Action } from './_cells';
import { renderAction } from './_cells';

/**
 * 맞춤 = **한 장이 통째로** 보이는 배율(폭·높이 중 작은 쪽) / 100% = 인쇄 크기 그대로.
 * 「폭 채우기」로 두면 안 된다 — 모달을 종이 폭에 맞췄으므로 폭 기준은 늘 100%가 되어
 * 토글이 아무 일도 안 한다(실제로 그랬다). 세로가 긴 A4에서 의미를 갖는 건 **높이**다.
 *
 * ⚠ **편집에는 배율이 없다.** 축소해 놓고 글자를 칠 수는 없으니 100%가 유일하게 쓸모 있는 값이고,
 *    쓸모없는 토글은 «있다»는 사실만으로 무언가를 약속한다. 인쇄도 같은 이유로 편집에서 뺀다 —
 *    아직 저장 안 한 초안을 종이로 뽑는 건 업무가 아니다(보고 나서 인쇄하면 된다).
 */
type Zoom = 'fit' | 'full';
const PAD = 12;                    // 데스크(회색 바탕)와 종이 사이 숨구멍

type Props = {
  opened: boolean;
  onClose: () => void;
  title: string;
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
  /** `edit` 전용 — 데이터에서 끌어오는 값(보이되 못 고친다). 어느 값이 어디서 오는지는 소비처만 안다. */
  readonlyFields?: string[];
  /**
   * 소비처 CTA 자리 — 「발송」·「승인 요청」처럼 **문서 밖 업무**를 잇는 단추.
   * 닫기·인쇄·저장은 빌트인이라 여기 넣지 않는다. primary/danger는 자동으로 맨 오른쪽에 선다.
   */
  actions?: Action[];
  closeOnOverlayClick?: boolean;
};

const isPrimaryEnd = (v?: string) => v === 'primary' || v === 'danger';

export function PaperDocModal({
  opened, onClose, title, spec, values, mode = 'view', onSave, readonlyFields, actions,
  closeOnOverlayClick = false,
}: Props) {
  const canon = PAPER_CANON[spec.orientation];
  const editing = mode === 'edit' && !!onSave;

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

  // ── 크기 — **모달은 종이 폭에 맞춘다.** 95vw로 두면 세로 A4 좌우로 빈 데스크가 화면 절반을 먹고
  //  «맞춤»이 늘 100%가 되어 토글이 죽는다(실제로 그랬다). 좁은 창에서만 95vw 상한이 걸린다.
  const [zoom, setZoom] = useState<Zoom>('fit');
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const roRef = useRef<ResizeObserver | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const measure = useCallback(() => {
    if (typeof window === 'undefined') return;
    const chrome = (headerRef.current?.offsetHeight ?? 0) + (footerRef.current?.offsetHeight ?? 0);
    setFrame({
      w: Math.min(window.innerWidth * 0.95, canon.w + PAD * 2) - PAD * 2,
      h: window.innerHeight * 0.95 - chrome - PAD * 2,
    });
  }, [canon.w]);
  // 콜백 ref — Mantine Portal이 effect로 늦게 mount해도 놓치지 않는다(PaperModal 선례:
  //  useRef+useEffect는 mount 전에 돌아 폭이 0으로 굳고 종이가 scale 0으로 사라진다).
  const setRootRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);   // 크롬(제목 줄바꿈·폰트 스케일) 변화 추적
    ro.observe(el);
    roRef.current = ro;
  }, [measure]);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    measure();
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); roRef.current?.disconnect(); };
  }, [measure]);

  const scale = editing || zoom === 'full' || frame.w <= 0
    ? 1
    : Math.min(1, frame.w / canon.w, frame.h / canon.h);

  // 인쇄 스코프 — 열려 있는 동안만 <html>에 표시를 건다. paper.css의 «문서 밖 감추기»가 이 안에 갇혀 있다.
  useEffect(() => {
    if (typeof document === 'undefined' || !opened) return;
    const root = document.documentElement;
    root.classList.add('erp-doc-print');
    return () => root.classList.remove('erp-doc-print');
  }, [opened]);

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
    // 좌: 나가기(닫기·취소) — 되돌리는 행위라 CTA에서 제일 멀리 둔다.
    // 우: 인쇄 → 소비처 CTA → 저장. 소비처 primary/danger는 자기들끼리 맨 뒤로 정렬된다.
    const ctas = actions
      ? [...actions].sort((a, b) => Number(isPrimaryEnd(a.variant)) - Number(isPrimaryEnd(b.variant)))
      : [];
    return (
      <Group justify="between" align="center" wrap={false}>
        <Button variant="secondary" size="sm" onClick={requestClose}>{editing ? '취소' : '닫기'}</Button>
        <Group gap="xs" wrap={false}>
          {!editing && (
            <Button variant="secondary" size="sm" leftIcon={<Icon name="print" />} onClick={() => window.print()}>
              인쇄
            </Button>
          )}
          {ctas.map((a, i) => renderAction(a, i))}
          {editing && (
            <Button variant="primary" size="sm" disabled={!dirty} onClick={() => { onSave!(shown); onClose(); }}>
              저장
            </Button>
          )}
        </Group>
      </Group>
    );
  }, [asking, editing, dirty, shown, onSave, onClose, requestClose, actions]);

  return (
    <M
      opened={opened}
      onClose={requestClose}
      /* 종이 폭 + 데스크 숨구멍. 측정 전 첫 프레임만 캔버스 기준으로 잡는다(깜빡임 없이 제자리). */
      size={Math.min(typeof window === 'undefined' ? canon.w + PAD * 2 : window.innerWidth * 0.95, canon.w + PAD * 2)}
      xOffset="2.5vw"
      yOffset="2.5vh"
      centered
      closeOnClickOutside={closeOnOverlayClick && !dirty}
      radius="md"
      shadow="md"
      withCloseButton={false}
      padding={0}
    >
      <div ref={setRootRef} style={{ display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
        <div
          ref={headerRef}
          className="erpDocChrome"
          style={{
            flex: 'none', padding: 'var(--mantine-spacing-md)',
            borderBottom: 'var(--border-width) solid var(--border-default)',
          }}
        >
          <Group justify="between" align="center" wrap={false}>
            <Title variant="heading">{title}</Title>
            <Group gap="md" align="center" wrap={false}>
              {!editing && (
                <SegmentedControl
                  size="sm" value={zoom} onChange={(v) => setZoom(v as Zoom)}
                  options={[{ label: '맞춤', value: 'fit' }, { label: '100%', value: 'full' }]}
                />
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
          <PaperDoc
            spec={spec}
            values={shown}
            scale={scale}
            mode={editing ? 'edit' : 'view'}
            onChange={editing ? setDraft : undefined}
            readonlyFields={readonlyFields}
          />
        </div>

        <div
          ref={footerRef}
          className="erpDocChrome"
          style={{
            flex: 'none', padding: 'var(--mantine-spacing-md)',
            borderTop: 'var(--border-width) solid var(--border-default)',
          }}
        >
          {footer}
        </div>
      </div>
    </M>
  );
}
