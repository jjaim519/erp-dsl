'use client';
// CompositionOutline 위젯 — 2-pane 작성 면의 우측 "작성물 카드 스택". 목차이되, 카드는 작성물만:
//  · 라인이 있거나 지금 작성 중(active)인 섹션만 카드로 렌더. 빈 섹션 상시 노출은 폐기(소비처 실화면 반전).
//  · 추가 진입점은 상단 단일 버튼 + 섹션 선택 메뉴(부품 소유 Popover). **items 있는 섹션은 메뉴 안에서 하위까지
//    드릴**(뒤로 포함) → onAddToSection(sectionId, itemId) — 좌측이 곧장 구성 면으로 진입한다(계층 추가 메뉴).
//    items 없는 섹션은 onAddToSection(sectionId)만 발화(소비처가 골라 담는 면을 연다).
//  · 읽는 물건이 아니라 조작면: 라인 클릭=좌측 재진입(onSelectLine). active = 은은한 채움 *한 겹* + "편집 중"
//    마이크로 라벨(카드 링 안에 링을 또 두르지 않는다 — 윤곽 중첩 금지, 실검토 확정). 카운트 뱃지 없음(중복 신호 금지).
//  · 선 최소화: 카드 링 하나만, 라인 사이 구분선 없음(간격이 구분). 섹션 라벨은 캡션 오버라인 — 라인이 주인공.
//  · 도메인 무지·금액 계산 0(§6): amount는 표시용, SummaryRow.value는 이미 포맷된 문자열. footer=완전 위임.
//  · 스크롤은 카드 스택 내부(§6-4) — 추가 버튼·합계·footer 고정. 카드 flex:none(압착 버그 수정 — R2 §6-1).
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
  active?: boolean;       // 좌측에서 편집 중 → 채움 + "편집 중" 라벨
};

export type CompositionSection = {
  id: string;
  label: string;
  badge?: string;         // 타입 칩(문자열 주입 — 부품은 의미를 모른다)
  addLabel?: string;      // [지원 중단 — 무시] 섹션별 추가 버튼이 전역 메뉴로 대체됨
  /** 추가 메뉴 하위 목록 — 있으면 메뉴에서 이 단계까지 드릴해 onAddToSection(sectionId, itemId)로 발화. */
  items?: { id: string; label: string; sublabel?: string }[];
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
  onAddToSection: (sectionId: string, itemId?: string) => void;
  onSelectLine: (lineId: string) => void;
  onDeleteLine: (lineId: string) => void;
};

export function CompositionOutline({
  sections, summary, footer, addLabel, emptyHint, onAddToSection, onSelectLine, onDeleteLine,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAt, setMenuAt] = useState<string | null>(null);   // null = 루트, 아니면 드릴 중인 섹션 id
  const cards = sections.filter((s) => s.lines.length > 0 || s.active);
  const drill = menuAt != null ? sections.find((s) => s.id === menuAt) : null;

  const closeMenu = () => { setMenuOpen(false); setMenuAt(null); };
  const fire = (sectionId: string, itemId?: string) => { closeMenu(); onAddToSection(sectionId, itemId); };

  return (
    <div className="erpOSO">
      <div className="erpOSO-addBar">
        <Popover
          opened={menuOpen}
          onChange={(o) => { setMenuOpen(o); if (!o) setMenuAt(null); }}
          position="bottom" align="start" width="auto" block
          content={(
            <div className="erpOSO-menu">
              {drill ? (
                <>
                  <button key="back" type="button" className="erpOSO-menuItem" data-back
                    onClick={(e) => { e.stopPropagation(); setMenuAt(null); }}>
                    ‹ {drill.label}
                  </button>
                  {(drill.items ?? []).map((it) => (
                    <button key={it.id} type="button" className="erpOSO-menuItem"
                      onClick={(e) => { e.stopPropagation(); fire(drill.id, it.id); }}>
                      <span>{it.label}</span>
                      {it.sublabel && <span className="end erpOSO-menuSub">{it.sublabel}</span>}
                    </button>
                  ))}
                </>
              ) : sections.map((s) => (
                <button key={s.id} type="button" className="erpOSO-menuItem"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s.items && s.items.length > 0) setMenuAt(s.id);   // 하위 드릴
                    else fire(s.id);                                      // 바로 발화(골라 담는 면 등)
                  }}>
                  <span>{s.label}</span>
                  <span className="end">
                    {s.badge && <span className="erpOSO-badge">{s.badge}</span>}
                    {s.items && s.items.length > 0 && <span className="drill"><Icon name="chevron-down" size="sm" /></span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        >
          <Button variant="secondary" size="sm" fullWidth leftIcon={<Icon name="plus" size="sm" />}>
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
            </div>
            {s.lines.length === 0 && <div className="erpOSO-hint">작성 중…</div>}
            {s.lines.map((l) => (
              <div key={l.id} className="erpOSO-line" role="button" tabIndex={0} data-active={l.active || undefined}
                onClick={() => onSelectLine(l.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectLine(l.id); } }}>
                <span className="erpOSO-lineMain">
                  <span className="erpOSO-lineLbl">
                    <span className="txt">{l.label}</span>
                    {l.active && <span className="erpOSO-editing">편집 중</span>}
                  </span>
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
