'use client';
// optionset-shared — OptionSet 가족 내부 공용 모듈(index 미수출 — 공개 API 아님).
//  두 편집기(OptionSetEditor·OptionSetComposer)의 동형을 코드로 강제한다: 트리 행 2슬롯 해부·hover 액션·
//  유형 형태 아이콘·미니 스위치·위젯 소유 팝오버·native DnD. 다른 가족에서 수요가 생겨도 승격하지 않는다
//  (세 번째 수요 확인 전 일반화 금지).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { OptionGroup } from './optionset';

/* ── 유형 형태 아이콘 5종(Forms 문법 — 고르면 만들어질 컨트롤의 형태): ◉ ☑ ± 123 ≡. 항상 라벨 왼쪽(리딩). ── */
export function TypeIcon({ sel }: { sel: OptionGroup['selection'] }) {
  const c = 'currentColor';
  if (sel === 'single') return (
    <svg className="erpOS-tico" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="5.2" fill="none" stroke={c} strokeWidth="1.4" />
      <circle cx="7" cy="7" r="2.4" fill={c} />
    </svg>);
  if (sel === 'multi') return (
    <svg className="erpOS-tico" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="1.8" y="1.8" width="10.4" height="10.4" rx="2.4" fill="none" stroke={c} strokeWidth="1.4" />
      <path d="M4.4 7.2l1.8 1.8 3.4-3.8" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>);
  if (sel === 'quantity') return (
    <svg className="erpOS-tico" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M7 1.6v4.6M4.7 3.9h4.6M4.2 10.6h5.6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>);
  if (sel === 'number') return (
    <svg className="erpOS-tico" width="16" height="14" viewBox="0 0 16 14" aria-hidden>
      <text x="8" y="10.6" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={c}>123</text>
    </svg>);
  return (
    <svg className="erpOS-tico" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M2 4.6h10M2 9.4h6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>);
}

/* ── hover 액션 아이콘(＋·⋯) — 텍스트 글리프 금지(라벨로 오독), 크리스프 SVG ── */
export const PlusGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>);
export const DotsGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <circle cx="3" cy="7" r="1.2" fill="currentColor" /><circle cx="7" cy="7" r="1.2" fill="currentColor" /><circle cx="11" cy="7" r="1.2" fill="currentColor" />
  </svg>);
/** 부착 대상(leaf) 마크 — 라운드 사각 점(도메인 중립 글리프, 원형 아바타 금지 계보) */
export const MarkGlyph = () => (
  <svg className="erpOS-tico" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" fill="currentColor" />
  </svg>);
export const EyeGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <path d="M1 7s2.2-3.8 6-3.8S13 7 13 7s-2.2 3.8-6 3.8S1 7 1 7Z" stroke="currentColor" strokeWidth="1.3" fill="none" />
    <circle cx="7" cy="7" r="1.7" stroke="currentColor" strokeWidth="1.3" fill="none" />
  </svg>);

/* ── 미니 스위치(30×18) — Mantine Switch(size 고정)와 별개, 목업 정본 그대로 ── */
export function MiniSwitch({ on, label, tone, onToggle }: {
  on: boolean; label: string; tone?: 'danger' | 'primary'; onToggle: () => void;
}) {
  return (
    <span className="erpOS-swt" data-on={on || undefined} data-tone={tone ?? 'danger'}
      role="switch" aria-checked={on} tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onToggle(); } }}>
      {label} <span className="tr" />
    </span>
  );
}

/* ── 위젯 소유 팝오버 — 목업 오프셋 그대로(absolute, 부모 relative). 바깥 클릭 닫기는 usePopDismiss로 ── */
export function usePopDismiss(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-os-pop],[data-os-popbtn]')) return;
      close();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, close]);
}

