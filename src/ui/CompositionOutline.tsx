'use client';
// CompositionOutline 위젯 — 2-pane 작성 면의 우측 "작성물 카드 스택". 목차이되, 카드는 작성물만:
//  · 라인이 있거나 지금 작성 중(active)인 섹션만 카드로 렌더. 빈 섹션 상시 노출은 폐기 —
//    소비처 실화면(섹션 다수)에서 우측이 "후보 메뉴"로 도배되어 정작 작성물이 파묻혔다(2026-07-27 반전).
//  · 추가 진입점은 상단 단일 "＋ 추가" 버튼 하나 — 섹션 선택 Popover 메뉴(라벨+badge)를 부품이 소유,
//    선택 시 기존 onAddToSection(sectionId) 그대로 발화(콜백 계약 불변, 소비처 조립 0).
//  · 읽는 물건이 아니라 조작면: 라인 클릭=좌측 구성기 재진입(onSelectLine). active 라인/섹션 =
//    tint+inset 링(좌측 강조선은 금지 어휘 — 장식·중복 신호 금지).
//  · 도메인 무지·금액 계산 0(§6): amount는 표시용, SummaryRow.value는 *이미 포맷된 문자열*. 합계 위계
//    (마지막 행 강조 등)는 tone으로만 — 순서·의미는 소비처가 행 배열로 소유한다. footer=저장 영역 완전 위임.
//  · 스크롤은 카드 스택 내부(§6-4) — 추가 버튼·합계·footer는 고정, 라인 증감에 바깥 상자 크기 불변.
import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Popover } from './Popover';
import { fmtCurrency } from './_cells';
import './optionset.css';

export type CompositionLine = {
  id: string;
  label: string;
  sublabel?: string;      // 선택값 요약 등
  quantity?: number;      // 1이면 표시하지 않는다
  amount?: number;
  active?: boolean;       // 좌측에서 편집 중 → 강조
};

export type CompositionSection = {
  id: string;
  label: string;
  badge?: string;         // 타입 칩(문자열 주입 — 부품은 의미를 모른다)
  addLabel?: string;      // [지원 중단 — 무시] 섹션별 추가 버튼이 전역 메뉴로 대체됨
  lines: CompositionLine[];
  active?: boolean;       // 현재 좌측이 열고 있는 섹션 — 라인 0개여도 카드로 표시된다
};

export type SummaryRow = {
  label: string;
  action?: { label: string; onClick: () => void };  // 라벨 옆 칩 버튼(모달 열기 등 — 소비처 소유)
  value: string;                                    // 이미 포맷된 문자열(§6-1)
  tone?: 'default' | 'muted' | 'negative' | 'grand';
};

type Props = {
  sections: CompositionSection[];  // 전체 섹션(메뉴 후보). 카드는 라인 보유·active만
  summary?: SummaryRow[];
  footer?: ReactNode;              // 저장 영역 완전 위임(모드 분기는 소비처 소유)
  addLabel?: string;               // 전역 추가 버튼 라벨(기본 '추가')
  emptyHint?: string;              // 작성물 0건 안내(기본 문구 내장)
  onAddToSection: (sectionId: string) => void;
  onSelectLine: (lineId: string) => void;
  onDeleteLine: (lineId: string) => void;
};

export function CompositionOutline({
  sections, summary, footer, addLabel, emptyHint, onAddToSection, onSelectLine, onDeleteLine,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cards = sections.filter((s) => s.lines.length > 0 || s.active);

  return (
    <div className="erpOSO">
      <div className="erpOSO-addBar">
        <Popover
          opened={menuOpen}
          onChange={setMenuOpen}
          position="bottom" align="start" width="auto" block
          content={(
            <div className="erpOSO-menu">
              {sections.map((s) => (
                <button key={s.id} type="button" className="erpOSO-menuItem"
                  onClick={() => { setMenuOpen(false); onAddToSection(s.id); }}>
                  <span>{s.label}</span>
                  {s.badge && <span className="erpOSO-badge">{s.badge}</span>}
                </button>
              ))}
            </div>
          )}
        >
          <Button variant="ghost" size="sm" fullWidth leftIcon={<Icon name="plus" size="sm" />}>
            {addLabel ?? '추가'}
          </Button>
        </Popover>
      </div>
      <div className="erpOSO-body">
        {cards.length === 0 ? (
          <div className="erpOSO-none">{emptyHint ?? '위 추가 버튼으로 시작하세요.'}</div>
        ) : cards.map((s) => (
          <section key={s.id} className="erpOSO-sec" data-active={s.active || undefined}>
            <div className="erpOSO-secHd">
              <span className="erpOSO-secLbl">{s.label}</span>
              {s.badge && <span className="erpOSO-badge">{s.badge}</span>}
              {s.lines.length > 0 && <span className="erpOSO-cnt">{s.lines.length}</span>}
            </div>
            {s.lines.length === 0 && <div className="erpOSO-hint">작성 중…</div>}
            {s.lines.map((l) => (
              <div key={l.id} className="erpOSO-line" role="button" tabIndex={0} data-active={l.active || undefined}
                onClick={() => onSelectLine(l.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectLine(l.id); } }}>
                <span className="erpOSO-lineMain">
                  <span className="erpOSO-lineLbl">{l.label}</span>
                  {l.sublabel && <span className="erpOSO-lineSub">{l.sublabel}</span>}
                </span>
                <span className="erpOSO-lineSide">
                  {l.quantity != null && l.quantity !== 1 && <span className="erpOSO-qty">×{l.quantity}</span>}
                  {l.amount != null && <span className="erpOSO-amt">{fmtCurrency(l.amount)}</span>}
                  <span className="erpOSO-x" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <IconButton icon="trash" label="삭제" variant="ghost" size="sm" onClick={() => onDeleteLine(l.id)} />
                  </span>
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
      {summary && summary.length > 0 && (
        <div className="erpOSO-sum">
          {summary.map((r, i) => (
            <div key={i} className="erpOSO-sumRow" data-tone={r.tone ?? 'default'}>
              <span className="erpOSO-sumLbl">
                {r.label}
                {r.action && <button type="button" className="erpOSO-sumAct" onClick={r.action.onClick}>{r.action.label}</button>}
              </span>
              <span className="erpOSO-sumVal">{r.value}</span>
            </div>
          ))}
        </div>
      )}
      {footer && <div className="erpOSO-foot">{footer}</div>}
    </div>
  );
}
