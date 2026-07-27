'use client';
// CompositionOutline 위젯 — 2-pane 작성 면의 우측 "문서 목차". 카트가 아니라 목차다:
//  · 라인 0개여도 모든 섹션이 헤더+추가 버튼과 함께 보인다(§3-7 핵심 요구 — 문서 구조가 먼저, 내용이 나중).
//  · 목차는 읽는 물건이 아니라 조작면: 라인 클릭=좌측 구성기 재진입(onSelectLine), 섹션 추가=좌측 진입점
//    (onAddToSection). active 라인/섹션 = tint+inset 링(좌측 강조선은 금지 어휘 — 장식·중복 신호 금지).
//  · 도메인 무지·금액 계산 0(§6): amount는 표시용, SummaryRow.value는 *이미 포맷된 문자열*. 합계 위계
//    (마지막 행 강조 등)는 tone으로만 — 순서·의미는 소비처가 행 배열로 소유한다. footer는 완전 위임 슬롯.
//  · 스크롤은 목차 본문 내부(§6-4) — 합계·footer는 하단 고정, 라인 증감에 바깥 상자 크기 불변.
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
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
  addLabel?: string;      // 기본 '추가'
  lines: CompositionLine[];
  active?: boolean;       // 현재 좌측이 열고 있는 섹션
};

export type SummaryRow = {
  label: string;
  action?: { label: string; onClick: () => void };  // 라벨 옆 칩 버튼(모달 열기 등 — 소비처 소유)
  value: string;                                    // 이미 포맷된 문자열(§6-1)
  tone?: 'default' | 'muted' | 'negative' | 'grand';
};

type Props = {
  sections: CompositionSection[];
  summary?: SummaryRow[];
  footer?: ReactNode;              // 저장 영역 완전 위임(모드 분기는 소비처 소유)
  onAddToSection: (sectionId: string) => void;
  onSelectLine: (lineId: string) => void;
  onDeleteLine: (lineId: string) => void;
};

export function CompositionOutline({ sections, summary, footer, onAddToSection, onSelectLine, onDeleteLine }: Props) {
  return (
    <div className="erpOSO">
      <div className="erpOSO-body">
        {sections.length === 0 ? (
          <div className="erpOSO-none">표시할 섹션이 없습니다.</div>
        ) : sections.map((s) => (
          <section key={s.id} className="erpOSO-sec" data-active={s.active || undefined}>
            <div className="erpOSO-secHd">
              <span className="erpOSO-secLbl">{s.label}</span>
              {s.badge && <span className="erpOSO-badge">{s.badge}</span>}
              {s.lines.length > 0 && <span className="erpOSO-cnt">{s.lines.length}</span>}
            </div>
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
            <div className="erpOSO-add">
              <Button variant="ghost" size="sm" fullWidth leftIcon={<Icon name="plus" size="sm" />}
                onClick={() => onAddToSection(s.id)}>
                {s.addLabel ?? '추가'}
              </Button>
            </div>
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