/* ── native DnD(목업 엔진 이식 — 외부 라이브러리 금지): 시작·대상 표시·드롭 배선을 위젯이 조립 ── */
export type DragState = { t: string; id: string; extra?: string } | null;
export function useRowDrag() {
  const dragRef = useRef<DragState>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const start = (t: string, id: string, extra?: string) => (e: React.DragEvent) => {
    dragRef.current = { t, id, extra };
    try { e.dataTransfer.setData('text/plain', 'x'); } catch { /* FF 요구 */ }
    e.dataTransfer.effectAllowed = 'move';
  };
  const over = (accept: (d: NonNullable<DragState>) => boolean, id: string) => (e: React.DragEvent) => {
    const d = dragRef.current;
    if (!d || !accept(d)) return;
    e.preventDefault();
    if (overId !== id) setOverId(id);
  };
  const end = () => { dragRef.current = null; setOverId(null); };
  const drop = (handler: (d: NonNullable<DragState>) => void) => (e: React.DragEvent) => {
    const d = dragRef.current;
    end();
    if (!d) return;
    e.preventDefault();
    handler(d);
  };
  return { dragRef, overId, start, over, end, drop };
}

/* ── 트리 행(2슬롯 해부: [쉐브론/스페이서][글리프][라벨]…[hover ＋][hover ⋯]) — 두 편집기 공용 표현.
   깊이=들여쓰기(padding-left), 소속 가이드=1px 중성 hairline(브랜드색·2px 금지 — VS Code 문법). ── */
export function TreeRow({ id, depth, selected, guide, chevron, onChevron, glyph, icon, label, placeholder,
  renaming, onRenameInput, onRenameDone, onSelect, onPlus, plusTitle, onMenu, menuOpen, menu,
  dragProps, rowDragOver, rowDrop }: {
  id: string; depth: number; selected?: boolean; guide?: boolean;
  chevron?: 'open' | 'closed' | null; onChevron?: () => void;
  /** slot1 대체 글리프(쉐브론 없을 때 그 자리에 — Composer leaf ▪마크). 쉐브론과 공존 불가 */
  glyph?: ReactNode;
  /** slot2 아이콘(Editor 1층 유형 아이콘 — 쉐브론 유무와 무관하게 별도 슬롯) */
  icon?: ReactNode;
  label: string; placeholder?: string;
  renaming?: boolean; onRenameInput?: (v: string) => void; onRenameDone?: () => void;
  onSelect?: () => void;
  onPlus?: () => void; plusTitle?: string;
  onMenu?: () => void; menuOpen?: boolean; menu?: ReactNode;
  dragProps?: React.HTMLAttributes<HTMLSpanElement> & { draggable?: boolean };
  rowDragOver?: (e: React.DragEvent) => void; rowDrop?: (e: React.DragEvent) => void;
}) {
  return (
    <div className={'erpOS-trow' + (selected ? ' on' : '') + (guide ? ' guide' : '')} data-row={id}
      style={{ paddingLeft: 6 + depth * 20 }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.erpOS-tin,.erpOS-tgrip,button')) return;
        onSelect?.();
      }}
      onDragOver={rowDragOver} onDrop={rowDrop}>
      <span className="erpOS-tgrip" {...dragProps}>⠿</span>
      {chevron != null
        ? <button type="button" className="erpOS-tcv" onClick={(e) => { e.stopPropagation(); onChevron?.(); }}>{chevron === 'open' ? '▾' : '▸'}</button>
        : glyph
          ? <span className="erpOS-tcv gl">{glyph}</span>
          : <span className="erpOS-tcv sp" />}
      {icon}
      {renaming ? (
        <input className="erpOS-tin" autoFocus value={label} placeholder={placeholder}
          onChange={(e) => onRenameInput?.(e.target.value)}
          onBlur={onRenameDone}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
      ) : (
        <span className={'erpOS-tlbl' + (label ? '' : ' ph')}>{label || placeholder || '이름 없음'}</span>
      )}
      <span className="erpOS-tgrow" />
      {onPlus && (
        <button type="button" className="erpOS-tplus" title={plusTitle} onClick={(e) => { e.stopPropagation(); onPlus(); }}><PlusGlyph /></button>
      )}
      {onMenu && (
        <button type="button" className="erpOS-tdots" data-os-popbtn data-keep={menuOpen || undefined}
          onClick={(e) => { e.stopPropagation(); onMenu(); }}><DotsGlyph /></button>
      )}
      {menu}
    </div>
  );
}
